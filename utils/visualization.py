import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from typing import List, Dict
import os
from config import RESULTS_PATH

class ResultsVisualizer:
    def __init__(self):
        self.figsize = (12, 8)
        self.style = 'whitegrid'
        sns.set_style(self.style)
        
    def plot_model_comparison(self, results_df: pd.DataFrame, save_path: str = None):
        """Create comprehensive model comparison plots"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Model Performance Comparison', fontsize=16, fontweight='bold')
        
        # RMSE comparison
        axes[0, 0].bar(results_df['model_name'], results_df['rmse'], color='lightcoral')
        axes[0, 0].set_title('Root Mean Square Error (Lower is Better)')
        axes[0, 0].set_ylabel('RMSE')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # MAE comparison
        axes[0, 1].bar(results_df['model_name'], results_df['mae'], color='lightblue')
        axes[0, 1].set_title('Mean Absolute Error (Lower is Better)')
        axes[0, 1].set_ylabel('MAE')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # R² Score comparison
        axes[1, 0].bar(results_df['model_name'], results_df['r2_score'], color='lightgreen')
        axes[1, 0].set_title('R² Score (Higher is Better)')
        axes[1, 0].set_ylabel('R² Score')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Training time comparison
        if 'training_time' in results_df.columns:
            axes[1, 1].bar(results_df['model_name'], results_df['training_time'], color='orange')
            axes[1, 1].set_title('Training Time (Seconds)')
            axes[1, 1].set_ylabel('Time (s)')
            axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to: {save_path}")
        
        # plt.show()
        return fig
    
    def plot_rating_distribution(self, X_complete: np.ndarray, save_path: str = None):
        """Plot distribution of ratings in the dataset"""
        plt.figure(figsize=(10, 6))
        
        # Get all valid ratings
        valid_ratings = X_complete[~np.isnan(X_complete)]
        
        # Create histogram
        counts, bins, patches = plt.hist(valid_ratings, bins=np.arange(0.5, 6.5, 1), 
                                       alpha=0.7, color='skyblue', edgecolor='black')
        
        # Add percentage labels on bars
        total = len(valid_ratings)
        for i, (count, patch) in enumerate(zip(counts, patches)):
            percentage = count / total * 100
            plt.text(patch.get_x() + patch.get_width()/2, patch.get_height() + total*0.01,
                    f'{percentage:.1f}%', ha='center', va='bottom', fontweight='bold')
        
        plt.title('Distribution of Movie Ratings in Dataset', fontsize=14, fontweight='bold')
        plt.xlabel('Rating (Stars)')
        plt.ylabel('Count')
        plt.xticks(range(1, 6))
        plt.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to: {save_path}")
        
        # plt.show()
    
    def plot_sparsity_analysis(self, X_incomplete: np.ndarray, save_path: str = None):
        """Analyze and plot data sparsity patterns"""
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # User sparsity (how many movies each user rated)
        user_ratings_count = (~np.isnan(X_incomplete)).sum(axis=1)
        axes[0].hist(user_ratings_count, bins=30, alpha=0.7, color='lightcoral')
        axes[0].set_title('Number of Movies Rated per User')
        axes[0].set_xlabel('Number of Ratings')
        axes[0].set_ylabel('Number of Users')
        axes[0].axvline(user_ratings_count.mean(), color='red', linestyle='--', 
                       label=f'Mean: {user_ratings_count.mean():.1f}')
        axes[0].legend()
        
        # Movie sparsity (how many users rated each movie)
        movie_ratings_count = (~np.isnan(X_incomplete)).sum(axis=0)
        axes[1].hist(movie_ratings_count, bins=30, alpha=0.7, color='lightblue')
        axes[1].set_title('Number of Users who Rated each Movie')
        axes[1].set_xlabel('Number of Ratings')
        axes[1].set_ylabel('Number of Movies')
        axes[1].axvline(movie_ratings_count.mean(), color='blue', linestyle='--',
                       label=f'Mean: {movie_ratings_count.mean():.1f}')
        axes[1].legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to: {save_path}")
        
        # plt.show()
        
        # Print summary statistics
        total_possible = X_incomplete.shape[0] * X_incomplete.shape[1]
        total_observed = (~np.isnan(X_incomplete)).sum()
        sparsity = (1 - total_observed / total_possible) * 100
        
        print(f"\nSparsity Analysis:")
        print(f"Total possible ratings: {total_possible:,}")
        print(f"Observed ratings: {total_observed:,}")
        print(f"Sparsity: {sparsity:.2f}%")
        print(f"Average ratings per user: {user_ratings_count.mean():.1f}")
        print(f"Average ratings per movie: {movie_ratings_count.mean():.1f}")

visualizer = ResultsVisualizer()
