# Wardrobe Intelligence — System Architecture

## Overview

AI-powered wardrobe manager that organizes your clothes, generates outfit suggestions, identifies wardrobe gaps, and lets you virtually try on clothes — all running serverless on AWS with Bedrock AI.

```
Upload Clothes -> Claude Haiku Vision Classifies -> Wardrobe Built
                                                        |
                Occasion/Body Type/Context -> AI Outfit Suggestions
                                                        |
                          Gap Analysis -> "You're missing X essentials"
                                                        |
                           Virtual Try-On -> See clothes on yourself
```

---

## High-Level Architecture

```
                         +------------------+
                         |   React Frontend |
                         |   (CloudFront)   |
                         +--------+---------+
                                  |
                                  | REST API (JSON)
                                  |
                         +--------v---------+
                         |   API Gateway    |
                         |   (HTTP API)     |
                         +--------+---------+
                                  |
                         +--------v---------+
                         |   AWS Lambda     |
                         |   FastAPI +      |
                         |   Mangum         |
                         +--------+---------+
                                  |
                 +----------------+----------------+
                 |                |                 |
        +--------v------+ +------v-------+ +-------v--------+
        | Auth Service  | | Wardrobe Svc | | AI Services    |
        | (JWT/bcrypt)  | | (CRUD)       | | (Bedrock)      |
        +---------------+ +------+-------+ +-------+--------+
                                 |                  |
                    +------------+         +--------+--------+
                    |                      |                  |
            +-------v--------+    +--------v------+  +-------v--------+
            | S3             |    | Claude Haiku  |  | Amazon Nova    |
            | (Image Store)  |    | (Vision)      |  | (Text)         |
            +----------------+    +---------------+  +----------------+
                    |
            +-------v--------+
            | DynamoDB       |
            | (All Data)     |
            +----------------+
```

---

## 1. Frontend (React 19)

### Directory Structure

```
frontend/
  src/
    pages/
      Login.js              -- email/password auth
      Register.js           -- signup form
      Dashboard.js          -- overview, daily outfit suggestion
      Wardrobe.js           -- grid view of all clothes
      Upload.js             -- upload + AI classification preview
      Suggestions.js        -- outfit combo cards, rate them
      GapAnalysis.js        -- missing items analysis
      Profile.js            -- body type, measurements, preferences
      BodyScan.js           -- photo upload -> body measurement extraction
      Shop.js               -- product browsing with filters
      Cart.js               -- shopping cart
      Wishlist.js           -- saved items
      Checkout.js           -- Stripe payment form
      Orders.js             -- order history
      OrderConfirmation.js  -- post-purchase confirmation
      TryOn.js              -- virtual try-on (Replicate)
    components/
      Navbar.js             -- navigation, logout
      ClothingCard.js       -- single garment display
      OutfitComboCard.js    -- top + bottom visual preview
      Logo.js               -- branding
    context/
      AuthContext.js        -- JWT token management, auto-logout on 401
    services/
      api.js                -- Axios instance with Bearer token injection
```

### Key Screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Overview with daily outfit suggestion |
| Wardrobe | Grid of all uploaded clothes |
| Upload | Photo upload -> AI auto-classify preview |
| Suggestions | Outfit combos, rate/like |
| Gap Analysis | AI-powered wardrobe gap identification |
| Body Scan | Photo -> body measurements via Claude Vision |
| Shop | Browse products with filters + size recommendations |
| Try-On | Virtual clothing overlay via Replicate |
| Checkout | Stripe payment integration |

---

## 2. Backend (FastAPI on Lambda)

### Directory Structure

```
backend/
  app/
    main.py                    -- FastAPI app, CORS, router mounts
    config.py                  -- Pydantic settings (JWT, AWS, Stripe, S3)
    dynamo.py                  -- DynamoDB table references, Decimal helpers
    lambda_handler.py          -- Mangum ASGI adapter for Lambda

    routers/
      auth.py                  -- POST /register, /login; GET /me; PUT /me
      wardrobe.py              -- CRUD /wardrobe/items (upload, list, update, delete)
      outfits.py               -- GET /suggest-combos; POST /rate; GET /suggest
      analysis.py              -- POST /body, /body/validate, /body/process, /measurements
      gaps.py                  -- GET / (gap analysis)
      shop.py                  -- GET /products, /recommend, /filters, /size-chart
      cart.py                  -- POST /add, DELETE /{id}, GET /, wishlist endpoints
      orders.py                -- POST /checkout, /{id}/confirm; GET /, /{id}
      tryon.py                 -- POST / (start try-on), GET /status
      ai.py                    -- POST /chat, /classify, /outfit-advice, /gap-analysis

    schemas/
      requests.py              -- RegisterRequest, LoginRequest, UpdateProfileRequest, etc.
      responses.py             -- UserResponse, TokenResponse, GapAnalysisResponse

    services/
      auth_service.py          -- JWT create/verify (HS256, 24h), bcrypt password hashing
      wardrobe_service.py      -- Item CRUD, file upload to S3/local
      combo_service.py         -- Outfit suggestion logic (color theory + occasion)
      body_service.py          -- Bedrock Claude Vision body measurement extraction
      size_service.py          -- Standard size chart mapping (Men/Women, XS-XXL)
      weather_service.py       -- OpenWeatherMap integration

    middleware/
      auth_middleware.py       -- HTTPBearer token verification, user lookup
```

### API Endpoints

```
Auth:
  POST   /api/auth/register        -- signup (email, password, name)
  POST   /api/auth/login           -- get JWT token
  GET    /api/auth/me              -- current user profile
  PUT    /api/auth/me              -- update profile

Wardrobe:
  POST   /api/wardrobe/items       -- upload clothing image
  GET    /api/wardrobe/items       -- list all items
  GET    /api/wardrobe/items/{id}  -- single item
  PUT    /api/wardrobe/items/{id}  -- edit tags/metadata
  DELETE /api/wardrobe/items/{id}  -- remove item

Outfits:
  GET    /api/outfits/suggest-combos  -- get outfit suggestions
  POST   /api/outfits/rate            -- rate a combo
  GET    /api/outfits/suggest         -- occasion-based suggestions

AI:
  POST   /api/ai/classify         -- classify clothing image (Claude Haiku Vision)
  POST   /api/ai/chat             -- style chatbot (Amazon Nova Micro)
  POST   /api/ai/outfit-advice    -- occasion-based outfit advice (Nova Micro)
  POST   /api/ai/gap-analysis     -- AI wardrobe gap analysis (Nova Micro)

Analysis:
  POST   /api/analysis/body       -- body photo -> measurements (Claude Vision)
  POST   /api/analysis/measurements -- manual measurement input

Shop:
  GET    /api/shop/products       -- browse products (filters: gender, type)
  GET    /api/shop/products/{id}  -- product detail
  GET    /api/shop/recommend      -- personalized recommendations
  GET    /api/shop/filters        -- available filter options
  GET    /api/shop/size-chart     -- size guide

Cart:
  POST   /api/cart/add            -- add to cart
  DELETE /api/cart/{id}           -- remove from cart
  GET    /api/cart/               -- view cart
  POST   /api/cart/wishlist/add   -- add to wishlist
  GET    /api/cart/wishlist       -- view wishlist

Orders:
  POST   /api/orders/checkout     -- Stripe payment + create order
  POST   /api/orders/{id}/confirm -- confirm order
  GET    /api/orders/             -- order history
  GET    /api/orders/{id}         -- order detail

Try-On:
  POST   /api/tryon/              -- start virtual try-on (Replicate IDM-VTON)
  GET    /api/tryon/status        -- poll try-on result
```

---

## 3. AI Services (AWS Bedrock)

All AI features run through AWS Bedrock — no self-hosted models.

### Claude Haiku 3 (Vision)

Used for tasks requiring image understanding:

- **Clothing Classification** (`/api/ai/classify`) — Analyzes clothing photos and returns structured JSON:
  ```json
  {
    "type": "shirt",
    "sub_type": "polo",
    "color": {"name": "navy", "hex": "#2C3E50"},
    "pattern": "solid",
    "season": ["summer", "spring"],
    "formality": 0.6,
    "tags": ["casual", "collar"]
  }
  ```
- **Body Analysis** (`/api/analysis/body`) — Extracts body measurements and type from a user photo

### Amazon Nova Micro

Used for text-based AI tasks (cheapest model — $0.035/1M tokens):

- **Style Chat** (`/api/ai/chat`) — Fashion advice with wardrobe context
- **Outfit Advice** (`/api/ai/outfit-advice`) — Occasion-specific outfit recommendations from user's wardrobe
- **Gap Analysis** (`/api/ai/gap-analysis`) — Analyzes wardrobe composition, identifies missing essentials and color gaps

### Virtual Try-On (Replicate)

- **IDM-VTON model** via Replicate API
- Async flow: submit body photo + clothing image -> get prediction ID -> poll for result
- Not a Bedrock service — external API call

---

## 4. Database (DynamoDB)

### Tables

```
wardrobe-intelligence-users
  Hash Key: email
  GSI: id-index (id)
  Fields: id, email, password_hash, name, body_type, measurements, preferences

wardrobe-intelligence-products
  Hash Key: id
  GSI: gender-article_type-index (gender + article_type)
  Fields: id, name, gender, article_type, color, price, image_url, sizes

wardrobe-intelligence-user-items
  Hash Key: user_id
  Range Key: sk (sort key pattern)
  SK Patterns:
    wardrobe#{item_id}  -- clothing items
    cart#{item_id}      -- cart items
    wish#{item_id}      -- wishlist items
    rating#{combo_id}   -- outfit ratings
  Fields: varies by sk pattern

wardrobe-intelligence-orders
  Hash Key: user_id
  Range Key: sk
  SK Pattern: order#{order_id}
  Fields: items, total, status, stripe_payment_intent, created_at
```

All tables use PROVISIONED capacity (5 RCU, 5 WCU).

---

## 5. Data Flow — Full User Journey

```
[1] User signs up
         |--> Password hashed (bcrypt) -> stored in DynamoDB
         |--> JWT token returned (HS256, 24h expiry)
         |
[2] Uploads body photo
         |--> Bedrock Claude Vision -> measurements, body type
         |--> Saved to users table
         |
[3] Uploads clothing photos
         |--> Image saved to S3
         |--> User calls /ai/classify -> Claude Haiku Vision -> structured classification
         |--> Classification saved to user_items table (wardrobe#)
         |
[4] Requests outfit suggestions
         |--> combo_service generates suggestions based on wardrobe items
         |--> OR /ai/outfit-advice for AI-powered suggestions (Nova Micro)
         |--> Combo cards returned to frontend
         |
[5] User rates combos
         |--> Rating saved to user_items table (rating#)
         |
[6] Gap Analysis
         |--> /ai/gap-analysis sends wardrobe summary to Nova Micro
         |--> AI identifies missing essentials, color gaps, purchase recommendations
         |
[7] Shopping
         |--> Browse products with filters (gender, type)
         |--> Size recommendations based on body measurements
         |--> Add to cart/wishlist
         |--> Stripe checkout -> order created
         |
[8] Virtual Try-On
         |--> Upload body photo + select clothing
         |--> Replicate IDM-VTON processes async
         |--> Poll for result -> display overlay image
```

---

## 6. Infrastructure (AWS — Terraform)

| Resource | Service | Purpose |
|----------|---------|---------|
| Compute | Lambda (Docker, Python 3.11) | 1024 MB, 300s timeout |
| API | API Gateway (HTTP API) | Catch-all proxy to Lambda |
| Database | DynamoDB (4 tables) | All application data |
| Storage | S3 (2 buckets) | Images + frontend static files |
| CDN | CloudFront | Frontend distribution, SPA routing |
| Registry | ECR | Backend Docker images |
| AI | Bedrock | Claude Haiku Vision + Amazon Nova Micro |
| IAM | Lambda role | S3, DynamoDB, Bedrock access |

### Lambda IAM Permissions

- **S3**: GetObject, PutObject, DeleteObject, ListBucket
- **DynamoDB**: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan (all 4 tables)
- **Bedrock**: InvokeModel

---

## 7. CI/CD (GitHub Actions)

### Backend Pipeline (`deploy-backend.yml`)

Triggers on push to `main` (backend/**, Dockerfile changes):
1. Checkout code
2. Configure AWS credentials
3. Login to ECR
4. Build Docker image (linux/amd64)
5. Push to ECR
6. Update Lambda function code
7. Wait for Lambda update to complete

### Frontend Pipeline (`deploy-frontend.yml`)

Triggers on push to `main` (frontend/** changes):
1. Checkout code
2. Setup Node 18
3. `npm ci && npm run build`
4. `aws s3 sync` build output to S3 frontend bucket
5. CloudFront cache invalidation

---

## 8. External Services

| Service | Purpose | Used In |
|---------|---------|---------|
| AWS Bedrock (Claude Haiku) | Clothing classification, body analysis | `ai.py`, `body_service.py` |
| AWS Bedrock (Nova Micro) | Style chat, outfit advice, gap analysis | `ai.py` |
| Replicate (IDM-VTON) | Virtual try-on | `tryon.py` |
| Stripe | Payment processing | `orders.py` |
| OpenWeatherMap | Weather data | `weather_service.py` |

---

## 9. Auth & Security

| Concern | Approach |
|---------|----------|
| Password storage | bcrypt hashing |
| Authentication | JWT (HS256, 24-hour expiry) |
| Token delivery | Bearer token in Authorization header |
| Frontend storage | localStorage |
| Auto-logout | 401 response -> redirect to login |
| CORS | Configured in FastAPI + Lambda Function URL |
| IAM | Least-privilege Lambda role (specific table ARNs) |
| File uploads | 10 MB max, S3 with public read for images |
