import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from typing import Dict, List, Tuple
import json
import os
from config import RESULTS_PATH


class ModelEvaluator:
    def __init__(self):
        self.metrics_history = []
    
    def evaluate_model(self, y_true: np.ndarray, y_pred: np.ndarray, 
                      model_name: str) -> Dict[str, float]:
        """Evaluate model performance using multiple metrics"""
        
        # Flatten arrays and remove NaN values
        mask = ~(np.isnan(y_true) | np.isnan(y_pred))
        y_true_clean = y_true[mask]
        y_pred_clean = y_pred[mask]
        
        metrics = {
            'model_name': model_name,
            'rmse': np.sqrt(mean_squared_error(y_true_clean, y_pred_clean)),
            'mae': mean_absolute_error(y_true_clean, y_pred_clean),
            'r2_score': r2_score(y_true_clean, y_pred_clean),
            'n_predictions': len(y_true_clean)
        }
        
        self.metrics_history.append(metrics)
        return metrics
    
    def compare_models(self, results: List[Dict]) -> pd.DataFrame:
        """Compare multiple models"""
        df = pd.DataFrame(results)
        df = df.round(4)
        return df.sort_values('rmse')
    
    def save_results(self, filename: str = 'model_performance.json'):
        """Save evaluation results"""
        os.makedirs(RESULTS_PATH, exist_ok=True)
        filepath = os.path.join(RESULTS_PATH, filename)
        
        with open(filepath, 'w') as f:
            json.dump(self.metrics_history, f, indent=2)
    
    def load_results(self, filename: str = 'model_performance.json') -> List[Dict]:
        """Load previous results"""
        filepath = os.path.join(RESULTS_PATH, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        return []

evaluator = ModelEvaluator()
