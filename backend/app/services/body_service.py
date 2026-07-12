"""
Body photo validation + measurement extraction using Bedrock Claude Vision.
Falls back to basic OpenCV validation for photo quality checks.
"""

import json
import base64
import cv2
import numpy as np
import boto3

bedrock = boto3.client("bedrock-runtime", region_name="ap-south-1")

MIN_RESOLUTION = (480, 640)


def validate_photo(image_path: str) -> dict:
    """Validate body photo before processing."""
    errors = []
    warnings = []

    img = cv2.imread(image_path)
    if img is None:
        return {"valid": False, "errors": ["Could not read image file. Please upload a JPEG or PNG."], "warnings": []}

    h, w, _ = img.shape

    if w < MIN_RESOLUTION[0] or h < MIN_RESOLUTION[1]:
        errors.append(f"Image too small ({w}x{h}). Minimum {MIN_RESOLUTION[0]}x{MIN_RESOLUTION[1]} required.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray)
    if brightness < 40:
        errors.append("Image is too dark. Please use better lighting.")
    elif brightness < 70:
        warnings.append("Image is slightly dark. Results may be less accurate.")
    elif brightness > 240:
        errors.append("Image is overexposed. Please reduce lighting.")

    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 50:
        errors.append("Image is too blurry. Please take a sharper photo.")
    elif laplacian_var < 100:
        warnings.append("Image is slightly blurry. Try holding the camera steadier.")

    if errors:
        return {"valid": False, "errors": errors, "warnings": warnings}

    return {"valid": True, "errors": [], "warnings": warnings}


def extract_measurements(image_path: str) -> dict:
    """Extract body measurements from photo using Bedrock Claude Vision."""
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Determine media type
    if image_path.lower().endswith(".png"):
        media_type = "image/png"
    else:
        media_type = "image/jpeg"

    prompt = """Analyze this full-body photo and estimate body measurements. Return ONLY valid JSON:

{
    "height": <height in inches, e.g. 68.5>,
    "chest": <chest circumference in inches>,
    "waist": <waist circumference in inches>,
    "hips": <hip circumference in inches>,
    "shoulders": <shoulder width in inches>,
    "arm_length": <arm length in inches>,
    "inseam": <inseam length in inches>,
    "body_type": "<hourglass|pear|inverted_triangle|apple|rectangle>",
    "confidence": <0.0 to 1.0>,
    "gender_guess": "<Men|Women>"
}

Estimate based on visual proportions. Be realistic. Return ONLY JSON, no other text."""

    try:
        response = bedrock.invoke_model(
            modelId="apac.anthropic.claude-3-haiku-20240307-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 400,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            }),
        )

        result = json.loads(response["body"].read())
        text = result["content"][0]["text"]

        # Parse JSON from response
        data = json.loads(text)

        return {
            "measurements": {
                "height": float(data.get("height", 66)),
                "chest": float(data.get("chest", 36)),
                "waist": float(data.get("waist", 30)),
                "hips": float(data.get("hips", 38)),
                "shoulders": float(data.get("shoulders", 18)),
                "arm_length": float(data.get("arm_length", 25)),
                "inseam": float(data.get("inseam", 30)),
            },
            "body_type": data.get("body_type", "rectangle"),
            "confidence": float(data.get("confidence", 0.75)),
        }

    except Exception as e:
        print(f"Bedrock Vision error: {e}")
        # Fallback
        return {
            "measurements": {
                "height": 66.0, "chest": 36.0, "waist": 30.0,
                "hips": 38.0, "shoulders": 18.0, "arm_length": 25.0, "inseam": 30.0,
            },
            "body_type": "rectangle",
            "confidence": 0.5,
        }
