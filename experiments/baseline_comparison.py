import numpy as np
import pandas as pd
from utils.data_loader import data_loader
from utils.evaluation import evaluator
from models.em_recommender import EMRecommender
from models.knn_recommender import KNNRecommender, KNNCollaborativeRecommender
from models.matrix_factorization import MatrixFactorizationRecommender
import time


def run_baseline_comparison():
    """Run comprehensive comparison of all recommendation algorithms"""
    
    print("Loading Netflix dataset...")
    X_incomplete, X_complete = data_loader.load_netflix_data()
    
    print(f"Dataset shape: {X_incomplete.shape}")
    print(f"Missing values: {np.isnan(X_incomplete).sum() / X_incomplete.size * 100:.1f}%")
    
    # Initialize models
    models = {
        'Mean Imputation': MeanImputationBaseline(),
        'EM Clustering': EMRecommender(n_components=10),
        'KNN User-based': KNNRecommender(n_neighbors=30),
        'KNN Item-based': KNNCollaborativeRecommender(n_neighbors=30),
        'Matrix Factorization': MatrixFactorizationRecommender(n_components=50)
    }
    
    results = []
    
    for name, model in models.items():
        print(f"\n{'='*50}")
        print(f"Evaluating: {name}")
        print(f"{'='*50}")
        
        start_time = time.time()
        
        try:
            # Fit and predict
            model.fit(X_incomplete)
            X_pred = model.predict(X_incomplete)
            
            # Evaluate
            metrics = evaluator.evaluate_model(X_complete, X_pred, name)
            
            # Add timing and model info
            metrics['training_time'] = time.time() - start_time
            metrics.update(model.get_model_info())
            
            results.append(metrics)
            
            print(f"RMSE: {metrics['rmse']:.4f}")
            print(f"MAE: {metrics['mae']:.4f}")
            print(f"R² Score: {metrics['r2_score']:.4f}")
            print(f"Training Time: {metrics['training_time']:.2f}s")
            
        except Exception as e:
            print(f"Error with {name}: {str(e)}")
            continue
    
    # Create comparison dataframe
    df_results = pd.DataFrame(results)
    df_results = df_results.sort_values('rmse')
    
    print(f"\n{'='*80}")
    print("FINAL COMPARISON RESULTS")
    print(f"{'='*80}")
    print(df_results[['model_name', 'rmse', 'mae', 'r2_score', 'training_time']].to_string(index=False))
    
    # Save results
    evaluator.save_results('baseline_comparison.json')
    df_results.to_csv('results/baseline_comparison.csv', index=False)
    
    return df_results

class MeanImputationBaseline:
    """Simple baseline using mean imputation"""
    
    def __init__(self):
        self.global_mean = None
        self.feature_means = None
        self.is_fitted = False
    
    def fit(self, X: np.ndarray):
        self.global_mean = np.nanmean(X)
        self.feature_means = np.
