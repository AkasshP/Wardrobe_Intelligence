from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.schemas.requests import UpdateWardrobeItemRequest
from app.services import wardrobe_service
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])


@router.post("/items", status_code=status.HTTP_201_CREATED)
async def upload_item(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    image_url = wardrobe_service.save_upload(file, user["id"])

    classification = {
        "type": "unclassified",
        "sub_type": None,
        "color": {"primary": "#000000", "name": "unknown"},
        "pattern": "unknown",
        "season": [],
        "formality": 0.5,
        "tags": [],
    }

    item = wardrobe_service.create_item(user["id"], image_url, classification)
    return item


@router.get("/items")
def list_items(user: dict = Depends(get_current_user)):
    return wardrobe_service.get_items(user["id"])


@router.get("/items/{item_id}")
def get_item(item_id: str, user: dict = Depends(get_current_user)):
    item = wardrobe_service.get_item(item_id, user["id"])
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.put("/items/{item_id}")
def update_item(item_id: str, req: UpdateWardrobeItemRequest, user: dict = Depends(get_current_user)):
    item = wardrobe_service.get_item(item_id, user["id"])
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    return wardrobe_service.update_item(item_id, user["id"], req.model_dump(exclude_unset=True))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str, user: dict = Depends(get_current_user)):
    item = wardrobe_service.get_item(item_id, user["id"])
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    wardrobe_service.delete_item(item_id, user["id"])
