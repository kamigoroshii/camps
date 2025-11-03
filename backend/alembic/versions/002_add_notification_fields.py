"""Add notification fields and verification score

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add verification_score column to service_requests
    op.add_column('service_requests', sa.Column('verification_score', sa.Float(), nullable=True))


def downgrade():
    # Remove verification_score column
    op.drop_column('service_requests', 'verification_score')