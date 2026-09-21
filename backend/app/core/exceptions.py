from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

class CLMException(Exception):
    def __init__(self, message: str, error_code: str = "ERROR", status_code: int = 400, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class AuthenticationError(CLMException):
    def __init__(self, message: str = "Authentication required", error_code: str = "UNAUTHORIZED", details: dict = None):
        super().__init__(message, error_code, 401, details)

class PermissionDeniedError(CLMException):
    def __init__(self, message: str = "Permission denied", error_code: str = "FORBIDDEN", details: dict = None):
        super().__init__(message, error_code, 403, details)

class TenantViolationError(CLMException):
    def __init__(self, message: str = "Access denied", error_code: str = "TENANT_VIOLATION", details: dict = None):
        super().__init__(message, error_code, 403, details)

class NotFoundError(CLMException):
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND", details: dict = None):
        super().__init__(message, error_code, 404, details)

class ConflictError(CLMException):
    def __init__(self, message: str = "Resource already exists", error_code: str = "CONFLICT", details: dict = None):
        super().__init__(message, error_code, 409, details)

class LimitExceededError(CLMException):
    def __init__(self, message: str = "Plan limit exceeded", error_code: str = "LIMIT_EXCEEDED", details: dict = None):
        super().__init__(message, error_code, 429, details)

class InternalError(CLMException):
    def __init__(self, message: str = "Internal server error", error_code: str = "INTERNAL_ERROR", details: dict = None):
        super().__init__(message, error_code, 500, details)

def _error_response(status_code: int, error_code: str, message: str, details: dict = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error_code, "message": message, "details": details or {}}
    )

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(CLMException)
    async def clm_handler(request: Request, exc: CLMException):
        return _error_response(exc.status_code, exc.error_code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        errors = {}
        for e in exc.errors():
            loc = ".".join(str(l) for l in e["loc"] if l != "body")
            errors[loc] = e["msg"]
        return _error_response(422, "VALIDATION_ERROR", "Validation failed", errors)

    @app.exception_handler(Exception)
    async def general_handler(request: Request, exc: Exception):
        import structlog
        log = structlog.get_logger()
        log.error("unhandled_exception", error=str(exc), path=request.url.path)
        return _error_response(500, "INTERNAL_ERROR", "An unexpected error occurred")
