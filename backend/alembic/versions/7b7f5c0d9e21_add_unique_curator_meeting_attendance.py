"""add unique curator meeting attendance

Revision ID: 7b7f5c0d9e21
Revises: bc56c0a3ffda
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "7b7f5c0d9e21"
down_revision: Union[str, Sequence[str], None] = "bc56c0a3ffda"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        "uq_curator_meeting_attendance_meeting_assignment",
        "curator_meetings_attendance",
        ["meeting_id", "curator_assignment_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "uq_curator_meeting_attendance_meeting_assignment",
        "curator_meetings_attendance",
        type_="unique",
    )
