import uuid
import stripe
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.config import get_settings
from app.middleware.auth_middleware import get_current_user
from app.dynamo import orders_table, user_items_table, products_table, from_decimal, to_decimal
from boto3.dynamodb.conditions import Key

settings = get_settings()
router = APIRouter(prefix="/api/orders", tags=["orders"])

stripe.api_key = settings.stripe_secret_key


class ShippingAddress(BaseModel):
    full_name: str
    address_line1: str
    address_line2: str = ""
    city: str
    state: str
    zip_code: str
    country: str = "India"
    phone: str = ""


class CheckoutRequest(BaseModel):
    shipping: ShippingAddress


def get_product(product_id: int) -> dict | None:
    resp = products_table.get_item(Key={"id": product_id})
    item = resp.get("Item")
    return from_decimal(item) if item else None


@router.post("/checkout")
def create_checkout(req: CheckoutRequest, user: dict = Depends(get_current_user)):
    # Get cart items
    resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("cart#")
    )
    cart_items = [from_decimal(i) for i in resp.get("Items", [])]
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total
    total = 0
    order_items = []
    for item in cart_items:
        product = get_product(item["product_id"])
        if product:
            subtotal = product["price"] * item["quantity"]
            total += subtotal
            order_items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "image_url": product.get("image_url"),
                "size": item["size"],
                "quantity": item["quantity"],
                "price": product["price"],
            })

    # Create Stripe payment intent
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(total * 100),
            currency="inr",
            metadata={"user_id": user["id"]},
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment failed: {str(e)}")

    # Save order to DynamoDB
    order_id = str(uuid.uuid4())
    orders_table.put_item(Item=to_decimal({
        "user_id": user["id"],
        "sk": f"order#{order_id}",
        "order_id": order_id,
        "status": "pending",
        "total": round(total, 2),
        "shipping_address": req.shipping.model_dump(),
        "stripe_payment_id": intent.id,
        "items": order_items,
        "created_at": datetime.utcnow().isoformat(),
    }))

    return {
        "order_id": order_id,
        "total": round(total, 2),
        "client_secret": intent.client_secret,
        "status": "pending",
    }


@router.post("/{order_id}/confirm")
def confirm_order(order_id: str, user: dict = Depends(get_current_user)):
    resp = orders_table.get_item(Key={"user_id": user["id"], "sk": f"order#{order_id}"})
    order = resp.get("Item")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = from_decimal(order)

    try:
        intent = stripe.PaymentIntent.retrieve(order["stripe_payment_id"])
        if intent.status == "succeeded":
            orders_table.update_item(
                Key={"user_id": user["id"], "sk": f"order#{order_id}"},
                UpdateExpression="SET #s = :s",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "paid"},
            )
            # Clear cart
            cart_resp = user_items_table.query(
                KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("cart#")
            )
            for item in cart_resp.get("Items", []):
                user_items_table.delete_item(Key={"user_id": user["id"], "sk": item["sk"]})

            return {"status": "paid", "order_id": order_id}
        else:
            return {"status": intent.status, "order_id": order_id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def get_orders(user: dict = Depends(get_current_user)):
    resp = orders_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("order#"),
        ScanIndexForward=False,
    )
    orders = [from_decimal(o) for o in resp.get("Items", [])]

    return {
        "orders": [
            {
                "id": o["order_id"],
                "status": o["status"],
                "total": o["total"],
                "items_count": len(o.get("items", [])),
                "created_at": o["created_at"],
                "items": o.get("items", []),
            }
            for o in orders
        ]
    }


@router.get("/{order_id}")
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    resp = orders_table.get_item(Key={"user_id": user["id"], "sk": f"order#{order_id}"})
    order = resp.get("Item")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = from_decimal(order)

    return {
        "id": order["order_id"],
        "status": order["status"],
        "total": order["total"],
        "shipping_address": order.get("shipping_address"),
        "created_at": order["created_at"],
        "items": order.get("items", []),
    }
