import numpy as np 
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score
import pickle
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class WaterSafetyPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.hmpi_metals = ['arsenic', 'lead', 'cadmium', 'chromium', 'mercury', 'nickel', 'copper', 'zinc', 'iron', 'manganese']
        
        # BIS standard limits (µg/L) - Corrected values
        self.standard_limits_ugL = {
            'arsenic': 10.0,    # µg/L
            'lead': 10.0,       # µg/L
            'cadmium': 3.0,     # µg/L
            'chromium': 50.0,   # µg/L
            'mercury': 1.0,     # µg/L
            'nickel': 20.0,     # µg/L
            'copper': 2000.0,   # µg/L
            'zinc': 5000.0,     # µg/L
            'iron': 300.0,      # µg/L
            'manganese': 100.0  # µg/L
        }
        
        # Convert to mg/L (divide by 1000)
        self.standard_limits_mgL = {
            metal: limit / 1000.0 for metal, limit in self.standard_limits_ugL.items()
        }
        
        # Add weights for HMPI calculation
        self.weights_ugL = {
            metal: 1.0 / limit if limit > 0 else 0.0 
            for metal, limit in self.standard_limits_ugL.items()
        }
        
        self.weights_mgL = {
            metal: 1.0 / limit if limit > 0 else 0.0 
            for metal, limit in self.standard_limits_mgL.items()
        }
    
    def generate_sample_data(self, n_samples=1000):
        """Generate sample data for training the model"""
        np.random.seed(42)
        
        # Generate synthetic water quality data
        data = {}
        for metal in self.hmpi_metals:
            # Generate realistic concentrations (mostly low with some outliers)
            base_conc = np.random.lognormal(mean=-2, sigma=2, size=n_samples)
            # Add some high contamination samples
            high_contam = np.random.uniform(10, 100, size=n_samples//10)
            indices = np.random.choice(n_samples, size=n_samples//10, replace=False)
            base_conc[indices] = high_contam
            data[metal] = base_conc
        
        geo_dataset = pd.DataFrame(data)
        
        # Generate target labels based on contamination levels
        total_contamination = np.sum([geo_dataset[metal] / self.standard_limits_ugL[metal] 
                                    for metal in self.hmpi_metals], axis=0)
        
        # Create pollution categories
        y = np.where(total_contamination < 1, 'Safe',
                    np.where(total_contamination < 3, 'Moderate', 'Critical'))
        
        return geo_dataset, y
    
    def train_model(self, X, y):
        """Train the XGBoost classification model"""
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost model
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        return accuracy
    
    def predict_pollution(self, input_data):
        """
        Predict pollution level and return probabilities
        This method is called from main.py
        """
        # If model is not trained, return safe default
        if self.model is None:
            print("Model not trained - returning safe default")
            return "Safe", {"Safe": 1.0, "Moderate": 0.0, "Critical": 0.0}
        
        try:
            print(f"Raw ML input data: {input_data}")
            print(f"Input data type: {type(input_data)}")
            print(f"Input data length: {len(input_data)}")
            
            # Ensure input_data is a list of floats
            processed_input = []
            for i, value in enumerate(input_data):
                try:
                    # Convert to float, default to 0.0 if conversion fails
                    if isinstance(value, (int, float)):
                        float_value = float(value)
                    elif isinstance(value, str):
                        # Handle string values - check if it's a classification label
                        if value.lower() in ['safe', 'moderate', 'critical']:
                            print(f"Warning: Found classification label '{value}' at position {i}, using 0.0")
                            float_value = 0.0
                        else:
                            float_value = float(value)
                    else:
                        float_value = 0.0
                    processed_input.append(float_value)
                except (ValueError, TypeError) as e:
                    print(f"Error converting value {value} at position {i} to float: {e}")
                    processed_input.append(0.0)
            
            print(f"Processed ML input: {processed_input}")
            
            # Convert to numpy array and reshape
            input_array = np.array(processed_input).reshape(1, -1)
            print(f"Input array shape: {input_array.shape}")
            
            # Scale the input if scaler is fitted
            if hasattr(self.scaler, 'mean_') and self.scaler.mean_ is not None:
                try:
                    input_scaled = self.scaler.transform(input_array)
                    print("Input scaled successfully")
                except Exception as e:
                    print(f"Scaling error: {e}, using unscaled input")
                    input_scaled = input_array
            else:
                input_scaled = input_array
                print("Using unscaled input (scaler not fitted)")
            
            # Make prediction
            prediction = self.model.predict(input_scaled)[0]
            print(f"Raw prediction: {prediction}")
            
            # Get prediction label
            if hasattr(self.label_encoder, 'classes_') and len(self.label_encoder.classes_) > 0:
                try:
                    prediction_label = self.label_encoder.inverse_transform([prediction])[0]
                    print(f"Prediction label: {prediction_label}")
                except Exception as e:
                    print(f"Label inverse transform error: {e}, using fallback")
                    prediction_label = "Safe" if prediction == 0 else "Moderate" if prediction == 1 else "Critical"
            else:
                # Fallback if label encoder not available
                prediction_label = "Safe" if prediction == 0 else "Moderate" if prediction == 1 else "Critical"
                print(f"Fallback prediction label: {prediction_label}")
            
            # Get probabilities if available
            if hasattr(self.model, 'predict_proba'):
                try:
                    probabilities = self.model.predict_proba(input_scaled)[0]
                    prob_dict = {}
                    if hasattr(self.label_encoder, 'classes_'):
                        for i, label in enumerate(self.label_encoder.classes_):
                            prob_dict[label] = float(probabilities[i])
                    else:
                        # Fallback probabilities
                        prob_dict = {"Safe": 0.8, "Moderate": 0.15, "Critical": 0.05}
                    print(f"Probabilities: {prob_dict}")
                except Exception as e:
                    print(f"Probability prediction error: {e}, using default probabilities")
                    prob_dict = {label: 0.0 for label in ["Safe", "Moderate", "Critical"]}
                    prob_dict[prediction_label] = 1.0
            else:
                # Default probabilities if predict_proba not available
                prob_dict = {label: 0.0 for label in ["Safe", "Moderate", "Critical"]}
                prob_dict[prediction_label] = 1.0
                print(f"Default probabilities: {prob_dict}")
            
            return prediction_label, prob_dict
            
        except Exception as e:
            print(f"Prediction error: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            
            # Return safe default prediction
            return "Safe", {"Safe": 1.0, "Moderate": 0.0, "Critical": 0.0}

    def calculate_contamination_factors(self, sample_data, standard_limits):
        """Calculate Contamination Factor (CF) for each metal - FIXED"""
        cf_dict = {}
        for metal in self.hmpi_metals:
            if metal in sample_data and sample_data[metal] is not None:
                try:
                    concentration = float(sample_data[metal])
                    standard = standard_limits.get(metal, 1.0)
                    
                    if standard > 0 and concentration >= 0:
                        cf_dict[metal] = concentration / standard
                    else:
                        cf_dict[metal] = 0.0
                except (ValueError, TypeError):
                    cf_dict[metal] = 0.0
            else:
                cf_dict[metal] = 0.0
        
        return cf_dict
    
    def calculate_pollution_load_index(self, cf_dict):
        """Calculate Pollution Load Index (PLI) - CORRECTED"""
        if not cf_dict:
            return 0.0
        
        # PLI = nth root of (CF1 * CF2 * ... * CFn)
        valid_cfs = [cf for cf in cf_dict.values() if cf > 0]
        
        if not valid_cfs:
            return 0.0
        
        product = 1.0
        for cf in valid_cfs:
            product *= max(cf, 0.001)  # Avoid zero values
        
        pli = product ** (1.0 / len(valid_cfs))
        return round(pli, 2)
    
    def calculate_hmpi(self, sample_data):
        """Calculate Heavy Metal Pollution Index - CORRECTED FORMULA"""
        # Convert to µg/L for calculation
        unit_detected = self.detect_unit(sample_data)
        sample_data_ugL = self.convert_to_ugL(sample_data, unit_detected)
        
        total_weighted_qi = 0.0
        total_weights = 0.0
        contributions = {}
        available_metals = []
        
        # Find available metals with valid data
        for metal in self.hmpi_metals:
            if (metal in sample_data_ugL and sample_data_ugL[metal] is not None):
                try:
                    concentration = float(sample_data_ugL[metal])
                    if concentration >= 0:
                        available_metals.append(metal)
                except (ValueError, TypeError):
                    continue
        
        if not available_metals:
            return 0.0, {}, unit_detected
        
        # Calculate HMPI: Σ(Wi × Qi) / ΣWi
        for metal in available_metals:
            try:
                concentration = float(sample_data_ugL[metal])
                standard = self.standard_limits_ugL.get(metal, 1.0)
                weight = 1.0 / standard if standard > 0 else 0.0
                
                # Qi = (Ci / Si) × 100
                if standard > 0:
                    qi = (concentration / standard) * 100.0
                else:
                    qi = 0.0
                
                weighted_qi = qi * weight
                total_weighted_qi += weighted_qi
                total_weights += weight
                
                contributions[metal] = {
                    'concentration': concentration,
                    'standard_limit': standard,
                    'qi_value': round(qi, 2),
                    'weight': round(weight, 6),
                    'contribution': round(weighted_qi, 2)
                }
            except (ValueError, TypeError, ZeroDivisionError):
                continue
        
        hmpi = total_weighted_qi / total_weights if total_weights > 0 else 0.0
        return round(hmpi, 2), contributions, unit_detected
    
    def interpret_pli(self, pli):
        """Interpret Pollution Load Index - CORRECTED"""
        if pli == 0:
            return "No data", "Insufficient data for calculation"
        elif pli < 1.0:
            return "Low", "Baseline level - suitable for drinking"
        elif 1.0 <= pli < 2.0:
            return "Moderate", "Moderate level of contamination"
        elif 2.0 <= pli < 5.0:
            return "High", "Significant contamination"
        else:
            return "Very High", "High level of contamination"
    
    def interpret_cf(self, cf):
        """Interpret Contamination Factor - CORRECTED"""
        if cf == 0:
            return "No data", "No concentration data"
        elif cf < 1.0:
            return "Low", "Within acceptable limits"
        elif 1.0 <= cf < 3.0:
            return "Moderate", "Moderate contamination"
        elif 3.0 <= cf < 6.0:
            return "Considerable", "Considerable contamination"
        else:
            return "Very High", "Very high contamination"
    
    def get_pollution_level(self, hmpi):
        """Determine pollution level based on HMPI - CORRECTED"""
        if hmpi == 0:
            return "No data", "Insufficient data for assessment"
        elif hmpi < 100:
            return "Safe", "Suitable for drinking purposes"
        elif 100 <= hmpi < 200:
            return "Moderate", "Requires treatment before consumption"
        else:
            return "Critical", "Not suitable for drinking"
    
    def calculate_comprehensive_indices(self, sample_data):
        """Calculate all pollution indices - FIXED MAIN FUNCTION"""
        try:
            # Detect unit and convert to µg/L
            unit_detected = self.detect_unit(sample_data)
            sample_data_ugL = self.convert_to_ugL(sample_data, unit_detected)
            
            # Calculate HMPI
            hmpi, contributions, _ = self.calculate_hmpi(sample_data)
            
            # Calculate contamination factors
            cf_dict = self.calculate_contamination_factors(sample_data_ugL, self.standard_limits_ugL)
            
            # Calculate PLI
            pli = self.calculate_pollution_load_index(cf_dict)
            
            # Calculate total CF
            total_cf = sum(cf_dict.values())
            
            # Interpret results
            hmpi_level, hmpi_recommendation = self.get_pollution_level(hmpi)
            pli_level, pli_description = self.interpret_pli(pli)
            
            # Interpret individual contamination factors
            cf_interpretations = {}
            for metal, cf_value in cf_dict.items():
                cf_level, cf_description = self.interpret_cf(cf_value)
                cf_interpretations[metal] = {
                    'cf_value': round(cf_value, 3),
                    'level': cf_level,
                    'description': cf_description
                }
            
            return {
                'hmpi': {
                    'score': hmpi,
                    'level': hmpi_level,
                    'recommendation': hmpi_recommendation,
                    'interpretation': f"HMPI value: {hmpi} ({hmpi_level})"
                },
                'pli': {
                    'score': pli,
                    'level': pli_level,
                    'description': pli_description
                },
                'total_cf': {
                    'score': round(total_cf, 2),
                    'level': self.interpret_cf(total_cf)[0],
                    'description': self.interpret_cf(total_cf)[1]
                },
                'contamination_factors': cf_interpretations,
                'unit_detected': unit_detected,
                'contributions': contributions
            }
            
        except Exception as e:
            print(f"Error in comprehensive indices calculation: {e}")
            # Return safe default values
            return {
                'hmpi': {'score': 0, 'level': 'No data', 'recommendation': 'Error in calculation'},
                'pli': {'score': 0, 'level': 'No data', 'description': 'Error in calculation'},
                'total_cf': {'score': 0, 'level': 'No data', 'description': 'Error in calculation'},
                'contamination_factors': {},
                'unit_detected': 'mg/L',
                'contributions': {}
            }

    def detect_unit(self, sample_data):
        """Auto-detect unit based on concentration values"""
        metal_values = []
        for metal in self.hmpi_metals:
            if metal in sample_data and sample_data[metal] is not None:
                try:
                    value = float(sample_data[metal])
                    if value > 0:
                        metal_values.append(value)
                except (ValueError, TypeError):
                    continue
        
        if not metal_values:
            return "µg/L"  # Default assumption
        
        median_conc = np.median(metal_values)
        
        # Improved detection logic
        if median_conc < 0.01:
            return "mg/L"
        elif median_conc < 1.0:
            low_count = sum(1 for val in metal_values if val < 0.1)
            return "mg/L" if low_count >= len(metal_values) * 0.6 else "µg/L"
        else:
            return "µg/L"

    def convert_to_ugL(self, sample_data, current_unit):
        """Convert sample data to µg/L"""
        converted_data = {}
        for key, value in sample_data.items():
            if key in self.hmpi_metals and value is not None:
                try:
                    num_value = float(value)
                    if current_unit == "mg/L":
                        converted_data[key] = num_value * 1000.0
                    else:
                        converted_data[key] = num_value
                except (ValueError, TypeError):
                    converted_data[key] = 0.0
            else:
                converted_data[key] = value
        return converted_data
    
    def interpret_hmpi(self, hmpi):
        """Interpret HMPI value"""
        if hmpi == 0:
            return "No data available"
        elif hmpi < 100:
            return "Low pollution level - water is safe"
        elif 100 <= hmpi < 200:
            return "Moderate pollution level - caution advised"
        else:
            return "High pollution level - immediate action required"
    
    def save_model(self, filepath):
        """Save the trained model to a pickle file"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'hmpi_metals': self.hmpi_metals,
            'standard_limits_ugL': self.standard_limits_ugL,
            'standard_limits_mgL': self.standard_limits_mgL,
            'weights_ugL': self.weights_ugL,
            'weights_mgL': self.weights_mgL
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
    
    @classmethod
    def load_model(cls, filepath):
        """Load a trained model from pickle file"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            predictor = cls()
            predictor.model = model_data['model']
            predictor.scaler = model_data['scaler']
            predictor.label_encoder = model_data['label_encoder']
            predictor.hmpi_metals = model_data['hmpi_metals']
            predictor.standard_limits_ugL = model_data['standard_limits_ugL']
            predictor.standard_limits_mgL = model_data['standard_limits_mgL']
            predictor.weights_ugL = model_data['weights_ugL']
            predictor.weights_mgL = model_data['weights_mgL']
            
            return predictor
        except Exception as e:
            print(f"Error loading model: {e}")
            # Return a new instance if loading fails
            return cls()

# Train and save the model
def train_and_save_model():
    predictor = WaterSafetyPredictor()
    geo_dataset, y = predictor.generate_sample_data()
    X = geo_dataset[predictor.hmpi_metals]
    accuracy = predictor.train_model(X, y)
    print(f"Model trained with accuracy: {accuracy:.2f}")
    
    predictor.save_model('water_quality_model.pkl')
    print("Model saved as 'water_quality_model.pkl'")

if __name__ == "__main__":
    train_and_save_model()