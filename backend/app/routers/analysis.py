import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user, get_current_user_or_guest
from app.dynamo import users_table, to_decimal
from app.services.size_service import measurements_to_size
from app.services.body_service import validate_photo, extract_measurements

settings = get_settings()
router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class ManualMeasurements(BaseModel):
    height: float
    chest: float
    waist: float
    hips: float
    shoulders: float | None = None
    gender: str = "Men"


@router.post("/body/validate")
async def validate_body_photo(file: UploadFile = File(...)):
    """Validate photo before processing. Returns errors if photo is not suitable."""
    tmp_dir = Path("/tmp/body")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = tmp_dir / filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    result = validate_photo(str(file_path))
    result["image_path"] = str(file_path)
    return result


@router.post("/body/process")
async def process_body_photo(
    image_path: str,
    gender: str = "Men",
    user: dict = Depends(get_current_user_or_guest),
):
    """Process a validated photo and extract measurements."""
    result = extract_measurements(image_path)

    measurements = result["measurements"]
    measurements["gender"] = gender

    size_info = measurements_to_size(
        measurements["chest"], measurements["waist"], measurements["hips"], gender
    )

    # Save to user profile in DynamoDB (skip for guests)
    if not user.get("is_guest") and user.get("email"):
        users_table.update_item(
            Key={"email": user["email"]},
            UpdateExpression="SET measurements = :m, body_type = :b",
            ExpressionAttributeValues=to_decimal({
                ":m": measurements,
                ":b": result["body_type"],
            }),
        )

    return {
        "measurements": measurements,
        "body_type": result["body_type"],
        "confidence": result["confidence"],
        "size_recommendation": size_info,
    }


@router.post("/body")
async def analyze_body(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user_or_guest),
):
    """Full pipeline: validate + process in one call."""
    tmp_dir = Path("/tmp/body")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = tmp_dir / filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Validate first
    validation = validate_photo(str(file_path))
    if not validation["valid"]:
        file_path.unlink(missing_ok=True)
        return {
            "success": False,
            "errors": validation["errors"],
            "warnings": validation["warnings"],
        }

    # Process
    result = extract_measurements(str(file_path))
    file_path.unlink(missing_ok=True)
    measurements = result["measurements"]
    measurements["gender"] = "Men"

    size_info = measurements_to_size(
        measurements["chest"], measurements["waist"], measurements["hips"], "Men"
    )

    return {
        "success": True,
        "measurements": measurements,
        "body_type": result["body_type"],
        "confidence": result["confidence"],
        "size_recommendation": size_info,
        "warnings": validation["warnings"],
    }


@router.post("/measurements")
def save_measurements(
    data: ManualMeasurements,
    user: dict = Depends(get_current_user),
):
    """Save manually entered measurements and get size recommendation."""
    measurements = {
        "height": data.height,
        "chest": data.chest,
        "waist": data.waist,
        "hips": data.hips,
        "shoulders": data.shoulders,
        "gender": data.gender,
    }

    size_info = measurements_to_size(data.chest, data.waist, data.hips, data.gender)

    # Save to user profile in DynamoDB
    users_table.update_item(
        Key={"email": user["email"]},
        UpdateExpression="SET measurements = :m",
        ExpressionAttributeValues=to_decimal({":m": measurements}),
    )

    return {
        "measurements": measurements,
        "size_recommendation": size_info,
        "message": "Measurements saved successfully",
    }
