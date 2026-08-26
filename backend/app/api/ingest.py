from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import verify_bot_api_key
from app.core.database import get_db
from app.models.bot_event import BotEvent
from app.models.message_template import MessageTemplate
from app.schemas.bot import IngestEventRequest, IngestEventResponse
from app.schemas.template import TemplatePublicOut

router = APIRouter(
    prefix="/api/ingest",
    tags=["ingest"],
    dependencies=[Depends(verify_bot_api_key)],
)


@router.post("/events", response_model=IngestEventResponse)
async def ingest_event(
    payload: IngestEventRequest, db: AsyncSession = Depends(get_db)
) -> IngestEventResponse:
    event = BotEvent(
        event_type=payload.event_type,
        telegram_user_id=payload.telegram_user_id,
        username=payload.username,
        payload=payload.payload,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return IngestEventResponse(id=event.id)


@router.post("/events/{event_id}/convert", status_code=status.HTTP_204_NO_CONTENT)
async def convert_event(event_id: int, db: AsyncSession = Depends(get_db)) -> None:
    event = await db.get(BotEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    event.converted = True
    event.converted_at = datetime.now(timezone.utc)
    await db.commit()


@router.get("/templates/{key}", response_model=TemplatePublicOut)
async def get_template(key: str, db: AsyncSession = Depends(get_db)) -> TemplatePublicOut:
    result = await db.execute(
        select(MessageTemplate).where(
            MessageTemplate.key == key, MessageTemplate.is_active.is_(True)
        )
    )
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")
    return TemplatePublicOut(key=template.key, text=template.text)
