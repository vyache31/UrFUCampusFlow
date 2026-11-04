"""feat: new s3_files_cleanup table

Revision ID: cc7b901efdd1
Revises: 973de1c513ec
Create Date: 2026-11-03 21:47:29.910489

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'cc7b901efdd1'
down_revision: Union[str, Sequence[str], None] = '973de1c513ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('s3_files_cleanup',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('object_key', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('next_attempt_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('last_error', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('object_key')
    )
    op.create_index(op.f('ix_s3_files_cleanup_next_attempt_at'), 's3_files_cleanup', ['next_attempt_at'], unique=False)
    # An earlier, reverted implementation can still exist in a Docker volume.
    op.execute("""
        DO $$
        BEGIN
            IF to_regclass('s3_object_cleanup') IS NOT NULL THEN
                INSERT INTO s3_files_cleanup
                    (id, object_key, created_at, next_attempt_at, attempts)
                SELECT gen_random_uuid()::text, object_key, CURRENT_TIMESTAMP,
                       available_at, 0
                FROM s3_object_cleanup
                ON CONFLICT (object_key) DO NOTHING;
            END IF;
        END;
        $$
    """)
    op.execute("DROP TRIGGER IF EXISTS s3_files_metadata_cleanup ON s3_files_metadata")
    op.execute("DROP FUNCTION IF EXISTS enqueue_s3_object_cleanup()")
    op.execute("DROP TABLE IF EXISTS s3_object_cleanup")

    op.add_column('s3_files_metadata', sa.Column('status', sa.String(), nullable=True))
    # Existing objects must be checked in S3 before they can be considered ready.
    op.execute("UPDATE s3_files_metadata SET status = 'uploading' WHERE status IS NULL")
    op.alter_column('s3_files_metadata', 'status', existing_type=sa.String(), nullable=False)
    op.create_check_constraint(
        'ck_status', 's3_files_metadata', "status IN ('uploading', 'ready')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ck_status', 's3_files_metadata', type_='check')
    op.drop_column('s3_files_metadata', 'status')
    op.drop_index(op.f('ix_s3_files_cleanup_next_attempt_at'), table_name='s3_files_cleanup')
    op.drop_table('s3_files_cleanup')
