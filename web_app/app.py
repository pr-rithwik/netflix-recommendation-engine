from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import json
import os
import sys
import time

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_loader import data_loader
from models.em_recommender import EMRecommender
from models.knn_recommender import KNNRecommender, KNNCollaborativeRecommender
from models.matrix_factorization import MatrixFactorizationRecommender
from experiments.baseline_comparison import MeanImputationBaseline

app = Flask(__name__)
app.config['SECRET_KEY'] = 'algorithm-demonstrator-secret-key'

# Global variables for loaded models
models = {}
X_incomplete = None
X_complete = None
is_initialized = False
performance_data = None

def initialize_models():
    """Initialize and train all models for algorithm comparison"""
    global models, X_incomplete, X_complete, is_initialized
    
    if is_initialized:
        return True
    
    try:
        print("🔧 Loading data and training models for algorithm demonstration...")
        X_incomplete, X_complete = data_loader.load_netflix_data()
        
        # Initialize models with parameters optimized for demonstration
        models = {
            'mean_imputation': MeanImputationBaseline().fit(X_incomplete),
            'em_clustering': EMRecommender(n_components=10).fit(X_incomplete),
            'knn_user_based': KNNRecommender(n_neighbors=30).fit(X_incomplete),
            'knn_item_based': KNNCollaborativeRecommender(n_neighbors=30).fit(X_incomplete),
            'matrix_nmf': MatrixFactorizationRecommender(n_components=50, method='nmf').fit(X_incomplete),
            'matrix_svd': MatrixFactorizationRecommender(n_components=50, method='svd').fit(X_incomplete)
        }
        
        is_initialized = True
        print("✅ Algorithm demonstrator models initialized successfully!")
        print(f"📊 Dataset: {X_incomplete.shape} with {np.count_nonzero(~np.isnan(X_incomplete))} observed ratings")
        return True
        
    except Exception as e:
        print(f"❌ Model initialization failed: {str(e)}")
        return False

def load_performance_data():
    """Load performance metrics from Phase 1 results"""
    global performance_data
    
    try:
        # Try JSON first
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'results', 'baseline_comparison.json')
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                performance_data = json.load(f)
                return True
        
        # Fallback to CSV
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'results', 'baseline_comparison.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            performance_data = df.to_dict('records')
            return True
            
        print("⚠️ No performance data found. Some features may be limited.")
        return False
        
    except Exception as e:
        print(f"❌ Error loading performance data: {e}")
        return False

# ================================
# MAIN PAGE ROUTES
# ================================

@app.route('/')
def index():
    """Home page - Algorithm Performance Demonstrator"""
    return render_template('index.html')

@app.route('/demonstrator')
def algorithm_demonstrator():
    """Main algorithm demonstration interface"""
    if not initialize_models():
        return "Error: Could not initialize algorithm models", 500
    
    return render_template('demonstrator.html', 
                         algorithms=get_algorithm_info(),
                         dataset_info=get_dataset_info())

@app.route('/about')
def about():
    """About page - Project information"""
    return render_template('about.html')

@app.route('/performance')
def performance_metrics():
    """Performance comparison page"""
    load_performance_data()
    return render_template('performance.html', performance_data=performance_data)

# ================================
# ALGORITHM COMPARISON API
# ================================

@app.route('/api/compare_algorithms', methods=['POST'])
def compare_algorithms():
    """Compare predictions across all algorithms for given user ratings"""
    if not initialize_models():
        return jsonify({'error': 'Algorithm models not initialized'}), 500
    
    try:
        data = request.get_json()
        user_ratings = data.get('ratings', {})
        
        if not user_ratings:
            return jsonify({'error': 'No ratings provided'}), 400
        
        # Validate ratings format
        for item_id, rating in user_ratings.items():
            try:
                item_id = int(item_id)
                rating = float(rating)
                if not (1 <= rating <= 5):
                    return jsonify({'error': f'Rating must be between 1 and 5, got {rating}'}), 400
                if not (0 <= item_id < X_incomplete.shape[1]):
                    return jsonify({'error': f'Item ID {item_id} out of range'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid rating format'}), 400
        
        # Create user vector
        user_vector = np.full(X_incomplete.shape[1], np.nan)
        for item_id, rating in user_ratings.items():
            user_vector[int(item_id)] = float(rating)
        
        user_matrix = user_vector.reshape(1, -1)
        unrated_indices = np.where(np.isnan(user_vector))[0]
        
        # Get predictions from all algorithms
        algorithm_results = {}
        
        for algo_name, model in models.items():
            try:
                start_time = time.time()
                predictions = model.predict(user_matrix)[0]
                prediction_time = time.time() - start_time
                
                # Get top 5 predictions for unrated items
                if len(unrated_indices) > 0:
                    unrated_predictions = predictions[unrated_indices]
                    top_indices = unrated_indices[np.argsort(unrated_predictions)[-5:]][::-1]
                    
                    top_predictions = []
                    for idx in top_indices:
                        top_predictions.append({
                            'item_id': int(idx),
                            'item_name': f'Item_{idx:03d}',
                            'predicted_rating': float(predictions[idx])
                        })
                else:
                    top_predictions = []
                
                algorithm_results[algo_name] = {
                    'name': get_algorithm_display_name(algo_name),
                    'predictions': top_predictions,
                    'prediction_time': prediction_time,
                    'status': 'success'
                }
                
            except Exception as e:
                algorithm_results[algo_name] = {
                    'name': get_algorithm_display_name(algo_name),
                    'predictions': [],
                    'prediction_time': 0,
                    'status': 'error',
                    'error': str(e)
                }
        
        return jsonify({
            'comparisons': algorithm_results,
            'input_ratings': len(user_ratings),
            'total_items': X_incomplete.shape[1]
        })
        
    except Exception as e:
        return jsonify({'error': f'Comparison failed: {str(e)}'}), 500

@app.route('/api/single_algorithm', methods=['POST'])
def single_algorithm_prediction():
    """Get predictions from a single algorithm"""
    if not initialize_models():
        return jsonify({'error': 'Models not initialized'}), 500
    
    try:
        data = request.get_json()
        user_ratings = data.get('ratings', {})
        algorithm = data.get('algorithm', 'knn_item_based')
        
        if algorithm not in models:
            return jsonify({'error': f'Unknown algorithm: {algorithm}'}), 400
        
        if not user_ratings:
            return jsonify({'error': 'No ratings provided'}), 400
        
        # Create user vector and predict
        user_vector = np.full(X_incomplete.shape[1], np.nan)
        for item_id, rating in user_ratings.items():
            user_vector[int(item_id)] = float(rating)
        
        model = models[algorithm]
        predictions = model.predict(user_vector.reshape(1, -1))[0]
        
        # Get top 10 predictions for unrated items
        unrated_indices = np.where(np.isnan(user_vector))[0]
        unrated_predictions = predictions[unrated_indices]
        top_indices = unrated_indices[np.argsort(unrated_predictions)[-10:]][::-1]
        
        recommendations = []
        for idx in top_indices:
            recommendations.append({
                'item_id': int(idx),
                'item_name': f'Item_{idx:03d}',
                'predicted_rating': float(predictions[idx])
            })
        
        return jsonify({
            'algorithm': get_algorithm_display_name(algorithm),
            'recommendations': recommendations,
            'input_ratings': len(user_ratings)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# DATASET AND INFO APIs
# ================================

@app.route('/api/random_items')
def random_items():
    """Get random items for rating interface"""
    try:
        count = request.args.get('count', 15, type=int)
        count = min(count, 50)  # Limit to prevent abuse
        
        if not is_initialized:
            return jsonify({'error': 'Models not initialized'}), 500
        
        # Generate random item IDs
        item_ids = np.random.choice(X_incomplete.shape[1], size=count, replace=False)
        
        items = []
        for item_id in item_ids:
            items.append({
                'item_id': int(item_id),
                'item_name': f'Item_{item_id:03d}',
                'description': f'Dataset item {item_id}'
            })
        
        return jsonify(items)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance_data')
def get_performance_data():
    """Get algorithm performance metrics from Phase 1"""
    try:
        if not load_performance_data():
            return jsonify({'error': 'No performance data available'}), 404
        
        return jsonify(performance_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dataset_info')
def get_dataset_info():
    """Get information about the dataset"""
    if not is_initialized:
        if not initialize_models():
            return jsonify({'error': 'Cannot load dataset info'}), 500
    
    total_possible = X_incomplete.shape[0] * X_incomplete.shape[1]
    observed_ratings = np.count_nonzero(~np.isnan(X_incomplete))
    sparsity = (1 - observed_ratings / total_possible) * 100
    
    return jsonify({
        'users': int(X_incomplete.shape[0]),
        'items': int(X_incomplete.shape[1]),
        'total_possible_ratings': int(total_possible),
        'observed_ratings': int(observed_ratings),
        'sparsity_percent': float(sparsity),
        'rating_scale': '1-5 stars'
    })

@app.route('/api/algorithm_info')
def get_algorithm_info():
    """Get information about available algorithms"""
    return jsonify({
        'mean_imputation': {
            'name': 'Mean Imputation Baseline',
            'description': 'Fills missing ratings with feature-wise mean',
            'type': 'Statistical Baseline',
            'best_for': 'Establishing baseline performance'
        },
        'em_clustering': {
            'name': 'EM Clustering',
            'description': 'Gaussian Mixture Model with cluster-based imputation',
            'type': 'Clustering-based',
            'best_for': 'Discovering user segments'
        },
        'knn_user_based': {
            'name': 'KNN User-based',
            'description': 'Collaborative filtering using user similarity',
            'type': 'Memory-based CF',
            'best_for': 'Finding similar users'
        },
        'knn_item_based': {
            'name': 'KNN Item-based',
            'description': 'Collaborative filtering using item similarity',
            'type': 'Memory-based CF',
            'best_for': 'Finding similar items'
        },
        'matrix_nmf': {
            'name': 'Matrix Factorization (NMF)',
            'description': 'Non-negative Matrix Factorization',
            'type': 'Matrix Factorization',
            'best_for': 'Latent factor discovery'
        },
        'matrix_svd': {
            'name': 'Matrix Factorization (SVD)',
            'description': 'Singular Value Decomposition',
            'type': 'Matrix Factorization',
            'best_for': 'Dimensionality reduction'
        }
    })

# ================================
# UTILITY FUNCTIONS
# ================================

def get_algorithm_display_name(algo_key):
    """Convert algorithm key to display name"""
    names = {
        'mean_imputation': 'Mean Imputation',
        'em_clustering': 'EM Clustering',
        'knn_user_based': 'KNN User-based',
        'knn_item_based': 'KNN Item-based',
        'matrix_nmf': 'Matrix Factorization (NMF)',
        'matrix_svd': 'Matrix Factorization (SVD)'
    }
    return names.get(algo_key, algo_key)

def get_dataset_info():
    """Get dataset information for templates"""
    if not is_initialized:
        return None
    
    total_possible = X_incomplete.shape[0] * X_incomplete.shape[1]
    observed_ratings = np.count_nonzero(~np.isnan(X_incomplete))
    
    return {
        'users': X_incomplete.shape[0],
        'items': X_incomplete.shape[1],
        'observed_ratings': observed_ratings,
        'total_possible': total_possible,
        'sparsity': round((1 - observed_ratings / total_possible) * 100, 2)
    }

# ================================
# STATUS AND ERROR HANDLING
# ================================

@app.route('/api/status')
def get_status():
    """Get application status"""
    return jsonify({
        'status': 'running',
        'models_initialized': is_initialized,
        'available_algorithms': list(models.keys()) if is_initialized else [],
        'dataset_loaded': X_incomplete is not None,
        'performance_data_loaded': performance_data is not None
    })

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ================================
# MAIN ENTRY POINT
# ================================

if __name__ == '__main__':
    print("🚀 Starting Algorithm Performance Demonstrator")
    print("📊 Initializing models for algorithm comparison...")
    
    if initialize_models():
        load_performance_data()
        print("✅ Ready! Starting web server...")
        print("📈 Available algorithms:", list(models.keys()))
        print("📊 Dataset shape:", X_incomplete.shape)
        print("🌐 Access the demonstrator at: http://localhost:5000")
        
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to initialize. Please check your data files and dependencies.")
        print("💡 Make sure you have:")
        print("   - data/netflix_incomplete.txt")
        print("   - data/netflix_complete.txt") 
        print("   - All required Python packages installed")