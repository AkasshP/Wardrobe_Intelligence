import uuid
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import get_settings
from app.dynamo import users_table, from_decimal
from boto3.dynamodb.conditions import Key

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiry_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload["sub"]
    except JWTError:
        return None


def get_user_by_email(email: str) -> dict | None:
    resp = users_table.get_item(Key={"email": email})
    item = resp.get("Item")
    return from_decimal(item) if item else None


def get_user_by_id(user_id: str) -> dict | None:
    resp = users_table.query(
        IndexName="id-index",
        KeyConditionExpression=Key("id").eq(user_id)
    )
    items = resp.get("Items", [])
    return from_decimal(items[0]) if items else None


def register_user(email: str, password: str) -> dict:
    existing = get_user_by_email(email)
    if existing:
        raise ValueError("Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(password),
        "body_type": None,
        "skin_tone": None,
        "measurements": None,
        "preferences": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    users_table.put_item(Item={k: v for k, v in user.items() if v is not None})
    return user


def authenticate_user(email: str, password: str) -> dict | None:
    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        return None
    return user


def update_user(email: str, updates: dict) -> dict:
    expr_parts = []
    expr_values = {}
    expr_names = {}
    for i, (key, value) in enumerate(updates.items()):
        attr = f"#attr{i}"
        val = f":val{i}"
        expr_parts.append(f"{attr} = {val}")
        expr_names[attr] = key
        expr_values[val] = value

    users_table.update_item(
        Key={"email": email},
        UpdateExpression="SET " + ", ".join(expr_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return get_user_by_email(email)
