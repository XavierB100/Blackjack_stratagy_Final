/**
 * UI Controller - Modernized and optimized coordinator for UI operations
 * Now uses specialized modules: CardAnimations, ModalManager, and DOMHelpers
 * Reduced from 1,316 lines to ~200 lines with focused responsibility
 */

import { CardAnimations } from '../ui/CardAnimations.js';
import { ModalManager } from '../ui/ModalManager.js';
import { DOMHelpers } from '../ui/DOMHelpers.js';

export class UIController {
    constructor() {
        // Specialized modules
        this.animations = new CardAnimations();
        this.modals = new ModalManager();
        this.dom = new DOMHelpers();
        
        // Sound effects
        this.sounds = {
            enabled: false,
            cardFlip: null,
            win: null,
            lose: null
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize the UI controller
     */
    async init() {
        try {
            console.log('🖼️ Initializing UI Controller (Optimized)...');
            
            // Initialize specialized modules
            this.dom.cacheElements();
            this.modals.init();
            
            // Set up UI event listeners
            this.setupUIEventListeners();
            
            // Initialize UI state
            this.initializeUI();
            
            this.isInitialized = true;
            console.log('✅ UI Controller initialized with modular architecture');
        } catch (error) {
            console.error('❌ Failed to initialize UI Controller:', error);
            throw error;
        }
    }

    /**
     * Set up UI-specific event listeners
     */
    setupUIEventListeners() {
        // Settings change events
        document.addEventListener('settingsChanged', (e) => {
            this.handleSettingsChange(e.detail);
        });
    }

    /**
     * Initialize UI state
     */
    initializeUI() {
        // Clear all displays
        this.clearAll();
        
        // Set initial states
        this.setButtonState('deal-btn', true);
        this.setButtonState('new-game-btn', true);
        this.disableGameButtons();
        
        // Hide card counting display initially
        this.toggleCardCountingDisplay(false);
        
        // Show welcome message
        this.showMessage('Welcome to BlackjackPro! Click "New Game" to start.', 'info');
    }

    // ===== CARD OPERATIONS (delegated to CardAnimations) =====
    
    /**
     * Add card to dealer's hand
     */
    async addCardToDealer(card, faceUp = true) {
        const cardElement = this.animations.createCardElement(card, faceUp);
        this.dom.appendTo(cardElement, 'dealerCards');
        
        await this.animations.addDealingAnimation(cardElement);
        
        if (faceUp) {
            this.playCardSound();
        }
        
        return cardElement;
    }

    /**
     * Add card to player's hand
     */
    async addCardToPlayer(card, handIndex = 0, faceUp = true) {
        const cardElement = this.animations.createCardElement(card, faceUp);
        
        // Handle split hands
        const container = handIndex === 0 ? 
            this.dom.getElement('playerCards') : 
            this.dom.getElementById(`player-hand-${handIndex}`)?.querySelector('.hand-cards');
            
        if (container) {
            container.appendChild(cardElement);
            await this.animations.addDealingAnimation(cardElement);
            this.playCardSound();
        }
        
        return cardElement;
    }

    /**
     * Reveal dealer's hole card
     */
    async revealDealerHoleCard() {
        const holeCard = this.dom.getElement('dealerCards')?.querySelector('.card-back');
        if (holeCard && holeCard.dataset.hiddenCard) {
            const cardData = JSON.parse(holeCard.dataset.hiddenCard);
            await this.animations.flipCard(holeCard, cardData);
            this.playCardSound();
        }
    }

    /**
     * Add visual effect to cards
     */
    async addCardEffect(handIndex, effect) {
        const container = handIndex !== undefined ? 
            this.dom.getElementById(`player-hand-${handIndex}`) || this.dom.getElement('playerCards') :
            this.dom.getElement('dealerCards');
            
        return await this.animations.addCardEffect(container, effect);
    }

    /**
     * Highlight card for counting practice
     */
    highlightCardForCounting(cardElement, countValue) {
        this.animations.highlightCardForCounting(cardElement, countValue);
    }

    /**
     * Show result celebration
     */
    showResultCelebration(result, message) {
        return this.animations.showResultCelebration(result, message);
    }

    // ===== MODAL OPERATIONS (delegated to ModalManager) =====
    
    /**
     * Show message
     */
    showMessage(message, type = 'info', duration = 0) {
        this.modals.showMessage(message, type, duration);
    }

    /**
     * Clear message
     */
    clearMessage() {
        this.modals.clearMessage();
    }

    /**
     * Show strategy hint modal
     */
    showHintModal(hint) {
        this.modals.showStrategyHint(hint);
    }

    /**
     * Show statistics modal
     */
    showStatsModal(statsData) {
        this.modals.showStatsModal(statsData);
    }

    /**
     * Show settings modal
     */
    showSettingsModal(currentSettings) {
        this.modals.showSettingsModal(currentSettings);
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay(message) {
        this.modals.showLoadingOverlay(message);
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        this.modals.hideLoadingOverlay();
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, onConfirm, onCancel) {
        this.modals.showConfirmation(message, onConfirm, onCancel);
    }

    // ===== DOM OPERATIONS (delegated to DOMHelpers) =====
    
    /**
     * Clear all displays
     */
    clearAll() {
        this.clearDealer();
        this.clearPlayer();
        this.clearMessage();
    }

    /**
     * Clear dealer area
     */
    clearDealer() {
        this.dom.clearContainer('dealerCards');
        this.dom.updateText('dealerTotal', '');
    }

    /**
     * Clear player area
     */
    clearPlayer() {
        this.dom.clearContainer('playerCards');
        this.dom.updateText('playerTotal', '');
        
        // Remove split hands
        this.dom.findElements('.split-hand').forEach(hand => hand.remove());
        this.dom.removeClass('playerCards', 'split-layout');
    }

    /**
     * Update dealer total
     */
    updateDealerTotal(total, isBusted = false) {
        this.dom.updateDealerTotal(total, isBusted);
    }

    /**
     * Update player total
     */
    updatePlayerTotal(total, isBusted = false, handIndex = 0) {
        this.dom.updatePlayerTotal(total, isBusted, handIndex);
    }

    /**
     * Show split hands
     */
    showSplitHands(playerHands) {
        this.dom.showSplitHands(playerHands);
        this.animations.animateSplitHands(playerHands);
    }

    /**
     * Highlight current hand
     */
    highlightCurrentHand(handIndex) {
        this.dom.highlightCurrentHand(handIndex);
        this.animations.highlightCurrentHand(handIndex);
    }

    /**
     * Show hand result
     */
    showHandResult(handIndex, result, message) {
        this.dom.showHandResult(handIndex, result, message);
    }

    /**
     * Update game phase display
     */
    updateGamePhase(phase, message) {
        this.dom.updateGamePhase(phase, message);
    }

    // ===== STATISTICS AND DATA DISPLAY =====
    
    /**
     * Update game statistics display
     */
    updateGameStats(stats) {
        const updates = [
            { type: 'text', element: 'handsPlayed', value: stats.handsPlayed || 0 },
            { type: 'text', element: 'wins', value: stats.wins || 0 }
        ];

        // Win rate with color coding
        if (this.dom.getElement('winRate')) {
            const winRate = stats.handsPlayed > 0 ? 
                ((stats.wins / stats.handsPlayed) * 100).toFixed(1) : 0;
            updates.push({ type: 'text', element: 'winRate', value: `${winRate}%` });
        }

        // Bank amount with color coding
        if (this.dom.getElement('bank')) {
            const bankColor = (stats.bankAmount || 1000) >= 1000 ? '#22c55e' : '#ef4444';
            updates.push(
                { type: 'text', element: 'bank', value: `$${stats.bankAmount || 1000}` },
                { type: 'style', element: 'bank', property: 'color', value: bankColor }
            );
        }

        // Strategy accuracy with color coding
        if (this.dom.getElement('strategyAccuracy')) {
            const accuracy = stats.strategyAccuracy || 0;
            let accuracyColor = '#ef4444'; // Red for poor
            if (accuracy >= 90) accuracyColor = '#22c55e'; // Green for excellent
            else if (accuracy >= 80) accuracyColor = '#f59e0b'; // Yellow for good
            else if (accuracy >= 70) accuracyColor = '#f97316'; // Orange for fair
            
            updates.push(
                { type: 'text', element: 'strategyAccuracy', value: `${accuracy.toFixed(1)}%` },
                { type: 'style', element: 'strategyAccuracy', property: 'color', value: accuracyColor }
            );
        }

        // Strategy grade
        if (this.dom.getElement('strategyGrade')) {
            updates.push({ type: 'text', element: 'strategyGrade', value: stats.strategyGrade || 'N/A' });
        }

        // Batch update for performance
        this.dom.batchUpdate(updates);
    }

    /**
     * Update card counting display
     */
    updateCardCountingDisplay(countData) {
        const updates = [
            { type: 'text', element: 'runningCount', value: countData.running || 0 },
            { type: 'text', element: 'trueCount', value: (countData.true || 0).toFixed(1) },
            { type: 'text', element: 'decksRemaining', value: (countData.decksRemaining || 6).toFixed(1) }
        ];
        
        this.dom.batchUpdate(updates);
    }

    /**
     * Toggle card counting display visibility
     */
    toggleCardCountingDisplay(show) {
        const countCard = this.dom.findElement('.stats-card:last-child');
        if (countCard) {
            this.dom.setVisible('countCard', show);
        }
    }

    /**
     * Update current bet display
     */
    updateCurrentBet(amount) {
        this.dom.updateText('currentBet', amount);
        this.animations.animateChipSelection(amount);
    }

    /**
     * Update betting recommendations
     */
    updateBettingRecommendations(bettingData) {
        // This would update betting recommendation displays
        if (bettingData.recommendedBet !== bettingData.currentBet) {
            this.showMessage(
                `Recommended bet: $${bettingData.recommendedBet} (Current: $${bettingData.currentBet})`, 
                'info', 
                3000
            );
        }
    }

    // ===== BUTTON AND CONTROL MANAGEMENT =====
    
    /**
     * Set button enabled/disabled state
     */
    setButtonState(buttonId, enabled) {
        this.dom.setButtonState(buttonId, enabled);
    }

    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, loading) {
        this.dom.setButtonLoading(buttonId, loading);
        this.animations.setButtonLoading(buttonId, loading);
    }

    /**
     * Disable all game action buttons
     */
    disableGameButtons() {
        const gameButtons = ['hit-btn', 'stand-btn', 'double-btn', 'split-btn', 'insurance-btn'];
        gameButtons.forEach(buttonId => this.setButtonState(buttonId, false));
    }

    /**
     * Enable game buttons based on availability
     */
    enableGameButtons(availableActions = []) {
        const buttonMap = {
            'hit': 'hit-btn',
            'stand': 'stand-btn',
            'doubleDown': 'double-btn',
            'split': 'split-btn',
            'insurance': 'insurance-btn'
        };
        
        Object.entries(buttonMap).forEach(([action, buttonId]) => {
            const isAvailable = availableActions.some(a => a.action === action);
            this.setButtonState(buttonId, isAvailable);
        });
    }

    // ===== SOUND EFFECTS =====
    
    /**
     * Play card sound effect
     */
    playCardSound() {
        if (this.sounds.enabled && this.sounds.cardFlip) {
            this.sounds.cardFlip.currentTime = 0;
            this.sounds.cardFlip.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }

    /**
     * Set sound enabled/disabled
     */
    setSoundEnabled(enabled) {
        this.sounds.enabled = enabled;
        console.log(`🔊 Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    }

    // ===== ANIMATION CONTROLS =====
    
    /**
     * Set animations enabled/disabled
     */
    setAnimationsEnabled(enabled) {
        this.animations.setEnabled(enabled);
        console.log(`🎬 Animations ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update animation speed based on game speed setting
     */
    setAnimationSpeed(speed) {
        const speedSettings = {
            'instant': false,
            'fast': true,
            'normal': true,
            'slow': true
        };
        
        this.animations.setEnabled(speedSettings[speed] !== false);
        
        // Update timing multipliers
        const multipliers = {
            'instant': 0,
            'fast': 0.3,
            'normal': 1,
            'slow': 2
        };
        
        this.animations.timings = Object.fromEntries(
            Object.entries(this.animations.timings).map(([key, value]) => 
                [key, Math.round(value * (multipliers[speed] || 1))]
            )
        );
    }

    // ===== ADVANCED UI FEATURES =====
    
    /**
     * Show index play recommendation
     */
    showIndexPlayRecommendation(indexPlay) {
        if (indexPlay.hasDeviation) {
            this.showMessage(
                `Index Play: ${indexPlay.reason}`, 
                'hint', 
                4000
            );
        }
    }

    /**
     * Update counting mode indicator
     */
    updateCountingModeIndicator(countingEnabled, practiceMode) {
        const indicator = this.dom.getElementById('counting-indicator');
        if (indicator) {
            indicator.textContent = countingEnabled ? 
                (practiceMode ? '📚 Practice Mode' : '🧮 Counting Mode') : '';
            indicator.className = `counting-indicator ${countingEnabled ? 'active' : ''}`;
        }
    }

    /**
     * Show heat warning for card counting
     */
    showHeatWarning(suggestions) {
        const warnings = suggestions.filter(s => s.level === 'high');
        if (warnings.length > 0) {
            this.showMessage(
                `⚠️ Heat Warning: ${warnings[0].message}`,
                'warning',
                5000
            );
        }
    }

    // ===== EVENT HANDLERS =====
    
    /**
     * Handle settings change
     */
    handleSettingsChange(settings) {
        if (settings.soundEffects !== undefined) {
            this.setSoundEnabled(settings.soundEffects);
        }
        
        if (settings.gameSpeed) {
            this.setAnimationSpeed(settings.gameSpeed);
        }
        
        if (settings.cardCountingMode !== undefined) {
            this.toggleCardCountingDisplay(settings.cardCountingMode);
        }
    }

    // ===== UTILITY METHODS =====
    
    /**
     * Check if UI is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Get UI module for external access
     */
    getModule(moduleName) {
        const modules = {
            'animations': this.animations,
            'modals': this.modals,
            'dom': this.dom
        };
        return modules[moduleName];
    }

    // ===== CLEANUP =====
    
    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Cleaning up UI Controller...');
        
        // Cleanup modules
        this.dom.cleanup();
        this.modals.hideActiveModal();
        
        // Reset state
        this.isInitialized = false;
        
        console.log('✅ UI Controller cleanup complete');
    }
}