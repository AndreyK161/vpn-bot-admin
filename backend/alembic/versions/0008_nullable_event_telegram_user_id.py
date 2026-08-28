"""make bot_events.telegram_user_id nullable — anonymous "message sent" events

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "bot_events",
        "telegram_user_id",
        existing_type=sa.BigInteger(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "bot_events",
        "telegram_user_id",
        existing_type=sa.BigInteger(),
        nullable=False,
    )
