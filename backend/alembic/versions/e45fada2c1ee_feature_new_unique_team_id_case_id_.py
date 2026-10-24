"""Associate curator assignments with teams instead of case history.

Revision ID: e45fada2c1ee
Revises: afe434efbaed
Create Date: 2026-10-19 12:50:19.446399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e45fada2c1ee'
down_revision: Union[str, Sequence[str], None] = 'afe434efbaed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('curator_assignments', sa.Column('team_id', sa.String(length=36), nullable=True))
    op.execute(sa.text("""
        UPDATE curator_assignments AS assignment
        SET team_id = history.team_id
        FROM team_case_history AS history
        WHERE history.id = assignment.team_case_history_id
    """))
    op.execute(sa.text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM curator_assignments
                WHERE is_current = true
                GROUP BY team_id, user_id HAVING count(*) > 1
            ) THEN
                RAISE EXCEPTION 'Resolve duplicate active curator assignments per team before upgrading';
            END IF;
        END $$;
    """))
    op.alter_column('curator_assignments', 'team_id', nullable=False)
    op.create_index('uq_curator_assignments_active_team_user', 'curator_assignments', ['team_id', 'user_id'], unique=True, postgresql_where=sa.text('is_current = true'))
    op.drop_constraint(op.f('curator_assignments_team_case_history_id_fkey'), 'curator_assignments', type_='foreignkey')
    op.create_foreign_key('curator_assignments_team_id_fkey', 'curator_assignments', 'teams', ['team_id'], ['id'])
    op.drop_column('curator_assignments', 'team_case_history_id')


def downgrade() -> None:
    """Downgrade schema."""
    # The old case association can only be reconstructed for an unambiguous team.
    op.execute(sa.text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM curator_assignments AS assignment
                WHERE (
                    SELECT count(*) FROM team_case_history AS history
                    WHERE history.team_id = assignment.team_id
                ) <> 1
            ) THEN
                RAISE EXCEPTION 'Cannot downgrade: each assigned team must have exactly one case history entry';
            END IF;
        END $$;
    """))
    op.add_column('curator_assignments', sa.Column('team_case_history_id', sa.String(length=36), nullable=True))
    op.execute(sa.text("""
        UPDATE curator_assignments AS assignment
        SET team_case_history_id = history.id
        FROM team_case_history AS history
        WHERE history.team_id = assignment.team_id
    """))
    op.alter_column('curator_assignments', 'team_case_history_id', nullable=False)
    op.drop_constraint('curator_assignments_team_id_fkey', 'curator_assignments', type_='foreignkey')
    op.create_foreign_key(op.f('curator_assignments_team_case_history_id_fkey'), 'curator_assignments', 'team_case_history', ['team_case_history_id'], ['id'])
    op.drop_index('uq_curator_assignments_active_team_user', table_name='curator_assignments', postgresql_where=sa.text('is_current = true'))
    op.drop_column('curator_assignments', 'team_id')
