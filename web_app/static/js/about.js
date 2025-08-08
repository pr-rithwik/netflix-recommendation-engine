/**
 * About Page Functionality - Algorithm Performance Demonstrator
 * Handles interactive elements, algorithm details, and educational content
 */

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 About Page - Algorithm Performance Demonstrator');
    
    // Initialize all about page functionality
    AboutPage.init();
});

// Main about page object
const AboutPage = {
    init() {
        this.initializeAlgorithmDetails();
        this.initializeTimelineInteraction();
        this.initializePerformanceIndicators();
        this.initializeTechnicalPaper();
        this.initializeResourceLinks();
        this.initializeExpandableContent();
        this.initializeProgressTracking();
    },

    // Initialize algorithm detail interactions
    initializeAlgorithmDetails() {
        const algorithmDetails = document.querySelectorAll('.algorithm-detail');
        
        algorithmDetails.forEach((detail, index) => {
            // Add click to expand/collapse
            detail.addEventListener('click', function(e) {
                // Don't trigger on link clicks
                if (e.target.tagName === 'A') return;
                
                this.classList.toggle('expanded');
                
                // Visual feedback
                const header = this.querySelector('.algorithm-header');
                if (header) {
                    header.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        header.style.transform = '';
                    }, 150);
                }
                
                console.log(`Algorithm detail ${index + 1} toggled`);
            });
            
            // Add hover effects for performance indicators
            const indicator = detail.querySelector('.performance-indicator');
            if (indicator) {
                indicator.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.1)';
                    this.style.boxShadow = '0 4px 12px rgba(90, 103, 216, 0.3)';
                });
                
                indicator.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '';
                });
            }
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focused = document.activeElement;
                if (focused.classList.contains('algorithm-detail')) {
                    e.preventDefault();
                    focused.click();
                }
            }
        });
    },

    // Initialize timeline interaction
    initializeTimelineInteraction() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        timelineItems.forEach((item, index) => {
            // Add click interaction
            item.addEventListener('click', function() {
                // Remove active from all items
                timelineItems.forEach(ti => ti.classList.remove('active'));
                
                // Add active to clicked item
                this.classList.add('active');
                
                // Animate marker
                const marker = this.querySelector('.timeline-marker');
                if (marker) {
                    marker.style.transform = 'scale(1.2) rotate(5deg)';
                    setTimeout(() => {
                        marker.style.transform = '';
                    }, 300);
                }
                
                console.log(`Timeline phase ${index + 1} selected`);
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = 'translateX(10px)';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = '';
                }
            });
        });
        
        // Animate timeline items on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.3 });
        
        timelineItems.forEach(item => observer.observe(item));
    },

    // Initialize performance indicator interactions
    initializePerformanceIndicators() {
        const indicators = document.querySelectorAll('.performance-indicator');
        
        indicators.forEach(indicator => {
            indicator.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Show tooltip with performance details
                const tooltipText = this.getTooltipText(this.textContent.trim());
                AboutPage.showTooltip(this, tooltipText);
                
                console.log('Performance indicator clicked:', this.textContent.trim());
            });
        });
    },

    // Get tooltip text for performance indicators
    getTooltipText(indicatorType) {
        const tooltips = {
            'Winner': 'Best overall RMSE (0.467) and R² Score (0.789) across all algorithms',
            'Strong': 'Second-best performance with solid accuracy and reasonable training time',
            'Fastest': 'Fastest training time (0.20s) with competitive accuracy - excellent speed-accuracy trade-off',
            'Interpretable': 'Provides meaningful user segments and explainable recommendations through clustering',
            'Specialized': 'Non-negative constraints enable interpretable factors but limit performance flexibility',
            'Baseline': 'Simple approach that establishes minimum performance threshold for comparison'
        };
        
        return tooltips[indicatorType] || 'Performance classification based on systematic evaluation';
    },

    // Show tooltip
    showTooltip(element, text) {
        // Remove existing tooltips
        document.querySelectorAll('.performance-tooltip').forEach(t => t.remove());
        
        const tooltip = document.createElement('div');
        tooltip.className = 'performance-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.bottom + 10 + 'px';
        
        // Auto-remove after 3 seconds
        setTimeout(() => tooltip.remove(), 3000);
    },

    // Initialize technical paper modal
    initializeTechnicalPaper() {
        const technicalPaperLink = document.getElementById('technicalPaper');
        
        if (technicalPaperLink) {
            technicalPaperLink.addEventListener('click', function(e) {
                e.preventDefault();
                AboutPage.showTechnicalPaperModal();
            });
        }
    },

    // Show technical paper modal
    showTechnicalPaperModal() {
        const paperContent = `
# Algorithm Performance Comparison: Collaborative Filtering Approaches

## Abstract
This technical report presents a systematic comparison of 6 machine learning algorithms for collaborative filtering on a Netflix-style dataset. Through rigorous evaluation using RMSE, MAE, and R² metrics, we demonstrate that simple neighbor-based approaches can outperform complex matrix factorization methods under specific conditions.

## Key Findings
1. **KNN Item-based achieved best performance** (0.467 RMSE, 0.789 R²)
2. **SVD offers optimal speed-accuracy trade-off** (0.502 RMSE in 0.20s)
3. **Algorithm complexity ≠ Performance superiority**
4. **Sparsity handling varies significantly** across method families

## Methodology
- Dataset: 1200×1200 matrix, 22.8% density, 1.11M observed ratings
- Metrics: RMSE (primary), MAE, R² Score, Training Time
- Validation: Consistent train/test splits, systematic hyperparameter selection
- Implementation: Scikit-learn with custom evaluation framework

## Statistical Results
| Algorithm | RMSE | MAE | R² | Time | Rank |
|-----------|------|-----|----|----- |----- |
| KNN Item  | 0.467| 0.160| 0.789| 4.93s| #1 |
| KNN User  | 0.498| 0.173| 0.760| 4.57s| #2 |
| SVD       | 0.502| 0.176| 0.757| 0.20s| #3 |
| EM Cluster| 0.503| 0.176| 0.756| 1.39s| #4 |
| Mean Base | 0.508| 0.179| 0.750| 0.06s| #5 |
| NMF       | 0.882| 0.366| 0.247| 7.86s| #6 |

## Implications for Practice
- Simple baselines (mean imputation) are surprisingly competitive
- Item-based CF may be preferable to user-based for stable catalogs
- SVD should be considered for latency-critical applications
- EM clustering provides best interpretability-performance balance

## Limitations
- Results specific to this dataset configuration
- No evaluation of recommendation diversity or novelty
- Hyperparameters chosen for demonstration, not optimization
- Cold-start scenarios not extensively tested

## Reproducibility
Complete code, data preprocessing steps, and evaluation framework available at:
https://github.com/pr-rithwik/netflix-recommendation-engine

## Citation
Algorithm Performance Demonstrator (2025). Build Beyond Series.
GitHub: pr-rithwik/netflix-recommendation-engine
        `;
        
        // Use the global modal from base.js
        if (window.AlgorithmDemo && window.AlgorithmDemo.FooterActions) {
            window.AlgorithmDemo.FooterActions.showModal('Technical Report', paperContent);
        } else {
            alert('Technical report functionality loading...');
        }
    },

    // Initialize resource link tracking
    initializeResourceLinks() {
        const resourceLinks = document.querySelectorAll('.resource-category a');
        
        resourceLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const linkText = this.textContent.trim();
                const isExternal = this.hostname !== window.location.hostname;
                
                console.log(`Resource link clicked: ${linkText} (${isExternal ? 'external' : 'internal'})`);
                
                // Add visual feedback for external links
                if (isExternal) {
                    this.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 200);
                }
            });
        });
    },

    // Initialize expandable content sections
    initializeExpandableContent() {
        const expandableHeaders = document.querySelectorAll('.methodology-list, .specs-grid');
        
        expandableHeaders.forEach(content => {
            const parent = content.parentElement;
            const header = parent.querySelector('h4');
            
            if (header) {
                header.style.cursor = 'pointer';
                header.title = 'Click to expand/collapse';
                
                header.addEventListener('click', function() {
                    content.classList.toggle('collapsed');
                    
                    // Add arrow indicator
                    const arrow = this.querySelector('.expand-arrow') || document.createElement('span');
                    arrow.className = 'expand-arrow';
                    arrow.textContent = content.classList.contains('collapsed') ? ' ▶' : ' ▼';
                    this.appendChild(arrow);
                });
            }
        });
    },

    // Initialize reading progress tracking
    initializeProgressTracking() {
        const sections = document.querySelectorAll('.card h3');
        const progressItems = [];
        
        // Create progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.className = 'reading-progress';
        progressContainer.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div>';
        document.body.appendChild(progressContainer);
        
        // Track section visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionTitle = entry.target.textContent.trim();
                
                if (entry.isIntersecting) {
                    if (!progressItems.includes(sectionTitle)) {
                        progressItems.push(sectionTitle);
                        console.log(`📖 Section read: ${sectionTitle}`);
                    }
                }
                
                // Update progress bar
                const progress = (progressItems.length / sections.length) * 100;
                const progressFill = document.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
            });
        }, { threshold: 0.5 });
        
        sections.forEach(section => observer.observe(section));
        
        // Hide progress bar when reading is complete
        setTimeout(() => {
            if (progressItems.length === sections.length) {
                progressContainer.style.opacity = '0';
                setTimeout(() => progressContainer.remove(), 1000);
            }
        }, 10000);
    }
};

// Goals grid interactions
const GoalsGrid = {
    init() {
        const goalItems = document.querySelectorAll('.goal-item');
        
        goalItems.forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                // Highlight effect
                this.style.transform = 'translateY(-5px) scale(1.02)';
                
                // Icon animation
                const icon = this.querySelector('.goal-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.2) rotate(10deg)';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = '';
                
                const icon = this.querySelector('.goal-icon');
                if (icon) {
                    icon.style.transform = '';
                }
            });
            
            // Click to highlight key points
            item.addEventListener('click', function() {
                // Remove highlight from others
                goalItems.forEach(gi => gi.classList.remove('highlighted'));
                
                // Highlight this one
                this.classList.add('highlighted');
                
                console.log(`Goal ${index + 1} highlighted:`, this.querySelector('h4').textContent);
            });
        });
    }
};

// Findings section interactions
const FindingsSection = {
    init() {
        const findingItems = document.querySelectorAll('.finding-item');
        
        findingItems.forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('expanded');
                
                // Scroll into view if expanded
                if (this.classList.contains('expanded')) {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
        
        // Add intersection observer for auto-expansion
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
                    setTimeout(() => {
                        entry.target.classList.add('highlighted');
                    }, 500);
                }
            });
        }, { threshold: 0.8 });
        
        findingItems.forEach(item => observer.observe(item));
    }
};

// Initialize additional interactive features
document.addEventListener('DOMContentLoaded', function() {
    GoalsGrid.init();
    FindingsSection.init();
});

// Export for potential use by other scripts
window.AboutPage = AboutPage;