from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.requests import RegisterRequest, LoginRequest, UpdateProfileRequest
from app.schemas.responses import UserResponse, TokenResponse
from app.services import auth_service
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    try:
        user = auth_service.register_user(req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    token = auth_service.create_token(user["id"])
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = auth_service.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = auth_service.create_token(user["id"])
    return TokenResponse(access_token=token)


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "body_type": user.get("body_type"),
        "skin_tone": user.get("skin_tone"),
        "measurements": user.get("measurements"),
        "preferences": user.get("preferences"),
    }


@router.put("/me")
def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    updates = req.model_dump(exclude_unset=True)
    if updates:
        updated = auth_service.update_user(user["email"], updates)
        return updated
    return user
