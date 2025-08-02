import numpy as np
import pandas as pd
from utils.data_loader import data_loader
from utils.evaluation import evaluator
from models.em_recommender import EMRecommender
from models.knn_recommender import KNNRecommender, KNNCollaborativeRecommender
from models.matrix_factorization import MatrixFactorizationRecommender
import time
import os

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
        'Matrix Factorization (NMF)': MatrixFactorizationRecommender(n_components=50, method='nmf'),
        'Matrix Factorization (SVD)': MatrixFactorizationRecommender(n_components=50, method='svd')
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
            
            # Get model info safely
            try:
                model_info = model.get_model_info()
                metrics.update(model_info)
            except:
                pass
            
            results.append(metrics)
            
            print(f"RMSE: {metrics['rmse']:.4f}")
            print(f"MAE: {metrics['mae']:.4f}")
            print(f"R² Score: {metrics['r2_score']:.4f}")
            print(f"Training Time: {metrics['training_time']:.2f}s")
            
        except Exception as e:
            print(f"❌ Error with {name}: {str(e)}")
            # Add failed result to track what didn't work
            results.append({
                'model_name': name,
                'rmse': float('inf'),
                'mae': float('inf'),
                'r2_score': -float('inf'),
                'training_time': 0,
                'error': str(e)
            })
            continue
    
    # Create comparison dataframe
    df_results = pd.DataFrame(results)
    
    # Remove failed models for ranking
    df_success = df_results[df_results['rmse'] != float('inf')]
    
    if len(df_success) > 0:
        df_success = df_success.sort_values('rmse')
        
        print(f"\n{'='*80}")
        print("FINAL COMPARISON RESULTS")
        print(f"{'='*80}")
        print(df_success[['model_name', 'rmse', 'mae', 'r2_score', 'training_time']].to_string(index=False))
        
        # Save results
        os.makedirs('results', exist_ok=True)
        evaluator.save_results('baseline_comparison.json')
        df_results.to_csv('results/baseline_comparison.csv', index=False)
        
        print(f"\n💾 Results saved to:")
        print(f"  - results/baseline_comparison.csv")
        print(f"  - results/baseline_comparison.json")
        
        return df_success
    else:
        print("❌ All models failed!")
        return pd.DataFrame()

class MeanImputationBaseline:
    """Simple baseline using mean imputation"""
    
    def __init__(self):
        self.global_mean = None
        self.feature_means = None
        self.is_fitted = False
    
    def fit(self, X: np.ndarray):
        """Fit the baseline model"""
        print("Fitting Mean Imputation Baseline...")
        self.global_mean = np.nanmean(X)
        self.feature_means = np.nanmean(X, axis=0)
        
        # Handle any NaN means (features with no ratings)
        self.feature_means = np.where(np.isnan(self.feature_means), 
                                    self.global_mean, 
                                    self.feature_means)
        
        self.is_fitted = True
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict missing values using feature means"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
            
        X_pred = X.copy()
        
        # Fill missing values with feature means
        for i in range(X.shape[1]):
            missing_mask = np.isnan(X_pred[:, i])
            if np.any(missing_mask):
                X_pred[missing_mask, i] = self.feature_means[i]
        
        # Fill any remaining NaNs with global mean
        X_pred = np.where(np.isnan(X_pred), self.global_mean, X_pred)
        
        # Round and clip to valid rating range
        X_pred = np.round(X_pred)
        X_pred = np.clip(X_pred, 1, 5)
        
        return X_pred
    
    def get_model_info(self):
        """Get model information"""
        return {
            'name': 'Mean Imputation Baseline',
            'global_mean': self.global_mean,
            'method': 'feature_mean_imputation'
        }

def run_quick_test():
    """Run a quick test on small dataset to verify everything works"""
    print("🧪 Running quick test on small dataset...")
    
    try:
        # Load test data
        X_test_incomplete, X_test_complete = data_loader.load_test_data()
        
        # Test just the baseline
        baseline = MeanImputationBaseline()
        baseline.fit(X_test_incomplete)
        X_pred = baseline.predict(X_test_incomplete)
        
        metrics = evaluator.evaluate_model(X_test_complete, X_pred, "Test_Baseline")
        
        print(f"✅ Quick test passed!")
        print(f"   Test RMSE: {metrics['rmse']:.4f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Quick test failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Can be run standalone for testing
    print("🚀 Running Baseline Comparison")
    
    # Quick test first
    if not run_quick_test():
        print("❌ Quick test failed. Check your setup.")
        exit(1)
    
    # Full comparison
    results = run_baseline_comparison()
    
    if len(results) > 0:
        print(f"\n🏆 Best performing model:")
        best_model = results.iloc[0]
        print(f"   {best_model['model_name']}: RMSE={best_model['rmse']:.4f}")
    else:
        print("❌ No successful results to report.")
