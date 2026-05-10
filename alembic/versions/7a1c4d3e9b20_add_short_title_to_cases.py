"""add short_title to cases

Revision ID: 7a1c4d3e9b20
Revises: 0b26b543f638
Create Date: 2026-05-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1c4d3e9b20'
down_revision: Union[str, Sequence[str], None] = '0b26b543f638'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('cases', sa.Column('short_title', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('cases', 'short_title')
