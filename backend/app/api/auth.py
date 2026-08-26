from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expires_at,
    verify_password,
)
from app.models.admin_user import AdminUser
from app.models.refresh_token import RefreshToken
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _issue_token_pair(user_id: int, db: AsyncSession) -> TokenResponse:
    access_token = create_access_token(subject=str(user_id))

    refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expires_at(),
        )
    )
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(AdminUser).where(AdminUser.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Учётная запись отключена"
        )

    return await _issue_token_pair(user.id, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный refresh-токен"
    )

    token_hash = hash_refresh_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()

    if stored is None or stored.revoked_at is not None:
        raise invalid
    if stored.expires_at < datetime.now(timezone.utc):
        raise invalid

    user = await db.get(AdminUser, stored.user_id)
    if user is None or not user.is_active:
        raise invalid

    # ротация: старый refresh-токен отзывается, выдаётся новая пара
    stored.revoked_at = datetime.now(timezone.utc)
    await db.commit()

    return await _issue_token_pair(user.id, db)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)) -> None:
    token_hash = hash_refresh_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = datetime.now(timezone.utc)
        await db.commit()


@router.get("/me", response_model=UserOut)
async def me(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    return current_user
