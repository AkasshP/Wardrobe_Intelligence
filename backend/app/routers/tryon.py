import shutil
import uuid
import os
import boto3
import base64
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user
from app.dynamo import products_table, from_decimal
import replicate

settings = get_settings()
router = APIRouter(prefix="/api/tryon", tags=["tryon"])

os.environ["REPLICATE_API_TOKEN"] = settings.replicate_api_token

s3 = boto3.client("s3", region_name=settings.s3_region)

LOWER_BODY_TYPES = {"jeans", "trousers", "shorts", "skirts", "leggings", "track pants"}
DRESS_TYPES = {"dresses", "dress", "kurtas", "kurtis", "tunics", "sarees"}


def detect_category(article_type: str) -> str:
    t = article_type.lower().strip()
    if t in LOWER_BODY_TYPES:
        return "lower_body"
    elif t in DRESS_TYPES:
        return "dresses"
    return "upper_body"


@router.post("")
def virtual_tryon(
    person_image: UploadFile = File(None),
    product_id: int = Form(None),
    garment_description: str = Form("clothing garment"),
    article_type: str = Form(""),
    user: dict = Depends(get_current_user),
):
    """Start async virtual try-on. Returns prediction ID to poll."""
    if not settings.replicate_api_token:
        raise HTTPException(status_code=500, detail="Replicate API token not configured")

    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")

    # Get product image URL from DynamoDB
    resp = products_table.get_item(Key={"id": product_id})
    product = resp.get("Item")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = from_decimal(product)
    garment_url = product.get("image_url")
    if not garment_url:
        raise HTTPException(status_code=404, detail="Product image not found")

    # Upload person image to S3 (temp) so Replicate can access it
    if not person_image or not person_image.filename:
        raise HTTPException(status_code=400, detail="Please upload a body photo")

    person_key = f"temp/tryon/{uuid.uuid4()}.jpg"
    s3.upload_fileobj(person_image.file, settings.s3_bucket_name, person_key)
    person_url = f"https://{settings.s3_bucket_name}.s3.{settings.s3_region}.amazonaws.com/{person_key}"

    category = detect_category(article_type or product.get("article_type", ""))

    try:
        # Start async prediction
        model = replicate.models.get("cuuupid/idm-vton")
        version = model.versions.get("0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985")

        prediction = replicate.predictions.create(
            version=version,
            input={
                "human_img": person_url,
                "garm_img": garment_url,
                "garment_des": garment_description,
                "category": category,
            },
        )

        return {
            "success": True,
            "prediction_id": prediction.id,
            "status": prediction.status,
        }

    except Exception as e:
        print(f"Try-on error: {e}")
        raise HTTPException(status_code=500, detail=f"Try-on failed: {str(e)}")


@router.get("/status")
def check_tryon_status(
    prediction_id: str = Query(...),
    user: dict = Depends(get_current_user),
):
    """Poll for try-on result."""
    try:
        prediction = replicate.predictions.get(prediction_id)

        if prediction.status == "succeeded":
            return {
                "status": "succeeded",
                "result_image": str(prediction.output),
            }
        elif prediction.status == "failed":
            return {
                "status": "failed",
                "error": prediction.error or "Try-on failed",
            }
        else:
            return {
                "status": prediction.status,  # starting, processing
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
