/**
 * Main Application Entry Point
 * BlackjackPro - Blackjack Practice Application
 */

import { GameController } from './modules/GameController.js';
import { UIController } from './modules/UIController.js';
import { Navigation } from './modules/Navigation.js';
import { Statistics } from './modules/Statistics.js';
import { StrategyHints } from './modules/StrategyHints.js';

/**
 * Application Class - Main orchestrator
 */
class BlackjackApp {
    constructor() {
        this.gameController = null;
        this.uiController = null;
        this.navigation = null;
        this.statistics = null;
        this.strategyHints = null;
        
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🎰 Initializing BlackjackPro...');
            
            // Initialize core modules
            this.navigation = new Navigation();
            this.statistics = new Statistics();
            this.strategyHints = new StrategyHints();
            this.uiController = new UIController();
            this.gameController = new GameController(this.statistics, this.uiController, this.strategyHints);
            
            // Initialize all modules
            await this.navigation.init();
            await this.statistics.init();
            await this.strategyHints.init();
            await this.uiController.init();
            await this.gameController.init();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Load saved preferences
            this.loadUserPreferences();
            
            this.isInitialized = true;
            console.log('✅ BlackjackPro initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Failed to initialize BlackjackPro:', error);
            this.showErrorMessage('Failed to initialize the application. Please refresh the page.');
        }
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause game when tab is not visible
                this.gameController.pauseGame();
            }
        });

        // Handle before page unload
        window.addEventListener('beforeunload', () => {
            this.saveUserPreferences();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        if (!this.isInitialized || event.target.tagName === 'INPUT') return;

        const { key, ctrlKey, metaKey } = event;
        
        // Game controls (only when game is active)
        if (this.gameController.isGameActive()) {
            switch (key.toLowerCase()) {
                case 'h':
                    event.preventDefault();
                    this.gameController.hit();
                    break;
                case 's':
                    event.preventDefault();
                    this.gameController.stand();
                    break;
                case 'd':
                    event.preventDefault();
                    this.gameController.doubleDown();
                    break;
                case 'p':
                    event.preventDefault();
                    this.gameController.split();
                    break;
                case 'i':
                    event.preventDefault();
                    this.gameController.takeInsurance();
                    break;
                case ' ':
                    event.preventDefault();
                    this.gameController.dealNewHand();
                    break;
                case 'u':
                    event.preventDefault();
                    this.gameController.undoLastAction();
                    break;
                case '?':
                    event.preventDefault();
                    this.gameController.showHintModal();
                    break;
            }
        }

        // Global shortcuts
        switch (key.toLowerCase()) {
            case 'n':
                if (ctrlKey || metaKey) {
                    event.preventDefault();
                    this.gameController.startNewGame();
                }
                break;
            case 't':
                if (ctrlKey || metaKey) {
                    event.preventDefault();
                    this.gameController.showStatsModal();
                }
                break;
            case 'escape':
                event.preventDefault();
                this.uiController.hideModal();
                break;
            case 'f1':
                event.preventDefault();
                this.showKeyboardShortcuts();
                break;
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        if (this.uiController) {
            this.uiController.handleResize();
        }
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const preferences = localStorage.getItem('blackjackpro_preferences');
            if (preferences) {
                const prefs = JSON.parse(preferences);
                
                // Apply preferences to game controller
                if (this.gameController) {
                    this.gameController.setPreferences(prefs);
                }
                
                console.log('📋 User preferences loaded');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user preferences:', error);
        }
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        try {
            const preferences = {
                deckCount: this.gameController.getDeckCount(),
                showBasicStrategyHints: this.gameController.getShowHints(),
                cardCountingMode: this.gameController.getCardCountingMode(),
                bankAmount: this.statistics.getBankAmount(),
                lastBetAmount: this.gameController.getLastBetAmount(),
                soundEnabled: this.uiController.getSoundEnabled(),
                animationsEnabled: this.uiController.getAnimationsEnabled()
            };
            
            localStorage.setItem('blackjackpro_preferences', JSON.stringify(preferences));
            console.log('💾 User preferences saved');
        } catch (error) {
            console.warn('⚠️ Failed to save user preferences:', error);
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const message = `
            <div class="welcome-message">
                <h3>Welcome to BlackjackPro! 🎰</h3>
                <p>Your ultimate blackjack practice platform.</p>
                <ul>
                    <li>Press <kbd>N</kbd> to start a new game</li>
                    <li>Use <kbd>H</kbd>, <kbd>S</kbd>, <kbd>D</kbd>, <kbd>P</kbd> for game actions</li>
                    <li>Press <kbd>?</kbd> to see all keyboard shortcuts</li>
                </ul>
                <p>Good luck at the tables! 🍀</p>
            </div>
        `;
        
        this.uiController.showMessage(message, 'info', 5000);
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcuts() {
        const shortcuts = `
            <div class="shortcuts-help">
                <h3>Keyboard Shortcuts</h3>
                <div class="shortcuts-grid">
                    <div class="shortcut-group">
                        <h4>Game Actions</h4>
                        <ul>
                            <li><kbd>H</kbd> - Hit</li>
                            <li><kbd>S</kbd> - Stand</li>
                            <li><kbd>D</kbd> - Double Down</li>
                            <li><kbd>P</kbd> - Split</li>
                            <li><kbd>I</kbd> - Insurance</li>
                            <li><kbd>Space</kbd> - Deal New Hand</li>
                        </ul>
                    </div>
                    <div class="shortcut-group">
                        <h4>Game Controls</h4>
                        <ul>
                            <li><kbd>U</kbd> - Undo Last Action</li>
                            <li><kbd>?</kbd> - Show Strategy Hint</li>
                            <li><kbd>Ctrl+T</kbd> - Show Statistics</li>
                            <li><kbd>Escape</kbd> - Close Modal</li>
                        </ul>
                    </div>
                    <div class="shortcut-group">
                        <h4>General</h4>
                        <ul>
                            <li><kbd>Ctrl+N</kbd> - New Game</li>
                            <li><kbd>F1</kbd> - Show this help</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        this.uiController.showModal('Keyboard Shortcuts', shortcuts);
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorElement = document.getElementById('game-messages');
        if (errorElement) {
            errorElement.innerHTML = `<p class="error-message">❌ ${message}</p>`;
            errorElement.style.background = 'rgba(220, 38, 38, 0.2)';
            errorElement.style.borderColor = '#dc2626';
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: {
                gameController: !!this.gameController,
                uiController: !!this.uiController,
                navigation: !!this.navigation,
                statistics: !!this.statistics,
                strategyHints: !!this.strategyHints
            }
        };
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM loaded, starting BlackjackPro...');
    
    // Create global app instance
    window.BlackjackApp = new BlackjackApp();
    
    // Initialize the application
    await window.BlackjackApp.init();
});

/**
 * Handle any uncaught errors
 */
window.addEventListener('error', (event) => {
    console.error('🚨 Uncaught error:', event.error);
    
    // Show user-friendly error message
    const messageElement = document.getElementById('game-messages');
    if (messageElement && window.BlackjackApp) {
        messageElement.innerHTML = `
            <p class="error-message">
                ⚠️ An unexpected error occurred. Please refresh the page.
            </p>
        `;
    }
});

/**
 * Export for testing purposes
 */
export { BlackjackApp };