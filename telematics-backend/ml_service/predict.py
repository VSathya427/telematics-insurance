#!/usr/bin/env python3
import sys
import json
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def advanced_ml_prediction(features):
    """
    Advanced ML-style prediction using feature engineering
    """
    try:
        # Extract features
        avg_speed = features.get('avg_speed', 40)
        max_speed = features.get('max_speed', 60)
        harsh_braking_rate = features.get('harsh_braking_rate', 0.02)
        harsh_accel_rate = features.get('harsh_accel_rate', 0.02) 
        phone_usage_rate = features.get('phone_usage_rate', 0.01)
        night_driving_rate = features.get('night_driving_rate', 0.1)
        speeding_rate = features.get('speeding_rate', 0.05)
        bad_weather_rate = features.get('bad_weather_rate', 0.1)
        total_trips = features.get('total_trips', 10)
        data_points = features.get('data_points', 100)
        
        # Base risk calculation (simulating trained ML model)
        risk_score = 25.0  # Base low risk
        
        # Speed-based risk (non-linear relationship)
        if avg_speed > 60:
            risk_score += (avg_speed - 60) * 1.2
        elif avg_speed > 50:
            risk_score += (avg_speed - 50) * 0.8
        
        if max_speed > 80:
            risk_score += (max_speed - 80) * 0.5
            
        # Event-based risk (exponential penalty)
        risk_score += harsh_braking_rate * 200
        risk_score += harsh_accel_rate * 180
        risk_score += phone_usage_rate * 300
        risk_score += speeding_rate * 150
        
        # Temporal risk factors
        risk_score += night_driving_rate * 40
        
        # Environmental risk
        risk_score += bad_weather_rate * 60
        
        # Data quality adjustment
        data_quality_multiplier = min(1.0, data_points / 500)  # Better with more data
        trip_quality_multiplier = min(1.0, total_trips / 50)   # Better with more trips
        
        # Confidence calculation
        base_confidence = 0.6
        confidence = base_confidence + (data_quality_multiplier * 0.2) + (trip_quality_multiplier * 0.2)
        
        # Apply quality adjustments
        risk_score *= (0.7 + 0.3 * data_quality_multiplier)
        
        # Feature interaction effects (simulating complex ML relationships)
        if harsh_braking_rate > 0.05 and avg_speed > 55:
            risk_score += 15  # High speed + harsh braking = higher risk
            
        if phone_usage_rate > 0.03 and night_driving_rate > 0.15:
            risk_score += 20  # Phone usage at night = much higher risk
            
        # Clamp to valid range
        risk_score = max(5, min(95, risk_score))
        confidence = max(0.5, min(1.0, confidence))
        
        # Risk level categorization
        if risk_score <= 30:
            risk_level = 0  # Low risk
        elif risk_score <= 50:
            risk_level = 1  # Medium risk
        elif risk_score <= 70:
            risk_level = 2  # High risk
        else:
            risk_level = 3  # Very high risk
        
        # Feature importance (simulating ML model explainability)
        feature_importance = {
            'speed_factors': (avg_speed - 40) * 0.5,
            'harsh_events': (harsh_braking_rate + harsh_accel_rate) * 100,
            'phone_usage': phone_usage_rate * 150,
            'night_driving': night_driving_rate * 30,
            'weather_conditions': bad_weather_rate * 40
        }
        
        return {
            "risk_score": round(risk_score, 2),
            "confidence": round(confidence, 3),
            "risk_level": risk_level,
            "feature_importance": feature_importance,
            "model_version": "v1.2",
            "features_analyzed": len(features),
            "data_quality_score": round(data_quality_multiplier, 2)
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "confidence": 0,
            "risk_score": 50
        }

if __name__ == "__main__":
    try:
        # Get features from command line argument
        features_json = sys.argv[1]
        features = json.loads(features_json)
        
        # Run prediction
        result = advanced_ml_prediction(features)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "confidence": 0,
            "risk_score": 50
        }
        print(json.dumps(error_result))
