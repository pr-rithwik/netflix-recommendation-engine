# Netflix Recommendation Engine

## 🎯 Project Overview

An intelligent recommendation system implementing multiple machine learning algorithms to compare their performance on Netflix-style collaborative filtering. This project demonstrates systematic algorithm comparison using Expectation-Maximization clustering, KNN imputation, and matrix factorization on realistic sparse rating data.

**Part of the "Build Beyond" series** - expanding course projects with comprehensive algorithm comparisons and practical implementations.

## 🚀 Key Features

- **Multi-Algorithm Comparison**: EM clustering, KNN (user/item-based), Matrix factorization (NMF & SVD)
- **Comprehensive Evaluation**: RMSE, MAE, R² metrics with detailed performance analysis
- **Algorithm Performance Demonstrator**: Interactive web interface for real-time algorithm comparison
- **Realistic Dataset**: Handles 22.79% sparsity on 1200×1200 user-movie matrix
- **Educational Focus**: Transparent comparison methodology and interpretable results

## 📊 Dataset Characteristics

- **Size**: 1200 users × 1200 movies (1,440,000 possible ratings)
- **Observed Ratings**: 1,111,768 ratings  
- **Sparsity**: 22.79% (realistic for recommendation systems)
- **Rating Scale**: 1-5 stars
- **Format**: Space-separated text files

## 🛠️ Installation

```bash
# Clone repository
git clone https://github.com/pr-rithwik/netflix-recommendation-engine.git
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
├── web_app/                # Flask algorithm demonstrator
├── notebooks/              # Jupyter notebooks for analysis
├── experiments/            # Algorithm comparison scripts
└── results/                # Performance results and comparisons
```

## 🏃‍♂️ Quick Start

### Phase 1: Run Algorithm Comparison
```bash
python run_phase1.py
```

This will:
1. Load and explore the Netflix dataset
2. Test all recommendation algorithms
3. Generate comprehensive performance comparison
4. Save results to `results/baseline_comparison.csv`

### Phase 2: Launch Algorithm Demonstrator
```bash
cd web_app
python app.py
```

Visit `http://localhost:5000` to interact with the algorithm comparison interface.

## 📈 Algorithm Performance Results

| Algorithm | RMSE | MAE | R² Score | Training Time | Status |
|-----------|------|-----|----------|---------------|--------|
| **KNN Item-based** | **0.467** | **0.160** | **0.789** | 5.00s | **Winner** |
| KNN User-based | 0.498 | 0.173 | 0.760 | 4.63s | Strong |
| Matrix Factorization (SVD) | 0.502 | 0.176 | 0.757 | 0.16s | Fast |
| EM Clustering | 0.503 | 0.176 | 0.756 | 1.54s | Interpretable |
| Mean Imputation (Baseline) | 0.508 | 0.179 | 0.750 | 0.05s | Baseline |
| Matrix Factorization (NMF) | 0.882 | 0.366 | 0.247 | 10.32s | Poor |

**Key Insights:**
- **Item-based KNN** achieved best accuracy with manageable training time
- **SVD** offers excellent speed-accuracy balance (60x faster than NMF)
- **EM Clustering** provides most interpretable user segments
- **NMF** significantly underperformed compared to SVD

## 🧠 Algorithms Implemented

### 1. EM-based Clustering Recommender
- Gaussian Mixture Models for user clustering (10 components, 70 iterations to convergence)
- Cluster-wise mean imputation for missing ratings
- Provides interpretable user segments

### 2. KNN Collaborative Filtering
- **User-based**: Find 30 nearest users, average their ratings
- **Item-based**: Find 30 nearest items, average their patterns  
- Item-based significantly outperformed user-based approach

### 3. Matrix Factorization
- **SVD**: Truncated Singular Value Decomposition (50 components)
- **NMF**: Non-negative Matrix Factorization (50 components)
- SVD proved far superior in both speed and accuracy

### 4. Baseline Method
- **Mean Imputation**: Global average rating (3.56) for missing values
- Essential for establishing improvement benchmarks

## 🌐 Algorithm Performance Demonstrator

**Important**: The web interface uses abstract item naming (Item_001, Item_002, etc.) to focus on algorithm comparison rather than content recommendations. This maintains scientific integrity while avoiding misleading content associations.

**Live Demo**: Experience the algorithm comparison tool at [this link](your-deployment-url).

### Features:
- **Interactive Rating Interface**: Rate items and see algorithm predictions
- **Side-by-Side Comparison**: Observe how different algorithms behave with identical input
- **Performance Metrics**: Real-time RMSE, MAE, R² calculations
- **Educational Focus**: Understand collaborative filtering through direct interaction

### What You'll Experience:
- Rate 5-10 items from the dataset
- See how each algorithm predicts your preferences differently
- Understand why certain algorithms perform better on specific patterns
- Learn collaborative filtering through hands-on experimentation

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

# Get algorithm comparison for user ratings
response = requests.post('http://localhost:5000/api/compare', 
                        json={'user_ratings': {0: 5, 15: 4, 23: 3}})
algorithm_results = response.json()['comparisons']
```

## 🔬 Technical Implementation Details

### Comparison Methodology
- Consistent data preprocessing across all algorithms
- Identical train/test splits for fair evaluation
- Standardized hyperparameter selection process
- Statistical significance testing for performance differences

### Data Processing
- Robust handling of sparse matrices (22.79% density)
- Memory-efficient sparse matrix operations
- Feature scaling and normalization where appropriate
- Synthetic item naming to avoid content bias

### Performance Optimization
- Vectorized operations for faster computation
- Efficient sparse matrix implementations
- Caching strategies for web interface responsiveness
- Memory usage optimization for large-scale matrices

## 🎯 Project Goals & Learning Outcomes

### Primary Objectives:
1. **Compare Algorithm Performance**: Systematically evaluate different collaborative filtering approaches
2. **Understand Trade-offs**: Speed vs. accuracy vs. interpretability analysis
3. **Educational Value**: Create interactive learning tool for recommendation systems
4. **Methodological Rigor**: Establish fair comparison framework

### Key Learnings:
- Simple algorithms (KNN) can outperform complex ones (Matrix Factorization)
- Training time varies dramatically between similar algorithms (SVD vs NMF)
- Algorithm selection depends heavily on specific use case requirements
- Interactive demonstration significantly improves algorithm understanding

## 📊 Evaluation Metrics

- **RMSE**: Root Mean Square Error (lower = better prediction accuracy)
- **MAE**: Mean Absolute Error (lower = better average prediction)  
- **R² Score**: Coefficient of determination (higher = better variance explanation)
- **Training Time**: Computational efficiency comparison

## 🚀 "Build Beyond" Series

This project exemplifies the "Build Beyond" approach:
- **Started**: MIT course EM implementation
- **Expanded**: Multi-algorithm comparison framework
- **Enhanced**: Interactive web demonstration
- **Future**: Neural collaborative filtering, transformer-based approaches

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AlgorithmComparison`)
3. Commit changes (`git commit -m 'Add new algorithm comparison'`)
4. Push to branch (`git push origin feature/AlgorithmComparison`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MIT online course for EM algorithm foundation
- Scikit-learn for robust ML implementations
- Flask community for web framework
- Collaborative filtering research community
- Contributors to recommendation system methodologies
