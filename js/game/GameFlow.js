/**
 * GameFlow - Manages game sequence, timing, and flow control
 * Extracted from GameController.js for better organization
 */

import { Hand } from '../modules/Hand.js';

export class GameFlow {
    constructor(gameState, deck, ui, statistics, rules, cardCounting) {
        this.gameState = gameState;
        this.deck = deck;
        this.ui = ui;
        this.statistics = statistics;
        this.rules = rules;
        this.cardCounting = cardCounting;
        
        // Current game references
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        
        // Flow control state
        this.isFlowActive = false;
        this.currentSequence = null;
        this.pausedOperations = [];
        
        // Auto-play configuration
        this.autoPlayEnabled = false;
        this.autoPlayDelay = 1000;
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
     * Initialize a new game session
     */
    async initializeNewGame() {
        console.log('🆕 Initializing new game session');
        
        try {
            this.gameState.reset();
            this.statistics.startNewSession();
            
            // Reset deck and hands
            this.deck.shuffle();
            this.resetHands();
            
            // Update UI
            this.ui.clearAll();
            this.ui.setButtonState('deal-btn', true);
            this.ui.setButtonState('new-game-btn', false);
            this.ui.disableGameButtons();
            
            this.ui.showMessage('New game started! Place your bet and click "Deal".', 'success');
            
            return true;
        } catch (error) {
            console.error('Error initializing new game:', error);
            this.ui.showMessage('Error starting new game. Please try again.', 'error');
            return false;
        }
    }

    /**
     * Start the dealing sequence for a new hand
     */
    async startDealingSequence() {
        if (!this.gameState.isInPhase('waiting') && !this.gameState.isInPhase('finished')) {
            console.warn('Cannot deal while game is in progress');
            return false;
        }

        console.log('🎴 Starting dealing sequence');
        
        try {
            // Check if deck needs reshuffling
            if (this.deck.needsReshuffle()) {
                await this.handleDeckReshuffle();
            }

            // Reset for new hand
            this.gameState.startNewHand();
            this.resetHands();
            
            // Update to dealing phase
            this.gameState.setPhase('dealing', 'Cards being dealt');
            this.ui.updateGamePhase('dealing', 'Dealing Cards');
            
            // Execute initial deal sequence
            await this.executeInitialDealSequence();
            
            // Check for immediate results (blackjacks, insurance)
            await this.checkForImmediateResults();
            
            return true;
        } catch (error) {
            console.error('Error in dealing sequence:', error);
            this.ui.hideLoadingOverlay();
            this.ui.showMessage('Error dealing cards. Please try again.', 'error');
            this.gameState.setPhase('waiting');
            return false;
        }
    }

    /**
     * Execute the initial dealing sequence with proper timing
     */
    async executeInitialDealSequence() {
        this.ui.showLoadingOverlay('Dealing Cards...');
        this.isFlowActive = true;
        
        try {
            // Deal cards with realistic casino timing
            await this.dealCardToPlayer(0, true);
            await this.delay(400);
            
            await this.dealCardToDealer(false); // Face down (hole card)
            await this.delay(400);
            
            await this.dealCardToPlayer(0, true);
            await this.delay(400);
            
            await this.dealCardToDealer(true); // Face up
            await this.delay(200);
            
            // Show dealer visible total (face-up card only)
            try {
                const upCard = this.dealerHand.cards[1];
                const visibleTotal = upCard ? upCard.value : '';
                this.ui.updateDealerTotal(visibleTotal, false);
            } catch (_) {
                this.ui.updateDealerTotal('', false);
            }

            this.ui.hideLoadingOverlay();
            this.isFlowActive = false;
        } catch (error) {
            this.ui.hideLoadingOverlay();
            this.isFlowActive = false;
            throw error;
        }
    }

    /**
     * Check for immediate results after initial deal
     */
    async checkForImmediateResults() {
        const playerBlackjack = this.playerHands[0].isBlackjack();
        const dealerUpCard = this.dealerHand.cards[1];
        const dealerBlackjack = this.dealerHand.isBlackjack();
        
        // Check for insurance opportunity first
        if (dealerUpCard.rank === 'A' && !playerBlackjack) {
            await this.offerInsurance();
        }

        if (playerBlackjack && dealerBlackjack) {
            await this.handleDoubleBlackjack();
        } else if (playerBlackjack) {
            await this.handlePlayerBlackjack();
        } else if (dealerBlackjack) {
            await this.handleDealerBlackjack();
        } else {
            // Normal play begins
            await this.startPlayerTurn();
        }
    }

    /**
     * Start the player's turn
     */
    async startPlayerTurn() {
        this.gameState.setPhase('playing', 'Player\'s turn');
        this.ui.updateGamePhase('playing', 'Your Turn');
        
        this.currentHandIndex = 0;
        this.ui.highlightCurrentHand(this.currentHandIndex);
        
        // Enable appropriate actions
        this.enablePlayerActions();
        
        await this.delay(300);
        
        // Show strategy hint if enabled
        this.showBasicStrategyHint();
        
        // Execute auto-play if enabled
        if (this.autoPlayEnabled) {
            await this.delay(this.autoPlayDelay);
            await this.executeAutoPlay();
        }
    }

    /**
     * Move to the next hand or start dealer turn
     */
    async moveToNextHand() {
        this.currentHandIndex++;
        
        if (this.currentHandIndex >= this.playerHands.length) {
            // All player hands completed, start dealer turn
            await this.startDealerTurn();
        } else {
            // Move to next hand
            this.ui.highlightCurrentHand(this.currentHandIndex);
            this.enablePlayerActions();
            
            await this.delay(300);
            this.showBasicStrategyHint();
            
            // Execute auto-play for split hands if enabled
            if (this.autoPlayEnabled) {
                await this.delay(this.autoPlayDelay);
                await this.executeAutoPlay();
            }
        }
    }

    /**
     * Start the dealer's turn with enhanced presentation
     */
    async startDealerTurn() {
        this.gameState.setPhase('dealer', 'Dealer\'s turn');
        this.ui.updateGamePhase('dealer', 'Dealer\'s Turn');
        this.disablePlayerActions();
        
        this.ui.showMessage('Dealer reveals hole card...', 'info');
        await this.delay(1000);
        
        // Reveal hole card with dramatic timing
        await this.ui.revealDealerHoleCard();
        this.updateDealerTotal();
        
        // Update card count for hole card
        if (this.gameState.getSetting('cardCountingMode')) {
            this.cardCounting.updateCount(this.dealerHand.cards[0], true);
            this.statistics.updateCardCount(this.dealerHand.cards[0]);
            this.updateCardCountingDisplay();
        }
        
        await this.delay(1500);
        
        // Execute dealer play sequence
        await this.executeDealerPlaySequence();
        
        // Determine and show results
        await this.executeResultsSequence();
    }

    /**
     * Execute the dealer's play sequence according to rules
     */
    async executeDealerPlaySequence() {
        const dealerValue = this.dealerHand.getValue();
        
        if (dealerValue === 21) {
            this.ui.showMessage('Dealer has 21!', 'info', 2000);
            return;
        }
        
        // Check if dealer must hit
        if (this.mustDealerHit()) {
            this.ui.showMessage('Dealer must hit...', 'info');
            await this.delay(1000);
            
            // Dealer draws cards according to rules
            while (this.mustDealerHit()) {
                await this.delay(1200);
                await this.dealCardToDealer(true);
                await this.delay(800);
                
                const newValue = this.dealerHand.getValue();
                if (newValue > 21) {
                    await this.ui.addCardEffect(undefined, 'busted'); // Dealer cards
                    this.ui.showMessage('Dealer busts!', 'success', 2000);
                    break;
                } else if (newValue === 21) {
                    this.ui.showMessage('Dealer makes 21!', 'info', 1500);
                    break;
                }
            }
        } else {
            this.ui.showMessage(`Dealer stands on ${dealerValue}`, 'info', 2000);
        }
        
        await this.delay(2000);
    }

    /**
     * Execute the results determination and payout sequence
     */
    async executeResultsSequence() {
        const results = this.calculateHandResults();
        
        // Show individual hand results
        results.hands.forEach((result, index) => {
            this.ui.showHandResult(index, result.outcome, result.message);
        });
        
        // Update statistics
        this.updateGameStatistics(results);
        
        // Show celebration for big wins
        if (results.summary.handsWon > 0 && results.summary.totalPayout > results.summary.totalWagered * 1.5) {
            await this.ui.showResultCelebration('win', 'Great Hand!');
        }
        
        // Update UI with results
        this.updateAllDisplays();
        
        // End the hand
        await this.delay(2000);
        this.endCurrentHand();
    }

    /**
     * Handle deck reshuffling
     */
    async handleDeckReshuffle() {
        this.deck.shuffle();
        this.ui.showMessage('Reshuffling deck...', 'info', 2000);
        
        // Reset card count if in counting mode
        if (this.gameState.getSetting('cardCountingMode')) {
            this.cardCounting.reset();
            this.statistics.resetCardCount();
            this.updateCardCountingDisplay();
        }
        
        await this.delay(2000);
    }

    /**
     * Handle player blackjack
     */
    async handlePlayerBlackjack() {
        await this.delay(500);
        await this.ui.showResultCelebration('blackjack', 'BLACKJACK!');
        await this.ui.addCardEffect(0, 'winning');
        
        const payout = Math.floor(this.gameState.getCurrentBet() * 1.5); // 3:2 payout
        this.statistics.updateBank(payout);
        
        this.endHandWithResult('blackjack', 'Blackjack! You win!');
    }

    /**
     * Handle dealer blackjack
     */
    async handleDealerBlackjack() {
        await this.delay(500);
        await this.ui.revealDealerHoleCard();
        this.updateDealerTotal();
        
        await this.ui.showResultCelebration('lose', 'Dealer Blackjack');
        
        const loss = -this.gameState.getCurrentBet();
        this.statistics.updateBank(loss);
        
        this.endHandWithResult('dealer_blackjack', 'Dealer has blackjack. You lose.');
    }

    /**
     * Handle double blackjack (push)
     */
    async handleDoubleBlackjack() {
        await this.delay(500);
        await this.ui.revealDealerHoleCard();
        this.updateDealerTotal();
        
        await this.ui.showResultCelebration('push', 'Push!');
        
        this.endHandWithResult('push', 'Both have blackjack - Push!');
    }

    /**
     * Offer insurance when dealer shows Ace
     */
    async offerInsurance() {
        this.ui.showMessage('Dealer showing Ace. Insurance available.', 'info');
        this.ui.setButtonState('insurance-btn', true);
        
        // Auto-timeout insurance offer after 10 seconds
        setTimeout(() => {
            this.ui.setButtonState('insurance-btn', false);
        }, 10000);
    }

    /**
     * Execute auto-play if enabled
     */
    async executeAutoPlay() {
        if (!this.autoPlayEnabled || !this.gameState.isInPhase('playing')) return;
        
        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1];
        
        // Get optimal action from strategy
        const { StrategyHints } = await import('../modules/StrategyHints.js');
        const strategy = new StrategyHints();
        
        const hint = strategy.getBasicStrategyHint(
            playerHand, 
            dealerUpCard, 
            this.canDoubleDown(), 
            this.canSplit()
        );
        
        await this.delay(this.autoPlayDelay);
        
        // Execute the recommended action
        const actionResult = await this.executeRecommendedAction(hint.action);
        
        // Continue auto-play if hand continues
        if (actionResult === 'continue' && this.autoPlayEnabled) {
            await this.delay(this.autoPlayDelay);
            await this.executeAutoPlay();
        }
    }

    /**
     * Execute recommended action from strategy
     */
    async executeRecommendedAction(action) {
        switch (action) {
            case 'Hit':
                return await this.handlePlayerAction('hit');
            case 'Stand':
                return await this.handlePlayerAction('stand');
            case 'Double Down':
                if (this.canDoubleDown()) {
                    return await this.handlePlayerAction('doubleDown');
                } else {
                    return await this.handlePlayerAction('hit');
                }
            case 'Split':
                if (this.canSplit()) {
                    return await this.handlePlayerAction('split');
                } else {
                    return await this.handlePlayerAction('hit');
                }
            default:
                return await this.handlePlayerAction('hit');
        }
    }

    /**
     * Handle player action through action handler
     */
    async handlePlayerAction(action) {
        // Delegate to ActionHandler if available via controller-like interface
        if (typeof this.actionHandler?.executeAction === 'function') {
            return await this.actionHandler.executeAction(action);
        }
        return 'continue';
    }

    /**
     * Calculate results for all hands
     */
    calculateHandResults() {
        const dealerValue = this.dealerHand.getValue();
        const dealerBusted = this.dealerHand.isBusted();
        
        const results = {
            hands: [],
            summary: {
                totalWagered: 0,
                totalPayout: 0,
                handsWon: 0,
                handsLost: 0,
                handsPushed: 0
            }
        };
        
        const baseBet = this.gameState.getCurrentBet() / (this.playerHands.length + (this.playerHands.filter(h => h.isDoubled).length));
        
        this.playerHands.forEach((hand, index) => {
            const playerValue = hand.getValue();
            const playerBusted = hand.isBusted();
            const handBet = baseBet * (hand.isDoubled ? 2 : 1);
            
            results.summary.totalWagered += handBet;
            
            let outcome, message, payout = 0;
            
            if (playerBusted) {
                outcome = 'lose';
                message = 'Bust - Lose';
                results.summary.handsLost++;
            } else if (dealerBusted) {
                outcome = 'win';
                message = 'Dealer bust - Win!';
                payout = handBet * 2; // Return bet + winnings
                results.summary.handsWon++;
            } else if (playerValue > dealerValue) {
                outcome = 'win';
                message = 'Win!';
                payout = handBet * 2; // Return bet + winnings
                results.summary.handsWon++;
            } else if (playerValue < dealerValue) {
                outcome = 'lose';
                message = 'Lose';
                results.summary.handsLost++;
            } else {
                outcome = 'push';
                message = 'Push';
                payout = handBet; // Return bet only
                results.summary.handsPushed++;
            }
            
            results.summary.totalPayout += payout;
            results.hands.push({ outcome, message, payout, handBet });
        });
        
        return results;
    }

    /**
     * Update game statistics after hand completion
     */
    updateGameStatistics(results) {
        // Record hand data
        this.statistics.recordHand({
            playerHands: this.playerHands.map(h => ({ 
                cards: h.cards, 
                value: h.getValue(), 
                busted: h.isBusted(),
                isDoubled: h.isDoubled,
                isSplit: h.isSplit
            })),
            dealerHand: {
                cards: this.dealerHand.cards,
                value: this.dealerHand.getValue(),
                busted: this.dealerHand.isBusted()
            },
            bet: results.summary.totalWagered,
            payout: results.summary.totalPayout,
            handsWon: results.summary.handsWon,
            handsLost: results.summary.handsLost,
            handsPushed: results.summary.handsPushed
        });
        
        // Record counting statistics if counting is enabled
        if (this.gameState.getSetting('cardCountingMode')) {
            const result = results.summary.handsWon > 0 ? 'win' : results.summary.handsLost > 0 ? 'loss' : 'push';
            this.statistics.recordCountingHand({
                trueCount: this.cardCounting.getTrueCount(),
                betAmount: results.summary.totalWagered,
                result: result
            });
            
            this.cardCounting.recordBet(results.summary.totalWagered);
        }
        
        // Update bank with net result
        this.statistics.updateBank(results.summary.totalPayout - results.summary.totalWagered);
    }

    /**
     * End current hand
     */
    endCurrentHand() {
        this.gameState.setPhase('finished');
        this.disablePlayerActions();
        this.ui.setButtonState('deal-btn', true);
        
        // Clear undo history for new hand
        this.gameState.clearUndoHistory();
        
        console.log('🏁 Hand finished');
    }

    /**
     * End hand with specific result
     */
    endHandWithResult(result, message) {
        this.ui.showMessage(message, result === 'blackjack' ? 'success' : 'info');
        this.endCurrentHand();
    }

    /**
     * Deal a card to the player with all effects
     */
    async dealCardToPlayer(handIndex, faceUp = true) {
        const card = this.deck.dealCard();
        this.playerHands[handIndex].addCard(card);
        
        // Update card count if in counting mode
        if (this.gameState.getSetting('cardCountingMode')) {
            this.cardCounting.updateCount(card, faceUp);
            this.statistics.updateCardCount(card);
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
     * Deal a card to the dealer with all effects
     */
    async dealCardToDealer(faceUp = true) {
        const card = this.deck.dealCard();
        this.dealerHand.addCard(card);
        
        // Only update count for face-up cards
        if (faceUp && this.gameState.getSetting('cardCountingMode')) {
            this.cardCounting.updateCount(card, faceUp);
            this.statistics.updateCardCount(card);
            this.cardCounting.updateDecksRemaining(this.deck.getDecksRemaining());
        }
        
        const cardElement = await this.ui.addCardToDealer(card, faceUp);
        
        // Highlight card for counting practice if enabled
        if (this.gameState.getSetting('cardCountingMode') && faceUp) {
            this.ui.highlightCardForCounting(cardElement, this.cardCounting.getHiLoValue(card));
        }
        
        if (faceUp && !this.dealerHand || (faceUp && this.dealerHand.cards.length <= 2)) {
            // During initial deal, the visible total is managed elsewhere
        } else if (faceUp) {
            this.updateDealerTotal();
        }
        
        this.updateCardCountingDisplay();
        
        return card;
    }

    /**
     * Check if dealer must hit according to rules
     */
    mustDealerHit() {
        const value = this.dealerHand.getValue();
        return value < 17 || (value === 17 && this.dealerHand.isSoft() && !this.rules.rules.dealerStandsOnSoft17);
    }

    /**
     * Check if player can double down
     */
    canDoubleDown() {
        const hand = this.playerHands[this.currentHandIndex];
        return this.rules.canDoubleDown(hand);
    }

    /**
     * Check if player can split
     */
    canSplit() {
        const hand = this.playerHands[this.currentHandIndex];
        return this.rules.canSplit(hand, this.playerHands.length);
    }

    /**
     * Enable player actions based on available options
     */
    enablePlayerActions() {
        const hand = this.playerHands[this.currentHandIndex];
        const actions = [];

        if (!hand.isBusted() && hand.getValue() < 21) {
            actions.push({ action: 'hit', enabled: true });
        }

        if (!hand.isBusted()) {
            actions.push({ action: 'stand', enabled: true });
        }

        if (this.canDoubleDown()) {
            actions.push({ action: 'doubleDown', enabled: true });
        }

        if (this.canSplit()) {
            actions.push({ action: 'split', enabled: true });
        }

        this.ui.enableGameButtons(actions);
    }

    /**
     * Disable all player actions
     */
    disablePlayerActions() {
        this.ui.disableGameButtons();
    }

    /**
     * Show basic strategy hint if enabled
     */
    showBasicStrategyHint() {
        if (!this.gameState.getSetting('showBasicStrategyHints')) return;

        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1];
        
        if (playerHand && dealerUpCard) {
            // This would call strategy hints module
            console.log('💡 Strategy hint available');
        }
    }

    /**
     * Reset hands for new game
     */
    resetHands() {
        this.dealerHand = new Hand();
        this.playerHands = [new Hand()];
        this.currentHandIndex = 0;
    }

    /**
     * Update player total display
     */
    updatePlayerTotal(handIndex) {
        const hand = this.playerHands[handIndex];
        this.ui.updatePlayerTotal(hand.getValue(), hand.isBusted(), handIndex);
    }

    /**
     * Update dealer total display
     */
    updateDealerTotal() {
        this.ui.updateDealerTotal(this.dealerHand.getValue(), this.dealerHand.isBusted());
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
     * Update all UI displays
     */
    updateAllDisplays() {
        this.updatePlayerTotal(0);
        this.updateDealerTotal();
        
        const basicStats = this.statistics.getStats();
        const strategyStats = this.statistics.getStrategyStats();
        
        this.ui.updateGameStats({
            ...basicStats,
            strategyAccuracy: strategyStats.overallAccuracy,
            strategyGrade: strategyStats.grade
        });
        
        this.ui.updateCurrentBet(this.gameState.getCurrentBet());
        
        if (this.gameState.getSetting('cardCountingMode')) {
            this.updateCardCountingDisplay();
        }
    }

    /**
     * Enhanced delay with game speed controls
     */
    delay(baseMs) {
        const speed = this.gameState.getSetting('gameSpeed');
        const speedMultipliers = {
            'instant': 0,
            'fast': 0.3,
            'normal': 1,
            'slow': 2
        };
        
        const multiplier = speedMultipliers[speed] || 1;
        const actualDelay = Math.round(baseMs * multiplier);
        
        return new Promise(resolve => setTimeout(resolve, actualDelay));
    }

    /**
     * Pause current game flow
     */
    pauseGame() {
        this.isFlowActive = false;
        console.log('⏸️ Game flow paused');
    }

    /**
     * Resume game flow
     */
    resumeGame() {
        this.isFlowActive = true;
        console.log('▶️ Game flow resumed');
    }

    /**
     * Check if game flow is active
     */
    isGameFlowActive() {
        return this.isFlowActive;
    }

    /**
     * Set auto-play mode
     */
    setAutoPlay(enabled, delay = 1000) {
        this.autoPlayEnabled = enabled;
        this.autoPlayDelay = delay;
        console.log(`🤖 Auto-play ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get flow statistics
     */
    getFlowStats() {
        return {
            currentPhase: this.gameState.getPhase(),
            currentHandIndex: this.currentHandIndex,
            totalHands: this.playerHands.length,
            isFlowActive: this.isFlowActive,
            autoPlayEnabled: this.autoPlayEnabled,
            handDuration: this.gameState.getHandDuration()
        };
    }

    /**
     * Validate game flow state
     */
    validateFlowState() {
        const issues = [];
        
        if (!this.dealerHand) {
            issues.push('No dealer hand initialized');
        }
        
        if (!this.playerHands || this.playerHands.length === 0) {
            issues.push('No player hands initialized');
        }
        
        if (this.currentHandIndex < 0 || this.currentHandIndex >= this.playerHands.length) {
            issues.push('Invalid current hand index');
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Emergency stop for flow operations
     */
    emergencyStop() {
        this.isFlowActive = false;
        this.currentSequence = null;
        this.pausedOperations = [];
        console.log('🚨 Emergency stop activated');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.isFlowActive = false;
        this.currentSequence = null;
        this.pausedOperations = [];
        this.autoPlayEnabled = false;
        
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        
        console.log('🧹 GameFlow cleaned up');
    }
}