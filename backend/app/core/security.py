from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.exceptions import AuthenticationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type", "INVALID_TOKEN")
        return payload
    except JWTError:
        raise AuthenticationError("Invalid or expired token", "INVALID_TOKEN")

def create_refresh_token() -> str:
    """Generate a secure random refresh token (raw, unhashed)."""
    return secrets.token_hex(64)

def hash_token(token: str) -> str:
    """SHA-256 hash for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)
