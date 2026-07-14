import os
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv(dotenv_path="../.env.local")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
# If the secret isn't provided, we'll gracefully fallback or throw an error in production.
# For local dev, we might allow it to pass temporarily if they haven't set it up, but it's better to enforce it.

security = HTTPBearer()

class User(BaseModel):
    id: str
    role: str
    email: str

def verify_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify the JWT token issued by Supabase."""
    token = credentials.credentials
    if not SUPABASE_JWT_SECRET:
        # In a real app, you MUST have the secret. We will fail loudly.
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET is not configured.")
    
    try:
        # Supabase uses HS256 for signing tokens, and the audience is 'authenticated'
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            options={"verify_aud": False} # Sometimes audience varies, safe to skip in basic setup
        )
        
        user_id = payload.get("sub")
        email = payload.get("email", "")
        role = payload.get("role", "authenticated")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
            
        return User(id=user_id, email=email, role=role)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
