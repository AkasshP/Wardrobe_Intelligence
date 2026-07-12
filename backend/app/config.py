from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Wardrobe Intelligence"
    debug: bool = True

    # Database (SQLite for local dev, PostgreSQL for prod)
    database_url: str = "sqlite:///./wardrobe.db"

    # JWT
    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 1440  # 24 hours

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # File storage
    upload_dir: str = "uploads"
    max_file_size_mb: int = 10

    # S3 storage
    s3_bucket_name: str = ""
    s3_region: str = "ap-south-1"

    @property
    def s3_base_url(self) -> str:
        if self.s3_bucket_name:
            return f"https://{self.s3_bucket_name}.s3.{self.s3_region}.amazonaws.com"
        return ""

    # Weather API
    openweather_api_key: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""

    # Replicate (Virtual Try-On)
    replicate_api_token: str = ""

    # ML
    model_weights_dir: str = "ml/clothing_classifier/weights"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
