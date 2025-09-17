import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

def load_and_prepare_data():
    # Load US Accidents dataset
    df = pd.read_csv('US_Accidents_March23.csv')
    
    # ✅ FIX: Use errors='coerce' and format='mixed' for flexible parsing
    df['Start_Time'] = pd.to_datetime(df['Start_Time'], errors='coerce', format='mixed')
    
    # Drop rows with invalid timestamps
    df = df.dropna(subset=['Start_Time'])
    
    # Feature engineering for telematics-relevant features
    df['hour'] = df['Start_Time'].dt.hour
    df['day_of_week'] = df['Start_Time'].dt.dayofweek
    df['month'] = df['Start_Time'].dt.month
    
    # Weather impact scoring
    weather_mapping = {
        'Clear': 0, 'Fair': 0, 'Partly Cloudy': 1, 'Mostly Cloudy': 1,
        'Overcast': 2, 'Light Rain': 3, 'Rain': 4, 'Heavy Rain': 5,
        'Light Snow': 4, 'Snow': 5, 'Heavy Snow': 6, 'Fog': 3,
        'Thunderstorm': 5, 'Light Drizzle': 2, 'Drizzle': 3
    }
    df['weather_risk'] = df['Weather_Condition'].map(weather_mapping).fillna(2)
    
    # Severity mapping (target variable) - 0: Low, 1: Medium, 2: High
    df['risk_level'] = df['Severity'].map({1: 0, 2: 0, 3: 1, 4: 2})
    
    # Select and clean features
    feature_columns = [
        'Distance(mi)', 'Temperature(F)', 'Wind_Speed(mph)', 'Visibility(mi)',
        'hour', 'day_of_week', 'month', 'weather_risk'
    ]
    
    # Clean data - fill missing values
    df['Distance(mi)'] = df['Distance(mi)'].fillna(df['Distance(mi)'].median())
    df['Temperature(F)'] = df['Temperature(F)'].fillna(df['Temperature(F)'].median())
    df['Wind_Speed(mph)'] = df['Wind_Speed(mph)'].fillna(df['Wind_Speed(mph)'].median())
    df['Visibility(mi)'] = df['Visibility(mi)'].fillna(10)  # Default good visibility
    
    # Remove rows with missing target
    df = df.dropna(subset=['risk_level'])
    
    # Handle outliers - cap extreme values
    df['Distance(mi)'] = df['Distance(mi)'].clip(0, 50)  # Max 50 miles
    df['Temperature(F)'] = df['Temperature(F)'].clip(-50, 150)  # Reasonable temp range
    df['Wind_Speed(mph)'] = df['Wind_Speed(mph)'].clip(0, 100)  # Max 100 mph wind
    df['Visibility(mi)'] = df['Visibility(mi)'].clip(0, 10)  # Max 10 miles visibility
    
    X = df[feature_columns]
    y = df['risk_level']
    
    print(f"Dataset shape: {X.shape}")
    print(f"Target distribution: {y.value_counts().to_dict()}")
    
    return X, y

def train_hybrid_model():
    print("Loading and preparing data...")
    X, y = load_and_prepare_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced',  # Handle imbalanced data
        n_jobs=-1  # Use all CPU cores
    )
    rf_model.fit(X_train_scaled, y_train)
    
    print("Training Gradient Boosting model...")
    gb_model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    )
    gb_model.fit(X_train_scaled, y_train)
    
    # Evaluate models
    rf_pred = rf_model.predict(X_test_scaled)
    gb_pred = gb_model.predict(X_test_scaled)
    
    rf_acc = accuracy_score(y_test, rf_pred)
    gb_acc = accuracy_score(y_test, gb_pred)
    
    print(f"Random Forest Accuracy: {rf_acc:.3f}")
    print(f"Gradient Boosting Accuracy: {gb_acc:.3f}")
    
    # Choose best model
    best_model = gb_model if gb_acc > rf_acc else rf_model
    model_name = "GradientBoosting" if gb_acc > rf_acc else "RandomForest"
    
    print(f"Selected model: {model_name}")
    print("\nClassification Report:")
    best_pred = gb_pred if gb_acc > rf_acc else rf_pred
    print(classification_report(y_test, best_pred))
    
    # Save model and scaler
    import os
    os.makedirs('ml_models', exist_ok=True)
    
    joblib.dump(best_model, 'ml_models/risk_model.pkl')
    joblib.dump(scaler, 'ml_models/scaler.pkl')
    
    # Save feature names
    feature_names = X.columns.tolist()
    joblib.dump(feature_names, 'ml_models/feature_names.pkl')
    
    # Save model metadata
    metadata = {
        'model_type': model_name,
        'accuracy': gb_acc if gb_acc > rf_acc else rf_acc,
        'features': feature_names,
        'target_classes': ['Low Risk', 'Medium Risk', 'High Risk'],
        'training_samples': len(X_train)
    }
    joblib.dump(metadata, 'ml_models/metadata.pkl')
    
    print("Model training completed and saved!")
    return best_model, scaler, feature_names

if __name__ == "__main__":
    try:
        model, scaler, features = train_hybrid_model()
        print("✅ Training successful!")
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
