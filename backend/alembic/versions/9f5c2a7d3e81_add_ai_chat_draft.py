"""Add persistent case drafts to AI chats.

Revision ID: 9f5c2a7d3e81
Revises: 64034bdcdb57
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '9f5c2a7d3e81'
down_revision = '64034bdcdb57'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'ai_chats',
        sa.Column('draft', postgresql.JSONB(none_as_null=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('ai_chats', 'draft')
