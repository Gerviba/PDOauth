"""empty message

Revision ID: 22f51775a6ac
Revises: a4910bfd68
Create Date: 2015-05-05 18:55:21.176532

"""

# revision identifiers, used by Alembic.
revision = '22f51775a6ac'
down_revision = 'a4910bfd68'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('assurance',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('timestamp', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('assurer_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['assurer_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('assurance')
    ### end Alembic commands ###