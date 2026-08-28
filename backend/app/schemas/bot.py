from datetime import datetime

from pydantic import BaseModel


class IngestEventRequest(BaseModel):
    event_type: str
    telegram_user_id: int | None = None
    username: str | None = None
    payload: dict | None = None


class IngestEventResponse(BaseModel):
    id: int


class EventOut(BaseModel):
    id: int
    event_type: str
    telegram_user_id: int | None
    username: str | None
    payload: dict | None
    occurred_at: datetime
    converted: bool
    converted_at: datetime | None

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    items: list[EventOut]
    total: int


class EventTypeStats(BaseModel):
    event_type: str
    total: int
    converted: int
    conversion_rate: float
    last_occurred_at: datetime | None


class IngestTemplateSyncItem(BaseModel):
    key: str
    title: str
    text: str
    event_type: str | None = None
    template_type: str = "regular"


class IngestTemplateSyncRequest(BaseModel):
    items: list[IngestTemplateSyncItem]


class IngestTemplateSyncResponse(BaseModel):
    created: list[str]
    skipped: list[str]
