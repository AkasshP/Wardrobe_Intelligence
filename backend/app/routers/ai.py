import json
import boto3
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.middleware.auth_middleware import get_current_user, get_current_user_or_guest
from app.dynamo import user_items_table, from_decimal
from boto3.dynamodb.conditions import Key

router = APIRouter(prefix="/api/ai", tags=["ai"])

bedrock = boto3.client("bedrock-runtime", region_name="ap-south-1")


class ChatRequest(BaseModel):
    message: str


class ClassifyRequest(BaseModel):
    image_url: str


def _invoke_nova(prompt: str, max_tokens: int = 500) -> str:
    """Call Amazon Nova Micro — cheapest model ($0.035/1M tokens)."""
    response = bedrock.invoke_model(
        modelId="apac.amazon.nova-micro-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "inferenceConfig": {"maxTokens": max_tokens, "temperature": 0.7},
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
        }),
    )
    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]


def _invoke_haiku_vision(image_url: str, prompt: str) -> str:
    """Call Claude Haiku 4.5 with image — for clothing classification."""
    response = bedrock.invoke_model(
        modelId="apac.anthropic.claude-3-haiku-20240307-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "url", "url": image_url}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        }),
    )
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


@router.post("/chat")
def style_chat(req: ChatRequest, user: dict = Depends(get_current_user_or_guest)):
    """AI Style Chatbot — fashion advice powered by Amazon Nova Micro."""
    # Get user context
    wardrobe_resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("wardrobe#"),
        Limit=20,
    )
    wardrobe_items = [from_decimal(i) for i in wardrobe_resp.get("Items", [])]

    wardrobe_summary = ""
    if wardrobe_items:
        types = {}
        for item in wardrobe_items:
            t = item.get("type", "unknown")
            types[t] = types.get(t, 0) + 1
        wardrobe_summary = f"\nUser's wardrobe: {dict(types)}"

    body_info = ""
    if user.get("body_type"):
        body_info = f"\nUser's body type: {user['body_type']}"

    prompt = f"""You are a personal fashion stylist AI for "Wardrobe Intelligence" app.
Be helpful, friendly, and give specific actionable fashion advice.
Keep responses concise (2-3 paragraphs max).
{wardrobe_summary}{body_info}

User: {req.message}"""

    response = _invoke_nova(prompt)
    return {"response": response}


@router.post("/classify")
def classify_clothing(req: ClassifyRequest, user: dict = Depends(get_current_user_or_guest)):
    """Classify clothing from image using Claude Haiku Vision."""
    prompt = """Analyze this clothing item and return JSON only:
{
    "type": "shirt/tshirt/jeans/trousers/dress/jacket/shorts/skirt/sweater",
    "sub_type": "specific type like polo/henley/slim-fit etc",
    "color": {"name": "color name", "hex": "#hexcode"},
    "pattern": "solid/striped/checked/printed/floral",
    "season": ["summer", "winter", "spring", "fall"],
    "formality": 0.0-1.0,
    "tags": ["casual", "formal", "party", etc]
}
Return ONLY valid JSON, no other text."""

    response = _invoke_haiku_vision(req.image_url, prompt)
    try:
        classification = json.loads(response)
    except json.JSONDecodeError:
        classification = {"raw": response}

    return {"classification": classification}


@router.post("/outfit-advice")
def outfit_advice(
    occasion: str = Query("casual"),
    user: dict = Depends(get_current_user),
):
    """Get AI-powered outfit advice based on wardrobe and occasion."""
    wardrobe_resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("wardrobe#"),
    )
    items = [from_decimal(i) for i in wardrobe_resp.get("Items", [])]

    if not items:
        return {"advice": "Upload some clothing items first, then I can suggest outfits!"}

    items_desc = "\n".join([
        f"- {i.get('type', 'unknown')} ({i.get('primary_color', 'unknown')} color, {i.get('pattern', 'unknown')} pattern)"
        for i in items[:20]
    ])

    prompt = f"""You are a fashion stylist. Based on this wardrobe, suggest 3 outfit combinations for {occasion}.

Wardrobe items:
{items_desc}

For each outfit, explain:
1. What to wear (top + bottom + optional layer)
2. Why it works
3. Styling tip

Keep it concise and practical."""

    response = _invoke_nova(prompt, max_tokens=800)
    return {"occasion": occasion, "advice": response}


@router.post("/gap-analysis")
def ai_gap_analysis(user: dict = Depends(get_current_user)):
    """AI-powered wardrobe gap analysis."""
    wardrobe_resp = user_items_table.query(
        KeyConditionExpression=Key("user_id").eq(user["id"]) & Key("sk").begins_with("wardrobe#"),
    )
    items = [from_decimal(i) for i in wardrobe_resp.get("Items", [])]

    if not items:
        return {"analysis": "Upload clothing items to get personalized gap analysis!"}

    types = {}
    colors = {}
    for item in items:
        t = item.get("type", "unknown")
        c = item.get("primary_color", "unknown")
        types[t] = types.get(t, 0) + 1
        colors[c] = colors.get(c, 0) + 1

    prompt = f"""Analyze this wardrobe and identify gaps:

Items by type: {dict(types)}
Items by color: {dict(colors)}
Total items: {len(items)}

Identify:
1. Missing essential items (what they should buy)
2. Color gaps (colors they're missing)
3. Versatility score (1-10)
4. Top 3 purchase recommendations with reasoning

Be specific and actionable. Keep concise."""

    response = _invoke_nova(prompt, max_tokens=600)
    return {"total_items": len(items), "types": types, "colors": colors, "analysis": response}
