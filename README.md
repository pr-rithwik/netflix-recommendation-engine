# A Comparative Analysis of Collaborative Filtering Algorithms

## 🎯 Project Goal

This project provides a systematic comparison of several common collaborative filtering algorithms for recommendation systems. Using a sparse user-item rating matrix inspired by the Netflix dataset, this repository implements and evaluates models based on clustering, nearest neighbors, and matrix factorization. The entire analysis is contained within a single, reproducible Jupyter Notebook.

## 📊 Key Findings

| Algorithm                  | RMSE    | MAE     | R² Score | Training Time |
| :------------------------- | :------ | :------ | :------- | :------------ |
| **KNN Item-based**         | **0.467** | **0.160** | **0.789**  | 4.93s         |
| KNN User-based             | 0.498   | 0.173   | 0.760    | 4.57s         |
| Matrix Factorization (SVD) | 0.502   | 0.176   | 0.757    | 0.20s         |
| EM Clustering              | 0.503   | 0.176   | 0.756    | 1.39s         |
| Mean Imputation (Baseline) | 0.508   | 0.179   | 0.750    | 0.06s         |
| Matrix Factorization (NMF) | 0.882   | 0.366   | 0.247    | 7.86s         |

**Conclusion:** Item-based KNN delivered the highest accuracy, while SVD offered the best balance of speed and performance.

## 🛠️ How to Run This Analysis

### Prerequisites
- Python 3.8+
- Jupyter Notebook or JupyterLab

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/netflix-recommendation-engine.git
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

## 🧠 Algorithms Implemented

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
├── recommendation_analysis.ipynb # The main Jupyter Notebook with all code and analysis.
├── data/ # Contains the dataset files.
├── README.md # This file.
└── requirements.txt # Python dependencies.
```