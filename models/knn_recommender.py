import numpy as np
from sklearn.impute import KNNImputer
from typing import Tuple, Optional

class KNNRecommender:
    def __init__(self, n_neighbors: int = 30, weights: str = 'uniform'):
        self.n_neighbors = n_neighbors
        self.weights = weights
        self.imputer = None
        self.is_fitted = False
    
    def fit(self, X: np.ndarray) -> 'KNNRecommender':
        """Fit KNN-based recommender"""
        print(f"Fitting KNN Recommender with {self.n_neighbors} neighbors...")
        
        self.imputer = KNNImputer(
            n_neighbors=self.n_neighbors,
            weights=self.weights
        )
        
        # Fit the imputer
        self.imputer.fit(X)
        
        self.is_fitted = True
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict missing values using KNN imputation"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_pred = self.imputer.transform(X)
        
        # Round to nearest valid rating and clip
        X_pred = np.round(X_pred)
        X_pred = np.clip(X_pred, 1, 5)
        
        return X_pred
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            'name': 'KNN Imputation Recommender',
            'n_neighbors': self.n_neighbors,
            'weights': self.weights
        }

class KNNCollaborativeRecommender(KNNRecommender):
    """KNN Recommender using transpose for item-based collaborative filtering"""
    
    def fit(self, X: np.ndarray) -> 'KNNCollaborativeRecommender':
        """Fit using transpose for item-based recommendations"""
        print(f"Fitting Item-based KNN Recommender with {self.n_neighbors} neighbors...")
        
        self.imputer = KNNImputer(
            n_neighbors=self.n_neighbors,
            weights=self.weights
        )
        
        # Fit on transposed data for item-based filtering
        self.imputer.fit(X.T)
        
        self.is_fitted = True
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict using item-based collaborative filtering"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Transform transposed data and transpose back
        X_pred = self.imputer.transform(X.T).T
        
        # Round and clip
        X_pred = np.round(X_pred)
        X_pred = np.clip(X_pred, 1, 5)
        
        return X_pred
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            'name': 'Item-based KNN Collaborative Recommender',
            'n_neighbors': self.n_neighbors,
            'weights': self.weights
        }
