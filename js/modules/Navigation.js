/**
 * Navigation Module - Handles mobile navigation and page interactions
 */

export class Navigation {
    constructor() {
        this.isInitialized = false;
        this.isMobileMenuOpen = false;
    }

    /**
     * Initialize navigation
     */
    async init() {
        try {
            console.log('🧭 Initializing Navigation...');
            
            this.setupMobileMenu();
            this.setupActiveNavigation();
            this.setupSmoothScrolling();
            
            this.isInitialized = true;
            console.log('✅ Navigation initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Navigation:', error);
            throw error;
        }
    }

    /**
     * Set up mobile hamburger menu
     */
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
            
            // Close menu when clicking on nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isMobileMenuOpen) {
                        this.closeMobileMenu();
                    }
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isMobileMenuOpen && 
                    !hamburger.contains(e.target) && 
                    !navMenu.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
            
            // Prevent body scrolling when menu is open
            document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : 'auto';
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            this.isMobileMenuOpen = false;
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Set up active navigation highlighting
     */
    setupActiveNavigation() {
        // Get current page from URL
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page link
        const activeLink = document.querySelector(`.nav-link[href="${currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Set up smooth scrolling for anchor links
     */
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
                }
            });
        });
    }

    /**
     * Highlight navigation based on scroll position
     */
    updateNavigationOnScroll() {
        // This would be used for single-page applications
        // with multiple sections on one page
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom > 100) {
                currentSection = section.id;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Add scroll listener for navigation updates
     */
    enableScrollNavigation() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateNavigationOnScroll();
            }, 100);
        });
    }

    /**
     * Navigate to a specific page
     */
    navigateTo(page) {
        if (typeof page === 'string') {
            window.location.href = page;
        }
    }

    /**
     * Check if we're on mobile
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu if window becomes larger
        if (!this.isMobile() && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    /**
     * Set up resize listener
     */
    enableResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * Add breadcrumb navigation
     */
    addBreadcrumbs(items) {
        const breadcrumbContainer = document.querySelector('.breadcrumbs');
        if (!breadcrumbContainer) return;
        
        const breadcrumbHTML = items.map((item, index) => {
            const isLast = index === items.length - 1;
            return isLast ? 
                `<span class="breadcrumb-current">${item.text}</span>` :
                `<a href="${item.url}" class="breadcrumb-link">${item.text}</a>`;
        }).join(' <span class="breadcrumb-separator">›</span> ');
        
        breadcrumbContainer.innerHTML = breadcrumbHTML;
    }

    /**
     * Show navigation loading state
     */
    showLoadingState() {
        document.body.classList.add('nav-loading');
    }

    /**
     * Hide navigation loading state
     */
    hideLoadingState() {
        document.body.classList.remove('nav-loading');
    }

    /**
     * Add keyboard navigation support
     */
    enableKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys for quick navigation
            if (e.altKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                
                const navLinks = document.querySelectorAll('.nav-link');
                const index = parseInt(e.key) - 1;
                
                if (navLinks[index]) {
                    navLinks[index].click();
                }
            }
            
            // Escape to close mobile menu
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        // Add focus indicators for keyboard navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('focus', () => {
                link.classList.add('keyboard-focus');
            });
            
            link.addEventListener('blur', () => {
                link.classList.remove('keyboard-focus');
            });
        });
    }

    /**
     * Get current page information
     */
    getCurrentPage() {
        return {
            path: window.location.pathname,
            filename: window.location.pathname.split('/').pop(),
            hash: window.location.hash,
            search: window.location.search
        };
    }

    /**
     * Check if navigation is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}