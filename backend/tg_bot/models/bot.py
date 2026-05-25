from sqlalchemy import (
    String, ForeignKey, DateTime, UniqueConstraint
)
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Interviews(Base):
    __tablename__ = 'interviews'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    tg_user_id: Mapped[int]
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    team_name: Mapped[str]
    date_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    case = relationship('Cases', back_populates='interviews')

class BotMode(Base):
    __tablename__ = 'bot_mode'

    id: Mapped[int] = mapped_column(primary_key=True, unique=True)
    mode: Mapped[str]
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class BotCases(Base):
    __tablename__ = 'bot_cases'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    case = relationship('Cases', back_populates='bot_cases')


class RecruitmentCurators(Base):
    __tablename__ = 'recruitment_curators'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user = relationship('Users', back_populates='recruitment_curators')
