import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth_middleware import get_current_user
from app.dynamo import user_items_table, products_table, from_decimal, to_decimal
from boto3.dynamodb.conditions import Key, Attr

router = APIRouter(prefix="/api/cart", tags=["cart"])


class AddToCartRequest(BaseModel):
    product_id: int
    size: str
    quantity: int = 1


class WishlistRequest(BaseModel):
    product_id: int


def get_product(product_id: int) -> dict | None:
    resp = products_table.get_item(Key={"id": product_id})
    item = resp.get("Item")
    return from_decimal(item) if item else None


@router.get("")
def get_cart(user: dict = Depends(get_current_user)):
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("cart#")
    )
    items = [from_decimal(i) for i in resp.get("Items", [])]

    cart_items = []
    total = 0
    for item in items:
        product = get_product(item["product_id"])
        if product:
            subtotal = product["price"] * item["quantity"]
            total += subtotal
            cart_items.append({
                "id": item["sk"].split("#")[1],
                "product_id": item["product_id"],
                "name": product["name"],
                "image_url": product.get("image_url"),
                "price": product["price"],
                "size": item["size"],
                "quantity": item["quantity"],
                "subtotal": subtotal,
            })

    return {"items": cart_items, "total": total, "count": len(cart_items)}


@router.post("/add")
def add_to_cart(req: AddToCartRequest, user: dict = Depends(get_current_user)):
    product = get_product(req.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if already in cart
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("cart#"),
        FilterExpression=Attr("product_id").eq(req.product_id) & Attr("size").eq(req.size)
    )
    existing = resp.get("Items", [])

    if existing:
        item = existing[0]
        user_items_table.update_item(
            Key={"user_id": user["id"], "sk": item["sk"]},
            UpdateExpression="SET quantity = quantity + :q",
            ExpressionAttributeValues={":q": req.quantity}
        )
    else:
        item_id = str(uuid.uuid4())
        user_items_table.put_item(Item=to_decimal({
            "user_id": user["id"],
            "sk": f"cart#{item_id}",
            "product_id": req.product_id,
            "size": req.size,
            "quantity": req.quantity,
            "created_at": datetime.utcnow().isoformat(),
        }))

    return {"message": "Added to cart"}


@router.delete("/{item_id}")
def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    user_items_table.delete_item(Key={"user_id": user["id"], "sk": f"cart#{item_id}"})
    return {"message": "Removed from cart"}


@router.delete("")
def clear_cart(user: dict = Depends(get_current_user)):
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("cart#")
    )
    for item in resp.get("Items", []):
        user_items_table.delete_item(Key={"user_id": user["id"], "sk": item["sk"]})
    return {"message": "Cart cleared"}


# Wishlist
@router.get("/wishlist")
def get_wishlist(user: dict = Depends(get_current_user)):
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("wish#")
    )
    items = [from_decimal(i) for i in resp.get("Items", [])]

    wishlist = []
    for item in items:
        product = get_product(item["product_id"])
        if product:
            wishlist.append({
                "id": item["sk"].split("#")[1],
                "product_id": item["product_id"],
                "name": product["name"],
                "image_url": product.get("image_url"),
                "price": product["price"],
            })

    return {"items": wishlist, "count": len(wishlist)}


@router.post("/wishlist/add")
def add_to_wishlist(req: WishlistRequest, user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    user_items_table.put_item(Item=to_decimal({
        "user_id": user["id"],
        "sk": f"wish#{item_id}",
        "product_id": req.product_id,
        "created_at": datetime.utcnow().isoformat(),
    }))
    return {"message": "Added to wishlist"}


@router.delete("/wishlist/{item_id}")
def remove_from_wishlist(item_id: str, user: dict = Depends(get_current_user)):
    user_items_table.delete_item(Key={"user_id": user["id"], "sk": f"wish#{item_id}"})
    return {"message": "Removed from wishlist"}
