/**
 * Base JavaScript for Algorithm Performance Demonstrator
 * Handles global functionality, system status, and shared utilities
 */

// Global application state
window.AppState = {
    initialized: false,
    algorithms: {},
    systemStatus: 'unknown',
    endpoints: {
        status: '/api/status',
        performanceData: '/api/performance_data',
        datasetInfo: '/api/dataset_info',
        algorithmInfo: '/api/algorithm_info'
    }
};

// Global utility functions
window.AppUtils = {
    // Alert system
    showAlert: function(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} fade-in`;
        alert.innerHTML = `
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, duration);
    },
    
    // Number formatting
    formatNumber: function(num, decimals = 2) {
        if (isNaN(num)) return 'N/A';
        return Number(num).toFixed(decimals);
    },
    
    // Time formatting
    formatTime: function(seconds) {
        if (isNaN(seconds)) return 'N/A';
        return `${seconds.toFixed(2)}s`;
    },
    
    // API call wrapper with error handling
    apiCall: async function(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error(`API call failed for ${url}:`, error);
            return { success: false, error: error.message };
        }
    },
    
    // Loading state management
    showLoading: function(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    },
    
    // Download JSON data
    downloadJSON: function(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// System status management
const SystemStatus = {
    async check() {
        console.log('🔍 Checking system status...');
        
        const result = await AppUtils.apiCall(AppState.endpoints.status);
        
        if (result.success) {
            AppState.systemStatus = result.data.status;
            AppState.initialized = result.data.models_initialized;
            AppState.algorithms = result.data.available_algorithms || [];
            
            this.updateIndicator(result.data);
            console.log('✅ System status updated:', result.data);
        } else {
            console.error('❌ Failed to check system status:', result.error);
            this.updateIndicator({ status: 'error', models_initialized: false });
        }
        
        return result;
    },
    
    updateIndicator(status) {
        const statusContainer = document.getElementById('systemStatus');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (!statusContainer || !statusDot || !statusText) return;
        
        let statusClass, statusMessage;
        
        if (status.models_initialized) {
            statusClass = 'online';
            const algoCount = Array.isArray(status.available_algorithms) 
                ? status.available_algorithms.length 
                : Object.keys(status.available_algorithms || {}).length;
            statusMessage = `System Ready (${algoCount} algorithms loaded)`;
        } else if (status.status === 'error') {
            statusClass = 'error';
            statusMessage = 'System Error - Please refresh page';
        } else {
            statusClass = 'offline';
            statusMessage = 'System Initializing...';
        }
        
        statusDot.className = `status-dot ${statusClass}`;
        statusText.textContent = statusMessage;
        statusContainer.style.display = 'block';
        
        // Auto-hide status if system is ready
        if (status.models_initialized) {
            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 3000);
        }
    }
};

// Navigation management
const Navigation = {
    init() {
        this.updateActiveState();
        this.initKeyboardShortcuts();
    },
    
    updateActiveState() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav a[data-nav]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in input/textarea
            if (e.target.matches('input, textarea, [contenteditable]')) return;
            
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'd':
                        e.preventDefault();
                        window.location.href = '/demonstrator';
                        break;
                    case 'p':
                        e.preventDefault();
                        window.location.href = '/performance';
                        break;
                    case 'h':
                        e.preventDefault();
                        window.location.href = '/';
                        break;
                    case 'a':
                        e.preventDefault();
                        window.location.href = '/about';
                        break;
                }
            }
        });
    }
};

// Footer functionality
const FooterActions = {
    init() {
        this.initDownloadResults();
        this.initCitationInfo();
        this.initPrivacyPolicy();
        this.initTermsOfUse();
    },
    
    initDownloadResults() {
        const downloadBtn = document.getElementById('downloadResults');
        if (!downloadBtn) return;
        
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            AppUtils.showAlert('Downloading performance results...', 'info', 2000);
            
            const result = await AppUtils.apiCall(AppState.endpoints.performanceData);
            
            if (result.success) {
                AppUtils.downloadJSON(result.data, 'algorithm_performance_results.json');
                AppUtils.showAlert('Results downloaded successfully!', 'success');
            } else {
                AppUtils.showAlert('Failed to download results: ' + result.error, 'error');
            }
        });
    },
    
    initCitationInfo() {
        const citationBtn = document.getElementById('citationInfo');
        if (!citationBtn) return;
        
        citationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCitationModal();
        });
    },
    
    showCitationModal() {
        const citation = `
Algorithm Performance Demonstrator (2025)
GitHub Repository: https://github.com/pr-rithwik/netflix-recommendation-engine
Part of the "Build Beyond" series - expanding course projects with systematic algorithm comparison.

BibTeX:
@misc{netflix_algorithm_demo_2025,
    title={Algorithm Performance Demonstrator for Collaborative Filtering},
    author={Pr-rithwik},
    year={2025},
    url={https://github.com/pr-rithwik/netflix-recommendation-engine},
    note={Build Beyond Series - Educational Research Tool}
}

Results Summary:
- Winner: KNN Item-based (0.467 RMSE)
- Fastest: SVD (0.20s training time)
- Dataset: 1200×1200 matrix, 22.8% sparsity
        `.trim();
        
        // Create a more sophisticated modal instead of alert
        this.showModal('Citation Information', citation);
    },
    
    showModal(title, content) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <pre>${content}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Close</button>
                    <button class="btn btn-primary" id="copyToClipboard">Copy to Clipboard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        const copyBtn = modal.querySelector('#copyToClipboard');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    AppUtils.showAlert('Citation copied to clipboard!', 'success');
                    modal.remove();
                }).catch(() => {
                    AppUtils.showAlert('Failed to copy to clipboard', 'error');
                });
            });
        }
    },
    
    initPrivacyPolicy() {
        const privacyBtn = document.getElementById('privacyPolicy');
        if (!privacyBtn) return;
        
        privacyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const policy = `
This educational research tool:
- Does not collect personal information
- Does not use cookies for tracking
- Stores no data beyond the current session
- All interactions are processed locally
- No data is transmitted to third parties

This is an open-source educational tool for learning about ML algorithms.
            `.trim();
            
            this.showModal('Privacy Policy', policy);
        });
    },
    
    initTermsOfUse() {
        const termsBtn = document.getElementById('termsOfUse');
        if (!termsBtn) return;
        
        termsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const terms = `
Terms of Use - Algorithm Performance Demonstrator

This tool is provided for educational and research purposes.

Usage Guidelines:
- Intended for learning about ML algorithms
- Not for production recommendation systems
- Results are for educational demonstration only
- Please cite if used in academic work

License: MIT License
Source: https://github.com/pr-rithwik/netflix-recommendation-engine

By using this tool, you acknowledge this is an educational demonstration
and not a production recommendation system.
            `.trim();
            
            this.showModal('Terms of Use', terms);
        });
    }
};

// Analytics and tracking
const Analytics = {
    init() {
        this.trackPageView();
        this.initEventTracking();
    },
    
    trackPageView() {
        console.log('📊 Page view:', window.location.pathname);
        // Add actual analytics tracking here if needed
    },
    
    initEventTracking() {
        // Track external link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="http"]') && !e.target.hostname.includes(window.location.hostname)) {
                console.log('🔗 External link clicked:', e.target.href);
                // Add analytics tracking here
            }
        });
        
        // Track button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn')) {
                console.log('🔘 Button clicked:', e.target.textContent?.trim() || e.target.className);
            }
        });
    }
};

// Main initialization
function initializeApp() {
    console.log('🚀 Algorithm Performance Demonstrator - Global Init');
    
    // Initialize all modules
    Navigation.init();
    FooterActions.init();
    Analytics.init();
    
    // Check system status
    SystemStatus.check();
    
    console.log('✅ Global initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for other scripts to use
window.AlgorithmDemo = {
    AppState,
    AppUtils,
    SystemStatus,
    Navigation,
    FooterActions,
    Analytics
};