from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_validator


class DaysOfWeek(str, Enum):
    monday = "Monday"
    tuesday = "Tuesday"
    wednesday = "Wednesday"
    thursday = "Thursday"
    friday = "Friday"
    saturday = "Saturday"
    sunday = "Sunday"


class PatternType(str, Enum):
    daily = "daily"
    weekly = "weekly"
    absolute_monthly = "absoluteMonthly"
    relative_monthly = "relativeMonthly"
    absolute_yearly = "absoluteYearly"
    relative_yearly = "relativeYearly"


class RangeType(str, Enum):
    no_end = "noEnd"
    end_date = "endDate"
    numbered = "numbered"


class WeekIndex(str, Enum):
    first = "first"
    second = "second"
    third = "third"
    fourth = "fourth"
    last = "last"


class RecurrencePattern(BaseModel):
    type: PatternType
    interval: int
    days_of_week: Optional[list[DaysOfWeek]] = None
    day_of_month: Optional[int] = None
    index: Optional[WeekIndex] = None
    month: Optional[int] = None
    first_day_of_week: Optional[DaysOfWeek] = None

    @model_validator(mode="after")
    def check_required_fields(self):
        t = self.type
        if t == PatternType.weekly and not self.days_of_week:
            raise ValueError("days_of_week обязателен для weekly")
        if (
            t in (PatternType.absolute_monthly, PatternType.absolute_yearly)
            and self.day_of_month is None
        ):
            raise ValueError("day_of_month обязателен для absolute типов")
        if (
            t in (PatternType.relative_monthly, PatternType.relative_yearly)
            and not self.days_of_week
        ):
            raise ValueError("days_of_week обязателен для relative типов")
        if (
            t in (PatternType.relative_monthly, PatternType.relative_yearly)
            and self.index is None
        ):
            raise ValueError("index обязателен для relative типов")
        if (
            t in (PatternType.absolute_yearly, PatternType.relative_yearly)
            and self.month is None
        ):
            raise ValueError("month обязателен для yearly типов")
        return self


class RecurrenceRange(BaseModel):
    type: RangeType
    start_date: date
    end_date: Optional[date] = None
    number_of_occurrences: Optional[int] = None
    recurrence_time_zone: Optional[str] = None

    @model_validator(mode="after")
    def check_required_fields(self):
        if self.type == RangeType.end_date and self.end_date is None:
            raise ValueError("end_date обязателен для типа endDate")
        if self.type == RangeType.numbered and self.number_of_occurrences is None:
            raise ValueError("number_of_occurrences обязателен для типа numbered")
        return self


class Recurrence(BaseModel):
    pattern: RecurrencePattern
    range: RecurrenceRange


class MeetingsSeriesCreate(BaseModel):
    title: str
    start_at: datetime
    location: Optional[str] = "Контур.Толк"
    end_at: datetime
    event_link: Optional[str] = None
    recurrence: Recurrence


class MeetingsSeriesResponse(MeetingsSeriesCreate):
    class Config:
        from_attributes = True

    pass
