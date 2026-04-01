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

    evaluation_forms = relationship('EvaluationForm', back_populates='case')
    grades = relationship('Grades', back_populates='case')
    meetings = relationship('Meetings', back_populates='case')
    status = relationship('CaseStatuses', back_populates='cases')
    creator = relationship('Users', back_populates='created_cases')
    teams = relationship('Teams', back_populates='case')
    semester = relationship('Semesters', back_populates='cases')
    team_history = relationship('TeamCaseHistory', back_populates='case')


class CaseStatuses(Base):
    __tablename__ = 'case_statuses'

    id: Mapped[int] = mapped_column(primary_key=True)
    status_code: Mapped[str]
    status_name: Mapped[str]

    cases = relationship('Cases', back_populates='status')


class EvaluationForm(Base):
    __tablename__ = 'evaluation_form'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    creator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    case = relationship("Cases", back_populates='evaluation_forms')
    reactions = relationship('EvaluationFormReactions', back_populates='form')
    comments = relationship('EvaluationFormComments', back_populates='form')
    creator = relationship('Users', back_populates='evaluation_forms')


class EvaluationFormReactions(Base):
    __tablename__ = 'evaluation_form_reactions'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    evaluation_form_id: Mapped[str] = mapped_column(ForeignKey('evaluation_form.id'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    reaction: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    form = relationship('EvaluationForm', back_populates='reactions')
    creator = relationship('Users', back_populates='evaluation_form_reactions')


class EvaluationFormComments(Base):
    __tablename__ = 'evaluation_form_comments'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    evaluation_form_id: Mapped[str] = mapped_column(ForeignKey('evaluation_form.id'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    comment_text: Mapped[str] = mapped_column(String())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    form = relationship('EvaluationForm', back_populates='comments')
    creator = relationship('Users', back_populates='evaluation_form_comments')






