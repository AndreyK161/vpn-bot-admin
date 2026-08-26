from datetime import datetime

from pydantic import BaseModel, Field


class TemplateTypeOut(BaseModel):
    key: str
    label: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TemplateTypeCreate(BaseModel):
    key: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9_]+$")
    label: str = Field(min_length=1, max_length=100)
