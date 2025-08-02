import numpy as np
from sklearn.decomposition import NMF, TruncatedSVD
from sklearn.impute import SimpleImputer
from typing import Tuple, Optional

class MatrixFactorizationRecommender:
    def __init__(self, n_components: int = 50, method: str = 'nmf', random_state: int = 42):
        self.n_components = n_components
        self.method = method.lower()
        self.random_state = random_state
        self.model = None
        self.temp_imputer = None
        self.user_mean = None
        self.is_fitted = False
    
    def fit(self, X: np.ndarray) -> 'MatrixFactorizationRecommender':
        """Fit matrix factorization model"""
        print(f"Fitting Matrix Factorization ({self.method.upper()}) with {self.n_components} components...")
        
        # Mean imputation for initial matrix completion
        self.temp_imputer = SimpleImputer(strategy='mean')
        X_filled = self.temp_imputer.fit_transform(X)
        
        # Center the data (subtract user means)
        self.user_mean = np.nanmean(X, axis=1, keepdims=True)
        X_centered = X_filled - np.nanmean(X_filled, axis=1, keepdims=True)
        
        # Step 3: Ensure non-negative for NMF
        if self.method == 'nmf':
            # Shift to make all values positive for NMF
            min_val = np.min(X_centered)
            if min_val < 0:
                X_centered = X_centered - min_val + 0.1
            
            self.model = NMF(
                n_components=self.n_components,
                random_state=self.random_state,
                max_iter=500
            )
        else:  # SVD
            self.model = TruncatedSVD(
                n_components=self.n_components,
                random_state=self.random_state
            )
        
        # Fit the model
        self.model.fit(X_centered)
        
        self.is_fitted = True
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict missing values using matrix factorization"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Fill missing values temporarily
        X_filled = self.temp_imputer.transform(X)
        
        # Center the data
        X_centered = X_filled - np.nanmean(X_filled, axis=1, keepdims=True)
        
        # Handle NMF non-negativity
        if self.method == 'nmf':
            min_val = np.min(X_centered)
            if min_val < 0:
                X_centered = X_centered - min_val + 0.1
        
        # Transform and reconstruct
        X_transformed = self.model.transform(X_centered)
        X_reconstructed = X_transformed @ self.model.components_
        
        # Add back the user means
        X_pred = X_reconstructed + np.nanmean(X_filled, axis=1, keepdims=True)
        
        # Only replace missing values in original matrix
        mask = np.isnan(X)
        X_result = X.copy()
        X_result[mask] = X_pred[mask]
        
        # Round and clip to valid rating range
        X_result = np.round(X_result)
        X_result = np.clip(X_result, 1, 5)
        
        return X_result
    
    def get_model_info(self) -> dict:
        """Get model information"""
        info = {
            'name': f'Matrix Factorization ({self.method.upper()})',
            'n_components': self.n_components,
            'method': self.method
        }
        
        if hasattr(self.model, 'reconstruction_err_'):
            info['reconstruction_error'] = self.model.reconstruction_err_
        
        return info
