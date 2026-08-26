from datetime import datetime

from pydantic import BaseModel


class IngestEventRequest(BaseModel):
    event_type: str
    telegram_user_id: int
    username: str | None = None
    payload: dict | None = None


class IngestEventResponse(BaseModel):
    id: int


class IngestMessageRequest(BaseModel):
    telegram_user_id: int
    username: str | None = None
    chat_id: int | None = None
    text: str
    message_type: str = "text"
    event_id: int | None = None
    event_type: str | None = None


class IngestMessageResponse(BaseModel):
    id: int


class MessageOut(BaseModel):
    id: int
    telegram_user_id: int
    username: str | None
    chat_id: int | None
    message_type: str
    text: str
    event_id: int | None
    event_type: str | None
    sent_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    items: list[MessageOut]
    total: int


class EventOut(BaseModel):
    id: int
    event_type: str
    telegram_user_id: int
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
