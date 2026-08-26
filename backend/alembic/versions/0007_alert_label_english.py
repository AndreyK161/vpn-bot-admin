"""rename alert template type label to English

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

template_types = sa.table(
    "template_types",
    sa.column("key", sa.String),
    sa.column("label", sa.String),
)


def upgrade() -> None:
    op.execute(template_types.update().where(template_types.c.key == "alert").values(label="Alert"))


def downgrade() -> None:
    op.execute(template_types.update().where(template_types.c.key == "alert").values(label="Алерт"))
