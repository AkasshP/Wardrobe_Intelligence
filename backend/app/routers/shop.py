from fastapi import APIRouter, Depends, Query
from app.middleware.auth_middleware import get_current_user
from app.dynamo import products_table, from_decimal
from app.services.size_service import measurements_to_size
from boto3.dynamodb.conditions import Key, Attr

router = APIRouter(prefix="/api/shop", tags=["shop"])


def scan_products(filters=None, page=1, limit=20):
    """Scan products with optional filters."""
    scan_kwargs = {}
    filter_exprs = []

    if filters:
        for key, value in filters.items():
            if value is not None:
                if key == "search":
                    filter_exprs.append(Attr("name").contains(value))
                elif key == "min_price":
                    filter_exprs.append(Attr("price").gte(value))
                elif key == "max_price":
                    filter_exprs.append(Attr("price").lte(value))
                elif key == "size":
                    filter_exprs.append(Attr("available_sizes").contains(value))
                else:
                    filter_exprs.append(Attr(key).eq(value))

    if filter_exprs:
        combined = filter_exprs[0]
        for expr in filter_exprs[1:]:
            combined = combined & expr
        scan_kwargs["FilterExpression"] = combined

    # DynamoDB scan with pagination
    items = []
    resp = products_table.scan(**scan_kwargs)
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        resp = products_table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))

    total = len(items)
    start = (page - 1) * limit
    paged = items[start:start + limit]

    return total, [from_decimal(i) for i in paged]


@router.get("/products")
def browse_products(
    gender: str | None = Query(None),
    article_type: str | None = Query(None),
    color: str | None = Query(None),
    usage: str | None = Query(None),
    season: str | None = Query(None),
    search: str | None = Query(None),
    size: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    filters = {
        "gender": gender, "article_type": article_type, "color": color,
        "usage": usage, "season": season, "search": search, "size": size,
        "min_price": min_price, "max_price": max_price,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    total, products = scan_products(filters, page, limit)

    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "products": [
            {
                "id": p["id"],
                "name": p["name"],
                "gender": p.get("gender"),
                "article_type": p.get("article_type"),
                "color": p.get("color"),
                "season": p.get("season"),
                "usage": p.get("usage"),
                "image_url": p.get("image_url"),
                "price": p.get("price", 0),
                "available_sizes": p.get("available_sizes"),
            }
            for p in products
        ],
    }


@router.get("/products/{product_id}")
def get_product(product_id: int):
    resp = products_table.get_item(Key={"id": product_id})
    product = resp.get("Item")
    if not product:
        return {"error": "Product not found"}, 404
    product = from_decimal(product)
    return {
        "id": product["id"],
        "name": product["name"],
        "gender": product.get("gender"),
        "category": product.get("category"),
        "article_type": product.get("article_type"),
        "color": product.get("color"),
        "season": product.get("season"),
        "usage": product.get("usage"),
        "image_url": product.get("image_url"),
        "price": product.get("price", 0),
        "available_sizes": product.get("available_sizes"),
    }


@router.get("/recommend")
def recommend_for_me(
    gender: str | None = Query(None),
    article_type: str | None = Query(None),
    usage: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    measurements = user.get("measurements")
    if not measurements:
        return {"error": "Upload a body photo or enter measurements first", "products": []}

    chest = measurements.get("chest", 36)
    waist = measurements.get("waist", 30)
    hips = measurements.get("hips", 38)
    user_gender = gender or measurements.get("gender", "Men")

    size_info = measurements_to_size(chest, waist, hips, user_gender)
    rec_size = size_info["recommended_size"]

    filters = {"size": rec_size}
    if gender:
        filters["gender"] = gender
    if article_type:
        filters["article_type"] = article_type
    if usage:
        filters["usage"] = usage

    total, products = scan_products(filters, page, limit)

    return {
        "recommended_size": rec_size,
        "size_fits": size_info["all_fits"],
        "measurements": {"chest": chest, "waist": waist, "hips": hips},
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "products": [
            {
                "id": p["id"],
                "name": p["name"],
                "gender": p.get("gender"),
                "article_type": p.get("article_type"),
                "color": p.get("color"),
                "season": p.get("season"),
                "usage": p.get("usage"),
                "image_url": p.get("image_url"),
                "price": p.get("price", 0),
                "available_sizes": p.get("available_sizes"),
                "size_match": rec_size in (p.get("available_sizes") or []),
            }
            for p in products
        ],
    }


@router.get("/size-chart")
def get_size_recommendation(
    chest: float = Query(...),
    waist: float = Query(...),
    hips: float = Query(...),
    gender: str = Query("Men"),
):
    return measurements_to_size(chest, waist, hips, gender)


@router.get("/filters")
def get_filters():
    items = []
    resp = products_table.scan(ProjectionExpression="gender, article_type, color, usage, season")
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        resp = products_table.scan(
            ProjectionExpression="gender, article_type, color, usage, season",
            ExclusiveStartKey=resp["LastEvaluatedKey"]
        )
        items.extend(resp.get("Items", []))

    genders = sorted(set(i.get("gender") for i in items if i.get("gender")))
    types = sorted(set(i.get("article_type") for i in items if i.get("article_type")))
    colors = sorted(set(i.get("color") for i in items if i.get("color")))
    usages = sorted(set(i.get("usage") for i in items if i.get("usage")))
    seasons = sorted(set(i.get("season") for i in items if i.get("season")))

    return {
        "genders": genders,
        "article_types": types,
        "colors": colors,
        "usages": usages,
        "seasons": seasons,
    }
