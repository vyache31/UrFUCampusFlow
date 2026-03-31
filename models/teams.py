from sqlalchemy import (
    String, ForeignKey, DateTime
)
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Students(Base):
    __tablename__ = 'students'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    name: Mapped[str]
    group: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    team_memberships = relationship('TeamMembers', back_populates='student')


class TeamMembers(Base):
    __tablename__ = 'team_members'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey('students.id'))
    position: Mapped[str]
    team_id: Mapped[str] = mapped_column(ForeignKey('teams.id'))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    left_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_current: Mapped[bool]

    team = relationship('Teams', back_populates='team_members')
    student = relationship('Students', back_populates='team_memberships')


class Teams(Base):
    __tablename__ = 'teams'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    name: Mapped[str]
    semester_id: Mapped[int] = mapped_column(ForeignKey('semesters.id'))
    university_id: Mapped[int] = mapped_column(ForeignKey('university_info.id'))
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    status: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    team_members = relationship('TeamMembers', back_populates='team')
    grades = relationship('Grades', back_populates='team')
    meetings = relationship('Meetings', back_populates='team')
    semester = relationship('Semesters', back_populates='teams')
    university = relationship('Universities', back_populates='teams')
    case = relationship('Cases', back_populates='teams')


class Semesters(Base):
    __tablename__ = 'semesters'

    id: Mapped[int] = mapped_column(primary_key=True)
    season: Mapped[str]
    year: Mapped[int]
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    grades = relationship('Grades', back_populates='semester')
    cases = relationship('Cases', back_populates='semester')
    teams = relationship('Teams', back_populates='semester')


class Universities(Base):
    __tablename__ = 'university_info'

    id: Mapped[int] = mapped_column(primary_key=True)
    uni_name: Mapped[str]
    contact_email: Mapped[str]

    teams = relationship('Teams', back_populates='university')






