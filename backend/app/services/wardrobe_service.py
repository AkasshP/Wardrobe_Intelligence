import uuid
import shutil
import os
from pathlib import Path
from fastapi import UploadFile
from app.config import get_settings
from app.dynamo import user_items_table, from_decimal, to_decimal
from boto3.dynamodb.conditions import Key
from datetime import datetime

settings = get_settings()


def save_upload(file: UploadFile, user_id: str) -> str:
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        upload_dir = Path("/tmp/clothing") / str(user_id)
    else:
        upload_dir = Path(settings.upload_dir) / "clothing" / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = upload_dir / filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return str(file_path)


def create_item(user_id: str, image_url: str, classification: dict) -> dict:
    item_id = str(uuid.uuid4())
    item = {
        "user_id": user_id,
        "sk": f"wardrobe#{item_id}",
        "id": item_id,
        "image_url": image_url,
        "type": classification["type"],
        "sub_type": classification.get("sub_type"),
        "primary_color": classification.get("color", {}).get("name"),
        "color_hex": classification.get("color", {}).get("primary"),
        "pattern": classification.get("pattern"),
        "season": classification.get("season"),
        "formality": classification.get("formality"),
        "tags": classification.get("tags"),
        "times_worn": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    clean = {k: v for k, v in item.items() if v is not None}
    user_items_table.put_item(Item=to_decimal(clean))
    return from_decimal(clean)


def get_items(user_id: str) -> list[dict]:
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id) & Key("sk").begins_with("wardrobe#")
    )
    return [from_decimal(i) for i in resp.get("Items", [])]


def get_item(item_id: str, user_id: str) -> dict | None:
    resp = user_items_table.get_item(Key={"user_id": user_id, "sk": f"wardrobe#{item_id}"})
    item = resp.get("Item")
    return from_decimal(item) if item else None


def update_item(item_id: str, user_id: str, updates: dict) -> dict:
    expr_parts = []
    expr_values = {}
    expr_names = {}
    for i, (key, value) in enumerate(updates.items()):
        if value is not None:
            attr = f"#a{i}"
            val = f":v{i}"
            expr_parts.append(f"{attr} = {val}")
            expr_names[attr] = key
            expr_values[val] = value

    if expr_parts:
        user_items_table.update_item(
            Key={"user_id": user_id, "sk": f"wardrobe#{item_id}"},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=to_decimal(expr_values),
        )
    return get_item(item_id, user_id)


def delete_item(item_id: str, user_id: str) -> None:
    user_items_table.delete_item(Key={"user_id": user_id, "sk": f"wardrobe#{item_id}"})
