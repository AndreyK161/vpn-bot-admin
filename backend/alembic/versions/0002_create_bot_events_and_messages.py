"""create bot_events and bot_messages tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bot_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "converted", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_bot_events_event_type", "bot_events", ["event_type"])
    op.create_index(
        "ix_bot_events_telegram_user_id", "bot_events", ["telegram_user_id"]
    )
    op.create_index("ix_bot_events_occurred_at", "bot_events", ["occurred_at"])
    op.create_index("ix_bot_events_converted", "bot_events", ["converted"])

    op.create_table(
        "bot_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("chat_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "message_type", sa.String(length=50), nullable=False, server_default="text"
        ),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column(
            "event_id",
            sa.Integer(),
            sa.ForeignKey("bot_events.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("event_type", sa.String(length=100), nullable=True),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_bot_messages_telegram_user_id", "bot_messages", ["telegram_user_id"]
    )
    op.create_index("ix_bot_messages_event_id", "bot_messages", ["event_id"])
    op.create_index("ix_bot_messages_event_type", "bot_messages", ["event_type"])
    op.create_index("ix_bot_messages_sent_at", "bot_messages", ["sent_at"])


def downgrade() -> None:
    op.drop_table("bot_messages")
    op.drop_table("bot_events")
