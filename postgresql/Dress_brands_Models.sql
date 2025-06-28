
-- Drop tables 
DROP TABLE IF EXISTS wardrobe.dress_recommendations CASCADE;
DROP TABLE IF EXISTS wardrobe.dresses CASCADE;
DROP TABLE IF EXISTS wardrobe.dress_categories CASCADE;
DROP TABLE IF EXISTS wardrobe.dress_brands CASCADE;



-- 1. Dress Categories Table
CREATE TABLE wardrobe.dress_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT,
    style_tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Dress Brands Table  
CREATE TABLE wardrobe.dress_brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    brand_description TEXT,
    price_range VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Main Dresses Table
CREATE TABLE wardrobe.dresses (
    dress_id SERIAL PRIMARY KEY,
    dress_name VARCHAR(255) NOT NULL,
    brand_id INTEGER REFERENCES wardrobe.dress_brands(brand_id),
    category_id INTEGER REFERENCES wardrobe.dress_categories(category_id),
    
    -- Physical measurements (in inches)
    bust_min DECIMAL(5,2),
    bust_max DECIMAL(5,2),
    waist_min DECIMAL(5,2),
    waist_max DECIMAL(5,2),
    hip_min DECIMAL(5,2),
    hip_max DECIMAL(5,2),
    length DECIMAL(5,2),
    
    -- Size information
    available_sizes TEXT[],
    size_chart JSONB,
    
    -- Style attributes
    dress_style VARCHAR(100),
    neckline VARCHAR(100),
    sleeve_type VARCHAR(100),
    dress_length VARCHAR(50),
    occasion TEXT[],
    
    -- Colors and patterns
    primary_color VARCHAR(50),
    secondary_colors TEXT[],
    pattern_type VARCHAR(50),
    
    -- Hotness/Sexiness factors
    sexiness_score INTEGER CHECK (sexiness_score >= 1 AND sexiness_score <= 10),
    hotness_tags TEXT[],
    body_type_recommendations TEXT[],
    
    -- Skin tone compatibility
    skin_tone_compatibility TEXT[],
    
    -- Commercial information
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    availability_status VARCHAR(50) DEFAULT 'available',
    
    -- Images and media
    primary_image_url VARCHAR(500) NOT NULL,
    additional_images TEXT[],
    model_images TEXT[],
    
    -- GCP Storage paths
    gcp_bucket_path VARCHAR(500),
    image_folder_path VARCHAR(500),
    
    -- SEO and discovery
    keywords TEXT[],
    description TEXT,
    fabric_type VARCHAR(100),
    care_instructions TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    recommendation_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    CONSTRAINT unique_dress_brand_name UNIQUE (dress_name, brand_id)
);

-- User Dress Recommendations Table
CREATE TABLE wardrobe.dress_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    dress_id INTEGER NOT NULL REFERENCES wardrobe.dresses(dress_id),
  
    compatibility_score DECIMAL(5,2),
    sexiness_match_score DECIMAL(5,2),
    fit_score DECIMAL(5,2),
    style_score DECIMAL(5,2),
    
    
    recommendation_reason TEXT,
    fit_analysis TEXT,
    style_tips TEXT,
    
    
    is_favorite BOOLEAN DEFAULT FALSE,
    is_viewed BOOLEAN DEFAULT FALSE,
    is_purchased BOOLEAN DEFAULT FALSE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    recommended_by VARCHAR(50) DEFAULT 'ai-transformer',
    recommendation_confidence DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Indexes
CREATE INDEX idx_dresses_sexiness_score ON wardrobe.dresses(sexiness_score DESC);
CREATE INDEX idx_dresses_body_type ON wardrobe.dresses USING GIN(body_type_recommendations);
CREATE INDEX idx_dresses_skin_tone ON wardrobe.dresses USING GIN(skin_tone_compatibility);
CREATE INDEX idx_dresses_measurements ON wardrobe.dresses(bust_min, bust_max, waist_min, waist_max, hip_min, hip_max);
CREATE INDEX idx_dresses_price ON wardrobe.dresses(price);
CREATE INDEX idx_dresses_style ON wardrobe.dresses(dress_style, neckline, dress_length);

CREATE INDEX idx_recommendations_user ON wardrobe.dress_recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_score ON wardrobe.dress_recommendations(compatibility_score DESC);
CREATE INDEX idx_recommendations_analysis ON wardrobe.dress_recommendations(analysis_id);


INSERT INTO wardrobe.dress_categories (category_name, category_description, style_tags) VALUES
('Bodycon Dresses', 'Form-fitting dresses that hug the body curves', ARRAY['hot', 'sexy', 'curve-hugging', 'club']),
('Cocktail Dresses', 'Elegant dresses perfect for evening events', ARRAY['elegant', 'sophisticated', 'party', 'formal']),
('Mini Dresses', 'Short dresses that show off legs', ARRAY['hot', 'playful', 'youthful', 'party']),
('Maxi Dresses', 'Long flowing dresses', ARRAY['elegant', 'romantic', 'flowing', 'formal']),
('Slip Dresses', 'Silky, lingerie-inspired dresses', ARRAY['sexy', 'minimalist', 'effortless', 'date']),
('Wrap Dresses', 'Versatile dresses that wrap and tie', ARRAY['flattering', 'versatile', 'classic', 'work']);

-- ============================================
-- STEP 4: INSERT BRANDS
-- ============================================
INSERT INTO wardrobe.dress_brands (brand_name, brand_description, price_range) VALUES
('Sexy Couture', 'High-end sexy dresses for confident women', 'luxury'),
('Hot & Trendy', 'Affordable trendy dresses', 'budget'),
('Elegance Plus', 'Mid-range elegant dress collection', 'mid-range'),
('Curve Appeal', 'Dresses designed for curvy women', 'mid-range'),
('Night Out Fashion', 'Party and club wear specialists', 'budget');

-- ============================================
-- STEP 5: INSERT DRESSES (Your GCP Images)
-- ============================================
INSERT INTO wardrobe.dresses (
    dress_name, brand_id, category_id,
    bust_min, bust_max, waist_min, waist_max, hip_min, hip_max, length,
    available_sizes, dress_style, neckline, sleeve_type, dress_length, occasion,
    primary_color, sexiness_score, hotness_tags, body_type_recommendations,
    skin_tone_compatibility, price, primary_image_url, gcp_bucket_path,
    description
) VALUES
-- Bodycon Dress
('Classic Black Mini Bodycon', 1, 1,
 32.0, 38.0, 24.0, 30.0, 34.0, 40.0, 35.0,
 ARRAY['XS','S','M','L'], 'bodycon', 'V-neck', 'sleeveless', 'mini',
 ARRAY['party','club','date'], 'black', 9,
 ARRAY['curve-hugging','form-fitting','sexy'],
 ARRAY['hourglass','rectangle'], ARRAY['all'],
 89.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/bodycon/black-classic-mini/primary.jpg',
 'dresses/bodycon/black-classic-mini/',
 'Classic black bodycon dress that hugs every curve'),

-- Cocktail Dress
('Emerald Sparkle Formal', 2, 2,
 34.0, 40.0, 26.0, 32.0, 36.0, 42.0, 38.0,
 ARRAY['S','M','L','XL'], 'A-line', 'sweetheart', 'sleeveless', 'knee-length',
 ARRAY['formal','cocktail-party'], 'emerald', 8,
 ARRAY['elegant','sparkly','flattering'],
 ARRAY['all'], ARRAY['cool','neutral'],
 129.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/cocktail/emerald-sparkle-formal/primary.jpg',
 'dresses/cocktail/emerald-sparkle-formal/',
 'Emerald green cocktail dress with sparkle details'),

-- Mini Dress
('Floral Summer Cute Mini', 3, 3,
 32.0, 38.0, 24.0, 30.0, 34.0, 40.0, 30.0,
 ARRAY['XS','S','M','L'], 'A-line', 'square-neck', 'short-sleeve', 'mini',
 ARRAY['brunch','casual','summer'], 'floral', 6,
 ARRAY['cute','playful','feminine'],
 ARRAY['all'], ARRAY['all'],
 49.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/mini/floral-summer-cute/primary.jpg',
 'dresses/mini/floral-summer-cute/',
 'Cute floral summer mini dress perfect for casual days'),

-- Maxi Dress
('Bohemian Long Maxi', 1, 4,
 34.0, 42.0, 26.0, 34.0, 36.0, 44.0, 58.0,
 ARRAY['S','M','L','XL'], 'A-line', 'V-neck', 'long-sleeve', 'maxi',
 ARRAY['beach','vacation','boho'], 'floral', 5,
 ARRAY['flowy','bohemian','comfortable'],
 ARRAY['all'], ARRAY['all'],
 79.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/maxi/floral-bohemian-long/primary.jpg',
 'dresses/maxi/floral-bohemian-long/',
 'Bohemian floral maxi dress for a free-spirited look'),

-- Slip Dress
('Silk Champagne Sexy Slip', 2, 5,
 32.0, 38.0, 24.0, 30.0, 34.0, 40.0, 36.0,
 ARRAY['XS','S','M','L'], 'slip', 'V-neck', 'sleeveless', 'midi',
 ARRAY['date','party','special'], 'champagne', 8,
 ARRAY['silky','sexy','elegant'],
 ARRAY['all'], ARRAY['warm','neutral'],
 99.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/slip/silk-champagne-sexy/primary.jpg',
 'dresses/slip/silk-champagne-sexy/',
 'Champagne silk slip dress for special occasions'),

-- Wrap Dress
('Floral Midi Spring Wrap', 3, 6,
 32.0, 40.0, 24.0, 32.0, 34.0, 42.0, 42.0,
 ARRAY['XS','S','M','L','XL'], 'wrap', 'V-neck', '3/4-sleeve', 'midi',
 ARRAY['work','brunch','spring'], 'floral', 6,
 ARRAY['flattering','versatile','feminine'],
 ARRAY['all'], ARRAY['all'],
 69.99, 'https://storage.googleapis.com/wardrobe_intelligence/dresses/wrap/floral-midi-spring/primary.jpg',
 'dresses/wrap/floral-midi-spring/',
 'Versatile floral wrap dress for work or weekend');


GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA wardrobe TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA wardrobe TO postgres;


-- Check categories
SELECT category_id, category_name FROM wardrobe.dress_categories ORDER BY category_id;

-- Check brands  
SELECT brand_id, brand_name FROM wardrobe.dress_brands ORDER BY brand_id;

-- Check dresses with details
SELECT 
    d.dress_id,
    d.dress_name, 
    b.brand_name, 
    c.category_name,
    d.primary_color,
    d.sexiness_score,
    d.price
FROM wardrobe.dresses d
JOIN wardrobe.dress_brands b ON d.brand_id = b.brand_id
JOIN wardrobe.dress_categories c ON d.category_id = c.category_id
ORDER BY c.category_id;

-- Final count
SELECT COUNT(*) as total_dresses FROM wardrobe.dresses;