import os
import sys
import numpy as np
import pandas as pd

def setup_environment():
    """Setup directories and check data files"""
    print("🔧 Setting up environment...")
    
    directories = ['results', 'results/evaluation_plots', 'results/experiment_logs']
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Created directory: {directory}")
    
    # Check data files
    required_files = [
        'data/netflix_incomplete.txt',
        'data/netflix_complete.txt',
        'data/test_incomplete.txt', 
        'data/test_complete.txt'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required data files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\nPlease add the missing data files and run again.")
        return False
    
    print("✓ All required data files found")
    return True

def run_data_exploration():
    """Run data exploration analysis"""
    print("\n" + "="*50)
    print("PHASE 1.1: DATA EXPLORATION")
    print("="*50)
    
    try:
        from utils.data_loader import data_loader
        from utils.visualization import visualizer
        
        # Load and explore data
        print("Loading Netflix dataset...")
        X_incomplete, X_complete = data_loader.load_netflix_data()
        
        print(f"Dataset shape: {X_incomplete.shape}")
        print(f"Complete ratings: {(~np.isnan(X_incomplete)).sum():,}")
        print(f"Missing ratings: {np.isnan(X_incomplete).sum():,}")
        print(f"Sparsity: {np.isnan(X_incomplete).sum() / X_incomplete.size * 100:.2f}%")
        
        # Rating distribution
        valid_ratings = X_complete[~np.isnan(X_complete)]
        print(f"\nRating distribution:")
        for rating in range(1, 6):
            count = np.sum(valid_ratings == rating)
            pct = count / len(valid_ratings) * 100
            print(f"  {rating} stars: {count:6d} ({pct:5.1f}%)")
        
        # Sample movies
        print(f"\nSample synthetic movie mapping:")
        sample_movies = data_loader.get_random_movies(5)
        for movie in sample_movies:
            print(f"  Feature {movie['feature_id']:3d}: {movie['title']} ({movie['genre']}, {movie['year']})")
        
        # Generate visualizations
        print(f"\nGenerating visualizations...")
        try:
            visualizer.plot_rating_distribution(X_complete, 
                                              'results/evaluation_plots/rating_distribution.png')
            visualizer.plot_sparsity_analysis(X_incomplete,
                                            'results/evaluation_plots/sparsity_analysis.png')
            print("✓ Visualizations saved to results/evaluation_plots/")
        except Exception as e:
            print(f"⚠️  Visualization error (non-critical): {str(e)}")
        
        print("✅ Data exploration completed!")
        return X_incomplete, X_complete
        
    except Exception as e:
        print(f"❌ Data exploration failed: {str(e)}")
        return None, None

def run_algorithm_testing():
    """Test all algorithms on small dataset first"""
    print("\n" + "="*50)
    print("PHASE 1.2: ALGORITHM TESTING")
    print("="*50)
    
    try:
        from utils.data_loader import data_loader
        from utils.evaluation import evaluator
        from models.em_recommender import EMRecommender
        from models.knn_recommender import KNNRecommender
        
        # Test on small dataset first
        print("Testing algorithms on small test dataset...")
        X_test_incomplete, X_test_complete = data_loader.load_test_data()
        print(f"Test dataset shape: {X_test_incomplete.shape}")
        
        models = {
            'EM Clustering': EMRecommender(n_components=3),
            'KNN Imputation': KNNRecommender(n_neighbors=5)
        }
        
        test_results = []
        
        for name, model in models.items():
            print(f"\nTesting {name}...")
            try:
                model.fit(X_test_incomplete)
                X_pred = model.predict(X_test_incomplete)
                metrics = evaluator.evaluate_model(X_test_complete, X_pred, f"{name}_test")
                
                print(f"  RMSE: {metrics['rmse']:.4f}")
                print(f"  MAE: {metrics['mae']:.4f}")
                print(f"  R² Score: {metrics['r2_score']:.4f}")
                print(f"  ✓ {name} working correctly")
                
                test_results.append(metrics)
                
            except Exception as e:
                print(f"  ❌ Error with {name}: {str(e)}")
        
        if len(test_results) > 0:
            print("✅ Algorithm testing completed successfully!")
        else:
            print("❌ All algorithm tests failed!")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Algorithm testing failed: {str(e)}")
        return False

def run_full_comparison():
    """Run full algorithm comparison"""
    print("\n" + "="*50)
    print("PHASE 1.3: FULL ALGORITHM COMPARISON")
    print("="*50)
    
    try:
        from experiments.baseline_comparison import run_baseline_comparison
        
        print("Running comprehensive algorithm comparison...")
        print("⚠️  This may take several minutes depending on your system...")
        
        results = run_baseline_comparison()
        
        print("\n✅ Full comparison completed successfully!")
        
        # Display summary
        if len(results) > 0:
            print(f"\n🏆 TOP 3 PERFORMING MODELS:")
            top_models = results.head(3)
            for idx, row in top_models.iterrows():
                print(f"  {idx+1}. {row['model_name']}")
                print(f"     RMSE: {row['rmse']:.4f} | MAE: {row['mae']:.4f} | R²: {row['r2_score']:.4f}")
        
        return results
            
    except Exception as e:
        print(f"❌ Error in full comparison: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def print_results_summary():
    """Print summary of all results"""
    print("\n" + "="*60)
    print("📊 RESULTS SUMMARY")
    print("="*60)
    
    # Check if results exist
    results_files = [
        'results/baseline_comparison.csv',
        'results/baseline_comparison.json',
        'results/evaluation_plots/rating_distribution.png',
        'results/evaluation_plots/sparsity_analysis.png'
    ]
    
    print("Generated files:")
    for file_path in results_files:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"  ✓ {file_path} ({file_size:,} bytes)")
        else:
            print(f"  ❌ {file_path} (missing)")
    
    # Load and display CSV results if available
    csv_path = 'results/baseline_comparison.csv'
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
            print(f"\n📈 ALGORITHM PERFORMANCE RANKING:")
            print(df[['model_name', 'rmse', 'mae', 'r2_score']].to_string(index=False))
        except Exception as e:
            print(f"Could not load results CSV: {str(e)}")

def main():
    """Main execution function"""
    print("🚀 STARTING PHASE 1 IMPLEMENTATION")
    print("Netflix Recommendation Engine - Algorithm Development")
    print("="*60)
    
    # Setup
    if not setup_environment():
        print("❌ Environment setup failed. Please add required data files.")
        return 1
    
    try:
        # Step 1: Data Exploration
        X_incomplete, X_complete = run_data_exploration()
        if X_incomplete is None:
            print("❌ Data exploration failed. Cannot continue.")
            return 1
        
        # Step 2: Algorithm Testing
        if not run_algorithm_testing():
            print("❌ Algorithm testing failed. Cannot continue.")
            return 1
        
        # Step 3: Full Comparison
        results = run_full_comparison()
        if results is None:
            print("❌ Full comparison failed.")
            return 1
        
        # Step 4: Results Summary
        print_results_summary()
        
        print("\n" + "="*60)
        print("🎉 PHASE 1 COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user.")
        return 1
    except Exception as e:
        print(f"\n❌ Phase 1 failed with unexpected error: {str(e)}")
        print("Please check error messages above and fix any issues.")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
