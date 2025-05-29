-- 1. Users Table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_h VARCHAR(512) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Avatars Table
CREATE TABLE avatars (
  avatar_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  selfie_url VARCHAR(512) NOT NULL,
  keypoints JSONB NOT NULL,
  created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Garments Table
CREATE TABLE garments (
  garment_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  source VARCHAR(20) NOT NULL, -- 'USER_UPLOAD' | 'CURATED' | 'AFFILIATE'
  image_url VARCHAR(512) NOT NULL,
  tags VARCHAR(512),
  affiliate_url VARCHAR(512),
  last_synced TIMESTAMP,
  created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Wishlist Table
CREATE TABLE wishlist (
  wish_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  garment_id INTEGER NOT NULL REFERENCES garments(garment_id),
  created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cart Items Table
CREATE TABLE cart_items (
  cart_item_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  garment_id INTEGER NOT NULL REFERENCES garments(garment_id),
  size_code VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  added_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Orders Table
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  subtotal NUMERIC(12,2) NOT NULL,
  shipping_amt NUMERIC(12,2) NOT NULL,
  total_amt NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED'
  created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Order Items Table
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  garment_id INTEGER NOT NULL REFERENCES garments(garment_id),
  size_code VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);
