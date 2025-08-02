import numpy as np
import pandas as pd
from typing import Tuple, Dict
import os
from config import *


class DataLoader:
    def __init__(self):
        self.movie_mapping = self._create_movie_mapping()
    
    def load_netflix_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Load Netflix incomplete and complete datasets"""
        incomplete_path = os.path.join(DATA_PATH, "netflix_incomplete.txt")
        complete_path = os.path.join(DATA_PATH, "netflix_complete.txt")
        
        # Load data
        X_incomplete = np.loadtxt(incomplete_path)
        X_complete = np.loadtxt(complete_path)
        
        # Replace 0s with NaN for missing values
        X_incomplete = np.where(X_incomplete == 0, np.nan, X_incomplete)
        
        return X_incomplete, X_complete
    
    def load_test_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Load small test datasets"""
        incomplete_path = os.path.join(DATA_PATH, "test_incomplete.txt")
        complete_path = os.path.join(DATA_PATH, "test_complete.txt")
        
        X_incomplete = np.loadtxt(incomplete_path)
        X_complete = np.loadtxt(complete_path)
        
        X_incomplete = np.where(X_incomplete == 0, np.nan, X_incomplete)
        
        return X_incomplete, X_complete
    
    def _create_movie_mapping(self) -> Dict[int, Dict]:
        """Create synthetic movie names and metadata"""
        movie_db = {}
        
        for i in range(N_MOVIES):
            genre_idx = i // MOVIES_PER_GENRE
            if genre_idx >= len(GENRES):
                genre_idx = len(GENRES) - 1
                
            genre = GENRES[genre_idx]
            movie_num = (i % MOVIES_PER_GENRE) + 1
            year = 2000 + (i % 25)  # Movies from 2000-2024
            
            movie_db[i] = {
                'title': f"{genre} Movie {movie_num:03d}",
                'genre': genre,
                'year': year,
                'feature_id': i
            }
        
        return movie_db
    
    def get_movie_info(self, movie_id: int) -> Dict:
        """Get movie information by ID"""
        return self.movie_mapping.get(movie_id, {
            'title': f'Unknown Movie {movie_id}',
            'genre': 'Unknown',
            'year': 2020,
            'feature_id': movie_id
        })
    
    def get_random_movies(self, n: int = 20) -> list:
        """Get random movies for rating interface"""
        movie_ids = np.random.choice(N_MOVIES, n, replace=False)
        return [self.get_movie_info(mid) for mid in movie_ids]

# Global data loader instance
data_loader = DataLoader()
