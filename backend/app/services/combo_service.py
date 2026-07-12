"""
Outfit Combo Suggestion Engine.
Suggests top+bottom combos based on skin tone, occasion, and body type.
Uses color theory + fashion rules.
"""

import random
from app.dynamo import products_table, from_decimal
from boto3.dynamodb.conditions import Attr

# Skin tone → recommended colors
SKIN_TONE_COLORS = {
    "fair_cool": ["Navy Blue", "Emerald", "Royal Blue", "Black", "White", "Burgundy", "Pink", "Lavender", "Grey"],
    "fair_warm": ["Coral", "Peach", "Gold", "Cream", "Brown", "Orange", "Olive", "Rust", "Beige"],
    "fair_neutral": ["Pink", "Lavender", "Mint", "Grey", "Beige", "Navy Blue", "Teal", "Mauve"],
    "medium_cool": ["Magenta", "Purple", "Black", "White", "Grey", "Teal", "Blue", "Navy Blue", "Maroon"],
    "medium_warm": ["Red", "Orange", "Yellow", "Brown", "Gold", "Olive", "Rust", "Khaki", "Tan"],
    "medium_neutral": ["Teal", "Burgundy", "Green", "Navy Blue", "Camel", "White", "Black", "Blue"],
    "deep_cool": ["White", "Black", "Blue", "Purple", "Silver", "Pink", "Red", "Grey", "Navy Blue"],
    "deep_warm": ["Gold", "Orange", "Red", "Yellow", "Brown", "Cream", "Olive", "Rust", "Tan"],
    "deep_neutral": ["Brown", "Black", "White", "Navy Blue", "Maroon", "Teal", "Gold", "Green"],
}

OCCASION_CONFIG = {
    "casual": {
        "tops": ["Tshirts", "Shirts"],
        "bottoms": ["Jeans", "Shorts", "Track Pants"],
        "usage": ["Casual", "Sports"],
        "vibe": "Relaxed and comfortable",
    },
    "smart_casual": {
        "tops": ["Shirts", "Tshirts"],
        "bottoms": ["Jeans", "Trousers"],
        "usage": ["Casual", "Smart Casual"],
        "vibe": "Polished yet effortless",
    },
    "office": {
        "tops": ["Shirts"],
        "bottoms": ["Trousers"],
        "usage": ["Formal", "Smart Casual"],
        "vibe": "Professional and sharp",
    },
    "formal": {
        "tops": ["Shirts"],
        "bottoms": ["Trousers"],
        "usage": ["Formal"],
        "vibe": "Elegant and refined",
    },
    "party": {
        "tops": ["Shirts", "Tshirts"],
        "bottoms": ["Jeans", "Trousers"],
        "usage": ["Party", "Casual"],
        "vibe": "Bold and eye-catching",
    },
    "date": {
        "tops": ["Shirts", "Tshirts"],
        "bottoms": ["Jeans", "Trousers"],
        "usage": ["Smart Casual", "Casual"],
        "vibe": "Stylish and impressive",
    },
}

COLOR_PAIRINGS = {
    "White": ["Blue", "Navy Blue", "Black", "Grey", "Khaki", "Brown", "Maroon"],
    "Black": ["White", "Grey", "Blue", "Khaki", "Beige", "Red"],
    "Navy Blue": ["White", "Beige", "Grey", "Khaki", "Brown", "Cream"],
    "Blue": ["White", "Black", "Grey", "Beige", "Khaki", "Brown", "Navy Blue"],
    "Grey": ["Black", "White", "Blue", "Navy Blue", "Maroon", "Brown"],
    "Red": ["Black", "Blue", "Navy Blue", "White", "Grey"],
    "Green": ["Black", "Brown", "Beige", "White", "Grey", "Khaki"],
    "Pink": ["Blue", "Navy Blue", "Grey", "White", "Black"],
    "Maroon": ["Beige", "White", "Grey", "Khaki", "Black"],
    "Brown": ["White", "Beige", "Blue", "Cream", "Black"],
    "Olive": ["White", "Beige", "Brown", "Black", "Khaki"],
    "Yellow": ["Blue", "Navy Blue", "Black", "Grey", "Brown"],
    "Orange": ["Blue", "Navy Blue", "Black", "White", "Brown"],
    "Purple": ["White", "Grey", "Black", "Beige", "Blue"],
    "Teal": ["White", "Beige", "Black", "Grey", "Brown"],
}

DEFAULT_BOTTOM_COLORS = ["Blue", "Black", "Navy Blue", "Grey", "Khaki", "Brown", "Beige", "White"]


def _match_color(product_color: str, target_colors: list) -> bool:
    if not product_color:
        return False
    pc = product_color.lower().strip()
    for tc in target_colors:
        if tc.lower() in pc or pc in tc.lower():
            return True
    return False


def _get_good_bottom_colors(top_color: str) -> list:
    if not top_color:
        return DEFAULT_BOTTOM_COLORS
    for key, values in COLOR_PAIRINGS.items():
        if key.lower() in top_color.lower() or top_color.lower() in key.lower():
            return values
    return DEFAULT_BOTTOM_COLORS


def _scan_by_types(article_types: list, gender: str) -> list:
    """Scan products by article types and gender."""
    all_items = []
    for atype in article_types:
        resp = products_table.query(
            IndexName="gender-index",
            KeyConditionExpression="gender = :g AND article_type = :a",
            ExpressionAttributeValues={":g": gender, ":a": atype},
            Limit=100,
        )
        all_items.extend([from_decimal(i) for i in resp.get("Items", [])])
    return all_items


def suggest_combos_dynamo(
    skin_tone: str = "medium_neutral",
    occasion: str = "casual",
    body_type: str = "rectangle",
    gender: str = "Men",
    count: int = 5,
) -> list:
    config = OCCASION_CONFIG.get(occasion, OCCASION_CONFIG["casual"])
    recommended_colors = SKIN_TONE_COLORS.get(skin_tone, SKIN_TONE_COLORS["medium_neutral"])

    all_tops = _scan_by_types(config["tops"], gender)
    all_bottoms = _scan_by_types(config["bottoms"], gender)

    if not all_tops or not all_bottoms:
        return []

    scored_tops = []
    for top in all_tops:
        score = 0
        if _match_color(top.get("color"), recommended_colors):
            score += 30
        if top.get("usage") and top["usage"] in config.get("usage", []):
            score += 20
        score += random.randint(0, 10)
        scored_tops.append((top, score))

    scored_tops.sort(key=lambda x: -x[1])
    best_tops = scored_tops[:20]

    combos = []
    used_top_ids = set()
    used_bottom_ids = set()

    for top, top_score in best_tops:
        if top["id"] in used_top_ids or len(combos) >= count:
            break

        good_bottom_colors = _get_good_bottom_colors(top.get("color"))

        scored_bottoms = []
        for bottom in all_bottoms:
            if bottom["id"] in used_bottom_ids:
                continue
            bscore = 0
            if _match_color(bottom.get("color"), good_bottom_colors):
                bscore += 30
            if _match_color(bottom.get("color"), recommended_colors):
                bscore += 15
            if bottom.get("usage") and bottom["usage"] in config.get("usage", []):
                bscore += 10
            bscore += random.randint(0, 5)
            scored_bottoms.append((bottom, bscore))

        if not scored_bottoms:
            continue

        scored_bottoms.sort(key=lambda x: -x[1])
        bottom, bottom_score = scored_bottoms[0]

        total_score = top_score + bottom_score

        reasons = []
        if _match_color(top.get("color"), recommended_colors):
            reasons.append(f"{top.get('color')} complements your {skin_tone.replace('_', ' ')} skin tone")
        if _match_color(bottom.get("color"), _get_good_bottom_colors(top.get("color"))):
            reasons.append(f"{top.get('color')} top pairs beautifully with {bottom.get('color')} bottom")
        reasons.append(f"Perfect for {occasion.replace('_', ' ')} occasions")

        combo = {
            "top": {
                "id": top["id"],
                "name": top["name"],
                "article_type": top.get("article_type"),
                "color": top.get("color"),
                "price": top.get("price", 0),
                "image_url": top.get("image_url"),
            },
            "bottom": {
                "id": bottom["id"],
                "name": bottom["name"],
                "article_type": bottom.get("article_type"),
                "color": bottom.get("color"),
                "price": bottom.get("price", 0),
                "image_url": bottom.get("image_url"),
            },
            "score": min(100, int(total_score * 100 / 100)),
            "total_price": round(top.get("price", 0) + bottom.get("price", 0), 0),
            "reasoning": " • ".join(reasons),
            "vibe": config["vibe"],
        }

        combos.append(combo)
        used_top_ids.add(top["id"])
        used_bottom_ids.add(bottom["id"])

    return combos
