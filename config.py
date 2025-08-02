import os

# Data paths
DATA_PATH = "data"
RESULTS_PATH = "results"
MODELS_PATH = "models"

# Dataset configuration
N_USERS = 1200
N_MOVIES = 1200
RATING_SCALE = (1, 5)

# Model parameters
DEFAULT_K_CLUSTERS = 10
DEFAULT_K_NEIGHBORS = 30
DEFAULT_N_COMPONENTS = 50

# Evaluation
TEST_SIZE = 0.2
RANDOM_STATE = 42
N_SEEDS = 5

# Synthetic movie mapping
GENRES = ['Action', 'Romance', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Animation']
MOVIES_PER_GENRE = N_MOVIES // len(GENRES)
