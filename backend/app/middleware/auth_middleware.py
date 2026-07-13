from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import decode_token, get_user_by_id

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def get_current_user_or_guest(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(optional_security),
) -> dict:
    """Returns authenticated user or guest dict. Never raises 401."""
    if credentials:
        user_id = decode_token(credentials.credentials)
        if user_id:
            user = get_user_by_id(user_id)
            if user:
                user["is_guest"] = False
                return user

    guest_id = request.headers.get("X-Guest-ID")
    if guest_id:
        return {"id": f"guest_{guest_id}", "is_guest": True, "email": None}

    return {"id": "anonymous", "is_guest": True, "email": None}
