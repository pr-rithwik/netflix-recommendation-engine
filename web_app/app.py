from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import json
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_loader import data_loader
from models.em_recommender import EMRecommender
from models.knn_recommender import KNNRecommender, KNNCollaborativeRecommender
from models.matrix_factorization import MatrixFactorizationRecommender
from experiments.baseline_comparison import MeanImputationBaseline

app = Flask(__name__)
app.config['SECRET_KEY'] = 'netflix-recommender-secret-key'

# Global variables for loaded models
models = {}
X_incomplete = None
X_complete = None
is_initialized = False

def initialize_models():
    """Initialize and train all models"""
    global models, X_incomplete, X_complete, is_initialized
    
    if is_initialized:
        return True
    
    try:
        print("Loading data and training models...")
        X_incomplete, X_complete = data_loader.load_netflix_data()
        
        # Initialize models with smaller parameters for web responsiveness
        models = {
            'mean': MeanImputationBaseline().fit(X_incomplete),
            'em': EMRecommender(n_components=8).fit(X_incomplete),
            'knn_user': KNNRecommender(n_neighbors=20).fit(X_incomplete),
            'knn_item': KNNCollaborativeRecommender(n_neighbors=20).fit(X_incomplete),
            'matrix_nmf': MatrixFactorizationRecommender(n_components=30, method='nmf').fit(X_incomplete)
        }
        
        is_initialized = True
        print("✅ Models initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Model initialization failed: {str(e)}")
        return False

# ================================
# MAIN PAGE ROUTES
# ================================

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/rate')
def rate_movies():
    """Movie rating interface"""
    if not initialize_models():
        return "Error: Could not initialize models", 500
    
    # Get random movies for rating
    movies = data_loader.get_random_movies(20)
    return render_template('rate_movies.html', movies=movies)

@app.route('/comparison')
def algorithm_comparison():
    """Algorithm comparison page"""
    return render_template('comparison.html')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html')

# ================================
# RECOMMENDATION API ROUTES
# ================================

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """Get personalized recommendations"""
    if not initialize_models():
        return jsonify({'error': 'Models not initialized'}), 500
    
    try:
        data = request.get_json()
        user_ratings = data.get('ratings', {})
        algorithm = data.get('algorithm', 'em')
        
        if not user_ratings:
            return jsonify({'error': 'No ratings provided'}), 400
        
        # Validate algorithm
        model = models.get(algorithm)
        if not model:
            return jsonify({'error': f'Unknown algorithm: {algorithm}'}), 400
        
        # Validate ratings
        for movie_id, rating in user_ratings.items():
            try:
                movie_id = int(movie_id)
                rating = float(rating)
                if not (1 <= rating <= 5):
                    return jsonify({'error': 'Rating must be between 1 and 5'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid movie ID or rating format'}), 400
        
        # Create user vector
        user_vector = np.full(X_incomplete.shape[1], np.nan)
        for movie_id, rating in user_ratings.items():
            user_vector[int(movie_id)] = float(rating)
        
        # Predict for this user
        user_matrix = user_vector.reshape(1, -1)
        predictions = model.predict(user_matrix)[0]
        
        # Get top recommendations (movies user hasn't rated)
        unrated_indices = np.where(np.isnan(user_vector))[0]
        unrated_predictions = predictions[unrated_indices]
        
        # Sort by predicted rating
        top_indices = unrated_indices[np.argsort(unrated_predictions)[-10:]][::-1]
        
        recommendations = []
        for idx in top_indices:
            movie_info = data_loader.get_movie_info(idx)
            recommendations.append({
                'movie_id': int(idx),
                'title': movie_info['title'],
                'genre': movie_info['genre'],
                'year': movie_info['year'],
                'predicted_rating': float(predictions[idx])
            })
        
        return jsonify({
            'recommendations': recommendations,
            'algorithm': algorithm,
            'total_ratings': len(user_ratings)
        })
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/random_movies')
def random_movies():
    """Get random movies for rating interface"""
    try:
        count = request.args.get('count', 10, type=int)
        count = min(count, 50)  # Limit to prevent abuse
        
        movies = data_loader.get_random_movies(count)
        return jsonify(movies)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# COMPARISON API ROUTES
# ================================

@app.route('/api/compare', methods=['POST'])
def compare_algorithms():
    """Compare recommendations across different algorithms - DEBUG VERSION"""
    print("🔍 Compare algorithms called")
    
    if not initialize_models():
        print("❌ Models not initialized")
        return jsonify({'error': 'Models not initialized'}), 500
    
    try:
        data = request.get_json()
        print(f"📥 Received data: {data}")
        
        user_ratings = data.get('ratings', {})
        print(f"👤 User ratings: {user_ratings}")
        print(f"📊 Number of ratings: {len(user_ratings)}")
        
        if not user_ratings:
            print("❌ No ratings provided")
            return jsonify({'error': 'No ratings provided'}), 400
        
        print(f"✅ Available models: {list(models.keys())}")
        print(f"📊 Data shape: {X_incomplete.shape}")
        
        # Create user vector
        print("🔧 Creating user vector...")
        user_vector = np.full(X_incomplete.shape[1], np.nan)
        for movie_id, rating in user_ratings.items():
            try:
                idx = int(movie_id)
                val = float(rating)
                user_vector[idx] = val
                print(f"  Set movie {idx} = {val}")
            except Exception as e:
                print(f"❌ Error setting rating {movie_id}={rating}: {e}")
                return jsonify({'error': f'Invalid rating: {movie_id}={rating}'}), 400
        
        user_matrix = user_vector.reshape(1, -1)
        unrated_indices = np.where(np.isnan(user_vector))[0]
        print(f"📊 Unrated movies: {len(unrated_indices)}")
        
        comparison_results = {}
        
        # Test each model one by one
        for algo_name, model in models.items():
            print(f"🧪 Testing {algo_name}...")
            
            try:
                # Test prediction
                predictions = model.predict(user_matrix)[0]
                print(f"  ✅ {algo_name}: predictions shape {predictions.shape}")
                
                # Get top unrated predictions
                if len(unrated_indices) == 0:
                    print(f"  ⚠️ {algo_name}: No unrated movies")
                    comparison_results[algo_name] = []
                    continue
                
                unrated_predictions = predictions[unrated_indices]
                top_indices = unrated_indices[np.argsort(unrated_predictions)[-5:]][::-1]
                
                algo_recommendations = []
                for idx in top_indices:
                    try:
                        movie_info = data_loader.get_movie_info(idx)
                        algo_recommendations.append({
                            'movie_id': int(idx),
                            'title': movie_info['title'],
                            'predicted_rating': float(predictions[idx])
                        })
                    except Exception as e:
                        print(f"  ⚠️ Error getting movie {idx}: {e}")
                        continue
                
                comparison_results[algo_name] = algo_recommendations
                print(f"  ✅ {algo_name}: {len(algo_recommendations)} recommendations")
                
            except Exception as e:
                print(f"  ❌ {algo_name} failed: {str(e)}")
                import traceback
                traceback.print_exc()
                comparison_results[algo_name] = {'error': str(e)}
        
        print(f"🎯 Returning results for {len(comparison_results)} algorithms")
        return jsonify(comparison_results)
        
    except Exception as e:
        print(f"❌ Compare API error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/algorithm_info')
def get_algorithm_info():
    """Get information about available algorithms"""
    try:
        algorithm_descriptions = {
            'mean': {
                'name': 'Mean Imputation Baseline',
                'description': 'Simple baseline using feature-wise mean imputation',
                'type': 'Statistical'
            },
            'em': {
                'name': 'EM Clustering',
                'description': 'Expectation-Maximization clustering with Gaussian mixtures',
                'type': 'Machine Learning'
            },
            'knn_user': {
                'name': 'KNN User-based',
                'description': 'K-Nearest Neighbors user-based collaborative filtering',
                'type': 'Collaborative Filtering'
            },
            'knn_item': {
                'name': 'KNN Item-based',
                'description': 'K-Nearest Neighbors item-based collaborative filtering',
                'type': 'Collaborative Filtering'
            },
            'matrix_nmf': {
                'name': 'Matrix Factorization (NMF)',
                'description': 'Matrix factorization using Non-negative Matrix Factorization',
                'type': 'Matrix Factorization'
            }
        }
        
        # Add model-specific info if available
        result = {}
        for algo, info in algorithm_descriptions.items():
            result[algo] = info.copy()
            if algo in models and hasattr(models[algo], 'get_model_info'):
                try:
                    model_info = models[algo].get_model_info()
                    result[algo].update(model_info)
                except:
                    pass
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# PERFORMANCE API ROUTES
# ================================

@app.route('/api/performance')
def get_performance_metrics():
    """Get model performance metrics from Phase 1"""
    try:
        # Try to load from CSV first
        csv_path = '../results/baseline_comparison.csv'
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            return jsonify(df.to_dict('records'))
        
        # Fallback to JSON
        json_path = '../results/baseline_comparison.json'
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                data = json.load(f)
            return jsonify(data)
        
        return jsonify({'error': 'No performance data available'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance/summary')
def get_performance_summary():
    """Get summarized performance metrics"""
    try:
        # Load metrics
        csv_path = '../results/baseline_comparison.csv'
        if not os.path.exists(csv_path):
            return jsonify({'error': 'No performance data available'}), 404
        
        df = pd.read_csv(csv_path)
        
        # Filter out failed models
        df = df[df['rmse'] != float('inf')]
        
        if len(df) == 0:
            return jsonify({'error': 'No successful model results'}), 404
        
        summary = {
            'best_rmse': {
                'model': df.loc[df['rmse'].idxmin(), 'model_name'],
                'value': float(df['rmse'].min())
            },
            'best_mae': {
                'model': df.loc[df['mae'].idxmin(), 'model_name'],
                'value': float(df['mae'].min())
            },
            'best_r2': {
                'model': df.loc[df['r2_score'].idxmax(), 'model_name'],
                'value': float(df['r2_score'].max())
            },
            'fastest': {
                'model': df.loc[df['training_time'].idxmin(), 'model_name'],
                'value': float(df['training_time'].min())
            },
            'total_models': len(df),
            'avg_rmse': float(df['rmse'].mean()),
            'avg_training_time': float(df['training_time'].mean())
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': f'Error processing metrics: {str(e)}'}), 500

# ================================
# UTILITY ROUTES
# ================================

@app.route('/api/status')
def get_status():
    """Get application status"""
    return jsonify({
        'status': 'running',
        'models_initialized': is_initialized,
        'available_algorithms': list(models.keys()) if is_initialized else [],
        'dataset_shape': X_incomplete.shape if is_initialized else None
    })

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ================================
# MAIN ENTRY POINT
# ================================

if __name__ == '__main__':
    print("🚀 Starting Netflix Recommendation Engine Web App")
    print("Initializing models... (this may take a moment)")
    
    if initialize_models():
        print("✅ Ready! Starting web server...")
        print("📊 Available algorithms:", list(models.keys()))
        print("📍 Dataset shape:", X_incomplete.shape)
        print("🌐 Access the app at: http://localhost:5000")
        
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to initialize. Please check your data files and run Phase 1 first.")
        print("💡 Make sure you have:")
        print("   - data/netflix_incomplete.txt")
        print("   - data/netflix_complete.txt") 
        print("   - All Phase 1 dependencies installed")
