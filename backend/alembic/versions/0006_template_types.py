"""create template_types table, add FK from message_templates

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "template_types",
        sa.Column("key", sa.String(length=50), primary_key=True),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    template_types = sa.table(
        "template_types",
        sa.column("key", sa.String),
        sa.column("label", sa.String),
    )
    op.bulk_insert(
        template_types,
        [
            {"key": "regular", "label": "Обычный"},
            {"key": "alert", "label": "Alert"},
        ],
    )

    op.create_foreign_key(
        "fk_message_templates_template_type",
        "message_templates",
        "template_types",
        ["template_type"],
        ["key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_message_templates_template_type", "message_templates", type_="foreignkey"
    )
    op.drop_table("template_types")
