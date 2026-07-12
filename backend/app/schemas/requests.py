from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    body_type: str | None = None
    skin_tone: str | None = None
    measurements: dict | None = None
    preferences: dict | None = None


class UpdateWardrobeItemRequest(BaseModel):
    type: str | None = None
    sub_type: str | None = None
    primary_color: str | None = None
    color_hex: str | None = None
    pattern: str | None = None
    season: list[str] | None = None
    formality: float | None = None
    tags: list[str] | None = None


class RateOutfitRequest(BaseModel):
    combo_id: str
    rating: int  # 1-5
    worn: bool = False


class OutfitSuggestRequest(BaseModel):
    occasion: str | None = None
    count: int = 5
