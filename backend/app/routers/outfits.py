import uuid
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user
from app.dynamo import user_items_table, from_decimal, to_decimal
from app.services.combo_service import suggest_combos_dynamo
from boto3.dynamodb.conditions import Key
import replicate

settings = get_settings()
os.environ["REPLICATE_API_TOKEN"] = settings.replicate_api_token

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


@router.get("/suggest-combos")
def get_outfit_combos(
    occasion: str = Query("casual"),
    count: int = Query(5, ge=1, le=10),
    user: dict = Depends(get_current_user),
):
    measurements = user.get("measurements") or {}
    skin_tone = measurements.get("skin_tone", "medium_neutral") or "medium_neutral"
    body_type = user.get("body_type") or "rectangle"
    gender = measurements.get("gender", "Men")

    combos = suggest_combos_dynamo(
        skin_tone=skin_tone,
        occasion=occasion,
        body_type=body_type,
        gender=gender,
        count=count,
    )

    return {
        "occasion": occasion,
        "skin_tone": skin_tone,
        "body_type": body_type,
        "count": len(combos),
        "combos": combos,
    }


@router.get("/suggest")
def suggest_outfits(
    occasion: str | None = Query(None),
    count: int = Query(5, ge=1, le=20),
    user: dict = Depends(get_current_user),
):
    return []


@router.post("/rate", status_code=status.HTTP_201_CREATED)
def rate_outfit(
    combo_id: str = Query(...),
    rating: int = Query(..., ge=1, le=5),
    worn: bool = Query(False),
    user: dict = Depends(get_current_user),
):
    user_items_table.put_item(Item=to_decimal({
        "user_id": user["id"],
        "sk": f"rating#{combo_id}",
        "combo_id": combo_id,
        "rating": rating,
        "worn": worn,
    }))
    return {"status": "rated"}
