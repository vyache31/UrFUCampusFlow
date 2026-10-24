"""Set null on carried task source deletion.

Revision ID: 6e032e7189ac
Revises: dc143260c23e
"""
from typing import Sequence, Union

from alembic import op


revision: str = "6e032e7189ac"
down_revision: Union[str, Sequence[str], None] = "dc143260c23e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "meeting_tasks_carried_from_task_id_fkey",
        "meeting_tasks",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "meeting_tasks_carried_from_task_id_fkey",
        "meeting_tasks",
        "meeting_tasks",
        ["carried_from_task_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "meeting_tasks_carried_from_task_id_fkey",
        "meeting_tasks",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "meeting_tasks_carried_from_task_id_fkey",
        "meeting_tasks",
        "meeting_tasks",
        ["carried_from_task_id"],
        ["id"],
    )
