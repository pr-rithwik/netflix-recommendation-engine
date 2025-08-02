import numpy as np
from sklearn.mixture import GaussianMixture
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional


class EMRecommender:
    def __init__(self, n_components: int = 10, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state
        self.gmm = None
        self.scaler = None
        self.temp_imputer = None
        self.cluster_means = None
        self.is_fitted = False
    
    def fit(self, X: np.ndarray) -> 'EMRecommender':
        """Fit EM-based recommender"""
        print(f"Fitting EM Recommender with {self.n_components} components...")
        
        # Temporary imputation for clustering
        self.temp_imputer = SimpleImputer(strategy='most_frequent')
        X_temp = self.temp_imputer.fit_transform(X)
        
        # Scale data
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X_temp)
        
        # Fit Gaussian Mixture Model
        self.gmm = GaussianMixture(
            n_components=self.n_components,
            random_state=self.random_state,
            covariance_type='diag'
        )
        cluster_labels = self.gmm.fit_predict(X_scaled)
        
        # Compute cluster-wise means for imputation
        self._compute_cluster_means(X, cluster_labels)
        
        self.is_fitted = True
        return self
    
    def _compute_cluster_means(self, X: np.ndarray, cluster_labels: np.ndarray):
        """Compute mean ratings for each cluster and feature"""
        n_features = X.shape[1]
        self.cluster_means = {}
        
        for cluster_id in range(self.n_components):
            cluster_mask = cluster_labels == cluster_id
            cluster_data = X[cluster_mask]
            
            # Compute mean for each feature in this cluster
            feature_means = []
            for feature_idx in range(n_features):
                feature_values = cluster_data[:, feature_idx]
                valid_values = feature_values[~np.isnan(feature_values)]
                
                if len(valid_values) > 0:
                    mean_val = np.mean(valid_values)
                else:
                    # Fallback to global mean
                    global_values = X[:, feature_idx]
                    mean_val = np.nanmean(global_values)
                
                feature_means.append(mean_val)
            
            self.cluster_means[cluster_id] = np.array(feature_means)
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict missing values using cluster-based imputation"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_pred = X.copy()
        
        # Get cluster assignments for each user
        X_temp = self.temp_imputer.transform(X)
        X_scaled = self.scaler.transform(X_temp)
        cluster_probs = self.gmm.predict_proba(X_scaled)
        cluster_labels = self.gmm.predict(X_scaled)
        
        # Impute missing values using cluster means
        for i in range(X.shape[0]):
            cluster_id = cluster_labels[i]
            user_ratings = X_pred[i]
            missing_mask = np.isnan(user_ratings)
            
            if np.any(missing_mask):
                # Use cluster mean for missing values
                cluster_mean = self.cluster_means[cluster_id]
                X_pred[i, missing_mask] = cluster_mean[missing_mask]
                
                # Round to nearest valid rating
                X_pred[i, missing_mask] = np.round(X_pred[i, missing_mask])
                X_pred[i, missing_mask] = np.clip(X_pred[i, missing_mask], 1, 5)
        
        return X_pred
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            'name': 'EM Clustering Recommender',
            'n_components': self.n_components,
            'converged': self.gmm.converged_ if self.gmm else False,
            'n_iter': self.gmm.n_iter_ if self.gmm else 0
        }
