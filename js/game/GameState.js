/**
 * GameState - Manages game state, phases, and settings
 * Extracted from GameController.js for better organization
 */

export class GameState {
    constructor() {
        // Game phases: 'waiting', 'betting', 'dealing', 'playing', 'dealer', 'finished'
        this.currentPhase = 'waiting';
        this.previousPhase = null;
        
        // Game settings
        this.settings = {
            deckCount: 6,
            showBasicStrategyHints: true,
            cardCountingMode: false,
            minimumBet: 5,
            maximumBet: 500,
            gameSpeed: 'normal',
            autoPlay: false,
            soundEffects: false,
            animationsEnabled: true
        };
        
        // Current game data
        this.currentBet = 25;
        this.insuranceBet = 0;
        this.gameId = null;
        
        // Game history for undo functionality
        this.gameHistory = [];
        this.maxHistorySize = 5;
        this.canUndo = false;
        this.lastAction = null;
        
        // Performance tracking
        this.handStartTime = null;
        this.roundNumber = 0;
        
        this.isInitialized = false;
    }

    /**
     * Initialize game state
     */
    init() {
        this.loadSettings();
        this.reset();
        this.isInitialized = true;
        console.log('🎯 GameState initialized');
    }

    /**
     * Reset game state for new session
     */
    reset() {
        this.currentPhase = 'waiting';
        this.previousPhase = null;
        this.currentBet = 25;
        this.insuranceBet = 0;
        this.gameId = Date.now();
        this.gameHistory = [];
        this.canUndo = false;
        this.lastAction = null;
        this.handStartTime = null;
        this.roundNumber = 0;
        
        console.log('🔄 GameState reset for new session');
    }

    /**
     * Start new hand
     */
    startNewHand() {
        this.handStartTime = Date.now();
        this.roundNumber++;
        this.insuranceBet = 0;
        this.gameHistory = []; // Clear history for new hand
        this.canUndo = false;
        this.lastAction = null;
        
        console.log(`🎴 Starting hand #${this.roundNumber}`);
    }

    /**
     * Set current game phase
     */
    setPhase(newPhase, reason = '') {
        if (!this.isValidPhase(newPhase)) {
            throw new Error(`Invalid game phase: ${newPhase}`);
        }

        this.previousPhase = this.currentPhase;
        this.currentPhase = newPhase;
        
        console.log(`🎯 Phase: ${this.previousPhase} → ${newPhase} ${reason ? `(${reason})` : ''}`);
        
        // Emit phase change event
        this.emitPhaseChange(newPhase, this.previousPhase, reason);
    }

    /**
     * Get current phase
     */
    getPhase() {
        return this.currentPhase;
    }

    /**
     * Check if in specific phase
     */
    isInPhase(phase) {
        return this.currentPhase === phase;
    }

    /**
     * Check if game is in active play state
     */
    isActivePlay() {
        return this.currentPhase === 'playing';
    }

    /**
     * Check if game is waiting for player action
     */
    isWaitingForPlayer() {
        return this.currentPhase === 'playing' || this.currentPhase === 'waiting';
    }

    /**
     * Update game setting
     */
    updateSetting(key, value) {
        if (!this.settings.hasOwnProperty(key)) {
            throw new Error(`Invalid setting: ${key}`);
        }

        const oldValue = this.settings[key];
        this.settings[key] = value;
        
        console.log(`⚙️ Setting updated: ${key} = ${value} (was ${oldValue})`);
        
        // Save settings
        this.saveSettings();
        
        // Emit settings change event
        this.emitSettingsChange(key, value, oldValue);
    }

    /**
     * Get setting value
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }

    /**
     * Set current bet amount
     */
    setBetAmount(amount) {
        const clampedAmount = Math.max(
            this.settings.minimumBet, 
            Math.min(amount, this.settings.maximumBet)
        );
        
        this.currentBet = clampedAmount;
        console.log(`💰 Bet set to $${clampedAmount}`);
        
        return clampedAmount;
    }

    /**
     * Get current bet amount
     */
    getCurrentBet() {
        return this.currentBet;
    }

    /**
     * Set insurance bet
     */
    setInsuranceBet(amount) {
        this.insuranceBet = amount;
        console.log(`🛡️ Insurance bet: $${amount}`);
    }

    /**
     * Get insurance bet
     */
    getInsuranceBet() {
        return this.insuranceBet;
    }

    /**
     * Save game state for undo functionality
     */
    saveGameState(action) {
        // Create state snapshot
        const gameState = {
            phase: this.currentPhase,
            currentBet: this.currentBet,
            insuranceBet: this.insuranceBet,
            action,
            timestamp: Date.now(),
            roundNumber: this.roundNumber
        };

        // Add to history
        this.gameHistory.push(gameState);
        
        // Maintain history size limit
        if (this.gameHistory.length > this.maxHistorySize) {
            this.gameHistory.shift();
        }

        this.canUndo = true;
        this.lastAction = action;
        
        console.log(`💾 State saved for undo: ${action} (${this.gameHistory.length} states)`);
    }

    /**
     * Check if undo is available
     */
    canUndoAction() {
        return this.canUndo && 
               this.gameHistory.length > 0 && 
               this.currentPhase === 'playing';
    }

    /**
     * Get last saved state for restoration
     */
    getLastSavedState() {
        return this.gameHistory.length > 0 ? 
               this.gameHistory[this.gameHistory.length - 1] : null;
    }

    /**
     * Remove last saved state (after successful undo)
     */
    removeLastSavedState() {
        if (this.gameHistory.length > 0) {
            const state = this.gameHistory.pop();
            this.canUndo = this.gameHistory.length > 0;
            return state;
        }
        return null;
    }

    /**
     * Clear undo history
     */
    clearUndoHistory() {
        this.gameHistory = [];
        this.canUndo = false;
        this.lastAction = null;
        console.log('🗑️ Undo history cleared');
    }

    /**
     * Get current game session data
     */
    getSessionData() {
        return {
            gameId: this.gameId,
            roundNumber: this.roundNumber,
            currentPhase: this.currentPhase,
            previousPhase: this.previousPhase,
            currentBet: this.currentBet,
            insuranceBet: this.insuranceBet,
            handStartTime: this.handStartTime,
            canUndo: this.canUndo,
            lastAction: this.lastAction,
            settings: { ...this.settings }
        };
    }

    /**
     * Get hand duration in milliseconds
     */
    getHandDuration() {
        return this.handStartTime ? Date.now() - this.handStartTime : 0;
    }

    /**
     * Get formatted hand duration
     */
    getFormattedHandDuration() {
        const duration = this.getHandDuration();
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    }

    /**
     * Validate phase transition
     */
    canTransitionTo(newPhase) {
        const validTransitions = {
            'waiting': ['dealing', 'waiting'],
            'betting': ['dealing', 'waiting'],
            'dealing': ['playing', 'finished'],
            'playing': ['dealer', 'finished', 'playing'], // playing to playing for split hands
            'dealer': ['finished'],
            'finished': ['waiting', 'dealing']
        };
        
        const allowedTransitions = validTransitions[this.currentPhase] || [];
        return allowedTransitions.includes(newPhase);
    }

    /**
     * Check if phase is valid
     */
    isValidPhase(phase) {
        const validPhases = ['waiting', 'betting', 'dealing', 'playing', 'dealer', 'finished'];
        return validPhases.includes(phase);
    }

    /**
     * Get phase display info
     */
    getPhaseDisplayInfo() {
        const phaseInfo = {
            'waiting': { 
                display: 'Ready to Play', 
                color: 'info', 
                description: 'Click "Deal" to start a new hand' 
            },
            'betting': { 
                display: 'Place Your Bet', 
                color: 'warning', 
                description: 'Choose your bet amount' 
            },
            'dealing': { 
                display: 'Dealing Cards', 
                color: 'info', 
                description: 'Cards are being dealt...' 
            },
            'playing': { 
                display: 'Your Turn', 
                color: 'success', 
                description: 'Choose your action: Hit, Stand, Double, or Split' 
            },
            'dealer': { 
                display: "Dealer's Turn", 
                color: 'warning', 
                description: 'Dealer is playing...' 
            },
            'finished': { 
                display: 'Hand Complete', 
                color: 'info', 
                description: 'Hand finished. Click "Deal" for next hand' 
            }
        };
        
        return phaseInfo[this.currentPhase] || { 
            display: 'Unknown', 
            color: 'error', 
            description: 'Unknown game state' 
        };
    }

    /**
     * Export current state
     */
    exportState() {
        return {
            sessionData: this.getSessionData(),
            gameHistory: [...this.gameHistory],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import state from export
     */
    importState(exportedState) {
        try {
            if (exportedState.sessionData) {
                const data = exportedState.sessionData;
                
                this.gameId = data.gameId;
                this.roundNumber = data.roundNumber;
                this.currentPhase = data.currentPhase;
                this.previousPhase = data.previousPhase;
                this.currentBet = data.currentBet;
                this.insuranceBet = data.insuranceBet;
                this.handStartTime = data.handStartTime;
                this.canUndo = data.canUndo;
                this.lastAction = data.lastAction;
                
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                }
            }
            
            if (exportedState.gameHistory) {
                this.gameHistory = [...exportedState.gameHistory];
            }
            
            console.log('📥 GameState imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import GameState:', error);
            return false;
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settingsData = {
                settings: this.settings,
                gameId: this.gameId,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('blackjackpro_gamestate', JSON.stringify(settingsData));
        } catch (error) {
            console.warn('⚠️ Failed to save settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('blackjackpro_gamestate');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    console.log('📋 Settings loaded from storage');
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load settings:', error);
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.settings = {
            deckCount: 6,
            showBasicStrategyHints: true,
            cardCountingMode: false,
            minimumBet: 5,
            maximumBet: 500,
            gameSpeed: 'normal',
            autoPlay: false,
            soundEffects: false,
            animationsEnabled: true
        };
        
        this.saveSettings();
        console.log('🔄 Settings reset to defaults');
        
        // Emit reset event
        this.emitEvent('settingsReset', {});
    }

    /**
     * Emit phase change event
     */
    emitPhaseChange(newPhase, previousPhase, reason) {
        this.emitEvent('phaseChanged', {
            newPhase,
            previousPhase,
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Emit settings change event
     */
    emitSettingsChange(key, value, oldValue) {
        this.emitEvent('settingChanged', {
            key,
            value,
            oldValue,
            timestamp: Date.now()
        });
    }

    /**
     * Emit custom event
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(`gameState:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Get detailed state summary
     */
    getStateSummary() {
        return {
            phase: this.getPhaseDisplayInfo(),
            timing: {
                handDuration: this.getFormattedHandDuration(),
                roundNumber: this.roundNumber
            },
            betting: {
                currentBet: this.currentBet,
                insuranceBet: this.insuranceBet,
                minBet: this.settings.minimumBet,
                maxBet: this.settings.maximumBet
            },
            actions: {
                canUndo: this.canUndoAction(),
                lastAction: this.lastAction
            },
            settings: this.getAllSettings()
        };
    }

    /**
     * Validate bet amount
     */
    isValidBet(amount) {
        return amount >= this.settings.minimumBet && 
               amount <= this.settings.maximumBet &&
               amount > 0;
    }

    /**
     * Get betting constraints
     */
    getBettingConstraints() {
        return {
            minimum: this.settings.minimumBet,
            maximum: this.settings.maximumBet,
            current: this.currentBet,
            canIncrease: this.currentBet < this.settings.maximumBet,
            canDecrease: this.currentBet > this.settings.minimumBet
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.gameHistory = [];
        this.canUndo = false;
        this.lastAction = null;
        this.gameId = null;
        this.isInitialized = false;
        
        console.log('🧹 GameState cleaned up');
    }
}