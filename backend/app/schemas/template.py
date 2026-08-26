from datetime import datetime

from pydantic import BaseModel


class TemplateOut(BaseModel):
    id: int
    key: str
    title: str
    text: str
    event_type: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    items: list[TemplateOut]
    total: int


class TemplateCreate(BaseModel):
    key: str
    title: str
    text: str
    event_type: str | None = None
    is_active: bool = True


class TemplateUpdate(BaseModel):
    title: str | None = None
    text: str | None = None
    event_type: str | None = None
    is_active: bool | None = None


class TemplatePublicOut(BaseModel):
    key: str
    text: str
