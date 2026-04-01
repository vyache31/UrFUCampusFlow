from sqlalchemy import (
    String, ForeignKey,
)
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Grades(Base):
    __tablename__ = 'grades'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    semester_id: Mapped[int] = mapped_column(ForeignKey('semesters.id'))
    team_id: Mapped[str] = mapped_column(ForeignKey('teams.id'))
    score: Mapped[int]
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    iteration_id: Mapped[int] = mapped_column(ForeignKey('iterations.id'))

    team = relationship('Teams', back_populates='grades')
    iteration = relationship('Iterations', back_populates='grades')
    case = relationship('Cases', back_populates='grades')
    semester = relationship('Semesters', back_populates='grades')


class Iterations(Base):
    __tablename__ = 'iterations'

    id: Mapped[int] = mapped_column(primary_key=True)
    iteration_name: Mapped[str]

    grades = relationship('Grades', back_populates='iteration')