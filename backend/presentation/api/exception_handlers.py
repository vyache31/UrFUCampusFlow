import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from application.exceptions.base import (
    ApplicationValidationError,
    AuthenticationError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)


logger = logging.getLogger(__name__)


async def application_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, NotFoundError):
        status_code = 404
    elif isinstance(exc, ConflictError):
        status_code = 409
    elif isinstance(exc, ApplicationValidationError):
        status_code = 422
    elif isinstance(exc, ForbiddenError):
        status_code = 403
    elif isinstance(exc, AuthenticationError):
        status_code = 401
    else:
        logger.error(
            "Application error during %s %s",
            request.method,
            request.url.path,
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return JSONResponse(status_code=status_code, content={"detail": str(exc)})
