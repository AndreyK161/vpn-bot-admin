from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.bot_event import BotEvent
from app.schemas.bot import EventListResponse, EventOut, EventTypeStats

router = APIRouter(
    prefix="/api/events", tags=["events"], dependencies=[Depends(get_current_user)]
)


@router.get("/stats", response_model=list[EventTypeStats])
async def event_stats(db: AsyncSession = Depends(get_db)) -> list[EventTypeStats]:
    stmt = select(
        BotEvent.event_type,
        func.count().label("total"),
        func.sum(case((BotEvent.converted.is_(True), 1), else_=0)).label("converted"),
        func.max(BotEvent.occurred_at).label("last_occurred_at"),
    ).group_by(BotEvent.event_type).order_by(func.count().desc())

    rows = (await db.execute(stmt)).all()

    return [
        EventTypeStats(
            event_type=row.event_type,
            total=row.total,
            converted=row.converted,
            conversion_rate=round((row.converted / row.total) * 100, 1) if row.total else 0.0,
            last_occurred_at=row.last_occurred_at,
        )
        for row in rows
    ]


@router.get("", response_model=EventListResponse)
async def list_events(
    db: AsyncSession = Depends(get_db),
    telegram_user_id: int | None = None,
    event_type: str | None = None,
    converted: bool | None = None,
    limit: int = Query(default=20, le=200),
    offset: int = Query(default=0, ge=0),
) -> EventListResponse:
    stmt = select(BotEvent)
    count_stmt = select(func.count()).select_from(BotEvent)

    if telegram_user_id is not None:
        stmt = stmt.where(BotEvent.telegram_user_id == telegram_user_id)
        count_stmt = count_stmt.where(BotEvent.telegram_user_id == telegram_user_id)
    if event_type is not None:
        stmt = stmt.where(BotEvent.event_type == event_type)
        count_stmt = count_stmt.where(BotEvent.event_type == event_type)
    if converted is not None:
        stmt = stmt.where(BotEvent.converted == converted)
        count_stmt = count_stmt.where(BotEvent.converted == converted)

    stmt = stmt.order_by(BotEvent.occurred_at.desc()).limit(limit).offset(offset)

    total = (await db.execute(count_stmt)).scalar_one()
    items = (await db.execute(stmt)).scalars().all()

    return EventListResponse(
        items=[EventOut.model_validate(item) for item in items], total=total
    )
