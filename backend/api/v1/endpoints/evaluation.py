from fastapi import APIRouter, Depends, HTTPException

from dependies.auth_depends import get_current_auth_user
from dependies.evaluation_depends import get_evaluation_service
from schemas.evaluation_schemas import (
    EvaluationCommentCreate,
    EvaluationCommentResponse,
    EvaluationCommentUpdate,
    EvaluationFormResponse,
    EvaluationReactionCreate,
    EvaluationReactionResponse,
    EvaluationReactionUpdate,
    ReactionType,
)
from services.evaluation_service import EvaluationService


router = APIRouter(tags=["Case Evaluations"])


def _evaluation_error(error: ValueError) -> HTTPException:
    detail = str(error)

    if "does not exist" in detail or "not found" in detail:
        return HTTPException(status_code=404, detail=detail)

    if "cannot update" in detail:
        return HTTPException(status_code=403, detail=detail)

    return HTTPException(status_code=409, detail=detail)


@router.get(
    "/cases/{case_id}/evaluations",
    response_model=list[EvaluationFormResponse],
)
async def get_case_evaluation_forms(
    case_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    return await service.get_evaluation_forms_by_case_id(case_id)


@router.get(
    "/cases/{case_id}/evaluations/current",
    response_model=EvaluationFormResponse,
)
async def get_current_case_evaluation_form(
    case_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    form = await service.get_current_evaluation_form_by_case_id(case_id)

    if not form:
        raise HTTPException(status_code=404, detail="Evaluation form not found")

    return form


@router.get(
    "/evaluation-forms/{form_id}",
    response_model=EvaluationFormResponse,
)
async def get_evaluation_form(
    form_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    form = await service.get_evaluation_form_by_id(form_id)

    if not form:
        raise HTTPException(status_code=404, detail="Evaluation form not found")

    return form


@router.post(
    "/evaluation-reactions",
    response_model=EvaluationReactionResponse,
    status_code=201,
)
async def create_evaluation_reaction(
    schema: EvaluationReactionCreate,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return await service.evaluation_reaction_create(user.id, schema)
    except ValueError as error:
        raise _evaluation_error(error)


@router.get(
    "/evaluation-reactions/",
    response_model=list[EvaluationReactionResponse],
)
async def get_all_evaluation_reactions(
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    return await service.get_all_evaluation_reactions()


@router.get(
    "/evaluation-reactions/{reaction_type}",
    response_model=list[EvaluationReactionResponse],
)
async def get_evaluation_reactions_by_type(
    reaction_type: ReactionType,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    return await service.get_evaluation_reactions_by_type(reaction_type)


@router.get(
    "/evaluation-reactions/id/{reaction_id}",
    response_model=EvaluationReactionResponse,
)
async def get_evaluation_reaction(
    reaction_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    reaction = await service.get_evaluation_reaction_by_id(reaction_id)

    if not reaction:
        raise HTTPException(status_code=404, detail="Evaluation reaction not found")

    return reaction


@router.get(
    "/evaluation-forms/{form_id}/reactions",
    response_model=list[EvaluationReactionResponse],
)
async def get_evaluation_form_reactions(
    form_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    return await service.get_evaluation_reactions_by_form_id(form_id)


@router.get(
    "/evaluation-forms/{form_id}/reactions/me",
    response_model=EvaluationReactionResponse,
)
async def get_current_user_evaluation_reaction(
    form_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    reaction = await service.get_evaluation_reaction_by_form_and_user(
        form_id, user.id
    )

    if not reaction:
        raise HTTPException(status_code=404, detail="Evaluation reaction not found")

    return reaction


@router.patch(
    "/evaluation-reactions/{reaction_id}",
    response_model=EvaluationReactionResponse,
)
async def update_evaluation_reaction(
    reaction_id: str,
    schema: EvaluationReactionUpdate,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return await service.evaluation_reaction_update(
            reaction_id, user.id, schema
        )
    except ValueError as error:
        raise _evaluation_error(error)


@router.post(
    "/evaluation-comments",
    response_model=EvaluationCommentResponse,
    status_code=201,
)
async def create_evaluation_comment(
    schema: EvaluationCommentCreate,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return await service.evaluation_comment_create(
            user.id,
            user.email,
            schema
        )
    except ValueError as error:
        raise _evaluation_error(error)


@router.get(
    "/evaluation-comments/{comment_id}",
    response_model=EvaluationCommentResponse,
)
async def get_evaluation_comment(
    comment_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    comment = await service.get_evaluation_comment_by_id(comment_id)

    if not comment:
        raise HTTPException(status_code=404, detail="Evaluation comment not found")

    return comment


@router.get(
    "/evaluation-forms/{form_id}/comments",
    response_model=list[EvaluationCommentResponse],
)
async def get_evaluation_form_comments(
    form_id: str,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    return await service.get_evaluation_comments_by_form_id(form_id)


@router.patch(
    "/evaluation-comments/{comment_id}",
    response_model=EvaluationCommentResponse,
)
async def update_evaluation_comment(
    comment_id: str,
    schema: EvaluationCommentUpdate,
    user=Depends(get_current_auth_user),
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return await service.evaluation_comment_update(comment_id, user.id, schema)
    except ValueError as error:
        raise _evaluation_error(error)
