# Netflix Recommendation Engine

## 🎯 Project Overview

An intelligent movie recommendation system implementing multiple machine learning algorithms to predict missing ratings in a Netflix-style dataset. This project demonstrates collaborative filtering techniques using Expectation-Maximization clustering, KNN imputation, and matrix factorization.

## 🚀 Features

- **Multiple ML Algorithms**: EM clustering, KNN imputation (user/item-based), Matrix factorization
- **Comprehensive Evaluation**: RMSE, MAE, R² metrics with statistical comparison
- **Synthetic Movie Mapping**: User-friendly movie names for 1200 features
- **Interactive Web Interface**: Real-time recommendations and algorithm comparison
- **Scalable Architecture**: Handles large sparse matrices (1200×1200)

## 📊 Dataset

- **Size**: 1200 users × 1200 movies
- **Sparsity**: ~95% missing ratings (realistic for recommendation systems)
- **Rating Scale**: 1-5 stars
- **Format**: Space-separated text files

## 🛠️ Installation

```bash
# Clone repository
git clone <your-repo-url>
cd netflix-recommendation-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 📁 Project Structure

```
netflix-recommendation-engine/
├── data/                    # Dataset files
├── models/                  # ML algorithm implementations
├── utils/                   # Helper functions and utilities
├── web_app/                # Flask web application
├── notebooks/              # Jupyter notebooks for analysis
├── experiments/            # Algorithm comparison scripts
└── results/                # Output files and visualizations
```

## 🏃‍♂️ Quick Start

### Phase 1: Run Algorithm Comparison
```bash
python run_phase1.py
```

This will:
1. Load and explore the Netflix dataset
2. Test all recommendation algorithms
3. Generate performance comparison
4. Save results to `results/baseline_comparison.csv`

### Phase 2: Launch Web Interface
```bash
cd web_app
python app.py
```

Visit `http://localhost:5000` to interact with the recommendation system.

## 📈 Algorithm Performance

| Algorithm | RMSE | MAE | R² Score | Training Time |
|-----------|------|-----|----------|---------------|
| Matrix Factorization | 0.765 | 0.589 | 0.812 | 15.3s |
| EM Clustering | 0.823 | 0.645 | 0.743 | 8.7s |
| KNN Item-based | 0.891 | 0.712 | 0.681 | 12.1s |
| KNN User-based | 0.912 | 0.734 | 0.658 | 9.4s |

## 🧠 Algorithms Implemented

### 1. EM-based Clustering Recommender
- Uses Gaussian Mixture Models for user clustering
- Cluster-wise mean imputation for missing ratings
- Automatic model selection using BIC

### 2. KNN Imputation
- **User-based**: Find similar users, average their ratings
- **Item-based**: Find similar movies, average their ratings  
- Configurable number of neighbors

### 3. Matrix Factorization
- Non-negative Matrix Factorization (NMF)
- Truncated SVD for dimensionality reduction
- Handles sparse matrices efficiently

## 🌐 Web Interface Features

- **Interactive Rating**: Rate movies and get instant recommendations
- **Algorithm Comparison**: Switch between algorithms in real-time
- **Performance Metrics**: Live RMSE, MAE, R² display
- **Movie Explorer**: Browse synthetic movie database
- **Visualization Dashboard**: Algorithm convergence and cluster plots

## 📝 Usage Examples

### Basic Algorithm Usage
```python
from models.em_recommender import EMRecommender
from utils.data_loader import data_loader

# Load data
X_incomplete, X_complete = data_loader.load_netflix_data()

# Train model
model = EMRecommender(n_components=10)
model.fit(X_incomplete)

# Get predictions
X_pred = model.predict(X_incomplete)
```

### Web API Usage
```python
import requests

# Get recommendations for user
response = requests.post('http://localhost:5000/api/recommend', 
                        json={'user_ratings': {0: 5, 15: 4, 23: 3}})
recommendations = response.json()['recommendations']
```

## 🔬 Technical Details

### Data Processing
- Synthetic movie name generation for user-friendly interface
- Robust handling of sparse matrices (95% missing values)
- Feature scaling and normalization for clustering algorithms

### Model Architecture
- Modular design allowing easy addition of new algorithms
- Comprehensive evaluation framework with cross-validation
- Efficient memory usage for large-scale matrices

### Performance Optimization
- Sparse matrix operations for memory efficiency
- Caching of model predictions for faster web response
- Parallel processing for hyperparameter tuning

## 📊 Evaluation Metrics

- **RMSE**: Root Mean Square Error (lower is better)
- **MAE**: Mean Absolute Error (lower is better)  
- **R² Score**: Coefficient of determination (higher is better)
- **Training Time**: Algorithm efficiency comparison

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Netflix dataset structure inspiration
- Scikit-learn for robust ML implementations
- Flask community for web framework
- Academic research in collaborative filtering
