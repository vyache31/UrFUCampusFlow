from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Students(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    name: Mapped[str]
    university_id: Mapped[int] = mapped_column(ForeignKey("university_info.id"))
    group: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    team_memberships = relationship("TeamMembers", back_populates="student")
    university = relationship("Universities", back_populates="students")


class TeamMembers(Base):
    __tablename__ = "team_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.id"))
    position: Mapped[str]
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    left_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_current: Mapped[bool]

    team = relationship("Teams", back_populates="team_members")
    student = relationship("Students", back_populates="team_memberships")


class Teams(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    description: Mapped[str] = mapped_column(String(100), nullable=True)
    notes: Mapped[str] = mapped_column(String(100), nullable=True)
    name: Mapped[str]
    university_id: Mapped[int] = mapped_column(ForeignKey("university_info.id"))
    status: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    team_members = relationship("TeamMembers", back_populates="team")
    university = relationship("Universities", back_populates="teams")
    case_history = relationship("TeamCaseHistory", back_populates="team")


class TeamCaseHistory(Base):
    __tablename__ = "team_case_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), index=True)
    case_semesters_id: Mapped[str] = mapped_column(ForeignKey("case_semesters.id"))
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    team = relationship("Teams", back_populates="case_history")
    case_semester = relationship("CaseSemesters", back_populates="team_case_history")
    grades = relationship("Grades", back_populates="team_case_history")
    meetings = relationship("Meetings", back_populates="team_case_history")
    meetings_series = relationship("MeetingsSeries", back_populates="team_case_history")
    curator_assignments = relationship(
        "CuratorAssignment", back_populates="team_case_history"
    )


class CuratorAssignment(Base):
    __tablename__ = "curator_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    team_case_history_id: Mapped[str] = mapped_column(
        ForeignKey("team_case_history.id")
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    unassigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("Users", back_populates="curator_assignments")
    team_case_history = relationship(
        "TeamCaseHistory", back_populates="curator_assignments"
    )
    meetings_attendance = relationship(
        "CuratorMeetingsAttendance", back_populates="curator_assignment"
    )


class Semesters(Base):
    __tablename__ = "semesters"

    id: Mapped[int] = mapped_column(primary_key=True)
    season: Mapped[str]
    year: Mapped[int]
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("season", "year", name="uq_semesters_season_year"),
    )

    case_semesters = relationship("CaseSemesters", back_populates="semester")


class Universities(Base):
    __tablename__ = "university_info"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    uni_name: Mapped[str]
    contact_email: Mapped[str]

    teams = relationship("Teams", back_populates="university")
    cases = relationship("Cases", back_populates="university")
    students = relationship("Students", back_populates="university")
