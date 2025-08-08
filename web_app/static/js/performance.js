/**
 * Performance Page Functionality - Algorithm Performance Demonstrator
 * Handles performance data visualization, table interactions, and analysis
 */

// Global state for performance page
const PerformanceState = {
    rawData: null,
    processedData: null,
    currentSort: 'rmse',
    currentHighlight: 'none',
    sortDirection: 'asc'
};

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Performance Metrics Page Loaded');
    
    // Initialize performance functionality
    PerformancePage.init();
});

// Main performance page object
const PerformancePage = {
    async init() {
        this.initializeControls();
        this.initializeTableInteractions();
        this.initializeCitationButton();
        await this.loadPerformanceData();
        this.initializeCharts();
        this.initializeInsightInteractions();
    },

    // Load performance data from API
    async loadPerformanceData() {
        try {
            const result = await window.AppUtils.apiCall('/api/performance_data');
            
            if (result.success) {
                PerformanceState.rawData = result.data;
                PerformanceState.processedData = this.processPerformanceData(result.data);
                
                this.displayPerformanceTable();
                this.generatePerformanceAnalysis();
                this.hideLoadingState();
                
                console.log('✅ Performance data loaded:', PerformanceState.processedData.length, 'algorithms');
            } else {
                this.showErrorState('Failed to load performance data: ' + result.error);
            }
        } catch (error) {
            console.error('Performance data loading failed:', error);
            this.showErrorState('Network error loading performance data');
        }
    },

    // Process raw performance data
    processPerformanceData(rawData) {
        return rawData.map(item => ({
            name: this.getDisplayName(item.model_name),
            originalName: item.model_name,
            rmse: parseFloat(item.rmse) || null,
            mae: parseFloat(item.mae) || null,
            r2_score: parseFloat(item.r2_score) || null,
            training_time: parseFloat(item.training_time) || null,
            n_predictions: parseInt(item.n_predictions) || null,
            rank: 0 // Will be calculated
        })).filter(item => item.rmse !== null); // Filter out invalid entries
    },

    // Get display name for algorithms
    getDisplayName(modelName) {
        const displayNames = {
            'KNN Item-based': 'KNN Item-based',
            'KNN User-based': 'KNN User-based', 
            'Matrix Factorization (SVD)': 'Matrix Factorization (SVD)',
            'Matrix Factorization (NMF)': 'Matrix Factorization (NMF)',
            'EM Clustering': 'EM Clustering',
            'Mean Imputation': 'Mean Imputation Baseline'
        };
        
        return displayNames[modelName] || modelName;
    },

    // Display performance table
    displayPerformanceTable() {
        const tableBody = document.getElementById('performanceTableBody');
        const table = document.getElementById('performanceTable');
        
        if (!tableBody || !PerformanceState.processedData) return;
        
        // Sort data
        const sortedData = this.sortData(PerformanceState.processedData, PerformanceState.currentSort);
        
        // Calculate ranks based on RMSE (lower is better)
        sortedData.forEach((item, index) => {
            item.rank = index + 1;
        });
        
        // Generate table rows
        let tableHTML = '';
        sortedData.forEach(algorithm => {
            const highlightClass = this.getHighlightClass(algorithm);
            
            tableHTML += `
                <tr class="algorithm-row ${highlightClass}" data-algorithm="${algorithm.originalName}">
                    <td class="algorithm-name">
                        <div class="name-cell">
                            <span class="algorithm-display-name">${algorithm.name}</span>
                            ${this.getRankBadge(algorithm.rank)}
                        </div>
                    </td>
                    <td class="metric-cell rmse" data-value="${algorithm.rmse}">
                        ${this.formatMetric(algorithm.rmse, 3)}
                        ${this.isMetricBest('rmse', algorithm.rmse) ? '<span class="best-indicator">🏆</span>' : ''}
                    </td>
                    <td class="metric-cell mae" data-value="${algorithm.mae}">
                        ${this.formatMetric(algorithm.mae, 3)}
                        ${this.isMetricBest('mae', algorithm.mae) ? '<span class="best-indicator">🏆</span>' : ''}
                    </td>
                    <td class="metric-cell r2" data-value="${algorithm.r2_score}">
                        ${this.formatMetric(algorithm.r2_score, 3)}
                        ${this.isMetricBest('r2_score', algorithm.r2_score, true) ? '<span class="best-indicator">🏆</span>' : ''}
                    </td>
                    <td class="metric-cell time" data-value="${algorithm.training_time}">
                        ${this.formatTime(algorithm.training_time)}
                        ${this.isMetricBest('training_time', algorithm.training_time) ? '<span class="best-indicator">⚡</span>' : ''}
                    </td>
                    <td class="rank-cell">
                        <div class="rank-display rank-${algorithm.rank}">
                            #${algorithm.rank}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        table.style.display = 'table';
        
        // Initialize row interactions
        this.initializeTableRowInteractions();
    },

    // Sort data by specified metric
    sortData(data, sortBy) {
        const sorted = [...data];
        
        sorted.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            // Handle null values
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            
            // For R² score, higher is better (reverse order)
            if (sortBy === 'r2_score') {
                return bVal - aVal;
            }
            
            // For other metrics, lower is better
            return aVal - bVal;
        });
        
        return sorted;
    },

    // Get highlight class for row
    getHighlightClass(algorithm) {
        const highlight = PerformanceState.currentHighlight;
        
        switch (highlight) {
            case 'best_rmse':
                return this.isMetricBest('rmse', algorithm.rmse) ? 'highlighted' : '';
            case 'best_mae':
                return this.isMetricBest('mae', algorithm.mae) ? 'highlighted' : '';
            case 'best_r2':
                return this.isMetricBest('r2_score', algorithm.r2_score, true) ? 'highlighted' : '';
            case 'fastest':
                return this.isMetricBest('training_time', algorithm.training_time) ? 'highlighted' : '';
            default:
                return '';
        }
    },

    // Check if metric is the best
    isMetricBest(metric, value, higherIsBetter = false) {
        if (!PerformanceState.processedData || value === null) return false;
        
        const values = PerformanceState.processedData
            .map(item => item[metric])
            .filter(val => val !== null);
        
        if (higherIsBetter) {
            return value === Math.max(...values);
        } else {
            return value === Math.min(...values);
        }
    },

    // Format metric value
    formatMetric(value, decimals = 2) {
        if (value === null || value === undefined) return 'N/A';
        return Number(value).toFixed(decimals);
    },

    // Format time value
    formatTime(seconds) {
        if (seconds === null || seconds === undefined) return 'N/A';
        return `${Number(seconds).toFixed(2)}s`;
    },

    // Get rank badge
    getRankBadge(rank) {
        const badges = {
            1: '<span class="rank-badge winner">🏆 Winner</span>',
            2: '<span class="rank-badge second">🥈 Strong</span>',
            3: '<span class="rank-badge third">🥉 Good</span>'
        };
        
        return badges[rank] || '';
    },

    // Initialize controls
    initializeControls() {
        // Sort dropdown
        const sortSelect = document.getElementById('sortMetric');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                PerformanceState.currentSort = e.target.value;
                this.displayPerformanceTable();
                console.log('Table sorted by:', PerformanceState.currentSort);
            });
        }
        
        // Highlight dropdown
        const highlightSelect = document.getElementById('highlightMetric');
        if (highlightSelect) {
            highlightSelect.addEventListener('change', (e) => {
                PerformanceState.currentHighlight = e.target.value;
                this.displayPerformanceTable();
                console.log('Highlight changed to:', PerformanceState.currentHighlight);
            });
        }
        
        // Download button
        const downloadBtn = document.getElementById('downloadResults');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadResultsCSV());
        }
    },

    // Initialize table interactions
    initializeTableInteractions() {
        // Column header sorting
        document.addEventListener('click', (e) => {
            if (e.target.closest('th[data-sort]')) {
                const sortKey = e.target.closest('th').dataset.sort;
                this.handleColumnSort(sortKey);
            }
        });
    },

    // Handle column sort
    handleColumnSort(sortKey) {
        // Toggle sort direction if clicking same column
        if (PerformanceState.currentSort === sortKey) {
            PerformanceState.sortDirection = PerformanceState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            PerformanceState.currentSort = sortKey;
            PerformanceState.sortDirection = 'asc';
        }
        
        // Update dropdown to match
        const sortSelect = document.getElementById('sortMetric');
        if (sortSelect) {
            sortSelect.value = sortKey;
        }
        
        this.displayPerformanceTable();
        this.updateSortArrows();
    },

    // Update sort arrows in table headers
    updateSortArrows() {
        document.querySelectorAll('.sort-arrow').forEach(arrow => {
            arrow.textContent = '↕️';
        });
        
        const activeHeader = document.querySelector(`th[data-sort="${PerformanceState.currentSort}"] .sort-arrow`);
        if (activeHeader) {
            activeHeader.textContent = PerformanceState.sortDirection === 'asc' ? '↑' : '↓';
        }
    },

    // Initialize table row interactions
    initializeTableRowInteractions() {
        document.querySelectorAll('.algorithm-row').forEach(row => {
            row.addEventListener('click', function() {
                // Remove active from all rows
                document.querySelectorAll('.algorithm-row').forEach(r => r.classList.remove('active'));
                
                // Add active to clicked row
                this.classList.add('active');
                
                // Get algorithm details
                const algorithmName = this.dataset.algorithm;
                console.log('Algorithm row clicked:', algorithmName);
                
                // Could show detailed analysis for this algorithm
                PerformancePage.showAlgorithmDetails(algorithmName);
            });
            
            // Add hover effect for metrics
            const metricCells = row.querySelectorAll('.metric-cell');
            metricCells.forEach(cell => {
                cell.addEventListener('mouseenter', function() {
                    const metric = this.className.split(' ').find(c => ['rmse', 'mae', 'r2', 'time'].includes(c));
                    const value = this.dataset.value;
                    
                    if (metric && value) {
                        this.title = `${metric.toUpperCase()}: ${value}`;
                    }
                });
            });
        });
    },

    // Show algorithm details
    showAlgorithmDetails(algorithmName) {
        const algorithm = PerformanceState.processedData?.find(a => a.originalName === algorithmName);
        if (!algorithm) return;
        
        const details = `
Algorithm: ${algorithm.name}
Rank: #${algorithm.rank}

Performance Metrics:
• RMSE: ${this.formatMetric(algorithm.rmse, 4)}
• MAE: ${this.formatMetric(algorithm.mae, 4)} 
• R² Score: ${this.formatMetric(algorithm.r2_score, 4)}
• Training Time: ${this.formatTime(algorithm.training_time)}
• Predictions: ${algorithm.n_predictions?.toLocaleString() || 'N/A'}

Strengths:
${this.getAlgorithmStrengths(algorithm)}

Best for:
${this.getAlgorithmUseCase(algorithm)}
        `;
        
        // Use global modal system
        if (window.AlgorithmDemo?.FooterActions?.showModal) {
            window.AlgorithmDemo.FooterActions.showModal(
                `${algorithm.name} - Detailed Performance`,
                details
            );
        } else {
            alert(details);
        }
    },

    // Get algorithm strengths
    getAlgorithmStrengths(algorithm) {
        const strengths = [];
        
        if (this.isMetricBest('rmse', algorithm.rmse)) strengths.push('• Best prediction accuracy (lowest RMSE)');
        if (this.isMetricBest('mae', algorithm.mae)) strengths.push('• Best mean absolute error');
        if (this.isMetricBest('r2_score', algorithm.r2_score, true)) strengths.push('• Best variance explanation (highest R²)');
        if (this.isMetricBest('training_time', algorithm.training_time)) strengths.push('• Fastest training time');
        
        if (algorithm.rank <= 3) strengths.push(`• Top ${algorithm.rank} overall performance`);
        
        return strengths.length > 0 ? strengths.join('\n') : '• Competitive performance across metrics';
    },

    // Get algorithm use case
    getAlgorithmUseCase(algorithm) {
        const useCases = {
            'KNN Item-based': 'Content-stable catalogs, interpretable recommendations',
            'KNN User-based': 'Social platforms, community-driven recommendations',
            'Matrix Factorization (SVD)': 'Large-scale systems, speed-critical applications',
            'Matrix Factorization (NMF)': 'Positive-constraint scenarios, feature interpretation',
            'EM Clustering': 'User segmentation, explainable recommendations',
            'Mean Imputation Baseline': 'Baseline comparison, cold-start scenarios'
        };
        
        return useCases[algorithm.name] || 'General collaborative filtering applications';
    },

    // Download results as CSV
    downloadResultsCSV() {
        if (!PerformanceState.processedData) {
            window.AppUtils.showAlert('No performance data to download', 'error');
            return;
        }
        
        // Create CSV content
        const headers = ['Algorithm', 'Rank', 'RMSE', 'MAE', 'R2_Score', 'Training_Time', 'Predictions'];
        const csvRows = [headers.join(',')];
        
        const sortedData = this.sortData(PerformanceState.processedData, 'rmse');
        sortedData.forEach((algo, index) => {
            const row = [
                `"${algo.name}"`,
                index + 1,
                this.formatMetric(algo.rmse, 4),
                this.formatMetric(algo.mae, 4),
                this.formatMetric(algo.r2_score, 4),
                algo.training_time || 'N/A',
                algo.n_predictions || 'N/A'
            ];
            csvRows.push(row.join(','));
        });
        
        // Download CSV
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `algorithm_performance_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        window.AppUtils.showAlert('Performance results downloaded as CSV', 'success');
    },

    // Generate performance analysis
    generatePerformanceAnalysis() {
        const analysisContainer = document.getElementById('performanceAnalysis');
        if (!analysisContainer || !PerformanceState.processedData) return;
        
        const data = PerformanceState.processedData;
        const winner = data.reduce((best, current) => 
            (current.rmse < best.rmse) ? current : best
        );
        
        const fastest = data.reduce((fast, current) => 
            (current.training_time < fast.training_time) ? current : fast
        );
        
        const analysisHTML = `
            <div class="analysis-grid">
                <div class="analysis-item">
                    <h4>🏆 Performance Leader</h4>
                    <p><strong>${winner.name}</strong> achieved the best RMSE of ${this.formatMetric(winner.rmse, 3)}, 
                    representing a ${this.calculateImprovement(winner.rmse)}% improvement over baseline.</p>
                </div>
                
                <div class="analysis-item">
                    <h4>⚡ Speed Champion</h4>
                    <p><strong>${fastest.name}</strong> completed training in just ${this.formatTime(fastest.training_time)}, 
                    making it ${this.calculateSpeedRatio(fastest.training_time)}× faster than the slowest algorithm.</p>
                </div>
                
                <div class="analysis-item">
                    <h4>📊 Performance Distribution</h4>
                    <p>Top ${this.countCompetitiveAlgorithms(data)} algorithms clustered within 
                    ${this.calculatePerformanceRange(data)}% RMSE range, showing dataset stability.</p>
                </div>
                
                <div class="analysis-item">
                    <h4>🎯 Key Insight</h4>
                    <p>${this.generateKeyInsight(data)}</p>
                </div>
            </div>
        `;
        
        analysisContainer.innerHTML = analysisHTML;
    },

    // Calculate improvement over baseline
    calculateImprovement(bestRMSE) {
        const baseline = PerformanceState.processedData?.find(a => 
            a.name.includes('Baseline') || a.name.includes('Mean')
        );
        
        if (!baseline) return 0;
        
        return ((baseline.rmse - bestRMSE) / baseline.rmse * 100).toFixed(1);
    },

    // Calculate speed ratio
    calculateSpeedRatio(fastestTime) {
        const slowest = PerformanceState.processedData?.reduce((slow, current) => 
            (current.training_time > slow.training_time) ? current : slow
        );
        
        return slowest ? Math.round(slowest.training_time / fastestTime) : 1;
    },

    // Count competitive algorithms
    countCompetitiveAlgorithms(data) {
        const sortedByRMSE = [...data].sort((a, b) => a.rmse - b.rmse);
        const bestRMSE = sortedByRMSE[0].rmse;
        const threshold = bestRMSE * 1.1; // Within 10%
        
        return sortedByRMSE.filter(a => a.rmse <= threshold).length;
    },

    // Calculate performance range
    calculatePerformanceRange(data) {
        const competitive = this.countCompetitiveAlgorithms(data);
        const sortedByRMSE = [...data].sort((a, b) => a.rmse - b.rmse);
        const bestRMSE = sortedByRMSE[0].rmse;
        const topNRMSE = sortedByRMSE[competitive - 1].rmse;
        
        return (((topNRMSE - bestRMSE) / bestRMSE) * 100).toFixed(1);
    },

    // Generate key insight
    generateKeyInsight(data) {
        const knnItemBased = data.find(a => a.name.includes('KNN Item'));
        const matrixMethods = data.filter(a => a.name.includes('Matrix'));
        
        if (knnItemBased && matrixMethods.length > 0) {
            const bestMatrix = matrixMethods.reduce((best, current) => 
                (current.rmse < best.rmse) ? current : best
            );
            
            if (knnItemBased.rmse < bestMatrix.rmse) {
                return 'Simple neighbor-based methods outperformed complex matrix factorization, challenging assumptions about algorithmic complexity and performance.';
            }
        }
        
        return 'Systematic evaluation reveals significant performance differences between algorithm families, emphasizing the importance of empirical comparison.';
    },

    // Initialize charts (placeholder for future chart library integration)
    initializeCharts() {
        // Placeholder for chart initialization
        // Could integrate Chart.js, D3.js, or other visualization libraries
        this.createSimpleCharts();
    },

    // Create simple text-based charts
    createSimpleCharts() {
        if (!PerformanceState.processedData) return;
        
        const data = PerformanceState.processedData;
        const sortedByRMSE = [...data].sort((a, b) => a.rmse - b.rmse);
        
        // RMSE comparison chart
        const accuracyChart = document.getElementById('accuracyChart');
        if (accuracyChart) {
            let chartHTML = '<div class="simple-chart">';
            sortedByRMSE.forEach((algo, index) => {
                const barWidth = ((1 - algo.rmse) * 100).toFixed(1);
                chartHTML += `
                    <div class="chart-bar">
                        <span class="chart-label">${algo.name}</span>
                        <div class="chart-bar-fill" style="width: ${barWidth}%">
                            <span class="chart-value">${this.formatMetric(algo.rmse, 3)}</span>
                        </div>
                    </div>
                `;
            });
            chartHTML += '</div>';
            accuracyChart.innerHTML = chartHTML;
        }
    },

    // Initialize citation button
    initializeCitationButton() {
        const citationBtn = document.getElementById('citationButton');
        if (citationBtn) {
            citationBtn.addEventListener('click', () => this.showCitation());
        }
    },

    // Show citation modal
    showCitation() {
        const citation = `
Algorithm Performance Demonstrator - Performance Results (2025)

Dataset: 1200×1200 user-item matrix, 22.8% density, 1.11M observed ratings
Evaluation: RMSE, MAE, R² Score with consistent preprocessing and validation
Winner: KNN Item-based (0.467 RMSE, 0.789 R²)
Fastest: SVD Matrix Factorization (0.20s training time)

GitHub: https://github.com/pr-rithwik/netflix-recommendation-engine
Part of the "Build Beyond" series - expanding course projects with systematic comparison.

BibTeX Citation:
@misc{netflix_algorithm_performance_2025,
    title={Algorithm Performance Demonstrator: Collaborative Filtering Comparison},
    author={Pr-rithwik},
    year={2025},
    url={https://github.com/pr-rithwik/netflix-recommendation-engine},
    note={Performance evaluation of 6 ML algorithms on Netflix-style recommendation data}
}

Results Summary:
1. KNN Item-based: 0.467 RMSE (Winner)
2. KNN User-based: 0.498 RMSE  
3. SVD: 0.502 RMSE (Fastest: 0.20s)
4. EM Clustering: 0.503 RMSE
5. Mean Imputation: 0.508 RMSE
6. NMF: 0.882 RMSE
        `;
        
        // Use global modal system
        if (window.AlgorithmDemo?.FooterActions?.showModal) {
            window.AlgorithmDemo.FooterActions.showModal('Citation Information', citation);
        } else {
            alert(citation);
        }
    },

    // Initialize insight interactions
    initializeInsightInteractions() {
        const insightCards = document.querySelectorAll('.insight-card');
        
        insightCards.forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('expanded');
                
                // Scroll into view if expanded
                if (this.classList.contains('expanded')) {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    },

    // Hide loading state
    hideLoadingState() {
        const loadingEl = document.getElementById('performanceTableLoading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    },

    // Show error state
    showErrorState(message) {
        const loadingEl = document.getElementById('performanceTableLoading');
        const errorEl = document.getElementById('performanceTableError');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'block';
            
            // Update error message if provided
            const errorMsg = errorEl.querySelector('p');
            if (errorMsg && message) {
                errorMsg.textContent = message;
            }
        }
        
        window.AppUtils.showAlert('Performance data unavailable', 'error');
    }
};

// Export for potential use by other scripts
window.PerformancePage = PerformancePage;
window.PerformanceState = PerformanceState;