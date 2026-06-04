from datetime import datetime, timedelta
from datetime import timezone as TZ
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class MicrosoftOAuth(Base):
    __tablename__ = "microsoft_oauth"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    provider_user_id: Mapped[str] = mapped_column(String(36))
    microsoft_email: Mapped[str] = mapped_column(nullable=True)
    encrypted_refresh_token: Mapped[str] = mapped_column(String)
    encrypted_access_token: Mapped[str] = mapped_column(String)
    access_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scope: Mapped[str]
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_refreshed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool]

    user = relationship("Users", back_populates="microsoft_oauth")


class Meetings(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    team_case_history_id: Mapped[str] = mapped_column(
        ForeignKey("team_case_history.id")
    )
    title: Mapped[str]
    location: Mapped[Optional[str]] = mapped_column(nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    outlook_event_id: Mapped[str]
    event_link: Mapped[str] = mapped_column(nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)
    timezone: Mapped[Optional[int]] = mapped_column(nullable=True)
    meetings_series_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("meetings_series.id"), nullable=True
    )

    tasks = relationship(
        "MeetingTask", back_populates="meeting", cascade="all, delete-orphan"
    )
    series = relationship("MeetingsSeries", back_populates="meetings")

    @property
    def tz(self) -> TZ:
        if self.timezone is None:
            return TZ(timedelta(hours=5))
        return TZ(timedelta(hours=self.timezone))

    team_case_history = relationship("TeamCaseHistory", back_populates="meetings")


class MeetingTask(Base):
    __tablename__ = "meeting_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str]
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id"))
    is_completed: Mapped[bool]

    meeting = relationship("Meetings", back_populates="tasks")


class MeetingsSeries(Base):
    __tablename__ = "meetings_series"
    id: Mapped[str] = mapped_column(String(36), nullable=False, primary_key=True)
    team_case_history_id: Mapped[str] = mapped_column(
        ForeignKey("team_case_history.id")
    )
    outlook_series_master_id: Mapped[str]
    title: Mapped[str]
    location: Mapped[Optional[str]] = mapped_column(nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    event_link: Mapped[str] = mapped_column(nullable=True)
    recurrence_pattern: Mapped[dict] = mapped_column(JSONB)
    recurrence_range: Mapped[dict] = mapped_column(JSONB)

    team_case_history = relationship(
        "TeamCaseHistory", back_populates="meetings_series"
    )
    meetings = relationship(
        "Meetings", back_populates="series", cascade="all, delete-orphan"
    )
