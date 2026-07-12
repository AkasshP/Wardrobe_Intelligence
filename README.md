# Wardrobe Intelligence

AI-powered wardrobe manager that organizes your clothes, generates personalized outfit combinations, identifies wardrobe gaps, and lets you virtually try on clothes — all running serverless on AWS.

## Features

- **Smart Wardrobe Builder** — Upload clothing photos, auto-classify via Claude Haiku Vision (type, color, pattern, formality, season)
- **Outfit Combo Engine** — AI-powered outfit suggestions scored by occasion, wardrobe composition, and style
- **Gap Analysis** — AI analyzes your wardrobe composition and identifies missing essentials, color gaps, and purchase recommendations
- **Body Analysis** — AWS Bedrock Claude Vision extracts body measurements from a photo
- **Virtual Try-On** — Replicate IDM-VTON integration for realistic clothing overlay
- **AI Style Chat** — Amazon Nova Micro powered fashion advisor with wardrobe context
- **E-Commerce** — Browse products, size recommendations, cart, wishlist, and Stripe checkout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Axios, Stripe.js |
| Backend | FastAPI (Python), Mangum (Lambda ASGI adapter) |
| AI Classification | AWS Bedrock — Claude Haiku 3 (Vision) |
| AI Chat & Advice | AWS Bedrock — Amazon Nova Micro |
| Virtual Try-On | Replicate (IDM-VTON) |
| Payments | Stripe |
| Database | DynamoDB |
| Storage | S3 (images + frontend hosting) |
| CDN | CloudFront |
| Compute | AWS Lambda (Docker) |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Project Structure

```
backend/                  FastAPI application
  app/
    routers/              API endpoints
      auth.py             Register, login, profile (JWT)
      wardrobe.py         Clothing CRUD with image upload
      outfits.py          Outfit combo suggestions & ratings
      analysis.py         Body photo analysis (Bedrock Claude Vision)
      gaps.py             Wardrobe gap analysis
      shop.py             Product browsing, filters, size chart
      cart.py             Cart & wishlist management
      orders.py           Stripe checkout & order tracking
      tryon.py            Virtual try-on (Replicate)
      ai.py               AI classify, chat, outfit advice, gap analysis
    schemas/              Pydantic request/response models
    services/             Business logic (auth, wardrobe, combo, body, size, weather)
    middleware/            JWT authentication middleware
    config.py             App settings (Pydantic)
    dynamo.py             DynamoDB table references & helpers

frontend/                 React 19 application
  src/
    pages/                Login, Register, Dashboard, Wardrobe, Upload, Suggestions,
                          GapAnalysis, Profile, BodyScan, Shop, Cart, Wishlist,
                          Checkout, Orders, OrderConfirmation, TryOn
    components/           Navbar, ClothingCard, OutfitComboCard, Logo
    context/              AuthContext (JWT token management)
    services/             Axios API client

terraform/                AWS infrastructure
  dynamodb.tf             4 tables (users, products, user_items, orders)
  lambda.tf               Lambda function (Docker) + IAM role
  apigateway.tf           HTTP API Gateway
  s3.tf                   Image storage + frontend hosting buckets
  cloudfront.tf           CDN distribution for frontend
  ecr.tf                  Container registry

.github/workflows/        CI/CD pipelines
  deploy-backend.yml      Docker build -> ECR push -> Lambda update
  deploy-frontend.yml     npm build -> S3 sync -> CloudFront invalidation
```

## Setup

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in JWT_SECRET, AWS creds, Stripe keys, etc.
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

### AWS Deployment

```bash
# Infrastructure
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in secrets
terraform init
terraform apply

# Backend deploys automatically on push to main (backend/**/Dockerfile changes)
# Frontend deploys automatically on push to main (frontend/** changes)
```

## API Documentation

Once running locally, visit `http://localhost:8000/docs` for interactive Swagger docs.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design and data flow documentation.
