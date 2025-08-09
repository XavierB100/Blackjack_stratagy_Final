/**
 * ActionHandler - Manages all player actions (hit, stand, double down, split, insurance)
 * Extracted from GameController.js for better organization
 */

import { Hand } from '../modules/Hand.js';

export class ActionHandler {
    constructor(gameState, deck, ui, statistics, rules, cardCounting) {
        this.gameState = gameState;
        this.deck = deck;
        this.ui = ui;
        this.statistics = statistics;
        this.rules = rules;
        this.cardCounting = cardCounting;
        
        // Action history for undo functionality
        this.actionHistory = [];
        this.lastStrategyHint = null;
        
        // Current game references (will be updated by GameController)
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
    }

    /**
     * Update current game references
     */
    updateGameRefs(dealerHand, playerHands, currentHandIndex) {
        this.dealerHand = dealerHand;
        this.playerHands = playerHands;
        this.currentHandIndex = currentHandIndex;
    }

    /**
     * Set the last strategy hint for accuracy tracking
     */
    setLastStrategyHint(hint) {
        this.lastStrategyHint = hint;
    }

    /**
     * Player hits (takes another card) with enhanced feedback
     */
    async hit() {
        if (!this.gameState.isInPhase('playing')) return false;

        console.log(`👋 Player hits on hand ${this.currentHandIndex}`);
        
        // Save state for undo functionality
        this.saveActionState('hit');
        
        // Track strategy accuracy
        if (this.lastStrategyHint) {
            this.statistics.recordStrategyDecision('Hit', this.lastStrategyHint.action, this.lastStrategyHint.handType);
        }
        
        // Disable buttons during card dealing
        this.disablePlayerActions();
        this.ui.setButtonLoading('hit-btn', true);
        
        try {
            const card = await this.dealCardToPlayer(this.currentHandIndex);
            const hand = this.playerHands[this.currentHandIndex];
            
            await this.delay(200);
            this.ui.setButtonLoading('hit-btn', false);
            
            if (hand.isBusted()) {
                this.ui.addCardEffect(this.currentHandIndex, 'busted');
                this.ui.showMessage('Bust!', 'error', 2000);
                await this.delay(1000);
                return 'bust';
            } else if (hand.getValue() === 21) {
                this.ui.addCardEffect(this.currentHandIndex, 'winning');
                this.ui.showMessage('21!', 'success', 1500);
                await this.delay(1000);
                return 'complete';
            } else {
                this.enablePlayerActions();
                await this.delay(300);
                return 'continue';
            }
        } catch (error) {
            console.error('Error in hit action:', error);
            this.ui.setButtonLoading('hit-btn', false);
            this.enablePlayerActions();
            this.ui.showMessage('Error processing hit. Please try again.', 'error');
            return 'error';
        }
    }

    /**
     * Player stands (ends turn) with enhanced feedback
     */
    async stand() {
        if (!this.gameState.isInPhase('playing')) return false;

        console.log(`✋ Player stands on hand ${this.currentHandIndex}`);
        
        // Save state for undo functionality
        this.saveActionState('stand');
        
        // Track strategy accuracy
        if (this.lastStrategyHint) {
            this.statistics.recordStrategyDecision('Stand', this.lastStrategyHint.action, this.lastStrategyHint.handType);
        }
        
        this.disablePlayerActions();
        this.ui.setButtonLoading('stand-btn', true);
        
        await this.delay(300);
        this.ui.setButtonLoading('stand-btn', false);
        
        return 'complete';
    }

    /**
     * Player doubles down with enhanced feedback
     */
    async doubleDown() {
        if (!this.gameState.isInPhase('playing')) return false;
        
        if (!this.canDoubleDown()) {
            this.ui.showMessage('Cannot double down', 'error', 2000);
            return false;
        }

        console.log(`💰 Player doubles down on hand ${this.currentHandIndex}`);
        
        // Save state for undo functionality
        this.saveActionState('double');
        
        // Track strategy accuracy
        if (this.lastStrategyHint) {
            this.statistics.recordStrategyDecision('Double Down', this.lastStrategyHint.action, this.lastStrategyHint.handType);
        }
        
        this.disablePlayerActions();
        this.ui.setButtonLoading('double-btn', true);
        
        try {
            const hand = this.playerHands[this.currentHandIndex];
            hand.isDoubled = true;
            
            // Double the bet for this hand
            const currentBet = this.gameState.getCurrentBet();
            const additionalBet = currentBet / this.playerHands.length;
            const newBet = currentBet + additionalBet;
            
            this.gameState.setBetAmount(newBet);
            this.ui.updateCurrentBet(newBet);
            this.ui.showMessage(`Bet doubled to $${newBet}!`, 'info', 2000);
            
            await this.delay(500);
            
            // Deal exactly one more card
            await this.dealCardToPlayer(this.currentHandIndex);
            this.ui.setButtonLoading('double-btn', false);
            
            // Check result immediately
            if (hand.isBusted()) {
                this.ui.addCardEffect(this.currentHandIndex, 'busted');
                this.ui.showMessage('Bust on double down!', 'error', 2000);
            } else if (hand.getValue() === 21) {
                this.ui.addCardEffect(this.currentHandIndex, 'winning');
                this.ui.showMessage('21 on double down!', 'success', 2000);
            }
            
            await this.delay(1500);
            return 'complete';
        } catch (error) {
            console.error('Error in double down action:', error);
            this.ui.setButtonLoading('double-btn', false);
            this.enablePlayerActions();
            this.ui.showMessage('Error processing double down. Please try again.', 'error');
            return 'error';
        }
    }

    /**
     * Player splits pair
     */
    async split() {
        if (!this.gameState.isInPhase('playing')) return false;
        
        if (!this.canSplit()) {
            this.ui.showMessage('Cannot split', 'error', 2000);
            return false;
        }

        console.log(`✂️ Player splits hand ${this.currentHandIndex}`);
        
        // Save state for undo functionality
        this.saveActionState('split');
        
        try {
            const originalHand = this.playerHands[this.currentHandIndex];
            const cardToMove = originalHand.cards.pop();
            
            // Mark both hands as split hands
            originalHand.isSplit = true;
            
            // Create new hand with the second card
            const newHand = new Hand();
            newHand.addCard(cardToMove);
            newHand.isSplit = true;
            
            // Insert new hand right after current hand
            this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);
            
            // Deal second card to both hands
            await this.dealCardToPlayer(this.currentHandIndex);
            await this.delay(300);
            await this.dealCardToPlayer(this.currentHandIndex + 1);
            
            // Double the bet (split requires equal bet on both hands)
            const currentBet = this.gameState.getCurrentBet();
            const newBet = currentBet * 2;
            this.gameState.setBetAmount(newBet);
            this.ui.updateCurrentBet(newBet);
            
            this.ui.showSplitHands(this.playerHands);
            this.ui.showMessage('Hand split! Continue with first hand.', 'info', 2000);
            
            return 'complete';
        } catch (error) {
            console.error('Error in split action:', error);
            this.ui.showMessage('Error processing split. Please try again.', 'error');
            return 'error';
        }
    }

    /**
     * Take insurance
     */
    async takeInsurance() {
        if (!this.gameState.isInPhase('playing')) return false;
        
        const dealerUpCard = this.dealerHand.cards[1];
        if (!this.rules.canTakeInsurance(dealerUpCard, this.playerHands[0])) {
            this.ui.showMessage('Insurance not available', 'error', 2000);
            return false;
        }
        
        console.log('🛡️ Player takes insurance');
        
        const currentBet = this.gameState.getCurrentBet();
        const insuranceBet = Math.floor(currentBet / 2);
        
        this.gameState.setInsuranceBet(insuranceBet);
        this.ui.showMessage(`Insurance bet: $${insuranceBet}`, 'info', 3000);
        
        // Insurance is resolved immediately when dealer checks for blackjack
        if (this.dealerHand.isBlackjack()) {
            const insurancePayout = this.rules.calculateInsurancePayout(insuranceBet);
            this.statistics.updateBank(insurancePayout);
            this.ui.showMessage(`Insurance pays $${insurancePayout}!`, 'success', 3000);
        } else {
            this.statistics.updateBank(-insuranceBet);
            this.ui.showMessage('Insurance lost', 'error', 2000);
        }
        
        // Disable insurance button after taking insurance
        this.ui.setButtonState('insurance-btn', false);
        
        return 'complete';
    }

    /**
     * Check if player can double down
     */
    canDoubleDown() {
        const hand = this.playerHands[this.currentHandIndex];
        return this.rules.canDoubleDown(hand, this.gameState.getCurrentBet(), this.statistics.getBankAmount());
    }

    /**
     * Check if player can split
     */
    canSplit() {
        const hand = this.playerHands[this.currentHandIndex];
        return this.rules.canSplit(hand, this.gameState.getCurrentBet(), this.statistics.getBankAmount());
    }

    /**
     * Get available actions for current hand
     */
    getAvailableActions() {
        if (!this.gameState.isInPhase('playing')) {
            return [];
        }

        const hand = this.playerHands[this.currentHandIndex];
        const actions = [];

        // Hit is always available unless hand is 21 or busted
        if (!hand.isBusted() && hand.getValue() < 21) {
            actions.push({
                action: 'hit',
                enabled: true,
                description: 'Take another card'
            });
        }

        // Stand is always available unless busted
        if (!hand.isBusted()) {
            actions.push({
                action: 'stand',
                enabled: true,
                description: 'Keep current hand'
            });
        }

        // Double down conditions
        if (this.canDoubleDown()) {
            actions.push({
                action: 'doubleDown',
                enabled: true,
                description: 'Double bet and take one card'
            });
        }

        // Split conditions
        if (this.canSplit()) {
            actions.push({
                action: 'split',
                enabled: true,
                description: 'Split pair into two hands'
            });
        }

        // Insurance conditions
        if (this.dealerHand && this.dealerHand.cards.length >= 2) {
            const dealerUpCard = this.dealerHand.cards[1];
            if (this.rules.canTakeInsurance(dealerUpCard, hand)) {
                actions.push({
                    action: 'insurance',
                    enabled: true,
                    description: 'Insure against dealer blackjack'
                });
            }
        }

        return actions;
    }

    /**
     * Deal a card to the player
     */
    async dealCardToPlayer(handIndex, faceUp = true) {
        const card = this.deck.dealCard();
        this.playerHands[handIndex].addCard(card);
        
        // Update card count if in counting mode
        if (this.gameState.getSetting('cardCountingMode')) {
            this.cardCounting.updateCount(card, faceUp);
            this.statistics.updateCardCount(card);
            
            // Update deck tracking
            this.cardCounting.updateDecksRemaining(this.deck.getDecksRemaining());
        }
        
        const cardElement = await this.ui.addCardToPlayer(card, handIndex, faceUp);
        
        // Highlight card for counting practice if enabled
        if (this.gameState.getSetting('cardCountingMode') && faceUp) {
            this.ui.highlightCardForCounting(cardElement, this.cardCounting.getHiLoValue(card));
        }
        
        this.updatePlayerTotal(handIndex);
        this.updateCardCountingDisplay();
        
        return card;
    }

    /**
     * Update player total display
     */
    updatePlayerTotal(handIndex) {
        const hand = this.playerHands[handIndex];
        const total = hand.getValue();
        const isBusted = hand.isBusted();
        
        this.ui.updatePlayerTotal(total, isBusted, handIndex);
    }

    /**
     * Update card counting display
     */
    updateCardCountingDisplay() {
        if (this.gameState.getSetting('cardCountingMode')) {
            const countData = {
                running: this.cardCounting.getRunningCount(),
                true: this.cardCounting.getTrueCount(),
                decksRemaining: this.deck.getDecksRemaining()
            };
            
            this.ui.updateCardCountingDisplay(countData);
        }
    }

    /**
     * Disable all player action buttons
     */
    disablePlayerActions() {
        const gameButtons = ['hit-btn', 'stand-btn', 'double-btn', 'split-btn', 'insurance-btn'];
        gameButtons.forEach(buttonId => this.ui.setButtonState(buttonId, false));
    }

    /**
     * Enable appropriate player action buttons
     */
    enablePlayerActions() {
        const availableActions = this.getAvailableActions();
        this.ui.enableGameButtons(availableActions);
    }

    /**
     * Save current game state for undo functionality
     */
    saveActionState(action) {
        const actionState = {
            action,
            handIndex: this.currentHandIndex,
            playerHands: this.playerHands.map(hand => ({ 
                cards: [...hand.cards],
                value: hand.getValue(),
                isDoubled: hand.isDoubled,
                isSplit: hand.isSplit
            })),
            dealerHand: {
                cards: [...this.dealerHand.cards],
                value: this.dealerHand.getValue()
            },
            currentBet: this.gameState.getCurrentBet(),
            insuranceBet: this.gameState.getInsuranceBet(),
            timestamp: Date.now()
        };
        this.gameState.saveGameState(action);
        this.actionHistory.push(actionState);
        if (this.actionHistory.length > 10) this.actionHistory.shift();
    }

    /**
     * Check if undo is available for actions
     */
    canUndoAction() {
        return this.gameState.canUndoAction() && 
               this.actionHistory.length > 0 &&
               this.gameState.isInPhase('playing');
    }

    /**
     * Undo last action
     */
    async undoLastAction() {
        if (!this.canUndoAction()) {
            this.ui.showMessage('Cannot undo at this time', 'error', 2000);
            return false;
        }

        try {
            const lastState = this.actionHistory.pop();
            const savedGameState = this.gameState.removeLastSavedState();
            
            if (lastState && savedGameState) {
                console.log(`🔄 Undoing action: ${savedGameState.action}`);
                
                // Restore hand states
                this.currentHandIndex = lastState.handIndex;
                
                // Restore player hands
                this.playerHands.forEach((hand, index) => {
                    if (lastState.playerHands[index]) {
                        hand.cards = [...lastState.playerHands[index].cards];
                        hand.isDoubled = lastState.playerHands[index].isDoubled;
                        hand.isSplit = lastState.playerHands[index].isSplit;
                    }
                });
                
                // Restore dealer hand
                this.dealerHand.cards = [...lastState.dealerHand.cards];
                
                // Restore bet amounts
                this.gameState.setBetAmount(lastState.currentBet);
                this.gameState.setInsuranceBet(lastState.insuranceBet);
                
                // Update UI to reflect restored state
                this.ui.clearPlayer();
                this.ui.clearDealer();
                
                // Redraw cards
                for (let handIndex = 0; handIndex < this.playerHands.length; handIndex++) {
                    const hand = this.playerHands[handIndex];
                    for (const card of hand.cards) {
                        await this.ui.addCardToPlayer(card, handIndex, true);
                    }
                    this.updatePlayerTotal(handIndex);
                }
                
                for (let i = 0; i < this.dealerHand.cards.length; i++) {
                    const card = this.dealerHand.cards[i];
                    const faceUp = i === 1; // Only second card is face up initially
                    await this.ui.addCardToDealer(card, faceUp);
                }
                
                // Update displays
                this.ui.updateCurrentBet(this.gameState.getCurrentBet());
                this.ui.highlightCurrentHand(this.currentHandIndex);
                
                // Re-enable actions
                this.enablePlayerActions();
                
                this.ui.showMessage(`Undid ${savedGameState.action}`, 'success', 2000);
                return true;
            }
        } catch (error) {
            console.error('Error undoing action:', error);
            this.ui.showMessage('Error undoing action', 'error', 2000);
        }
        
        return false;
    }

    /**
     * Clear action history
     */
    clearActionHistory() {
        this.actionHistory = [];
        this.lastStrategyHint = null;
        console.log('🗑️ Action history cleared');
    }

    /**
     * Get action statistics
     */
    getActionStats() {
        const stats = {
            totalActions: this.actionHistory.length,
            actionBreakdown: {},
            averageHandDuration: 0
        };
        
        // Count action types
        this.actionHistory.forEach(action => {
            stats.actionBreakdown[action.action] = (stats.actionBreakdown[action.action] || 0) + 1;
        });
        
        // Calculate average hand duration
        if (this.actionHistory.length > 0) {
            const totalDuration = this.actionHistory.reduce((sum, action, index) => {
                if (index > 0) {
                    return sum + (action.timestamp - this.actionHistory[index - 1].timestamp);
                }
                return sum;
            }, 0);
            stats.averageHandDuration = totalDuration / this.actionHistory.length;
        }
        
        return stats;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate action before execution
     */
    validateAction(action) {
        const availableActions = this.getAvailableActions();
        const actionNames = availableActions.map(a => a.action);
        
        if (!actionNames.includes(action)) {
            console.warn(`Action ${action} not available. Available: ${actionNames.join(', ')}`);
            return false;
        }
        
        return true;
    }

    /**
     * Execute action with validation and error handling
     */
    async executeAction(action) {
        if (!this.validateAction(action)) {
            return false;
        }
        
        try {
            switch (action) {
                case 'hit':
                    return await this.hit();
                case 'stand':
                    return await this.stand();
                case 'doubleDown':
                    return await this.doubleDown();
                case 'split':
                    return await this.split();
                case 'insurance':
                    return await this.takeInsurance();
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            console.error(`Error executing action ${action}:`, error);
            this.ui.showMessage(`Error executing ${action}. Please try again.`, 'error');
            return 'error';
        }
    }

    /**
     * Get detailed action information for debugging
     */
    getActionInfo() {
        return {
            currentHandIndex: this.currentHandIndex,
            gamePhase: this.gameState.getPhase(),
            availableActions: this.getAvailableActions(),
            canUndo: this.canUndoAction(),
            actionHistoryLength: this.actionHistory.length,
            lastAction: this.gameState.lastAction
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearActionHistory();
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        console.log('🧹 ActionHandler cleaned up');
    }
}