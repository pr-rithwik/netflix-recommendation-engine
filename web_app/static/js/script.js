// Global variables
let userRatings = {};
let currentAlgorithm = 'em';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Netflix Recommender loaded');
    initializeEventListeners();
});

function initializeEventListeners() {
    // Star rating functionality
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseover', handleStarHover);
    });
    
    // Algorithm selector
    const algorithmBtns = document.querySelectorAll('.algorithm-btn');
    algorithmBtns.forEach(btn => {
        btn.addEventListener('click', handleAlgorithmChange);
    });
    
    // Get recommendations button
    const getRecsBtn = document.getElementById('getRecommendations');
    if (getRecsBtn) {
        getRecsBtn.addEventListener('click', getRecommendations);
    }
    
    // Compare algorithms button
    const compareBtn = document.getElementById('compareAlgorithms');
    if (compareBtn) {
        compareBtn.addEventListener('click', compareAlgorithms);
    }
}

function handleStarClick(event) {
    const star = event.target;
    const movieId = star.dataset.movieId;
    const rating = parseInt(star.dataset.rating);
    
    // Update user ratings
    userRatings[movieId] = rating;
    
    // Update visual feedback
    updateStarDisplay(movieId, rating);
    
    // Update rating counter
    updateRatingCounter();
    
    console.log(`Rated movie ${movieId}: ${rating} stars`);
}

function handleStarHover(event) {
    const star = event.target;
    const movieId = star.dataset.movieId;
    const rating = parseInt(star.dataset.rating);
    
    // Temporarily highlight stars on hover
    highlightStars(movieId, rating);
}

function handleAlgorithmChange(event) {
    const btn = event.target;
    const algorithm = btn.dataset.algorithm;
    
    // Update active button
    document.querySelectorAll('.algorithm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update current algorithm
    currentAlgorithm = algorithm;
    
    console.log(`Switched to algorithm: ${algorithm}`);
    
    // If we have ratings, automatically get new recommendations
    if (Object.keys(userRatings).length > 0) {
        getRecommendations();
    }
}

function updateStarDisplay(movieId, rating) {
    const stars = document.querySelectorAll(`[data-movie-id="${movieId}"]`);
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(movieId, rating) {
    const stars = document.querySelectorAll(`[data-movie-id="${movieId}"]`);
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.style.color = '#ffd700';
        } else {
            star.style.color = '#ddd';
        }
    });
}

function updateRatingCounter() {
    const counter = document.getElementById('ratingCounter');
    if (counter) {
        const count = Object.keys(userRatings).length;
        counter.textContent = `${count} movies rated`;
        
        // Enable/disable recommendations button
        const getRecsBtn = document.getElementById('getRecommendations');
        if (getRecsBtn) {
            getRecsBtn.disabled = count === 0;
        }
    }
}

async function getRecommendations() {
    const ratingsCount = Object.keys(userRatings).length;
    
    if (ratingsCount === 0) {
        showAlert('Please rate at least one movie first!', 'error');
        return;
    }
    
    // Show loading state
    showLoading('recommendations');
    
    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ratings: userRatings,
                algorithm: currentAlgorithm
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayRecommendations(data.recommendations, data.algorithm);
        } else {
            showAlert(`Error: ${data.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        showAlert('Failed to get recommendations. Please try again.', 'error');
    } finally {
        hideLoading('recommendations');
    }
}

async function compareAlgorithms() {
    const ratingsCount = Object.keys(userRatings).length;
    
    if (ratingsCount === 0) {
        showAlert('Please rate at least one movie first!', 'error');
        return;
    }
    
    showLoading('comparison');
    
    try {
        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ratings: userRatings
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayComparison(data);
        } else {
            showAlert(`Error: ${data.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error comparing algorithms:', error);
        showAlert('Failed to compare algorithms. Please try again.', 'error');
    } finally {
        hideLoading('comparison');
    }
}

function displayRecommendations(recommendations, algorithm) {
    const container = document.getElementById('recommendations');
    if (!container) return;
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p>No recommendations available.</p>';
        return;
    }
    
    const algorithmNames = {
        'mean': 'Mean Imputation',
        'em': 'EM Clustering',
        'knn_user': 'KNN User-based',
        'knn_item': 'KNN Item-based',
        'matrix_nmf': 'Matrix Factorization (NMF)'
    };
    
    let html = `
        <h3>Recommendations from ${algorithmNames[algorithm] || algorithm}</h3>
        <div class="recommendations-list">
    `;
    
    recommendations.forEach(rec => {
        html += `
            <div class="recommendation-item">
                <div class="movie-details">
                    <h4>${rec.title}</h4>
                    <p>${rec.genre} • ${rec.year}</p>
                </div>
                <div class="predicted-rating">
                    ${rec.predicted_rating.toFixed(1)}⭐
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function displayComparison(comparisonData) {
    const container = document.getElementById('comparison');
    if (!container) return;
    
    const algorithmNames = {
        'mean': 'Mean Imputation',
        'em': 'EM Clustering',
        'knn_user': 'KNN User-based',
        'knn_item': 'KNN Item-based',
        'matrix_nmf': 'Matrix Factorization (NMF)'
    };
    
    let html = '<h3>Algorithm Comparison</h3>';
    
    for (const [algorithm, recommendations] of Object.entries(comparisonData)) {
        if (recommendations.error) {
            html += `
                <div class="card">
                    <h4>${algorithmNames[algorithm] || algorithm}</h4>
                    <p class="alert alert-error">Error: ${recommendations.error}</p>
                </div>
            `;
            continue;
        }
        
        html += `
            <div class="card">
                <h4>${algorithmNames[algorithm] || algorithm}</h4>
                <div class="recommendations-list">
        `;
        
        recommendations.forEach(rec => {
            html += `
                <div class="recommendation-item">
                    <div class="movie-details">
                        <h5>${rec.title}</h5>
                    </div>
                    <div class="predicted-rating">
                        ${rec.predicted_rating.toFixed(1)}⭐
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    container.innerHTML = html;
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing...</p>
            </div>
        `;
    }
}

function hideLoading(containerId) {
    // Loading will be replaced by actual content
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at top of page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Utility function to get query parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
