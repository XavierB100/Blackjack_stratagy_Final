/**
 * Navigation JavaScript for About and other static pages
 */

import { Navigation } from './modules/Navigation.js';

class StaticPageApp {
    constructor() {
        this.navigation = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('📄 Initializing Static Page App...');
            
            // Initialize navigation
            this.navigation = new Navigation();
            await this.navigation.init();
            
            // Set up page-specific features
            this.setupPageFeatures();
            this.setupInteractivity();
            this.setupAccessibility();
            
            this.isInitialized = true;
            console.log('✅ Static Page App initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Static Page App:', error);
        }
    }

    setupPageFeatures() {
        // Set up collapsible sections
        this.setupCollapsibleSections();
        
        // Set up smooth scrolling for internal links
        this.setupSmoothScrolling();
        
        // Set up external link handling
        this.setupExternalLinks();
        
        // Set up copy-to-clipboard functionality
        this.setupCopyToClipboard();
    }

    setupCollapsibleSections() {
        // Add click handlers for expandable content
        document.querySelectorAll('.expandable-section').forEach(section => {
            const header = section.querySelector('.section-header');
            const content = section.querySelector('.section-content');
            
            if (header && content) {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const isExpanded = content.style.display !== 'none';
                    content.style.display = isExpanded ? 'none' : 'block';
                    
                    // Update header indicator
                    const indicator = header.querySelector('.expand-indicator');
                    if (indicator) {
                        indicator.textContent = isExpanded ? '+' : '-';
                    }
                });
            }
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without causing page jump
                    history.pushState(null, null, targetId);
                }
            });
        });
    }

    setupExternalLinks() {
        // Add external link indicators and security attributes
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            // Add external link indicator
            if (!link.querySelector('.external-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'external-indicator';
                indicator.innerHTML = ' ↗';
                indicator.style.fontSize = '0.8em';
                indicator.style.opacity = '0.7';
                link.appendChild(indicator);
            }
            
            // Ensure security attributes
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            
            // Add click confirmation for external links (optional)
            link.addEventListener('click', (e) => {
                if (link.hostname !== window.location.hostname) {
                    const confirmLeave = confirm(
                        `You are leaving BlackjackPro to visit:\n${link.href}\n\nDo you want to continue?`
                    );
                    if (!confirmLeave) {
                        e.preventDefault();
                    }
                }
            });
        });
    }

    setupCopyToClipboard() {
        // Add copy buttons for code blocks or specific content
        document.querySelectorAll('.copyable').forEach(element => {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy';
            copyButton.style.marginLeft = '10px';
            
            copyButton.addEventListener('click', async () => {
                try {
                    const textToCopy = element.textContent || element.innerText;
                    await navigator.clipboard.writeText(textToCopy);
                    
                    // Visual feedback
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text:', err);
                    
                    // Fallback for older browsers
                    this.fallbackCopyText(textToCopy);
                }
            });
            
            element.appendChild(copyButton);
        });
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('Text copied using fallback method');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    setupInteractivity() {
        // Add hover effects for interactive elements
        this.setupHoverEffects();
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Add search functionality if needed
        this.setupSearch();
        
        // Add print functionality
        this.setupPrint();
    }

    setupHoverEffects() {
        // Add hover effects for cards and interactive elements
        document.querySelectorAll('.feature-card, .step, .rule-card').forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-5px)';
                element.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
                element.style.boxShadow = '';
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + P for print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            
            // Ctrl/Cmd + F for search (if search is implemented)
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchElement = document.querySelector('#page-search');
                if (searchElement) {
                    e.preventDefault();
                    searchElement.focus();
                }
            }
            
            // Escape to close any open modals or overlays
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
        });
    }

    setupSearch() {
        const searchInput = document.querySelector('#page-search');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.clearSearchHighlights();
            return;
        }
        
        const searchElements = document.querySelectorAll('.content-section p, .content-section li, .content-section h3');
        let matchCount = 0;
        
        searchElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                this.highlightSearchTerm(element, query);
                matchCount++;
            }
        });
        
        this.showSearchResults(matchCount);
    }

    highlightSearchTerm(element, term) {
        const text = element.innerHTML;
        const regex = new RegExp(`(${term})`, 'gi');
        element.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    clearSearchHighlights() {
        document.querySelectorAll('.search-highlight').forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    showSearchResults(count) {
        let resultElement = document.querySelector('#search-results');
        
        if (!resultElement) {
            resultElement = document.createElement('div');
            resultElement.id = 'search-results';
            resultElement.style.position = 'fixed';
            resultElement.style.top = '10px';
            resultElement.style.right = '10px';
            resultElement.style.background = 'rgba(0, 0, 0, 0.8)';
            resultElement.style.color = '#ffd700';
            resultElement.style.padding = '10px';
            resultElement.style.borderRadius = '5px';
            resultElement.style.zIndex = '1000';
            document.body.appendChild(resultElement);
        }
        
        resultElement.textContent = count > 0 ? `Found ${count} match${count === 1 ? '' : 'es'}` : 'No matches found';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (resultElement.parentNode) {
                resultElement.parentNode.removeChild(resultElement);
            }
        }, 3000);
    }

    setupPrint() {
        // Add print-specific styling
        const printStyles = document.createElement('style');
        printStyles.textContent = `
            @media print {
                .no-print,
                .copy-btn,
                .external-indicator,
                #search-results {
                    display: none !important;
                }
                
                .feature-card,
                .step,
                .rule-card {
                    break-inside: avoid;
                    margin-bottom: 20px;
                }
                
                a[href^="http"]:after {
                    content: " (" attr(href) ")";
                    font-size: 0.8em;
                    color: #666;
                }
                
                .page-content {
                    max-width: none;
                    margin: 0;
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(printStyles);
        
        // Add print button if it exists
        const printButton = document.querySelector('.print-page-btn');
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }
    }

    setupAccessibility() {
        // Add skip navigation link
        this.addSkipLink();
        
        // Improve focus indicators
        this.improveFocusIndicators();
        
        // Add ARIA labels where needed
        this.addAriaLabels();
        
        // Add keyboard navigation for interactive elements
        this.addKeyboardNavigation();
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.position = 'absolute';
        skipLink.style.top = '-40px';
        skipLink.style.left = '6px';
        skipLink.style.background = '#000';
        skipLink.style.color = '#fff';
        skipLink.style.padding = '8px';
        skipLink.style.textDecoration = 'none';
        skipLink.style.zIndex = '1001';
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content ID if it doesn't exist
        const mainContent = document.querySelector('.page-content, main, .content-container');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    improveFocusIndicators() {
        const focusStyle = document.createElement('style');
        focusStyle.textContent = `
            .focus-visible {
                outline: 3px solid #ffd700 !important;
                outline-offset: 2px !important;
            }
            
            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            textarea:focus-visible,
            select:focus-visible {
                outline: 3px solid #ffd700 !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(focusStyle);
    }

    addAriaLabels() {
        // Add aria-labels to elements that need them
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            if (!card.getAttribute('aria-label')) {
                const heading = card.querySelector('h3');
                if (heading) {
                    card.setAttribute('aria-label', `Feature: ${heading.textContent}`);
                }
            }
        });
        
        // Add role attributes where appropriate
        document.querySelectorAll('.step').forEach(step => {
            step.setAttribute('role', 'listitem');
        });
        
        const stepsContainer = document.querySelector('.usage-steps');
        if (stepsContainer) {
            stepsContainer.setAttribute('role', 'list');
        }
    }

    addKeyboardNavigation() {
        // Make interactive elements keyboard accessible
        document.querySelectorAll('.feature-card, .step, .rule-card').forEach(element => {
            if (!element.getAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    element.click();
                }
            });
        });
    }

    closeAllOverlays() {
        // Close any open overlays, modals, or dropdowns
        document.querySelectorAll('.overlay, .modal, .dropdown-open').forEach(element => {
            element.style.display = 'none';
            element.classList.remove('active', 'open', 'dropdown-open');
        });
    }

    // Utility methods
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    getPageInfo() {
        return {
            title: document.title,
            url: window.location.href,
            sections: Array.from(document.querySelectorAll('h2')).map(h => ({
                id: h.id,
                text: h.textContent,
                level: 2
            }))
        };
    }

    // Add floating "back to top" button
    addBackToTopButton() {
        const backToTop = document.createElement('button');
        backToTop.innerHTML = '↑';
        backToTop.className = 'back-to-top';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.style.position = 'fixed';
        backToTop.style.bottom = '20px';
        backToTop.style.right = '20px';
        backToTop.style.width = '50px';
        backToTop.style.height = '50px';
        backToTop.style.border = 'none';
        backToTop.style.borderRadius = '50%';
        backToTop.style.background = '#ffd700';
        backToTop.style.color = '#000';
        backToTop.style.fontSize = '20px';
        backToTop.style.cursor = 'pointer';
        backToTop.style.display = 'none';
        backToTop.style.zIndex = '1000';
        
        backToTop.addEventListener('click', () => {
            this.scrollToTop();
        });
        
        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            backToTop.style.display = window.pageYOffset > 300 ? 'block' : 'none';
        });
        
        document.body.appendChild(backToTop);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Static page loaded');
    
    window.StaticPageApp = new StaticPageApp();
    await window.StaticPageApp.init();
});

export { StaticPageApp };