from datetime import datetime

from pydantic import BaseModel


class S3FileMetadataResponse(BaseModel):
    id: str
    task_id: str
    original_filename: str
    size_bytes: int
    content_type: str
    created_at: datetime
    uploaded_by: str

    class Config:
        from_attributes = True
