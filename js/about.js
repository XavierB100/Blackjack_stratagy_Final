/**
 * About Page JavaScript
 * Handles interactive learning paths and feature demonstrations
 */

import { Navigation } from './modules/Navigation.js';

class AboutPageApp {
    constructor() {
        this.navigation = null;
        this.currentPath = 'beginner';
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('📖 Initializing About page...');
            
            // Initialize navigation
            this.navigation = new Navigation();
            await this.navigation.init();
            
            // Set up page-specific functionality
            this.setupLearningPaths();
            this.setupDemoCards();
            this.setupInteractiveElements();
            
            this.isInitialized = true;
            console.log('✅ About page initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize About page:', error);
        }
    }

    setupLearningPaths() {
        const pathButtons = document.querySelectorAll('.path-btn');
        const learningPaths = document.querySelectorAll('.learning-path');

        pathButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pathType = button.dataset.path;
                this.switchLearningPath(pathType);
                
                // Update button states
                pathButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update path visibility
                learningPaths.forEach(path => {
                    path.style.display = 'none';
                    path.classList.remove('active');
                });
                
                const targetPath = document.getElementById(`${pathType}-path`);
                if (targetPath) {
                    targetPath.style.display = 'block';
                    targetPath.classList.add('active');
                }
                
                this.currentPath = pathType;
            });
        });
    }

    switchLearningPath(pathType) {
        console.log(`Switching to ${pathType} learning path`);
        
        // Add analytics or tracking here if needed
        this.trackPathSwitch(pathType);
        
        // Scroll to the new path smoothly
        setTimeout(() => {
            const targetPath = document.getElementById(`${pathType}-path`);
            if (targetPath) {
                targetPath.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    setupDemoCards() {
        const demoCards = document.querySelectorAll('.demo-card');
        
        demoCards.forEach(card => {
            // Add hover animations for non-touch devices
            if (!this.isTouchDevice()) {
                card.addEventListener('mouseenter', () => {
                    this.animateDemoCard(card, 'enter');
                });
                
                card.addEventListener('mouseleave', () => {
                    this.animateDemoCard(card, 'leave');
                });
            }
            
            // Add click tracking for demo links
            const demoLink = card.querySelector('.demo-link');
            if (demoLink) {
                demoLink.addEventListener('click', (e) => {
                    const feature = card.querySelector('.demo-header h3')?.textContent || 'Unknown';
                    this.trackDemoClick(feature, demoLink.href);
                });
            }
        });
    }

    animateDemoCard(card, action) {
        const mockElements = card.querySelectorAll('.mock-card, .chart-cell, .count-display');
        
        if (action === 'enter') {
            mockElements.forEach((element, index) => {
                setTimeout(() => {
                    element.style.transform = 'scale(1.05)';
                    element.style.transition = 'transform 0.2s ease';
                }, index * 50);
            });
        } else {
            mockElements.forEach(element => {
                element.style.transform = '';
                element.style.transition = 'transform 0.2s ease';
            });
        }
    }

    setupInteractiveElements() {
        // Add keyboard shortcuts for learning paths
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key >= '1' && e.key <= '3') {
                e.preventDefault();
                const pathIndex = parseInt(e.key) - 1;
                const paths = ['beginner', 'intermediate', 'advanced'];
                if (paths[pathIndex]) {
                    const pathButton = document.querySelector(`[data-path="${paths[pathIndex]}"]`);
                    if (pathButton) pathButton.click();
                }
            }
        });

        // Add scroll progress indicator for timeline items
        this.setupTimelineAnimation();
        
        // Add estimated time calculator
        this.setupTimeCalculator();
    }

    setupTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                        
                        const marker = entry.target.querySelector('.timeline-marker');
                        if (marker) {
                            setTimeout(() => {
                                marker.style.transform = 'scale(1.2)';
                                setTimeout(() => {
                                    marker.style.transform = '';
                                }, 200);
                            }, 100);
                        }
                    }
                });
            }, {
                threshold: 0.3
            });

            timelineItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-30px)';
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(item);
            });
        }
    }

    setupTimeCalculator() {
        const pathButtons = document.querySelectorAll('.path-btn');
        
        pathButtons.forEach(button => {
            const originalText = button.textContent;
            
            button.addEventListener('mouseenter', () => {
                if (!this.isTouchDevice()) {
                    const pathType = button.dataset.path;
                    const totalTime = this.calculateTotalTime(pathType);
                    button.textContent = `${originalText} (${totalTime})`;
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (!this.isTouchDevice()) {
                    button.textContent = originalText;
                }
            });
        });
    }

    calculateTotalTime(pathType) {
        const timeMappings = {
            'beginner': '16-25 hours',
            'intermediate': '30-47 hours', 
            'advanced': '37-53 hours + ongoing'
        };
        
        return timeMappings[pathType] || 'Variable';
    }

    trackPathSwitch(pathType) {
        // Analytics tracking for path switches
        console.log(`📊 Learning path switched to: ${pathType}`);
        
        // Store user preference in localStorage
        try {
            localStorage.setItem('preferredLearningPath', pathType);
        } catch (error) {
            console.warn('Could not save learning path preference:', error);
        }
    }

    trackDemoClick(feature, url) {
        console.log(`🎯 Demo clicked: ${feature} -> ${url}`);
        
        // Could send analytics data here
        // analytics.track('demo_clicked', { feature, url });
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Method to programmatically switch paths (for external use)
    switchToPath(pathType) {
        const pathButton = document.querySelector(`[data-path="${pathType}"]`);
        if (pathButton) {
            pathButton.click();
        }
    }

    // Method to get current learning path
    getCurrentPath() {
        return this.currentPath;
    }

    // Method to get recommended path based on user progress
    getRecommendedPath() {
        // This could check game statistics or user preferences
        try {
            const savedPath = localStorage.getItem('preferredLearningPath');
            if (savedPath) return savedPath;
            
            // Check if user has played games before
            const gameStats = localStorage.getItem('blackjack-stats');
            if (gameStats) {
                const stats = JSON.parse(gameStats);
                if (stats.handsPlayed > 100) {
                    return 'intermediate';
                } else if (stats.handsPlayed > 500) {
                    return 'advanced';
                }
            }
        } catch (error) {
            console.warn('Could not determine recommended path:', error);
        }
        
        return 'beginner';
    }

    // Method to show path recommendation on page load
    showRecommendedPath() {
        const recommendedPath = this.getRecommendedPath();
        
        if (recommendedPath !== 'beginner') {
            const notification = document.createElement('div');
            notification.className = 'path-recommendation';
            notification.innerHTML = `
                <div class="recommendation-content">
                    <h4>Recommended for you</h4>
                    <p>Based on your progress, we recommend the <strong>${recommendedPath}</strong> path.</p>
                    <button class="btn btn-secondary btn-sm" onclick="window.AboutPageApp.switchToPath('${recommendedPath}')">
                        Switch to ${recommendedPath}
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="this.parentNode.parentNode.remove()">
                        Dismiss
                    </button>
                </div>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(184, 134, 11, 0.95));
                color: #000;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                max-width: 300px;
                animation: slideInRight 0.5s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutRight 0.5s ease';
                    setTimeout(() => notification.remove(), 500);
                }
            }, 10000);
        }
    }
}

// Add CSS for path recommendation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .path-recommendation .recommendation-content {
        text-align: left;
    }
    
    .path-recommendation h4 {
        color: #000;
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }
    
    .path-recommendation p {
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }
    
    .path-recommendation .btn {
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .btn-ghost {
        background: transparent;
        color: #000;
        border: 1px solid rgba(0, 0, 0, 0.3);
    }
    
    .btn-ghost:hover {
        background: rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 About page loaded');
    
    window.AboutPageApp = new AboutPageApp();
    await window.AboutPageApp.init();
    
    // Show recommended path after a short delay
    setTimeout(() => {
        window.AboutPageApp.showRecommendedPath();
    }, 2000);
});

export { AboutPageApp };