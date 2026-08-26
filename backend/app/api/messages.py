from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.bot_event import BotMessage
from app.schemas.bot import MessageListResponse, MessageOut

router = APIRouter(
    prefix="/api/messages", tags=["messages"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=MessageListResponse)
async def list_messages(
    db: AsyncSession = Depends(get_db),
    telegram_user_id: int | None = None,
    event_type: str | None = None,
    search: str | None = None,
    limit: int = Query(default=20, le=200),
    offset: int = Query(default=0, ge=0),
) -> MessageListResponse:
    stmt = select(BotMessage)
    count_stmt = select(func.count()).select_from(BotMessage)

    if telegram_user_id is not None:
        stmt = stmt.where(BotMessage.telegram_user_id == telegram_user_id)
        count_stmt = count_stmt.where(BotMessage.telegram_user_id == telegram_user_id)
    if event_type is not None:
        stmt = stmt.where(BotMessage.event_type == event_type)
        count_stmt = count_stmt.where(BotMessage.event_type == event_type)
    if search:
        stmt = stmt.where(BotMessage.text.ilike(f"%{search}%"))
        count_stmt = count_stmt.where(BotMessage.text.ilike(f"%{search}%"))

    stmt = stmt.order_by(BotMessage.sent_at.desc()).limit(limit).offset(offset)

    total = (await db.execute(count_stmt)).scalar_one()
    items = (await db.execute(stmt)).scalars().all()

    return MessageListResponse(
        items=[MessageOut.model_validate(item) for item in items], total=total
    )
