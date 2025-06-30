from flask import Flask, request, jsonify
import json
import math
import numpy as np
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime
import logging

# For AI/ML processing (free alternatives)
try:
    from transformers import pipeline, AutoTokenizer, AutoModel
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("Transformers not installed. Using rule-based recommendations.")

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

class SexyDressRecommendationEngine:
    def __init__(self):
        print("Initializing Sexy Dress Recommendation Engine...")
        
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'port': 5433,
            'database': 'postgres',
            'user': 'postgres', 
            'password': 'Akassh@3108'
        }
        
        # Initialize AI models if available
        self.init_ai_models()
        
        # Style preferences for different body types and occasions
        self.style_preferences = self.load_style_preferences()
        
        print("Sexy Dress Recommendation Engine initialized!")
    
    def init_ai_models(self):
        """Initialize AI models for recommendation"""
        if HAS_TRANSFORMERS:
            try:
                print("Loading AI models...")
                # Use a lightweight model for text processing
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
                )
                
                # For style matching (using a general purpose model)
                self.feature_extractor = pipeline(
                    "feature-extraction",
                    model="sentence-transformers/all-MiniLM-L6-v2"
                )
                
                self.has_ai = True
                print("AI models loaded successfully")
                
            except Exception as e:
                print(f"Could not load AI models: {e}")
                self.has_ai = False
        else:
            self.has_ai = False
            print("Using rule-based recommendations (no AI models)")
    
    def load_style_preferences(self):
        """Load style preferences and rules"""
        return {
            'body_types': {
                'hourglass': {
                    'recommended_styles': ['bodycon', 'wrap', 'fit-and-flare'],
                    'sexy_features': ['curve-hugging', 'waist-emphasizing', 'form-fitting'],
                    'necklines': ['V-neck', 'sweetheart', 'scoop'],
                    'avoid': ['empire-waist', 'loose-fitting']
                },
                'pear': {
                    'recommended_styles': ['A-line', 'fit-and-flare', 'empire'],
                    'sexy_features': ['off-shoulder', 'statement-sleeves', 'embellished-top'],
                    'necklines': ['boat-neck', 'off-shoulder', 'halter'],
                    'avoid': ['tight-hips', 'straight-cut']
                },
                'apple': {
                    'recommended_styles': ['empire', 'A-line', 'wrap'],
                    'sexy_features': ['plunging-neckline', 'leg-emphasis', 'flowing-silhouette'],
                    'necklines': ['V-neck', 'scoop', 'cowl'],
                    'avoid': ['tight-waist', 'belt-emphasis']
                },
                'rectangle': {
                    'recommended_styles': ['bodycon', 'sheath', 'wrap'],
                    'sexy_features': ['curve-creating', 'cut-outs', 'side-slits'],
                    'necklines': ['sweetheart', 'strapless', 'halter'],
                    'avoid': ['straight-lines', 'boxy-cuts']
                },
                'inverted_triangle': {
                    'recommended_styles': ['A-line', 'mermaid', 'straight'],
                    'sexy_features': ['hip-emphasis', 'flowing-bottom', 'dramatic-hemline'],
                    'necklines': ['scoop', 'square', 'high-neck'],
                    'avoid': ['shoulder-emphasis', 'puffy-sleeves']
                }
            },
            'skin_tones': {
                'fair_cool': ['navy', 'emerald', 'royal-blue', 'black', 'white', 'silver'],
                'fair_warm': ['coral', 'peach', 'gold', 'cream', 'warm-brown', 'orange'],
                'fair_neutral': ['pink', 'lavender', 'mint', 'gray', 'beige', 'rose-gold'],
                'medium_cool': ['jewel-tones', 'magenta', 'purple', 'black', 'white', 'gray'],
                'medium_warm': ['red', 'orange', 'yellow', 'brown', 'gold', 'bronze'],
                'medium_neutral': ['teal', 'burgundy', 'forest-green', 'navy', 'camel'],
                'deep_cool': ['bright-white', 'black', 'royal-colors', 'ice-colors', 'silver'],
                'deep_warm': ['gold', 'copper', 'warm-reds', 'orange', 'yellow', 'bronze'],
                'deep_neutral': ['earth-tones', 'jewel-tones', 'black', 'white', 'metallics']
            },
            'sexiness_factors': {
                'high_sexiness': {
                    'styles': ['bodycon', 'slip', 'bandage'],
                    'features': ['backless', 'low-cut', 'thigh-high-slit', 'see-through', 'cut-outs'],
                    'lengths': ['mini', 'micro-mini'],
                    'necklines': ['plunging-V', 'sweetheart', 'halter', 'strapless']
                },
                'medium_sexiness': {
                    'styles': ['wrap', 'sheath', 'fit-and-flare'],
                    'features': ['side-slit', 'off-shoulder', 'lace-details', 'form-fitting'],
                    'lengths': ['knee-length', 'midi'],
                    'necklines': ['V-neck', 'scoop', 'boat-neck']
                }
            }
        }
    
    def get_database_connection(self):
        """Get database connection"""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            print(f"Database connection failed: {e}")
            raise
    
    def get_user_measurements(self, analysis_id: str) -> Dict[str, Any]:
        """Get user measurements from database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT 
                            measurements,
                            skin_tone,
                            body_type,
                            user_id
                        FROM wardrobe.body_analysis 
                        WHERE analysis_id = %s AND status = 'COMPLETED'
                    """, (analysis_id,))
                    
                    result = cursor.fetchone()
                    if result:
                        measurements = json.loads(result['measurements']) if result['measurements'] else {}
                        return {
                            'measurements': measurements,
                            'skin_tone': result['skin_tone'],
                            'body_type': result['body_type'],
                            'user_id': result['user_id']
                        }
                    else:
                        raise ValueError(f"No completed analysis found for ID: {analysis_id}")
                        
        except Exception as e:
            print(f"Error getting user measurements: {e}")
            raise
    
    def fetch_sexy_dresses(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch hot and sexy dresses from database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT 
                            d.*,
                            dc.category_name,
                            dc.style_tags,
                            db.brand_name,
                            db.price_range
                        FROM wardrobe.dresses d
                        LEFT JOIN wardrobe.dress_categories dc ON d.category_id = dc.category_id
                        LEFT JOIN wardrobe.dress_brands db ON d.brand_id = db.brand_id
                        WHERE d.sexiness_score >= 7  -- Focus on hot & sexy dresses
                        AND d.availability_status = 'available'
                        ORDER BY d.sexiness_score DESC, d.avg_rating DESC NULLS LAST
                        LIMIT %s
                    """, (limit,))
                    
                    return [dict(row) for row in cursor.fetchall()]
                    
        except Exception as e:
            print(f"Error fetching dresses: {e}")
            return []
    
    def calculate_fit_score(self, user_measurements: Dict[str, float], dress: Dict[str, Any]) -> float:
        """Calculate how well the dress will fit the user."""
        try:
            # 1) User’s measurements (already floats)
            user_chest = user_measurements.get('chest', 36.0)
            user_waist = user_measurements.get('waist', 30.0)
            user_hips  = user_measurements.get('hips', 38.0)

            # 2) Cast the DB’s Decimal fields into floats
            bust_min  = float(dress.get('bust_min',  0))
            bust_max  = float(dress.get('bust_max',  0))
            waist_min = float(dress.get('waist_min', 0))
            waist_max = float(dress.get('waist_max', 0))
            hip_min   = float(dress.get('hip_min',   0))
            hip_max   = float(dress.get('hip_max',   0))

            # 3) Compute chest fit
            if bust_min <= user_chest <= bust_max:
                chest_fit = 100.0
            else:
                if user_chest < bust_min:
                    chest_fit = max(0.0, 100.0 - (bust_min   - user_chest) * 10.0)
                else:
                    chest_fit = max(0.0, 100.0 - (user_chest - bust_max)   * 10.0)

            # 4) Compute waist fit
            if waist_min <= user_waist <= waist_max:
                waist_fit = 100.0
            else:
                if user_waist < waist_min:
                    waist_fit = max(0.0, 100.0 - (waist_min  - user_waist) * 10.0)
                else:
                    waist_fit = max(0.0, 100.0 - (user_waist - waist_max) * 10.0)

            # 5) Compute hip fit
            if hip_min <= user_hips <= hip_max:
                hip_fit = 100.0
            else:
                if user_hips < hip_min:
                    hip_fit = max(0.0, 100.0 - (hip_min    - user_hips) * 10.0)
                else:
                    hip_fit = max(0.0, 100.0 - (user_hips   - hip_max)   * 10.0)

            # 6) Weighted average (chest and waist are most important)
            fit_score = chest_fit * 0.4 + waist_fit * 0.4 + hip_fit * 0.2
            return round(min(100.0, max(0.0, fit_score)), 2)

        except Exception as e:
            print(f"Error calculating fit score: {e}")
            return 50.0  # Fallback moderate fit
    
    def calculate_style_score(self, user_data: Dict[str, Any], dress: Dict[str, Any]) -> float:
        """Calculate style compatibility score"""
        try:
            body_type = user_data.get('body_type', 'rectangle')
            skin_tone = user_data.get('skin_tone', 'medium_neutral')
            
            score = 0
            
            # Body type compatibility
            body_prefs = self.style_preferences['body_types'].get(body_type, {})
            if dress['dress_style'] in body_prefs.get('recommended_styles', []):
                score += 30
            
            if dress['neckline'] in body_prefs.get('necklines', []):
                score += 20
            
            # Check hotness tags match body type preferences
            dress_hotness = dress.get('hotness_tags', [])
            body_sexy_features = body_prefs.get('sexy_features', [])
            matching_features = set(dress_hotness) & set(body_sexy_features)
            score += len(matching_features) * 10
            
            # Skin tone compatibility
            compatible_colors = self.style_preferences['skin_tones'].get(skin_tone, [])
            if dress['primary_color'] in compatible_colors:
                score += 25
            
            # Additional sexiness bonus
            if dress['sexiness_score'] >= 8:
                score += 15
            
            return round(min(100, max(0, score)), 2)
            
        except Exception as e:
            print(f"Error calculating style score: {e}")
            return 50.0
    
    def calculate_sexiness_match_score(self, dress: Dict[str, Any], preference: str = 'high') -> float:
        """Calculate how well the dress matches sexiness preference"""
        try:
            sexiness_score = dress.get('sexiness_score', 5)
            hotness_tags = dress.get('hotness_tags', [])
            
            if preference == 'high':
                # User wants maximum hotness
                base_score = (sexiness_score / 10) * 70  # 70% based on sexiness score
                
                # Bonus for hot features
                hot_features = self.style_preferences['sexiness_factors']['high_sexiness']['features']
                matching_hot_features = set(hotness_tags) & set(hot_features)
                feature_bonus = len(matching_hot_features) * 10
                
                total_score = base_score + feature_bonus
                
            else:  # medium sexiness
                # Moderate sexiness preference
                ideal_score = 6  # Sweet spot for medium sexiness
                deviation = abs(sexiness_score - ideal_score)
                base_score = max(0, 100 - (deviation * 15))
                
                medium_features = self.style_preferences['sexiness_factors']['medium_sexiness']['features']
                matching_features = set(hotness_tags) & set(medium_features)
                feature_bonus = len(matching_features) * 5
                
                total_score = base_score + feature_bonus
            
            return round(min(100, max(0, total_score)), 2)
            
        except Exception as e:
            print(f"Error calculating sexiness match: {e}")
            return 50.0
    
    def generate_ai_reasoning(self, user_data: Dict[str, Any], dress: Dict[str, Any], scores: Dict[str, float]) -> str:
        """Generate AI reasoning for why this dress is recommended"""
        try:
            body_type = user_data.get('body_type', 'rectangle')
            skin_tone = user_data.get('skin_tone', 'medium_neutral')
            measurements = user_data.get('measurements', {})
            
            # Build reasoning based on scores and characteristics
            reasons = []
            
            # Fit reasoning
            if scores['fit_score'] >= 85:
                reasons.append(f"Perfect fit for your {measurements.get('chest', 'N/A')}\" chest and {measurements.get('waist', 'N/A')}\" waist measurements")
            elif scores['fit_score'] >= 70:
                reasons.append("Good fit that will flatter your proportions")
            
            # Style reasoning
            if scores['style_score'] >= 80:
                reasons.append(f"Ideal style for {body_type} body type - the {dress['dress_style']} cut with {dress['neckline']} neckline will enhance your best features")
            
            # Sexiness reasoning
            if scores['sexiness_match_score'] >= 85:
                hotness_features = ', '.join(dress.get('hotness_tags', [])[:3])
                reasons.append(f"Maximum hotness factor with {hotness_features} - guaranteed to turn heads")
            
            # Color reasoning
            if dress['primary_color'] in self.style_preferences['skin_tones'].get(skin_tone, []):
                reasons.append(f"The {dress['primary_color']} color perfectly complements your {skin_tone.replace('_', ' ')} skin tone")
            
            # Overall appeal
            if dress['sexiness_score'] >= 9:
                reasons.append("Ultra-sexy design that will make you feel confident and irresistible")
            
            if not reasons:
                reasons.append("This dress combines style, fit, and sexiness for a stunning look")
            
            return " • ".join(reasons)
            
        except Exception as e:
            print(f"Error generating reasoning: {e}")
            return "This dress is recommended based on your measurements and style preferences."
    
    def recommend_sexy_dresses(self, analysis_id: str, preference: str = 'high', limit: int = 10) -> List[Dict[str, Any]]:
        """Main recommendation function"""
        try:
            print(f"Generating sexy dress recommendations for analysis: {analysis_id}")
            
            # Get user data
            user_data = self.get_user_measurements(analysis_id)
            print(f" User: {user_data['body_type']} body type, {user_data['skin_tone']} skin tone")
            
            # Fetch available dresses
            dresses = self.fetch_sexy_dresses(limit=50)  # Get more to filter from
            print(f" Found {len(dresses)} sexy dresses to analyze")
            
            recommendations = []
            
            for dress in dresses:
                # Calculate compatibility scores
                fit_score = self.calculate_fit_score(user_data['measurements'], dress)
                style_score = self.calculate_style_score(user_data, dress)
                sexiness_match_score = self.calculate_sexiness_match_score(dress, preference)
                
                # Calculate overall compatibility score
                compatibility_score = (
                    fit_score * 0.4 +           # 40% fit
                    style_score * 0.35 +        # 35% style
                    sexiness_match_score * 0.25  # 25% sexiness match
                )
                
                # Only recommend dresses with good compatibility
                if compatibility_score >= 60:
                    scores = {
                        'fit_score': fit_score,
                        'style_score': style_score,
                        'sexiness_match_score': sexiness_match_score,
                        'compatibility_score': round(compatibility_score, 2)
                    }
                    
                    # Generate AI reasoning
                    reasoning = self.generate_ai_reasoning(user_data, dress, scores)
                    
                    recommendation = {
                        'dress': dress,
                        'scores': scores,
                        'reasoning': reasoning,
                        'recommended_size': self.recommend_size(user_data['measurements'], dress),
                        'styling_tips': self.generate_styling_tips(dress, user_data['body_type'])
                    }
                    
                    recommendations.append(recommendation)
            
            # Sort by compatibility score
            recommendations.sort(key=lambda x: x['scores']['compatibility_score'], reverse=True)
            
            # Take top recommendations
            top_recommendations = recommendations[:limit]
            
            print(f"Generated {len(top_recommendations)} hot dress recommendations")
            
            return top_recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            raise
    
    def recommend_size(self, measurements: Dict[str, float], dress: Dict[str, Any]) -> str:
        """Recommend the best size for the user"""
        try:
            user_chest = measurements.get('chest', 36.0)
            user_waist = measurements.get('waist', 30.0)
            
            # Simple size recommendation logic
            if user_chest <= 32 and user_waist <= 26:
                return 'XS'
            elif user_chest <= 34 and user_waist <= 28:
                return 'S'
            elif user_chest <= 36 and user_waist <= 30:
                return 'M'
            elif user_chest <= 38 and user_waist <= 32:
                return 'L'
            else:
                return 'XL'
                
        except Exception as e:
            return 'M'  # Default to medium
    
    def generate_styling_tips(self, dress: Dict[str, Any], body_type: str) -> str:
        """Generate styling tips for the dress"""
        tips = []
        
        # Based on dress style
        if dress['dress_style'] == 'bodycon':
            tips.append("Pair with heels to elongate your silhouette")
            tips.append("Add a statement necklace to draw attention upward")
        
        if dress['neckline'] == 'V-neck':
            tips.append("Perfect for showcasing a delicate necklace")
        
        if dress.get('sexiness_score', 0) >= 8:
            tips.append("Keep accessories minimal to let the dress be the star")
            tips.append("Confidence is your best accessory!")
        
        # Body type specific tips
        body_tips = {
            'hourglass': "Emphasize your waist with a thin belt if the dress allows",
            'pear': "Add volume on top with statement earrings or a bold lip",
            'apple': "Choose nude undergarments for a smooth silhouette",
            'rectangle': "Create curves with strategic accessories and poses",
            'inverted_triangle': "Balance your look with attention-drawing shoes or bags"
        }
        
        if body_type in body_tips:
            tips.append(body_tips[body_type])
        
        return " • ".join(tips) if tips else "Style with confidence!"
    
    def save_recommendations_to_db(self, analysis_id: str, recommendations: List[Dict[str, Any]]):
        """Save recommendations to database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    for rec in recommendations:
                        dress = rec['dress']
                        scores = rec['scores']
                        
                        cursor.execute("""
                            INSERT INTO wardrobe.dress_recommendations (
                                analysis_id, user_id, dress_id,
                                compatibility_score, sexiness_match_score, fit_score, style_score,
                                recommendation_reason, recommendation_confidence,
                                recommended_by
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            analysis_id,
                            dress.get('user_id'),  # This should come from user_data
                            dress['dress_id'],
                            scores['compatibility_score'],
                            scores['sexiness_match_score'],
                            scores['fit_score'],
                            scores['style_score'],
                            rec['reasoning'],
                            scores['compatibility_score'],  # Use compatibility as confidence
                            'ai-transformer'
                        ))
                    
                    conn.commit()
                    print(f"Saved {len(recommendations)} recommendations to database")
                    
        except Exception as e:
            print(f"Error saving recommendations: {e}")

# Initialize the recommendation engine
recommendation_engine = SexyDressRecommendationEngine()

@app.route('/recommend-dresses', methods=['POST'])
def recommend_dresses():
    """API endpoint for dress recommendations"""
    try:
        data = request.json
        analysis_id = data.get('analysis_id')
        preference = data.get('sexiness_preference', 'high')  # 'high' or 'medium'
        limit = data.get('limit', 10)
        
        if not analysis_id:
            return jsonify({
                'success': False,
                'error': 'analysis_id is required'
            }), 400
        
        print(f"Received request for sexy dress recommendations: {analysis_id}")
        
        # Generate recommendations
        recommendations = recommendation_engine.recommend_sexy_dresses(
            analysis_id=analysis_id,
            preference=preference,
            limit=limit
        )
        
        # Save to database
        recommendation_engine.save_recommendations_to_db(analysis_id, recommendations)
        
        # Format response
        response_data = []
        for rec in recommendations:
            dress_data = {
                'dress_id': rec['dress']['dress_id'],
                'dress_name': rec['dress']['dress_name'],
                'brand_name': rec['dress']['brand_name'],
                'price': float(rec['dress']['price']),
                'primary_image_url': rec['dress']['primary_image_url'],
                'sexiness_score': rec['dress']['sexiness_score'],
                'dress_style': rec['dress']['dress_style'],
                'neckline': rec['dress']['neckline'],
                'dress_length': rec['dress']['dress_length'],
                'primary_color': rec['dress']['primary_color'],
                'hotness_tags': rec['dress']['hotness_tags'],
                'compatibility_score': rec['scores']['compatibility_score'],
                'fit_score': rec['scores']['fit_score'],
                'style_score': rec['scores']['style_score'],
                'sexiness_match_score': rec['scores']['sexiness_match_score'],
                'recommendation_reason': rec['reasoning'],
                'recommended_size': rec['recommended_size'],
                'styling_tips': rec['styling_tips']
            }
            response_data.append(dress_data)
        
        return jsonify({
            'success': True,
            'analysis_id': analysis_id,
            'recommendations_count': len(response_data),
            'sexiness_preference': preference,
            'recommendations': response_data,
            'message': f"Found {len(response_data)} hot & sexy dresses perfect for you!"
        })
        
    except Exception as e:
        print(f"Error in recommend_dresses: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Sexy Dress Recommendation Engine',
        'version': '1.0',
        'ai_enabled': recommendation_engine.has_ai,
        'database_connected': True,
        'features': {
            'fit_analysis': 'Active',
            'style_matching': 'Active',
            'sexiness_scoring': 'Active',
            'ai_reasoning': 'Active'
        }
    })

if __name__ == '__main__':
    print("Starting AI Sexy Dress Recommendation Service...")
    print("Features: Fit Analysis + Style Matching + Sexiness Scoring")
    print("AI Engine: Transformers + Custom Logic")
    print("Server: http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
