"""updated codes in reference models

Revision ID: c29cf582f31e
Revises: ee9d810c2684
Create Date: 2026-05-04 00:40:53.695832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c29cf582f31e'
down_revision: Union[str, Sequence[str], None] = 'ee9d810c2684'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('case_difficulty_levels', sa.Column('code', sa.String(), nullable=True))
    op.execute("UPDATE case_difficulty_levels SET code = level_code WHERE code IS NULL")
    op.alter_column('case_difficulty_levels', 'code', nullable=False)
    op.create_unique_constraint('uq_case_difficulty_levels_code', 'case_difficulty_levels', ['code'])
    op.drop_column('case_difficulty_levels', 'level_code')

    op.add_column('case_statuses', sa.Column('code', sa.String(), nullable=True))
    op.execute("UPDATE case_statuses SET code = status_code WHERE code IS NULL")
    op.alter_column('case_statuses', 'code', nullable=False)
    op.create_unique_constraint('uq_case_statuses_code', 'case_statuses', ['code'])
    op.drop_column('case_statuses', 'status_code')

    op.add_column('iterations', sa.Column('code', sa.String(), nullable=True))
    op.execute(
        """
        UPDATE iterations
        SET code = CASE iteration_name
            WHEN 'Аналитика' THEN 'ANALYTICS'
            WHEN 'Разработка' THEN 'DEVELOPING'
            WHEN 'Тестирование' THEN 'TESTING'
            ELSE 'ITERATION_' || id::text
        END
        WHERE code IS NULL
        """
    )
    op.alter_column('iterations', 'code', nullable=False)
    op.create_unique_constraint('uq_iterations_code', 'iterations', ['code'])

    op.add_column('roles', sa.Column('code', sa.String(), nullable=True))
    op.execute(
        """
        UPDATE roles
        SET code = CASE role_name
            WHEN 'Администратор' THEN 'ADMIN'
            WHEN 'Студент' THEN 'STUDENT'
            WHEN 'Куратор' THEN 'CURATOR'
            ELSE 'ROLE_' || id::text
        END
        WHERE code IS NULL
        """
    )
    op.alter_column('roles', 'code', nullable=False)
    op.create_unique_constraint('uq_roles_code', 'roles', ['code'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_roles_code', 'roles', type_='unique')
    op.drop_column('roles', 'code')

    op.drop_constraint('uq_iterations_code', 'iterations', type_='unique')
    op.drop_column('iterations', 'code')

    op.add_column('case_statuses', sa.Column('status_code', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.execute("UPDATE case_statuses SET status_code = code WHERE status_code IS NULL")
    op.alter_column('case_statuses', 'status_code', nullable=False)
    op.drop_constraint('uq_case_statuses_code', 'case_statuses', type_='unique')
    op.drop_column('case_statuses', 'code')

    op.add_column('case_difficulty_levels', sa.Column('level_code', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.execute("UPDATE case_difficulty_levels SET level_code = code WHERE level_code IS NULL")
    op.alter_column('case_difficulty_levels', 'level_code', nullable=False)
    op.drop_constraint('uq_case_difficulty_levels_code', 'case_difficulty_levels', type_='unique')
    op.drop_column('case_difficulty_levels', 'code')
