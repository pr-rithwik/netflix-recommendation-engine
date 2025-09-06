# A Comparative Analysis of Collaborative Filtering Algorithms

## 🎯 Project Goal

This project provides a systematic comparison of several common collaborative filtering algorithms for recommendation systems. Using a sparse user-item rating matrix inspired by the Netflix dataset, this repository implements and evaluates models based on clustering, nearest neighbors, and matrix factorization. The entire analysis is contained within a single, reproducible Jupyter Notebook.

## 📊 Performance Results

| Algorithm                  | RMSE  | MAE   | R² Score | Training Time (s) |
| :------------------------- | :---- | :---- | :------- | :---------------- |
| KNN Item-based             | 0.467 | 0.160 | 0.789    | 12.11             |
| EM Clustering              | 0.484 | 0.169 | 0.773    | 6.82              |
| KNN User-based             | 0.498 | 0.173 | 0.760    | 9.47              |
| Matrix Factorization (NMF) | 0.499 | 0.174 | 0.760    | 16.60             |
| Matrix Factorization (SVD) | 0.502 | 0.176 | 0.757    | 0.81              |
| Mean Imputation            | 0.524 | 0.186 | 0.734    | 0.18              |

## 🧠 Key Insights

-   **Highest Accuracy:** `KNN Item-based` delivered the best predictive accuracy (lowest RMSE). This suggests that for this dataset, item-to-item similarity is a stronger signal than user-to-user similarity.
-   **Best Speed-Accuracy Balance:** `Matrix Factorization (SVD)` offers the most pragmatic trade-off. It is over **20 times faster** than the NMF model while delivering highly competitive accuracy, making it an ideal choice for systems requiring rapid retraining.
-   **Importance of Tuning:** The `NMF` model's performance improved dramatically after its `max_iter` parameter was increased to resolve a convergence warning, highlighting the critical impact of proper model tuning on final results.

## 🛠️ How to Run This Analysis

### Prerequisites
- Python 3.8+
- Jupyter Notebook or JupyterLab

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/pr-rithwik/netflix-recommendation-engine.git
    cd netflix-recommendation-engine
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Launch Jupyter and open `recommendation_analysis.ipynb`:
    ```bash
    jupyter notebook recommendation_analysis.ipynb
    ```

## 🤖 Algorithms Implemented

- **Mean Imputation:** A simple baseline that fills missing values with the global average rating.
- **EM Clustering (GMM):** Groups users into clusters and uses cluster-specific average ratings for prediction.
- **K-Nearest Neighbors (KNN):**
  - **User-based:** Predicts ratings based on the ratings of similar users.
  - **Item-based:** Predicts ratings based on the ratings of similar items.
- **Matrix Factorization:**
  - **SVD (Truncated SVD):** Decomposes the user-item matrix into lower-dimensional latent factor matrices.
  - **NMF (Non-negative Matrix Factorization):** A similar decomposition technique that requires non-negative data.

## 📁 Repository Structure
```
.
├── recommendation_analysis.ipynb # The main Jupyter Notebook with all code and analysis.
├── data/ # Contains the dataset files.
├── README.md # This file.
└── requirements.txt # Python dependencies.
```