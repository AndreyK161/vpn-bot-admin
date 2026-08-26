from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MessageTemplate(Base):
    """Редактируемый шаблон сообщения бота (в т.ч. дефолтные и событийные)."""

    __tablename__ = "message_templates"

    id: Mapped[int] = mapped_column(primary_key=True)

    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(String)

    event_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # FK на template_types вместо БД-enum — новые типы добавляются из
    # админки, без миграции и передеплоя.
    template_type: Mapped[str] = mapped_column(
        ForeignKey("template_types.key"), default="regular", index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
