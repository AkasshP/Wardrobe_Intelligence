import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import get_settings
from app.routers import auth, wardrobe, outfits, analysis, gaps, shop, cart, orders, tryon, ai

settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://d2oy687wjudhkr.cloudfront.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images (use /tmp in Lambda, local dir otherwise)
if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    uploads_path = Path("/tmp/uploads")
else:
    uploads_path = Path(settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(wardrobe.router)
app.include_router(outfits.router)
app.include_router(analysis.router)
app.include_router(gaps.router)
app.include_router(shop.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(tryon.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "2.0.0",
        "database": "dynamodb",
    }


@app.get("/api/config/stripe")
def stripe_config():
    return {"publishable_key": settings.stripe_publishable_key}
