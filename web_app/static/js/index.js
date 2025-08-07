/**
 * Index Page Functionality - Algorithm Performance Demonstrator
 * Handles landing page interactions, system readiness, and engagement tracking
 */

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Algorithm Performance Demonstrator - Index Page');
    
    // Initialize all page functionality
    IndexPage.init();
});

// Main index page object
const IndexPage = {
    init() {
        this.checkSystemReadiness();
        this.initializePerformanceCards();
        this.initializeSmoothScrolling();
        this.initializeEngagementTracking();
        this.initializeQuickStats();
    },

    // Check if the system is ready and update CTAs accordingly
    async checkSystemReadiness() {
        try {
            const status = await window.AlgorithmDemo.SystemStatus.check();
            
            if (!status.success || !window.AppState.initialized) {
                this.disableCTAs('System is initializing algorithms, please wait...');
                window.AppUtils.showAlert('System is initializing algorithms, please wait...', 'info', 3000);
            } else {
                this.enableCTAs();
                this.updateQuickStats(status.data);
            }
        } catch (error) {
            console.error('Failed to check system readiness:', error);
            this.disableCTAs('System error, please refresh the page');
        }
    },

    // Disable CTA buttons when system isn't ready
    disableCTAs(message) {
        const ctaButtons = document.querySelectorAll('.btn[href*="demonstrator"]');
        ctaButtons.forEach(btn => {
            btn.classList.add('btn-disabled');
            btn.title = message;
            btn.style.pointerEvents = 'none';
        });
    },

    // Enable CTA buttons when system is ready
    enableCTAs() {
        const ctaButtons = document.querySelectorAll('.btn');
        ctaButtons.forEach(btn => {
            btn.classList.remove('btn-disabled');
            btn.removeAttribute('title');
            btn.style.pointerEvents = '';
        });
    },

    // Update quick stats with real system data
    updateQuickStats(systemData) {
        const quickStats = document.querySelector('.quick-stats p');
        if (quickStats && systemData.available_algorithms) {
            const algoCount = Array.isArray(systemData.available_algorithms) 
                ? systemData.available_algorithms.length 
                : Object.keys(systemData.available_algorithms).length;
            
            quickStats.innerHTML = `<strong>Ready to use:</strong> ${algoCount} algorithms loaded • 1.44M predictions available • Real-time comparison`;
        }
    },

    // Initialize performance card interactions
    initializePerformanceCards() {
        const performanceCards = document.querySelectorAll('.performance-card');
        
        performanceCards.forEach(card => {
            // Click effect
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                const algorithmName = this.querySelector('h4').textContent.trim();
                console.log('Performance card clicked:', algorithmName);
                
                // Could navigate to demonstrator with specific algorithm highlighted
                // window.location.href = '/demonstrator?highlight=' + encodeURIComponent(algorithmName);
            });
            
            // Hover effects for metrics
            const metrics = card.querySelectorAll('.metric');
            metrics.forEach(metric => {
                metric.addEventListener('mouseenter', function() {
                    this.style.fontWeight = 'bold';
                    this.style.color = '#5a67d8';
                });
                
                metric.addEventListener('mouseleave', function() {
                    this.style.fontWeight = '';
                    this.style.color = '';
                });
            });
        });
    },

    // Initialize smooth scrolling for anchor links
    initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    // Initialize engagement tracking
    initializeEngagementTracking() {
        const startTime = Date.now();
        let maxScroll = 0;
        
        // Track scroll depth
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            maxScroll = Math.max(maxScroll, scrollPercent);
        });
        
        // Track time on page and scroll depth on page unload
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            console.log(`📊 Index page metrics: ${timeOnPage}s, ${maxScroll}% scroll`);
        });
        
        // Track section visibility
        this.initializeSectionTracking();
    },

    // Track which sections users view
    initializeSectionTracking() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionTitle = entry.target.querySelector('h3')?.textContent?.trim() || 
                                       entry.target.querySelector('h2')?.textContent?.trim() || 
                                       'unknown section';
                    console.log('📍 Section viewed:', sectionTitle);
                    
                    // Mark section as viewed
                    entry.target.classList.add('section-viewed');
                }
            });
        }, { 
            threshold: 0.5,
            rootMargin: '-50px'
        });
        
        // Observe all cards and major sections
        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
        });
    },

    // Initialize quick stats updates
    initializeQuickStats() {
        const quickStatsElement = document.querySelector('.quick-stats');
        if (!quickStatsElement) return;
        
        // Add click handler to quick stats for system status
        quickStatsElement.addEventListener('click', async () => {
            const result = await window.AlgorithmDemo.SystemStatus.check();
            
            if (result.success) {
                window.AppUtils.showAlert(
                    `System Status: ${result.data.models_initialized ? 'Ready' : 'Initializing'}`, 
                    result.data.models_initialized ? 'success' : 'info'
                );
            } else {
                window.AppUtils.showAlert('Failed to check system status', 'error');
            }
        });
        
        // Make it look clickable
        quickStatsElement.style.cursor = 'pointer';
        quickStatsElement.title = 'Click to check system status';
    }
};

// Learning grid interactions
const LearningGrid = {
    init() {
        const learningItems = document.querySelectorAll('.learning-item');
        
        learningItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                const icon = this.querySelector('.learning-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.2) rotate(5deg)';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                const icon = this.querySelector('.learning-icon');
                if (icon) {
                    icon.style.transform = '';
                }
            });
        });
    }
};

// Process steps animation
const ProcessSteps = {
    init() {
        const steps = document.querySelectorAll('.step');
        
        // Add sequential animation when steps come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stepElements = entry.target.querySelectorAll('.step');
                    stepElements.forEach((step, index) => {
                        setTimeout(() => {
                            step.classList.add('animate-in');
                        }, index * 200);
                    });
                }
            });
        }, { threshold: 0.5 });
        
        const processSection = document.querySelector('.process-steps');
        if (processSection) {
            observer.observe(processSection);
        }
    }
};

// Series info interactions
const SeriesInfo = {
    init() {
        const evolutionSteps = document.querySelectorAll('.evolution-step');
        
        evolutionSteps.forEach((step, index) => {
            step.addEventListener('click', function() {
                this.classList.add('highlight');
                setTimeout(() => {
                    this.classList.remove('highlight');
                }, 1000);
                
                console.log(`Evolution step ${index + 1} clicked`);
            });
        });
    }
};

// Initialize all interactive features when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize additional interactive features
    LearningGrid.init();
    ProcessSteps.init();
    SeriesInfo.init();
});

// Export for potential use by other scripts
window.IndexPage = IndexPage;