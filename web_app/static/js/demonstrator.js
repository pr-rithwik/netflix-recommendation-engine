/**
 * Demonstrator Page Functionality - Algorithm Performance Demonstrator
 * Handles item rating, algorithm comparison, and interactive demonstrations
 */

// Global state for the demonstrator
const DemonstratorState = {
    userRatings: {},
    currentItems: [],
    comparisonResults: null,
    isComparing: false,
    systemReady: false
};

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔬 Algorithm Demonstrator Page Loaded');
    
    // Initialize demonstrator functionality
    AlgorithmDemonstrator.init();
});

// Main demonstrator object
const AlgorithmDemonstrator = {
    async init() {
        // Check system readiness
        await this.checkSystemReadiness();
        
        // Initialize all components
        this.initializeItemRating();
        this.initializeComparison();
        this.initializeAlgorithmCards();
        this.initializeControls();
        this.loadInitialItems();
        
        console.log('✅ Algorithm Demonstrator initialized');
    },

    // Check if the system is ready for demonstrations
    async checkSystemReadiness() {
        try {
            const result = await window.AlgorithmDemo.SystemStatus.check();
            
            if (result.success && result.data.models_initialized) {
                DemonstratorState.systemReady = true;
                this.enableInterface();
            } else {
                this.disableInterface('System is initializing algorithms, please wait...');
                
                // Retry every 3 seconds
                setTimeout(() => this.checkSystemReadiness(), 3000);
            }
        } catch (error) {
            console.error('System readiness check failed:', error);
            this.disableInterface('System error - please refresh the page');
        }
    },

    // Enable the interface when system is ready
    enableInterface() {
        const disabledElements = document.querySelectorAll('[disabled]');
        disabledElements.forEach(el => {
            el.disabled = false;
            el.classList.remove('disabled');
        });
        
        window.AppUtils.showAlert('System ready! All algorithms loaded.', 'success', 2000);
    },

    // Disable the interface when system isn't ready
    disableInterface(message) {
        const interactiveElements = document.querySelectorAll('button, .btn');
        interactiveElements.forEach(el => {
            el.disabled = true;
            el.classList.add('disabled');
            el.title = message;
        });
        
        window.AppUtils.showAlert(message, 'warning', 3000);
    },

    // Initialize item rating functionality
    initializeItemRating() {
        this.initializeStarRating();
        this.initializeRatingCounter();
        this.initializeItemControls();
    },

    // Initialize star rating system
    initializeStarRating() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarClick(e.target);
            }
        });
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarHover(e.target);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarMouseOut(e.target);
            }
        });
    },

    // Handle star click
    handleStarClick(star) {
        const itemCard = star.closest('.item-card');
        const itemId = this.getItemId(itemCard);
        const rating = parseInt(star.dataset.rating);
        
        if (!itemId) return;
        
        // Update rating
        DemonstratorState.userRatings[itemId] = rating;
        
        // Update visual display
        this.updateStarDisplay(itemCard, rating);
        this.updateRatingCounter();
        this.updateCurrentRating(itemCard, rating);
        
        // Mark card as rated
        itemCard.classList.add('rated');
        
        // Enable comparison if we have enough ratings
        this.updateComparisonButton();
        
        console.log(`Item ${itemId} rated: ${rating} stars`);
    },

    // Handle star hover
    handleStarHover(star) {
        const itemCard = star.closest('.item-card');
        const rating = parseInt(star.dataset.rating);
        
        this.highlightStars(itemCard, rating);
    },

    // Handle star mouse out
    handleStarMouseOut(star) {
        const itemCard = star.closest('.item-card');
        const itemId = this.getItemId(itemCard);
        const currentRating = DemonstratorState.userRatings[itemId] || 0;
        
        this.updateStarDisplay(itemCard, currentRating);
    },

    // Update star display
    updateStarDisplay(itemCard, rating) {
        const stars = itemCard.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.add('active');
                star.style.color = '#ffd700';
            } else {
                star.classList.remove('active');
                star.style.color = '#e2e8f0';
            }
        });
    },

    // Highlight stars on hover
    highlightStars(itemCard, rating) {
        const stars = itemCard.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            const starRating = index + 1;
            star.style.color = starRating <= rating ? '#ffd700' : '#e2e8f0';
        });
    },

    // Update current rating display
    updateCurrentRating(itemCard, rating) {
        const ratingDisplay = itemCard.querySelector('.current-rating');
        if (ratingDisplay) {
            ratingDisplay.textContent = `${rating} star${rating !== 1 ? 's' : ''}`;
        }
    },

    // Get item ID from card
    getItemId(itemCard) {
        const itemName = itemCard.querySelector('.item-name');
        if (!itemName) return null;
        
        // Extract ID from "Item_XXX" format
        const match = itemName.textContent.match(/Item_(\d+)/);
        return match ? parseInt(match[1]) : null;
    },

    // Update rating counter
    updateRatingCounter() {
        const counter = document.getElementById('ratingCounter');
        const count = Object.keys(DemonstratorState.userRatings).length;
        
        if (counter) {
            counter.textContent = `${count} items rated`;
            
            if (count >= 5) {
                counter.classList.add('sufficient');
                counter.textContent += ' (good for comparison!)';
            }
        }
    },

    // Initialize rating counter
    initializeRatingCounter() {
        this.updateRatingCounter();
    },

    // Initialize item controls
    initializeItemControls() {
        const loadMoreBtn = document.getElementById('loadMoreItems');
        const clearBtn = document.getElementById('clearRatings');
        
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreItems());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllRatings());
        }
    },

    // Load initial items
    async loadInitialItems() {
        await this.loadItems(15);
    },

    // Load more items
    async loadMoreItems() {
        window.AppUtils.showLoading('itemsGrid', 'Loading more items...');
        await this.loadItems(10, true);
    },

    // Load items from API
    async loadItems(count = 10, append = false) {
        try {
            const result = await window.AppUtils.apiCall(`/api/random_items?count=${count}`);
            
            if (result.success) {
                if (append) {
                    DemonstratorState.currentItems.push(...result.data);
                } else {
                    DemonstratorState.currentItems = result.data;
                }
                
                this.displayItems(result.data, append);
            } else {
                window.AppUtils.showAlert('Failed to load items: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Failed to load items:', error);
            window.AppUtils.showAlert('Error loading items', 'error');
        }
    },

    // Display items in the grid
    displayItems(items, append = false) {
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) return;
        
        if (!append) {
            itemsGrid.innerHTML = '';
        }
        
        items.forEach(item => {
            const itemCard = this.createItemCard(item);
            itemsGrid.appendChild(itemCard);
        });
        
        // Restore existing ratings
        this.restoreRatings();
    },

    // Create item card HTML
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Check if already rated
        const existingRating = DemonstratorState.userRatings[item.item_id];
        if (existingRating) {
            card.classList.add('rated');
        }
        
        card.innerHTML = `
            <div class="item-header">
                <span class="item-name">${item.item_name}</span>
                <span class="item-id">ID: ${item.item_id}</span>
            </div>
            <div class="rating-stars">
                ${Array.from({length: 5}, (_, i) => 
                    `<span class="star" data-rating="${i + 1}">⭐</span>`
                ).join('')}
            </div>
            <div class="current-rating">
                ${existingRating ? `${existingRating} star${existingRating !== 1 ? 's' : ''}` : 'Not rated'}
            </div>
        `;
        
        return card;
    },

    // Restore existing ratings
    restoreRatings() {
        Object.entries(DemonstratorState.userRatings).forEach(([itemId, rating]) => {
            const itemCards = document.querySelectorAll('.item-card');
            
            itemCards.forEach(card => {
                const cardItemId = this.getItemId(card);
                if (cardItemId === parseInt(itemId)) {
                    this.updateStarDisplay(card, rating);
                    this.updateCurrentRating(card, rating);
                    card.classList.add('rated');
                }
            });
        });
    },

    // Clear all ratings
    clearAllRatings() {
        if (Object.keys(DemonstratorState.userRatings).length === 0) {
            window.AppUtils.showAlert('No ratings to clear!', 'info');
            return;
        }
        
        const confirmed = confirm('Clear all ratings? This will reset your comparison.');
        if (!confirmed) return;
        
        // Clear state
        DemonstratorState.userRatings = {};
        DemonstratorState.comparisonResults = null;
        
        // Update UI
        document.querySelectorAll('.item-card').forEach(card => {
            card.classList.remove('rated');
            this.updateStarDisplay(card, 0);
            this.updateCurrentRating(card, 0);
            
            const ratingDisplay = card.querySelector('.current-rating');
            if (ratingDisplay) {
                ratingDisplay.textContent = 'Not rated';
            }
        });
        
        this.updateRatingCounter();
        this.updateComparisonButton();
        this.clearComparisonResults();
        
        window.AppUtils.showAlert('All ratings cleared!', 'success');
    },

    // Initialize comparison functionality
    initializeComparison() {
        const compareBtn = document.getElementById('compareAll');
        
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compareAlgorithms());
        }
        
        this.updateComparisonButton();
    },

    // Update comparison button state
    updateComparisonButton() {
        const compareBtn = document.getElementById('compareAll');
        const ratingsCount = Object.keys(DemonstratorState.userRatings).length;
        
        if (compareBtn) {
            compareBtn.disabled = ratingsCount === 0 || !DemonstratorState.systemReady;
            
            if (ratingsCount === 0) {
                compareBtn.textContent = 'Rate items to compare algorithms';
            } else {
                compareBtn.textContent = `Compare All Algorithms (${ratingsCount} ratings)`;
            }
        }
    },

    // Compare all algorithms
    async compareAlgorithms() {
        const ratingsCount = Object.keys(DemonstratorState.userRatings).length;
        
        if (ratingsCount === 0) {
            window.AppUtils.showAlert('Please rate at least one item first!', 'warning');
            return;
        }
        
        if (DemonstratorState.isComparing) {
            return;
        }
        
        DemonstratorState.isComparing = true;
        
        // Show loading state
        window.AppUtils.showLoading('comparisonResults', 'Comparing algorithms...');
        
        // Update button state
        const compareBtn = document.getElementById('compareAll');
        if (compareBtn) {
            compareBtn.disabled = true;
            compareBtn.textContent = 'Comparing algorithms...';
        }
        
        try {
            const result = await window.AppUtils.apiCall('/api/compare_algorithms', {
                method: 'POST',
                body: JSON.stringify({
                    ratings: DemonstratorState.userRatings
                })
            });
            
            if (result.success) {
                DemonstratorState.comparisonResults = result.data;
                this.displayComparisonResults(result.data);
                
                window.AppUtils.showAlert(
                    `Algorithm comparison complete! Analyzed ${ratingsCount} ratings.`, 
                    'success'
                );
            } else {
                window.AppUtils.showAlert('Comparison failed: ' + result.error, 'error');
                this.clearComparisonResults();
            }
        } catch (error) {
            console.error('Algorithm comparison failed:', error);
            window.AppUtils.showAlert('Comparison failed: Network error', 'error');
            this.clearComparisonResults();
        } finally {
            DemonstratorState.isComparing = false;
            
            // Reset button
            if (compareBtn) {
                compareBtn.disabled = false;
                compareBtn.textContent = `Compare All Algorithms (${ratingsCount} ratings)`;
            }
        }
    },

    // Display comparison results
    displayComparisonResults(comparisonData) {
        const resultsContainer = document.getElementById('comparisonResults');
        if (!resultsContainer) return;
        
        const showTimes = document.getElementById('showTimes')?.checked ?? true;
        const showDetails = document.getElementById('showDetails')?.checked ?? true;
        
        let html = '<div class="comparison-grid">';
        
        // Sort algorithms by performance (if available)
        const sortedAlgorithms = Object.entries(comparisonData.comparisons).sort((a, b) => {
            const aAvg = this.calculateAverageRating(a[1].predictions);
            const bAvg = this.calculateAverageRating(b[1].predictions);
            return bAvg - aAvg; // Higher average ratings first
        });
        
        sortedAlgorithms.forEach(([algoKey, algoData]) => {
            html += this.createAlgorithmResultCard(algoKey, algoData, showTimes, showDetails);
        });
        
        html += '</div>';
        
        // Add insights section
        html += this.createComparisonInsights(comparisonData);
        
        resultsContainer.innerHTML = html;
        
        // Initialize result interactions
        this.initializeResultInteractions();
    },

    // Create algorithm result card
    createAlgorithmResultCard(algoKey, algoData, showTimes, showDetails) {
        const statusClass = algoData.status === 'success' ? 'success' : 'error';
        const avgRating = this.calculateAverageRating(algoData.predictions);
        
        return `
            <div class="algorithm-result ${statusClass}" data-algorithm="${algoKey}">
                <div class="algorithm-header">
                    <h4 class="algorithm-name">${algoData.name}</h4>
                    <div class="algorithm-meta">
                        ${showTimes ? `<span class="prediction-time">${window.AppUtils.formatTime(algoData.prediction_time)}</span>` : ''}
                        <span class="status-indicator ${statusClass}"></span>
                    </div>
                </div>
                
                ${showDetails ? `<div class="algorithm-description">${this.getAlgorithmDescription(algoKey)}</div>` : ''}
                
                ${algoData.status === 'error' ? 
                    `<div class="error-message">Error: ${algoData.error}</div>` :
                    `
                    <div class="predictions-summary">
                        <span class="avg-rating">Avg Prediction: ${window.AppUtils.formatNumber(avgRating, 1)}⭐</span>
                        <span class="prediction-count">${algoData.predictions.length} predictions</span>
                    </div>
                    
                    <div class="predictions-list">
                        ${algoData.predictions.slice(0, 3).map(pred => 
                            `<div class="prediction-item">
                                <span class="item-name">${pred.item_name}</span>
                                <span class="predicted-rating">${window.AppUtils.formatNumber(pred.predicted_rating, 1)}⭐</span>
                            </div>`
                        ).join('')}
                    </div>
                    
                    ${algoData.predictions.length > 3 ? 
                        `<button class="show-more-predictions" data-algorithm="${algoKey}">Show all ${algoData.predictions.length} predictions</button>` : ''
                    }
                    `
                }
            </div>
        `;
    },

    // Calculate average rating for predictions
    calculateAverageRating(predictions) {
        if (!predictions || predictions.length === 0) return 0;
        const sum = predictions.reduce((acc, pred) => acc + pred.predicted_rating, 0);
        return sum / predictions.length;
    },

    // Get algorithm description
    getAlgorithmDescription(algoKey) {
        const descriptions = {
            'knn_item_based': 'Finds similar items based on rating patterns',
            'knn_user_based': 'Finds users with similar preferences',
            'matrix_svd': 'Uses latent factors via Singular Value Decomposition',
            'em_clustering': 'Groups users into preference clusters',
            'matrix_nmf': 'Non-negative matrix factorization approach',
            'mean_imputation': 'Simple baseline using average ratings'
        };
        
        return descriptions[algoKey] || 'Advanced machine learning algorithm';
    },

    // Create comparison insights
    createComparisonInsights(comparisonData) {
        const algorithms = Object.entries(comparisonData.comparisons);
        const successful = algorithms.filter(([_, data]) => data.status === 'success');
        
        if (successful.length < 2) {
            return '<div class="comparison-insights"><p>Need at least 2 successful algorithms for insights.</p></div>';
        }
        
        // Find fastest and highest average
        const fastest = successful.reduce((min, curr) => 
            curr[1].prediction_time < min[1].prediction_time ? curr : min
        );
        
        const highestAvg = successful.reduce((max, curr) => {
            const currAvg = this.calculateAverageRating(curr[1].predictions);
            const maxAvg = this.calculateAverageRating(max[1].predictions);
            return currAvg > maxAvg ? curr : max;
        });
        
        return `
            <div class="comparison-insights">
                <h4>🔍 Key Insights from Your Ratings</h4>
                <div class="insights-grid">
                    <div class="insight-item">
                        <strong>⚡ Fastest Algorithm:</strong> ${fastest[1].name} 
                        (${window.AppUtils.formatTime(fastest[1].prediction_time)})
                    </div>
                    <div class="insight-item">
                        <strong>📈 Highest Predictions:</strong> ${highestAvg[1].name} 
                        (${window.AppUtils.formatNumber(this.calculateAverageRating(highestAvg[1].predictions), 1)}⭐ avg)
                    </div>
                    <div class="insight-item">
                        <strong>🎯 Your Pattern:</strong> Based on your ${Object.keys(DemonstratorState.userRatings).length} ratings, 
                        algorithms show ${this.getAgreementLevel(successful)} agreement levels
                    </div>
                </div>
            </div>
        `;
    },

    // Get agreement level between algorithms
    getAgreementLevel(algorithms) {
        // Simple heuristic: compare top predictions
        const topPredictions = algorithms.map(([_, data]) => 
            data.predictions[0]?.item_id
        );
        
        const uniqueTopPicks = new Set(topPredictions).size;
        
        if (uniqueTopPicks === 1) return 'high';
        if (uniqueTopPicks <= algorithms.length / 2) return 'moderate';
        return 'low';
    },

    // Clear comparison results
    clearComparisonResults() {
        const resultsContainer = document.getElementById('comparisonResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="comparison-placeholder">
                    <p>👆 Rate some items above and click "Compare All Algorithms" to see how different ML approaches predict your preferences!</p>
                </div>
            `;
        }
    },

    // Initialize result interactions
    initializeResultInteractions() {
        // Show more predictions buttons
        document.querySelectorAll('.show-more-predictions').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const algorithm = e.target.dataset.algorithm;
                this.showAllPredictions(algorithm);
            });
        });
        
        // Algorithm result card clicks
        document.querySelectorAll('.algorithm-result').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return; // Don't trigger on button clicks
                
                card.classList.toggle('expanded');
            });
        });
    },

    // Show all predictions for an algorithm
    showAllPredictions(algorithm) {
        const algoData = DemonstratorState.comparisonResults?.comparisons[algorithm];
        if (!algoData) return;
        
        const predictions = algoData.predictions.map(pred => 
            `${pred.item_name}: ${window.AppUtils.formatNumber(pred.predicted_rating, 2)}⭐`
        ).join('\n');
        
        const content = `
All predictions from ${algoData.name}:

${predictions}

Average Rating: ${window.AppUtils.formatNumber(this.calculateAverageRating(algoData.predictions), 2)}⭐
Prediction Time: ${window.AppUtils.formatTime(algoData.prediction_time)}
        `;
        
        // Use global modal system
        if (window.AlgorithmDemo?.FooterActions?.showModal) {
            window.AlgorithmDemo.FooterActions.showModal(
                `${algoData.name} - All Predictions`, 
                content
            );
        } else {
            alert(content);
        }
    },

    // Initialize algorithm cards
    initializeAlgorithmCards() {
        const algorithmCards = document.querySelectorAll('.algorithm-card');
        
        algorithmCards.forEach(card => {
            card.addEventListener('click', function() {
                // Toggle active state
                algorithmCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                // Get algorithm info
                const algorithm = this.dataset.algorithm;
                console.log('Algorithm card clicked:', algorithm);
                
                // Could highlight in results if comparison is done
                if (DemonstratorState.comparisonResults) {
                    const resultCard = document.querySelector(`[data-algorithm="${algorithm}"]`);
                    if (resultCard) {
                        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        resultCard.classList.add('highlighted');
                        setTimeout(() => resultCard.classList.remove('highlighted'), 2000);
                    }
                }
            });
        });
    },

    // Initialize controls
    initializeControls() {
        // Show times checkbox
        const showTimesCheckbox = document.getElementById('showTimes');
        if (showTimesCheckbox) {
            showTimesCheckbox.addEventListener('change', () => {
                if (DemonstratorState.comparisonResults) {
                    this.displayComparisonResults(DemonstratorState.comparisonResults);
                }
            });
        }
        
        // Show details checkbox
        const showDetailsCheckbox = document.getElementById('showDetails');
        if (showDetailsCheckbox) {
            showDetailsCheckbox.addEventListener('change', () => {
                if (DemonstratorState.comparisonResults) {
                    this.displayComparisonResults(DemonstratorState.comparisonResults);
                }
            });
        }
    }
};

// Export for potential use by other scripts
window.AlgorithmDemonstrator = AlgorithmDemonstrator;
window.DemonstratorState = DemonstratorState;