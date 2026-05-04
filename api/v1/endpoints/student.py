from fastapi import APIRouter, Depends, HTTPException, Query
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from services.student_service import StudentService
from dependies.student_depends import get_student_service
from dependies.auth_depends import check_auth, require_admin_role


router = APIRouter(
    prefix='/students',
    tags=["Students"]
)


@router.post('/', response_model=StudentResponse)
async def create_student(
        schema: StudentCreate,
        user=Depends(check_auth),
        service: StudentService = Depends(get_student_service)
):
    try:
        return await service.create_student(schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.get('/', response_model=list[StudentResponse])
async def get_all_students(
        limit: int = Query(10),
        user=Depends(check_auth),
        service: StudentService = Depends(get_student_service)
):
    return await service.get_all_students(limit)


@router.get('/{student_id}', response_model=StudentResponse)
async def get_student(
        student_id: str,
        user=Depends(check_auth),
        service: StudentService = Depends(get_student_service)
):
    student = await service.get_student_by_id(student_id)

    if not student:
        raise HTTPException(status_code=404, detail='Student not found')

    return student


@router.patch('/{student_id}', response_model=StudentResponse)
async def update_student(
        student_id: str,
        schema: StudentUpdate,
        user=Depends(check_auth),
        service: StudentService = Depends(get_student_service)
):
    try:
        student = await service.update_student(student_id, schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

    if not student:
        raise HTTPException(status_code=404, detail='Student not found')

    return student


@router.delete('/{student_id}')
async def delete_student(
        student_id: str,
        user=Depends(check_auth),
        service: StudentService = Depends(get_student_service)
):
    result = await service.delete_student(student_id)

    if not result:
        raise HTTPException(status_code=404, detail='Student not found')

    return {'status': 'deleted'}
