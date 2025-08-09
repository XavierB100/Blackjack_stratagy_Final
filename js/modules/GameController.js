/**
 * GameController - Refactored coordinator using specialized modules
 * Reduced from 1,274 lines by extracting GameState, ActionHandler, and GameFlow
 * Now focuses on coordination and delegation rather than implementation
 */

import { Deck } from './Deck.js';
import { Hand } from './Hand.js';
import { GameRules } from './GameRules.js';
import { CardCounting } from './CardCounting.js';
import { GameState } from '../game/GameState.js';
import { ActionHandler } from '../game/ActionHandler.js';
import { GameFlow } from '../game/GameFlow.js';

export class GameController {
    constructor(statistics, uiController, strategyHints) {
        this.statistics = statistics;
        this.ui = uiController;
        this.strategyHints = strategyHints;
        
        // Initialize specialized modules
        this.gameState = new GameState();
        this.cardCounting = new CardCounting();
        this.rules = new GameRules();
        
        // Core game objects
        this.deck = null;
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        
        // Initialize coordinating modules (will set deck after init)
        this.actionHandler = null;
        this.gameFlow = null;
        
        this.isInitialized = false;
    }

    /**
     * Initialize the game controller
     */
    async init() {
        try {
            console.log('🎮 Initializing GameController (Optimized)...');
            
            // Initialize game state
            this.gameState.init();
            
            // Initialize deck and hands
            this.initializeGameObjects();
            
            // Initialize coordinating modules with deck reference
            this.actionHandler = new ActionHandler(
                this.gameState, this.deck, this.ui, this.statistics, this.rules, this.cardCounting
            );
            this.gameFlow = new GameFlow(
                this.gameState, this.deck, this.ui, this.statistics, this.rules, this.cardCounting
            );
            // Allow GameFlow to delegate to ActionHandler where needed
            this.gameFlow.actionHandler = this.actionHandler;
            
            // Initialize card counting module
            await this.cardCounting.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update game references in modules
            this.updateModuleReferences();
            
            this.isInitialized = true;
            console.log('✅ GameController initialized with modular architecture');
        } catch (error) {
            console.error('❌ Failed to initialize GameController:', error);
            throw error;
        }
    }

    /**
     * Initialize core game objects
     */
    initializeGameObjects() {
        this.deck = new Deck(this.gameState.getSetting('deckCount'));
        this.deck.shuffle();
        
        this.dealerHand = new Hand();
        this.playerHands = [new Hand()];
        this.currentHandIndex = 0;
        
        this.ui.clearAll();
        this.ui.showMessage('Welcome! Click "New Game" to start.', 'info');
    }

    /**
     * Update module references with current game objects
     */
    updateModuleReferences() {
        this.actionHandler.updateGameRefs(this.dealerHand, this.playerHands, this.currentHandIndex);
        this.gameFlow.updateGameRefs(this.dealerHand, this.playerHands, this.currentHandIndex);
    }

    /**
     * Set up event listeners for game controls
     */
    setupEventListeners() {
        // Main game buttons
        document.getElementById('new-game-btn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('deal-btn')?.addEventListener('click', () => this.dealNewHand());
        
        // Player action buttons (delegate to ActionHandler)
        document.getElementById('hit-btn')?.addEventListener('click', () => this.executePlayerAction('hit'));
        document.getElementById('stand-btn')?.addEventListener('click', () => this.executePlayerAction('stand'));
        document.getElementById('double-btn')?.addEventListener('click', () => this.executePlayerAction('doubleDown'));
        document.getElementById('split-btn')?.addEventListener('click', () => this.executePlayerAction('split'));
        document.getElementById('insurance-btn')?.addEventListener('click', () => this.executePlayerAction('insurance'));

        // Betting controls
        document.getElementById('bet-amount')?.addEventListener('change', (e) => {
            this.setBetAmount(parseInt(e.target.value));
        });

        // Chip buttons
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.target.dataset.value);
                this.setBetAmount(value);
            });
        });

        // Settings controls
        document.getElementById('deck-count')?.addEventListener('change', (e) => {
            this.updateSetting('deckCount', parseInt(e.target.value));
        });

        document.getElementById('basic-strategy-hints')?.addEventListener('change', (e) => {
            this.updateSetting('showBasicStrategyHints', e.target.checked);
        });

        document.getElementById('card-counting-practice')?.addEventListener('change', (e) => {
            this.updateSetting('cardCountingMode', e.target.checked);
        });
        
        document.getElementById('game-speed')?.addEventListener('change', (e) => {
            this.updateSetting('gameSpeed', e.target.value);
        });
        
        document.getElementById('auto-play')?.addEventListener('change', (e) => {
            this.gameFlow.setAutoPlay(e.target.checked);
        });
        
        document.getElementById('sound-effects')?.addEventListener('change', (e) => {
            this.updateSetting('soundEffects', e.target.checked);
        });
        
        // Utility buttons
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undoLastAction());
        document.getElementById('hint-btn')?.addEventListener('click', () => this.showHintModal());
        document.getElementById('stats-btn')?.addEventListener('click', () => this.showStatsModal());
    }

    /**
     * Start a new game session (delegate to GameFlow)
     */
    async startNewGame() {
        console.log('🆕 Starting new game session');
        
        const success = await this.gameFlow.initializeNewGame();
        
        if (success) {
            // Update local references
            this.dealerHand = new Hand();
            this.playerHands = [new Hand()];
            this.currentHandIndex = 0;
            
            this.updateModuleReferences();
            this.updateAllDisplays();
        }
        
        return success;
    }

    /**
     * Deal a new hand (delegate to GameFlow)
     */
    async dealNewHand() {
        const success = await this.gameFlow.startDealingSequence();
        
        if (success) {
            this.updateModuleReferences();
        }
        
        return success;
    }

    /**
     * Execute player action (delegate to ActionHandler)
     */
    async executePlayerAction(action) {
        // Update references before action
        this.actionHandler.updateGameRefs(this.dealerHand, this.playerHands, this.currentHandIndex);
        
        // Set strategy hint for accuracy tracking
        const hint = this.getStrategyHint();
        if (hint) {
            this.actionHandler.setLastStrategyHint(hint);
        }
        
        // Execute the action
        const result = await this.actionHandler.executeAction(action);
        
        // Handle action result
        await this.handleActionResult(result);
        
        return result;
    }

    /**
     * Handle the result of a player action
     */
    async handleActionResult(result) {
        switch (result) {
            case 'continue':
                // Action completed, player can continue
                this.showBasicStrategyHint();
                break;
                
            case 'complete':
            case 'bust':
                // Hand/action completed, move to next hand or dealer
                this.currentHandIndex = this.actionHandler.currentHandIndex;
                await this.gameFlow.moveToNextHand();
                this.updateModuleReferences();
                break;
                
            case 'error':
                // Error occurred, enable actions again
                this.actionHandler.enablePlayerActions();
                break;
        }
        
        this.updateAllDisplays();
    }

    /**
     * Get basic strategy hint
     */
    getStrategyHint() {
        if (!this.gameState.getSetting('showBasicStrategyHints') || !this.gameState.isInPhase('playing')) {
            return null;
        }

        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1];
        
        if (playerHand && dealerUpCard) {
            const hint = this.strategyHints.getBasicStrategyHint(
                playerHand, 
                dealerUpCard, 
                this.actionHandler.canDoubleDown(),
                this.actionHandler.canSplit()
            );
            
            // Check for index play deviations if counting is enabled
            if (this.gameState.getSetting('cardCountingMode')) {
                const indexPlay = this.cardCounting.getIndexPlayRecommendation(playerHand, dealerUpCard);
                if (indexPlay.hasDeviation) {
                    hint.action = indexPlay.action;
                    hint.explanation += ` (Index Play: ${indexPlay.reason})`;
                    this.ui.showIndexPlayRecommendation(indexPlay);
                }
            }
            
            return hint;
        }
        
        return null;
    }

    /**
     * Show basic strategy hint
     */
    showBasicStrategyHint() {
        const hint = this.getStrategyHint();
        
        if (hint) {
            // Highlight recommended action on buttons
            this.highlightRecommendedAction(hint.action);
            
            // Show modal if enabled
            if (this.gameState.getSetting('showStrategyModal')) {
                this.ui.showHintModal(hint);
            }
        }
    }

    /**
     * Highlight recommended action on buttons
     */
    highlightRecommendedAction(recommendedAction) {
        // Remove existing highlights
        document.querySelectorAll('.btn').forEach(btn => {
            btn.classList.remove('recommended-action');
        });
        
        // Add highlight to recommended button
        const actionMap = {
            'Hit': 'hit-btn',
            'Stand': 'stand-btn',
            'Double Down': 'double-btn',
            'Split': 'split-btn'
        };
        
        const buttonId = actionMap[recommendedAction];
        if (buttonId) {
            const button = document.getElementById(buttonId);
            if (button && !button.disabled) {
                button.classList.add('recommended-action');
            }
        }
    }

    /**
     * Undo last action (delegate to ActionHandler)
     */
    async undoLastAction() {
        const success = await this.actionHandler.undoLastAction();
        
        if (success) {
            // Update local references from action handler
            this.currentHandIndex = this.actionHandler.currentHandIndex;
            this.updateModuleReferences();
            this.updateAllDisplays();
        }
        
        return success;
    }

    /**
     * Update game setting
     */
    updateSetting(key, value) {
        this.gameState.updateSetting(key, value);
        
        // Handle specific setting changes
        if (key === 'deckCount' && (this.gameState.isInPhase('waiting') || this.gameState.isInPhase('finished'))) {
            this.initializeGameObjects();
            this.updateModuleReferences();
        } else if (key === 'cardCountingMode') {
            this.cardCounting.setEnabled(value);
            this.cardCounting.setTotalDecks(this.gameState.getSetting('deckCount'));
            this.ui.toggleCardCountingDisplay(value);
            
            if (value) {
                this.updateCardCountingDisplay();
                this.updateBettingRecommendations();
            }
        } else if (key === 'gameSpeed') {
            this.ui.setAnimationSpeed(value);
        } else if (key === 'soundEffects') {
            this.ui.setSoundEnabled(value);
        }
    }

    /**
     * Set bet amount
     */
    setBetAmount(amount) {
        const newAmount = this.gameState.setBetAmount(amount);
        this.ui.updateCurrentBet(newAmount);
        
        // Update bet amount input
        const betInput = document.getElementById('bet-amount');
        if (betInput) {
            betInput.value = newAmount;
        }
        
        return newAmount;
    }

    /**
     * Update all UI displays
     */
    updateAllDisplays() {
        // Update hand totals
        this.playerHands.forEach((hand, index) => {
            this.ui.updatePlayerTotal(hand.getValue(), hand.isBusted(), index);
        });
        
        if (this.dealerHand) {
            this.ui.updateDealerTotal(this.dealerHand.getValue(), this.dealerHand.isBusted());
        }
        
        // Update statistics
        const basicStats = this.statistics.getStats();
        const strategyStats = this.statistics.getStrategyStats();
        
        this.ui.updateGameStats({
            ...basicStats,
            strategyAccuracy: strategyStats.overallAccuracy,
            strategyGrade: strategyStats.grade
        });
        
        // Update current bet
        this.ui.updateCurrentBet(this.gameState.getCurrentBet());
        
        // Update counting displays if enabled
        if (this.gameState.getSetting('cardCountingMode')) {
            this.updateCardCountingDisplay();
            this.updateBettingRecommendations();
        }
        
        // Update game phase
        const phaseInfo = this.gameState.getPhaseDisplayInfo();
        this.ui.updateGamePhase(this.gameState.getPhase(), phaseInfo.description);
    }

    /**
     * Update card counting display
     */
    updateCardCountingDisplay() {
        if (!this.gameState.getSetting('cardCountingMode')) return;
        
        const countStats = this.cardCounting.getCountingStats();
        this.ui.updateCardCountingDisplay(countStats);
        
        // Update mode indicator
        this.ui.updateCountingModeIndicator(
            this.cardCounting.isCountingEnabled(),
            this.cardCounting.isPracticeModeEnabled()
        );
    }

    /**
     * Update betting recommendations
     */
    updateBettingRecommendations() {
        if (!this.gameState.getSetting('cardCountingMode')) return;
        
        const bettingRec = this.cardCounting.getBettingRecommendation(
            this.gameState.getCurrentBet(),
            this.statistics.getBankAmount()
        );
        
        const evData = this.cardCounting.getEVCalculation(bettingRec.recommendedBet);
        
        const bettingData = {
            ...bettingRec,
            currentBet: this.gameState.getCurrentBet(),
            expectedEV: evData.expectedValue,
            riskOfRuin: this.cardCounting.getRiskOfRuin(
                this.statistics.getBankAmount(),
                bettingRec.recommendedBet,
                bettingRec.advantage
            )
        };
        
        this.ui.updateBettingRecommendations(bettingData);
        
        // Record betting decision for statistics
        this.statistics.recordBettingDecision({
            betAmount: this.gameState.getCurrentBet(),
            recommendedBet: bettingRec.recommendedBet,
            trueCount: this.cardCounting.getTrueCount(),
            bankroll: this.statistics.getBankAmount(),
            advantage: bettingRec.advantage
        });
        
        // Check for heat management warnings
        const heatSuggestions = this.cardCounting.getHeatManagementSuggestions();
        if (heatSuggestions.length > 0) {
            this.ui.showHeatWarning(heatSuggestions);
        }
    }

    /**
     * Show strategy hint modal
     */
    showHintModal() {
        if (!this.gameState.isInPhase('playing')) {
            this.ui.showMessage('Hints only available during play', 'warning', 2000);
            return;
        }
        
        const hint = this.getStrategyHint();
        if (hint) {
            this.ui.showHintModal(hint);
        }
    }

    /**
     * Show detailed statistics modal
     */
    showStatsModal() {
        const stats = this.statistics.getStats();
        const strategyStats = this.statistics.getStrategyStats();
        
        let countingStats = null;
        if (this.gameState.getSetting('cardCountingMode')) {
            countingStats = this.cardCounting.getCountingStats();
        }
        
        this.ui.showStatsModal({
            gameStats: stats,
            strategyStats: strategyStats,
            countingStats: countingStats
        });
    }

    // ===== GETTERS AND SETTERS =====

    /**
     * Check if game is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Get current game phase
     */
    getCurrentPhase() {
        return this.gameState.getPhase();
    }

    /**
     * Check if game is active
     */
    isGameActive() {
        return this.gameState.isActivePlay();
    }

    /**
     * Get current hand index
     */
    getCurrentHandIndex() {
        return this.currentHandIndex;
    }

    /**
     * Get game state data for external access
     */
    getGameStateData() {
        return this.gameState.getSessionData();
    }

    /**
     * Get game flow statistics
     */
    getGameFlowStats() {
        return this.gameFlow.getFlowStats();
    }

    /**
     * Get action handler statistics
     */
    getActionStats() {
        return this.actionHandler.getActionStats();
    }

    /**
     * Get available actions for current state
     */
    getAvailableActions() {
        return this.actionHandler.getAvailableActions();
    }

    /**
     * Export game state for save/load functionality
     */
    exportGameState() {
        return {
            gameState: this.gameState.exportState(),
            currentHandIndex: this.currentHandIndex,
            dealerHand: this.dealerHand ? {
                cards: this.dealerHand.cards,
                value: this.dealerHand.getValue()
            } : null,
            playerHands: this.playerHands.map(hand => ({
                cards: hand.cards,
                value: hand.getValue(),
                isDoubled: hand.isDoubled,
                isSplit: hand.isSplit
            })),
            deckState: this.deck ? { cardsRemaining: this.deck.getCardsRemaining?.() } : null
        };
    }

    /**
     * Import game state for save/load functionality
     */
    importGameState(exportedData) {
        try {
            if (exportedData.gameState) {
                this.gameState.importState(exportedData.gameState);
            }
            
            if (exportedData.currentHandIndex !== undefined) {
                this.currentHandIndex = exportedData.currentHandIndex;
            }
            
            // Restore hands would require more complex logic
            // This is a simplified version for the basic structure
            
            this.updateModuleReferences();
            this.updateAllDisplays();
            
            return true;
        } catch (error) {
            console.error('Error importing game state:', error);
            return false;
        }
    }

    /**
     * Pause game operations
     */
    pauseGame() {
        this.gameFlow.pauseGame();
    }

    /**
     * Resume game operations
     */
    resumeGame() {
        this.gameFlow.resumeGame();
    }

    /**
     * Emergency stop all operations
     */
    emergencyStop() {
        this.gameFlow.emergencyStop();
        this.actionHandler.disablePlayerActions();
        console.log('🚨 GameController emergency stop activated');
    }

    /**
     * Validate current game state
     */
    validateGameState() {
        const issues = [];
        
        // Validate game flow
        const flowValidation = this.gameFlow.validateFlowState();
        if (!flowValidation.isValid) {
            issues.push(...flowValidation.issues);
        }
        
        // Validate action handler
        const actionInfo = this.actionHandler.getActionInfo();
        if (actionInfo.currentHandIndex !== this.currentHandIndex) {
            issues.push('Hand index mismatch between controller and action handler');
        }
        
        // Validate game state
        if (!this.gameState.isInitialized) {
            issues.push('Game state not properly initialized');
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            gamePhase: this.gameState.getPhase(),
            actionInfo
        };
    }

    /**
     * Get comprehensive game info for debugging
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            gameState: this.gameState.getStateSummary(),
            flowStats: this.gameFlow.getFlowStats(),
            actionStats: this.actionHandler.getActionStats(),
            validation: this.validateGameState(),
            currentHands: {
                dealer: this.dealerHand ? this.dealerHand.getValue() : null,
                player: this.playerHands.map(h => h.getValue()),
                currentIndex: this.currentHandIndex
            }
        };
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        console.log('🧹 Cleaning up GameController...');
        
        // Cleanup modules
        this.gameState.cleanup();
        this.actionHandler.cleanup();
        this.gameFlow.cleanup();
        
        // Reset references
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        this.deck = null;
        
        this.isInitialized = false;
        
        console.log('✅ GameController cleanup complete');
    }
}