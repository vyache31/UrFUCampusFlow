from sqlalchemy import (
    String, ForeignKey, DateTime
)
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Cases(Base):
    __tablename__ = 'cases'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    title: Mapped[str]
    description: Mapped[str]
    university_id: Mapped[int] = mapped_column(ForeignKey('university_info.id'))
    semester_id: Mapped[int] = mapped_column(ForeignKey('semesters.id'))
    status_id: Mapped[int] = mapped_column(ForeignKey('case_statuses.id'))
    creator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class CaseStatuses(Base):
    __tablename__ = 'case_statuses'

    id: Mapped[int] = mapped_column(primary_key=True)
    status_code: Mapped[str]
    status_name: Mapped[str]


class EvaluationForm(Base):
    __tablename__ = 'evaluation_form'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    creator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EvaluationFormReactions(Base):
    __tablename__ = 'evaluation_form_reactions'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    evaluation_form_id: Mapped[str] = mapped_column(ForeignKey('evaluation_form.id'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    reaction: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EvaluationFormComments(Base):
    __tablename__ = 'evaluation_form_comments'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    evaluation_form_id: Mapped[str] = mapped_column(ForeignKey('evaluation_form.id'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    comment_text: Mapped[str] = mapped_column(String())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))








