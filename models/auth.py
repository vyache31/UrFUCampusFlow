from sqlalchemy import (
    String, ForeignKey, DateTime
)
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Users(Base):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    role_id: Mapped[int] = mapped_column(ForeignKey('roles.id'))
    password_hash: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    microsoft_oauth = relationship('MicrosoftOAuth', back_populates='user')
    role = relationship('Roles', back_populates='users')
    created_cases = relationship('Cases', back_populates='creator')
    evaluation_forms = relationship('EvaluationForm', back_populates='creator')
    evaluation_form_reactions = relationship('EvaluationFormReactions', back_populates='creator')
    evaluation_form_comments = relationship('EvaluationFormComments', back_populates='creator')


class Roles(Base):
    __tablename__ = 'roles'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_name: Mapped[str]
    code: Mapped[str] = mapped_column(unique=True)

    users = relationship('Users', back_populates='role')
