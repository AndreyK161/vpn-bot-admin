from datetime import datetime

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BotEvent(Base):
    """Событие в сценарии бота, например предложение скидки при окончании подписки."""

    __tablename__ = "bot_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True)

    telegram_user_id: Mapped[int] = mapped_column(BigInteger, index=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)

    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    converted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    converted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
