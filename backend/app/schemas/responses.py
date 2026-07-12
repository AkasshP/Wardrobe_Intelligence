from pydantic import BaseModel
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    email: str
    body_type: str | None
    skin_tone: str | None
    measurements: dict | None
    preferences: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class WardrobeItemResponse(BaseModel):
    id: str
    image_url: str
    type: str
    sub_type: str | None
    primary_color: str | None
    color_hex: str | None
    pattern: str | None
    season: list[str] | None
    formality: float | None
    tags: list[str] | None
    times_worn: int
    last_worn_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClothingClassification(BaseModel):
    type: str
    sub_type: str | None
    color: dict
    pattern: str
    season: list[str]
    formality: float
    tags: list[str]


class OutfitComboResponse(BaseModel):
    id: str
    top: WardrobeItemResponse
    bottom: WardrobeItemResponse
    layer: WardrobeItemResponse | None
    accessory: WardrobeItemResponse | None
    occasion: str | None
    color_score: float | None
    total_score: float | None

    model_config = {"from_attributes": True}


class GapAnalysisResponse(BaseModel):
    total_items: int
    items_by_type: dict
    current_combo_count: int
    suggestions: list[dict]
    color_gaps: list[str]
