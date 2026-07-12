import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

_region = os.environ.get("AWS_REGION", os.environ.get("S3_REGION", "ap-south-1"))
_project = os.environ.get("PROJECT_NAME", "wardrobe-intelligence")

dynamodb = boto3.resource("dynamodb", region_name=_region)

# Table references
users_table = dynamodb.Table(f"{_project}-users")
products_table = dynamodb.Table(f"{_project}-products")
user_items_table = dynamodb.Table(f"{_project}-user-items")
orders_table = dynamodb.Table(f"{_project}-orders")


def to_decimal(obj):
    """Convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_decimal(i) for i in obj]
    return obj


def from_decimal(obj):
    """Convert Decimal back to float for JSON response."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: from_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [from_decimal(i) for i in obj]
    return obj
