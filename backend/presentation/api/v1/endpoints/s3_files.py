from urllib.parse import quote

from fastapi import APIRouter, Depends, Response, UploadFile

from application.services.s3_files_service import S3FileMetadataService
from presentation.api.dependencies.auth_depends import get_current_auth_user
from presentation.api.dependencies.s3_files_depends import get_s3_files_service
from presentation.api.schemas.s3_files_schemas import S3FileMetadataResponse


router = APIRouter(
    prefix="/teams/{team_id}/meetings/{meeting_id}/tasks/{task_id}/files",
    tags=["Task Files"],
)


@router.post("", response_model=S3FileMetadataResponse, status_code=201)
async def upload_file(
    team_id: str,
    meeting_id: str,
    task_id: str,
    file: UploadFile,
    user=Depends(get_current_auth_user),
    service: S3FileMetadataService = Depends(get_s3_files_service),
):
    return await service.upload(
        task_id=task_id, user=user, meeting_id=meeting_id, team_id=team_id, file=file
    )


@router.get("", response_model=list[S3FileMetadataResponse])
async def get_task_files(
    team_id: str,
    meeting_id: str,
    task_id: str,
    user=Depends(get_current_auth_user),
    service: S3FileMetadataService = Depends(get_s3_files_service),
):
    return await service.get_by_task_id(
        task_id=task_id, user=user, meeting_id=meeting_id, team_id=team_id
    )


@router.get("/{file_id}/download", response_class=Response)
async def download_file(
    team_id: str,
    meeting_id: str,
    task_id: str,
    file_id: str,
    user=Depends(get_current_auth_user),
    service: S3FileMetadataService = Depends(get_s3_files_service),
) -> Response:
    content, metadata = await service.download(
        task_id=task_id, user=user, meeting_id=meeting_id, team_id=team_id, file_id=file_id
    )
    filename = quote(metadata.original_filename, safe="")
    return Response(
        content=content,
        media_type=metadata.content_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/{file_id}", status_code=204, response_class=Response)
async def delete_file(
    team_id: str,
    meeting_id: str,
    task_id: str,
    file_id: str,
    user=Depends(get_current_auth_user),
    service: S3FileMetadataService = Depends(get_s3_files_service),
) -> Response:
    await service.delete(
        task_id=task_id, user=user, meeting_id=meeting_id, team_id=team_id, file_id=file_id
    )
    return Response(status_code=204)
