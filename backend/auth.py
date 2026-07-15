import os
from pathlib import Path

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env.local")
load_dotenv(dotenv_path=ROOT_DIR / ".env")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
# If the secret isn't provided, we'll gracefully fallback or throw an error in production.
# For local dev, we might allow it to pass temporarily if they haven't set it up, but it's better to enforce it.

security = HTTPBearer()

class User(BaseModel):
    id: str
    role: str
    email: str


def _get_supabase_jwks_url() -> str | None:
    if not SUPABASE_URL:
        return None
    return f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _decode_token(token: str) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    algorithm = unverified_header.get("alg", "HS256")

    if algorithm == "HS256" and SUPABASE_JWT_SECRET:
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

    if algorithm in {"RS256", "ES256"}:
        jwks_url = _get_supabase_jwks_url()
        if not jwks_url:
            raise HTTPException(
                status_code=500,
                detail="Supabase URL is not configured for JWKS-based token verification.",
            )

        signing_key = jwt.PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )

    raise HTTPException(status_code=401, detail=f"Unsupported JWT algorithm: {algorithm}")


def verify_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify the JWT token issued by Supabase."""
    token = credentials.credentials

    try:
        payload = _decode_token(token)

        user_id = payload.get("sub")
        email = payload.get("email", "")
        role = payload.get("role", "authenticated")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")

        return User(id=user_id, email=email, role=role)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired") from None
    except jwt.InvalidTokenError as e:
        unverified_header = jwt.get_unverified_header(token)
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}. Header: {unverified_header}",
        ) from None
    except HTTPException:
        raise
