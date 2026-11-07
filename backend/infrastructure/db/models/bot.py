from sqlalchemy import (
    String, ForeignKey, DateTime, UniqueConstraint
)
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import relationship, mapped_column, Mapped
from infrastructure.db.database import Base


class Interviews(Base):
    __tablename__ = 'interviews'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    tg_user_id: Mapped[int]
    case_id: Mapped[str] = mapped_column(ForeignKey('bot_cases.id', ondelete="CASCADE"))
    team_name: Mapped[str]
    date_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status_id: Mapped[int] = mapped_column(ForeignKey('interview_statuses.id'))
    event_link: Mapped[str | None] = mapped_column(nullable=True)

    case = relationship("BotCases", back_populates="interviews")
    status = relationship('InterviewStatuses', back_populates='interviews')
    curators: Mapped[list["InterviewCurators"]] = relationship(
        'InterviewCurators',
        back_populates='interview',
        cascade='all, delete-orphan',
    )

class InterviewStatuses(Base):
    __tablename__ = 'interview_statuses'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(unique=True)
    status_name: Mapped[str]

    interviews = relationship('Interviews', back_populates='status')

class InterviewCurators(Base):
    __tablename__ = 'interview_curators'

    interview_id: Mapped[str] = mapped_column(
        ForeignKey('interviews.id', ondelete='CASCADE'), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    outlook_event_id: Mapped[str | None] = mapped_column(nullable=True)

    interview: Mapped["Interviews"] = relationship('Interviews', back_populates='curators')
    user = relationship('Users')

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

    case = relationship('Cases')
    interviews = relationship(
        "Interviews",
        back_populates="case",
        cascade="all, delete-orphan"
    )


class RecruitmentCurators(Base):
    __tablename__ = 'recruitment_curators'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user = relationship('Users')
