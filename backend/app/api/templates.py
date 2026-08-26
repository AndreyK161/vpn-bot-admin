from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.message_template import MessageTemplate
from app.schemas.template import (
    TemplateCreate,
    TemplateListResponse,
    TemplateOut,
    TemplateUpdate,
)

router = APIRouter(
    prefix="/api/templates", tags=["templates"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, le=200),
    offset: int = Query(default=0, ge=0),
) -> TemplateListResponse:
    total = (await db.execute(select(func.count()).select_from(MessageTemplate))).scalar_one()
    result = await db.execute(
        select(MessageTemplate).order_by(MessageTemplate.key).limit(limit).offset(offset)
    )
    items = [TemplateOut.model_validate(t) for t in result.scalars().all()]
    return TemplateListResponse(items=items, total=total)


def _integrity_error_detail(exc: IntegrityError, key: str, template_type: str) -> str:
    if "template_type" in str(exc.orig):
        return f"Тип шаблона {template_type!r} не существует — сначала создай его"
    return f"Шаблон с ключом {key!r} уже существует"


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate, db: AsyncSession = Depends(get_db)
) -> TemplateOut:
    template = MessageTemplate(**payload.model_dump())
    db.add(template)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_integrity_error_detail(exc, payload.key, payload.template_type),
        ) from exc
    await db.refresh(template)
    return TemplateOut.model_validate(template)


@router.patch("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: int, payload: TemplateUpdate, db: AsyncSession = Depends(get_db)
) -> TemplateOut:
    template = await db.get(MessageTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_integrity_error_detail(exc, template.key, template.template_type),
        ) from exc
    await db.refresh(template)
    return TemplateOut.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)) -> None:
    template = await db.get(MessageTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")

    await db.delete(template)
    await db.commit()
