"""drop bot_messages, add template_type to message_templates

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("bot_messages")

    op.add_column(
        "message_templates",
        sa.Column(
            "template_type",
            sa.String(length=50),
            nullable=False,
            server_default="regular",
        ),
    )
    op.create_index(
        "ix_message_templates_template_type", "message_templates", ["template_type"]
    )


def downgrade() -> None:
    op.drop_index("ix_message_templates_template_type", table_name="message_templates")
    op.drop_column("message_templates", "template_type")

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
