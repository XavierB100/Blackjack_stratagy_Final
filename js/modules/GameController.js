/**
 * Game Controller - Core game logic and state management
 */

import { Deck } from './Deck.js';
import { Hand } from './Hand.js';
import { GameRules } from './GameRules.js';
import { CardCounting } from './CardCounting.js';

export class GameController {
    constructor(statistics, uiController, strategyHints) {
        this.statistics = statistics;
        this.ui = uiController;
        this.strategyHints = strategyHints;
        this.cardCounting = new CardCounting();
        
        // Game state
        this.deck = null;
        this.dealerHand = null;
        this.playerHands = [];
        this.currentHandIndex = 0;
        this.gamePhase = 'waiting'; // waiting, betting, dealing, playing, dealer, finished
        this.gameSettings = {
            deckCount: 6,
            showBasicStrategyHints: true,
            cardCountingMode: false,
            minimumBet: 5,
            maximumBet: 500,
            gameSpeed: 'normal',
            autoPlay: false,
            soundEffects: false
        };
        
        // Game rules
        this.rules = new GameRules();
        
        // Current game data
        this.currentBet = 25;
        this.insuranceBet = 0;
        this.gameId = null;
        this.handHistory = [];
        
        // Game state management
        this.gameHistory = [];
        this.canUndo = false;
        this.lastAction = null;
        
        this.isInitialized = false;
    }

    /**
     * Initialize the game controller
     */
    async init() {
        try {
            console.log('🎮 Initializing Game Controller...');
            
            // Initialize card counting module
            await this.cardCounting.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize game components
            this.initializeGame();
            
            this.isInitialized = true;
            console.log('✅ Game Controller initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Game Controller:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for game controls
     */
    setupEventListeners() {
        // Main game buttons
        document.getElementById('new-game-btn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('deal-btn')?.addEventListener('click', () => this.dealNewHand());
        document.getElementById('hit-btn')?.addEventListener('click', () => this.hit());
        document.getElementById('stand-btn')?.addEventListener('click', () => this.stand());
        document.getElementById('double-btn')?.addEventListener('click', () => this.doubleDown());
        document.getElementById('split-btn')?.addEventListener('click', () => this.split());
        document.getElementById('insurance-btn')?.addEventListener('click', () => this.takeInsurance());

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

        // Game options
        document.getElementById('deck-count')?.addEventListener('change', (e) => {
            this.setDeckCount(parseInt(e.target.value));
        });

        document.getElementById('basic-strategy-hints')?.addEventListener('change', (e) => {
            this.toggleBasicStrategyHints(e.target.checked);
        });

        document.getElementById('card-counting-practice')?.addEventListener('change', (e) => {
            this.toggleCardCountingMode(e.target.checked);
        });
        
        // Enhanced UX controls
        document.getElementById('game-speed')?.addEventListener('change', (e) => {
            this.setGameSpeed(e.target.value);
        });
        
        document.getElementById('auto-play')?.addEventListener('change', (e) => {
            this.toggleAutoPlay(e.target.checked);
        });
        
        document.getElementById('sound-effects')?.addEventListener('change', (e) => {
            this.toggleSoundEffects(e.target.checked);
        });
        
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undoLastAction());
        document.getElementById('hint-btn')?.addEventListener('click', () => this.showHintModal());
        document.getElementById('stats-btn')?.addEventListener('click', () => this.showStatsModal());
    }

    /**
     * Initialize a new game
     */
    initializeGame() {
        this.deck = new Deck(this.gameSettings.deckCount);
        this.deck.shuffle();
        
        this.dealerHand = new Hand();
        this.playerHands = [new Hand()];
        this.currentHandIndex = 0;
        this.gamePhase = 'waiting';
        this.gameId = Date.now();
        
        this.updateUI();
        this.ui.showMessage('Welcome! Click "Deal" to start playing.', 'info');
    }

    /**
     * Start a new game session
     */
    startNewGame() {
        console.log('🆕 Starting new game session');
        
        // Reset statistics for new session
        this.statistics.startNewSession();
        
        // Initialize new game
        this.initializeGame();
        
        // Enable deal button
        this.ui.setButtonState('deal-btn', true);
        this.ui.setButtonState('new-game-btn', false);
        
        this.ui.showMessage('New game started! Place your bet and click "Deal".', 'success');
    }

    /**
     * Deal a new hand
     */
    dealNewHand() {
        if (this.gamePhase !== 'waiting' && this.gamePhase !== 'finished') {
            console.warn('Cannot deal while game is in progress');
            return;
        }

        console.log('🎴 Dealing new hand');
        
        // Check if deck needs reshuffling
        if (this.deck.needsReshuffle()) {
            this.deck.shuffle();
            this.ui.showMessage('Reshuffling deck...', 'info', 2000);
            
            // Reset card count if in counting mode
            if (this.gameSettings.cardCountingMode) {
                this.cardCounting.reset();
                this.statistics.resetCardCount();
                this.updateCardCountingDisplay();
            }
        }

        // Reset hands
        this.dealerHand = new Hand();
        this.playerHands = [new Hand()];
        this.currentHandIndex = 0;
        this.insuranceBet = 0;
        
        // Update UI to show dealing phase
        this.gamePhase = 'dealing';
        this.ui.updateGamePhase('dealing', 'Dealing Cards');
        
        // Deal initial cards with proper timing
        this.dealInitialCards();
    }

    /**
     * Deal initial two cards to player and dealer with enhanced timing
     */
    async dealInitialCards() {
        try {
            // Show dealing phase
            this.ui.showLoadingOverlay('Dealing Cards...');
            
            // Deal cards with realistic casino timing
            await this.dealCardToPlayer(0, true);
            await this.delay(400);
            
            await this.dealCardToDealer(false); // Face down (hole card)
            await this.delay(400);
            
            await this.dealCardToPlayer(0, true);
            await this.delay(400);
            
            await this.dealCardToDealer(true); // Face up
            await this.delay(200);
            
            this.ui.hideLoadingOverlay();
            
            // Check for blackjacks and insurance
            this.checkForBlackjacks();
        } catch (error) {
            console.error('Error dealing initial cards:', error);
            this.ui.hideLoadingOverlay();
            this.ui.showMessage('Error dealing cards. Please try again.', 'error');
        }
    }

    /**
     * Deal a card to the player
     */
    async dealCardToPlayer(handIndex, faceUp = true) {
        const card = this.deck.dealCard();
        this.playerHands[handIndex].addCard(card);
        
        // Update card count if in counting mode
        if (this.gameSettings.cardCountingMode) {
            this.cardCounting.updateCount(card, faceUp);
            this.statistics.updateCardCount(card);
            
            // Update deck tracking
            this.cardCounting.updateDecksRemaining(this.deck.getDecksRemaining());
        }
        
        const cardElement = this.ui.addCardToPlayer(card, handIndex, faceUp);
        
        // Highlight card for counting practice if enabled
        if (this.gameSettings.cardCountingMode && faceUp) {
            this.ui.highlightCardForCounting(cardElement, this.cardCounting.getHiLoValue(card));
        }
        
        this.updatePlayerTotal(handIndex);
        this.updateCardCountingDisplay();
        
        return card;
    }

    /**
     * Deal a card to the dealer
     */
    async dealCardToDealer(faceUp = true) {
        const card = this.deck.dealCard();
        this.dealerHand.addCard(card);
        
        // Only update count for face-up cards
        if (faceUp && this.gameSettings.cardCountingMode) {
            this.cardCounting.updateCount(card, faceUp);
            this.statistics.updateCardCount(card);
            
            // Update deck tracking
            this.cardCounting.updateDecksRemaining(this.deck.getDecksRemaining());
        }
        
        const cardElement = this.ui.addCardToDealer(card, faceUp);
        
        // Highlight card for counting practice if enabled
        if (this.gameSettings.cardCountingMode && faceUp) {
            this.ui.highlightCardForCounting(cardElement, this.cardCounting.getHiLoValue(card));
        }
        
        if (faceUp) {
            this.updateDealerTotal();
        }
        
        this.updateCardCountingDisplay();
        
        return card;
    }

    /**
     * Check for blackjacks and insurance after initial deal
     */
    async checkForBlackjacks() {
        const playerBlackjack = this.playerHands[0].isBlackjack();
        const dealerUpCard = this.dealerHand.cards[1];
        const dealerBlackjack = this.dealerHand.isBlackjack();
        
        // Check for insurance opportunity first
        if (dealerUpCard.rank === 'A' && !playerBlackjack) {
            await this.offerInsurance();
        }

        if (playerBlackjack && dealerBlackjack) {
            await this.delay(500);
            this.ui.revealDealerHoleCard();
            this.updateDealerTotal();
            this.ui.showResultCelebration('push', 'Push!');
            this.endHand('push', 'Both have blackjack - Push!');
        } else if (playerBlackjack) {
            await this.delay(500);
            this.ui.showResultCelebration('blackjack', 'BLACKJACK!');
            this.ui.addCardEffect(0, 'winning');
            this.endHand('blackjack', 'Blackjack! You win!');
        } else if (dealerBlackjack) {
            await this.delay(500);
            this.ui.revealDealerHoleCard();
            this.updateDealerTotal();
            this.ui.showResultCelebration('lose', 'Dealer Blackjack');
            this.endHand('dealer_blackjack', 'Dealer has blackjack. You lose.');
        } else {
            // Normal play begins
            this.gamePhase = 'playing';
            this.ui.updateGamePhase('playing', 'Your Turn');
            this.enablePlayerActions();
            await this.delay(300);
            this.showBasicStrategyHint();
        }
    }

    /**
     * Player hits (takes another card) with enhanced feedback
     */
    async hit() {
        // Save state for undo
        this.saveGameState();
        this.lastAction = 'hit';
        if (this.gamePhase !== 'playing') return;

        console.log(`👋 Player hits on hand ${this.currentHandIndex}`);
        
        // Track strategy accuracy
        const hint = this.getLastStrategyHint();
        if (hint) {
            this.statistics.recordStrategyDecision('Hit', hint.action, hint.handType);
        }
        
        // Disable buttons during card dealing
        this.disablePlayerActions();
        this.ui.setButtonLoading('hit-btn', true);
        
        const card = await this.dealCardToPlayer(this.currentHandIndex);
        const hand = this.playerHands[this.currentHandIndex];
        
        await this.delay(200);
        
        this.ui.setButtonLoading('hit-btn', false);
        
        if (hand.isBusted()) {
            this.ui.addCardEffect(this.currentHandIndex, 'busted');
            this.ui.showMessage('Bust!', 'error', 2000);
            await this.delay(1000);
            this.moveToNextHand();
        } else if (hand.getValue() === 21) {
            this.ui.addCardEffect(this.currentHandIndex, 'winning');
            this.ui.showMessage('21!', 'success', 1500);
            await this.delay(1000);
            this.moveToNextHand();
        } else {
            this.enablePlayerActions();
            await this.delay(300);
            this.showBasicStrategyHint();
        }
    }

    /**
     * Player stands (ends turn) with enhanced feedback
     */
    async stand() {
        // Save state for undo
        this.saveGameState();
        this.lastAction = 'stand';
        if (this.gamePhase !== 'playing') return;

        console.log(`✋ Player stands on hand ${this.currentHandIndex}`);
        
        // Track strategy accuracy
        const hint = this.getLastStrategyHint();
        if (hint) {
            this.statistics.recordStrategyDecision('Stand', hint.action, hint.handType);
        }
        
        this.ui.setButtonLoading('stand-btn', true);
        await this.delay(300);
        this.ui.setButtonLoading('stand-btn', false);
        
        this.moveToNextHand();
    }

    /**
     * Player doubles down with enhanced feedback
     */
    async doubleDown() {
        // Save state for undo
        this.saveGameState();
        this.lastAction = 'double';
        if (this.gamePhase !== 'playing') return;
        if (!this.canDoubleDown()) {
            this.ui.showMessage('Cannot double down', 'error', 2000);
            return;
        }

        console.log(`💰 Player doubles down on hand ${this.currentHandIndex}`);
        
        // Track strategy accuracy
        const hint = this.getLastStrategyHint();
        if (hint) {
            this.statistics.recordStrategyDecision('Double Down', hint.action, hint.handType);
        }
        
        this.disablePlayerActions();
        this.ui.setButtonLoading('double-btn', true);
        
        const hand = this.playerHands[this.currentHandIndex];
        hand.isDoubled = true;
        
        // Double the bet for this hand
        const additionalBet = this.currentBet / this.playerHands.length;
        this.currentBet += additionalBet;
        this.ui.updateCurrentBet(this.currentBet);
        this.ui.showMessage(`Bet doubled to $${this.currentBet}!`, 'info', 2000);
        
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
        this.moveToNextHand();
    }

    /**
     * Player splits pair
     */
    async split() {
        if (this.gamePhase !== 'playing') return;
        if (!this.canSplit()) {
            this.ui.showMessage('Cannot split', 'error', 2000);
            return;
        }

        console.log(`✂️ Player splits hand ${this.currentHandIndex}`);
        
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
        this.currentBet *= 2;
        this.ui.updateCurrentBet(this.currentBet);
        
        this.ui.showSplitHands(this.playerHands);
        this.updateUI();
        this.enablePlayerActions();
    }
    
    /**
     * Take insurance
     */
    takeInsurance() {
        if (this.gamePhase !== 'playing') return;
        
        const dealerUpCard = this.dealerHand.cards[1];
        if (!this.rules.canTakeInsurance(dealerUpCard, this.playerHands[0])) {
            this.ui.showMessage('Insurance not available', 'error', 2000);
            return;
        }
        
        console.log('🛡️ Player takes insurance');
        
        this.insuranceBet = Math.floor(this.currentBet / 2);
        this.ui.showMessage(`Insurance bet: $${this.insuranceBet}`, 'info', 3000);
        
        // Insurance is resolved immediately when dealer checks for blackjack
        if (this.dealerHand.isBlackjack()) {
            const insurancePayout = this.rules.calculateInsurancePayout(this.insuranceBet);
            this.statistics.updateBank(insurancePayout);
            this.ui.showMessage(`Insurance pays $${insurancePayout}!`, 'success', 3000);
        } else {
            this.statistics.updateBank(-this.insuranceBet);
            this.ui.showMessage('Insurance lost', 'error', 2000);
        }
        
        // Disable insurance button after taking insurance
        this.ui.setButtonState('insurance-btn', false);
    }

    /**
     * Move to next hand or dealer play
     */
    moveToNextHand() {
        this.currentHandIndex++;
        
        if (this.currentHandIndex >= this.playerHands.length) {
            // All player hands completed, dealer plays
            this.dealerPlay();
        } else {
            // Move to next hand
            this.ui.highlightCurrentHand(this.currentHandIndex);
            this.showBasicStrategyHint();
        }
    }

    /**
     * Dealer plays according to rules with enhanced presentation
     */
    async dealerPlay() {
        this.gamePhase = 'dealer';
        this.ui.updateGamePhase('dealer', 'Dealer\'s Turn');
        this.disablePlayerActions();
        
        this.ui.showMessage('Dealer reveals hole card...', 'info');
        await this.delay(1000);
        
        // Reveal hole card with dramatic timing
        this.ui.revealDealerHoleCard();
        this.updateDealerTotal();
        
        // Update card count for hole card
        if (this.gameSettings.cardCountingMode) {
            this.cardCounting.updateCount(this.dealerHand.cards[0], true);
            this.statistics.updateCardCount(this.dealerHand.cards[0]);
            this.updateCardCountingDisplay();
        }
        
        await this.delay(1500);
        
        // Check if dealer has blackjack or needs to draw
        const dealerValue = this.dealerHand.getValue();
        
        if (dealerValue === 21) {
            this.ui.showMessage('Dealer has 21!', 'info', 2000);
        } else if (dealerValue < 17 || (dealerValue === 17 && this.dealerHand.isSoft() && !this.rules.rules.dealerStandsOnSoft17)) {
            this.ui.showMessage('Dealer must hit...', 'info');
            await this.delay(1000);
            
            // Dealer draws cards according to rules
            while (this.dealerHand.getValue() < 17 || 
                   (this.dealerHand.getValue() === 17 && this.dealerHand.isSoft() && !this.rules.rules.dealerStandsOnSoft17)) {
                
                await this.delay(1200);
                await this.dealCardToDealer(true);
                await this.delay(800);
                
                const newValue = this.dealerHand.getValue();
                if (newValue > 21) {
                    this.ui.addCardEffect(undefined, 'busted'); // Dealer cards
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
        
        // Determine winners
        this.determineWinners();
    }

    /**
     * Determine winners and payouts
     */
    determineWinners() {
        const dealerValue = this.dealerHand.getValue();
        const dealerBusted = this.dealerHand.isBusted();
        
        let totalPayout = 0;
        let totalWagered = 0;
        let handsWon = 0;
        let handsLost = 0;
        let handsPushed = 0;
        
        const baseBet = this.currentBet / (this.playerHands.length + (this.playerHands.filter(h => h.isDoubled).length));
        
        this.playerHands.forEach((hand, index) => {
            const playerValue = hand.getValue();
            const playerBusted = hand.isBusted();
            const handBet = baseBet * (hand.isDoubled ? 2 : 1);
            
            totalWagered += handBet;
            
            let result, message, payout = 0;
            
            if (playerBusted) {
                result = 'lose';
                message = 'Bust - Lose';
                handsLost++;
            } else if (dealerBusted) {
                result = 'win';
                message = 'Dealer bust - Win!';
                payout = handBet * 2; // Return bet + winnings
                handsWon++;
            } else if (playerValue > dealerValue) {
                result = 'win';
                message = 'Win!';
                payout = handBet * 2; // Return bet + winnings
                handsWon++;
            } else if (playerValue < dealerValue) {
                result = 'lose';
                message = 'Lose';
                handsLost++;
            } else {
                result = 'push';
                message = 'Push';
                payout = handBet; // Return bet only
                handsPushed++;
            }
            
            totalPayout += payout;
            this.ui.showHandResult(index, result, message);
        });
        
        // Update statistics
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
                value: dealerValue,
                busted: dealerBusted
            },
            bet: totalWagered,
            payout: totalPayout,
            handsWon,
            handsLost,
            handsPushed
        });
        
        // Record counting statistics if counting is enabled
        if (this.gameSettings.cardCountingMode) {
            const result = handsWon > 0 ? 'win' : handsLost > 0 ? 'loss' : 'push';
            this.statistics.recordCountingHand({
                trueCount: this.cardCounting.getTrueCount(),
                betAmount: totalWagered,
                result: result
            });
            
            // Record bet for tracking
            this.cardCounting.recordBet(totalWagered);
        }
        
        // Update bank (net gain/loss)
        this.statistics.updateBank(totalPayout - totalWagered);
        
        // End game
        this.endGame();
    }

    /**
     * End the current game
     */
    endGame() {
        this.gamePhase = 'finished';
        this.disablePlayerActions();
        this.ui.setButtonState('deal-btn', true);
        this.updateUI();
        
        console.log('🏁 Hand finished');
    }

    /**
     * End hand with specific result
     */
    endHand(result, message) {
        let payout = 0;
        
        switch (result) {
            case 'blackjack':
                payout = Math.floor(this.currentBet * 1.5); // 3:2 payout
                this.statistics.updateBank(payout);
                break;
            case 'push':
                payout = 0; // Return bet
                break;
            case 'dealer_blackjack':
                payout = -this.currentBet;
                this.statistics.updateBank(payout);
                break;
        }
        
        this.ui.showMessage(message, result === 'blackjack' ? 'success' : 'info');
        this.endGame();
    }

    /**
     * Check if player can double down
     */
    canDoubleDown() {
        const hand = this.playerHands[this.currentHandIndex];
        const additionalBet = this.currentBet / this.playerHands.length;
        return hand.cards.length === 2 && 
               !hand.isDoubled && 
               this.statistics.getBankAmount() >= additionalBet;
    }

    /**
     * Check if player can split
     */
    canSplit() {
        const hand = this.playerHands[this.currentHandIndex];
        return hand.cards.length === 2 && 
               hand.cards[0].rank === hand.cards[1].rank &&
               this.playerHands.length < 4 &&
               !hand.isSplit &&
               this.statistics.getBankAmount() >= this.currentBet;
    }
    
    /**
     * Check if player can take insurance
     */
    canTakeInsurance() {
        if (this.dealerHand.cards.length < 2) return false;
        const dealerUpCard = this.dealerHand.cards[1];
        const playerHand = this.playerHands[this.currentHandIndex];
        
        return this.rules.canTakeInsurance(dealerUpCard, playerHand) && 
               this.insuranceBet === 0 && // Haven't taken insurance yet
               this.statistics.getBankAmount() >= Math.floor(this.currentBet / 2);
    }

    /**
     * Enable player action buttons
     */
    enablePlayerActions() {
        this.ui.setButtonState('hit-btn', true);
        this.ui.setButtonState('stand-btn', true);
        this.ui.setButtonState('double-btn', this.canDoubleDown());
        this.ui.setButtonState('split-btn', this.canSplit());
        this.ui.setButtonState('insurance-btn', this.canTakeInsurance());
        this.ui.setButtonState('deal-btn', false);
    }

    /**
     * Disable player action buttons
     */
    disablePlayerActions() {
        this.ui.setButtonState('hit-btn', false);
        this.ui.setButtonState('stand-btn', false);
        this.ui.setButtonState('double-btn', false);
        this.ui.setButtonState('split-btn', false);
        this.ui.setButtonState('insurance-btn', false);
    }

    /**
     * Show basic strategy hint with enhanced information
     */
    showBasicStrategyHint() {
        if (!this.gameSettings.showBasicStrategyHints) return;

        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1]; // Second card is face up
        
        if (playerHand && dealerUpCard) {
            const canDouble = this.canDoubleDown();
            const canSplit = this.canSplit();
            
            const hint = this.strategyHints.getBasicStrategyHint(
                playerHand, 
                dealerUpCard, 
                canDouble, 
                canSplit
            );
            
            // Check for index play deviations if counting is enabled
            if (this.gameSettings.cardCountingMode) {
                const indexPlay = this.cardCounting.getIndexPlayRecommendation(playerHand, dealerUpCard);
                if (indexPlay.hasDeviation) {
                    // Override basic strategy with index play
                    hint.action = indexPlay.action;
                    hint.explanation += ` (Index Play: ${indexPlay.reason})`;
                    
                    // Show index play recommendation
                    this.ui.showIndexPlayRecommendation(indexPlay);
                }
            }
            
            // Store hint for accuracy tracking
            this.lastStrategyHint = hint;
            
            // Visual indication on buttons
            this.highlightRecommendedAction(hint.action);
            
            // Show modal if enabled
            if (this.gameSettings.showStrategyModal) {
                this.ui.showStrategyHint(hint);
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
     * Get last strategy hint for tracking
     */
    getLastStrategyHint() {
        return this.lastStrategyHint;
    }
    
    /**
     * Offer insurance when dealer shows Ace
     */
    async offerInsurance() {
        if (!this.canTakeInsurance()) return;
        
        this.ui.showMessage('Dealer showing Ace. Insurance available.', 'info');
        this.ui.setButtonState('insurance-btn', true);
        
        // Auto-timeout insurance offer after 10 seconds
        setTimeout(() => {
            this.ui.setButtonState('insurance-btn', false);
        }, 10000);
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
     * Update all UI elements
     */
    updateUI() {
        this.updatePlayerTotal(0);
        this.updateDealerTotal();
        // Update UI with comprehensive stats including strategy accuracy
        const basicStats = this.statistics.getStats();
        const strategyStats = this.statistics.getStrategyStats();
        
        this.ui.updateGameStats({
            ...basicStats,
            strategyAccuracy: strategyStats.overallAccuracy,
            strategyGrade: strategyStats.grade
        });
        this.ui.updateCurrentBet(this.currentBet);
        
        if (this.gameSettings.cardCountingMode) {
            this.updateCardCountingDisplay();
            this.updateBettingRecommendations();
        }
    }
    
    /**
     * Update card counting display
     */
    updateCardCountingDisplay() {
        if (!this.gameSettings.cardCountingMode) return;
        
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
        if (!this.gameSettings.cardCountingMode) return;
        
        const bettingRec = this.cardCounting.getBettingRecommendation(
            this.currentBet,
            this.statistics.getBankAmount()
        );
        
        const evData = this.cardCounting.getEVCalculation(bettingRec.recommendedBet);
        
        const bettingData = {
            ...bettingRec,
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
            betAmount: this.currentBet,
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
     * Set bet amount
     */
    setBetAmount(amount) {
        const clampedAmount = Math.max(this.gameSettings.minimumBet, 
                                     Math.min(amount, this.gameSettings.maximumBet));
        this.currentBet = clampedAmount;
        this.ui.updateCurrentBet(clampedAmount);
        document.getElementById('bet-amount').value = clampedAmount;
    }

    /**
     * Enhanced delay with speed controls
     */
    delay(baseMs) {
        const speedMultipliers = {
            'instant': 0,
            'fast': 0.3,
            'normal': 1,
            'slow': 2
        };
        
        const multiplier = speedMultipliers[this.gameSettings.gameSpeed] || 1;
        const actualDelay = Math.round(baseMs * multiplier);
        
        return new Promise(resolve => setTimeout(resolve, actualDelay));
    }

    pauseGame() {
        // Pause any ongoing animations or timers
        console.log('⏸️ Game paused');
    }

    isGameActive() {
        return this.gamePhase === 'playing';
    }

    // Getters and setters for settings
    setDeckCount(count) { 
        this.gameSettings.deckCount = count; 
        if (this.gamePhase === 'waiting' || this.gamePhase === 'finished') {
            this.initializeGame();
        }
    }
    
    getDeckCount() { return this.gameSettings.deckCount; }
    
    toggleBasicStrategyHints(enabled) { this.gameSettings.showBasicStrategyHints = enabled; }
    getShowHints() { return this.gameSettings.showBasicStrategyHints; }
    
    toggleCardCountingMode(enabled) { 
        this.gameSettings.cardCountingMode = enabled;
        this.cardCounting.setEnabled(enabled);
        this.cardCounting.setTotalDecks(this.gameSettings.deckCount);
        this.ui.toggleCardCountingDisplay(enabled);
        
        // Update display immediately
        if (enabled) {
            this.updateCardCountingDisplay();
            this.updateBettingRecommendations();
        }
    }
    getCardCountingMode() { return this.gameSettings.cardCountingMode; }
    
    getLastBetAmount() { return this.currentBet; }
    
    /**
     * Enhanced chip betting with animation
     */
    setBetAmount(amount) {
        const clampedAmount = Math.max(this.gameSettings.minimumBet, 
                                     Math.min(amount, this.gameSettings.maximumBet));
        this.currentBet = clampedAmount;
        this.ui.updateCurrentBet(clampedAmount);
        this.ui.animateChipSelection(amount);
        document.getElementById('bet-amount').value = clampedAmount;
    }
    
    setPreferences(prefs) {
        if (prefs.deckCount) this.setDeckCount(prefs.deckCount);
        if (prefs.showBasicStrategyHints !== undefined) this.toggleBasicStrategyHints(prefs.showBasicStrategyHints);
        if (prefs.cardCountingMode !== undefined) this.toggleCardCountingMode(prefs.cardCountingMode);
        if (prefs.lastBetAmount) this.setBetAmount(prefs.lastBetAmount);
        if (prefs.gameSpeed) this.setGameSpeed(prefs.gameSpeed);
        if (prefs.soundEffects !== undefined) this.toggleSoundEffects(prefs.soundEffects);
    }
    
    /**
     * Game speed control
     */
    setGameSpeed(speed) {
        this.gameSettings.gameSpeed = speed;
        console.log(`🎮 Game speed set to: ${speed}`);
        
        // Update UI animations based on speed
        this.ui.setAnimationsEnabled(speed !== 'instant');
    }
    
    /**
     * Toggle auto-play mode
     */
    toggleAutoPlay(enabled) {
        this.gameSettings.autoPlay = enabled;
        console.log(`🤖 Auto-play ${enabled ? 'enabled' : 'disabled'}`);
        
        if (enabled && this.gamePhase === 'playing') {
            this.executeOptimalAction();
        }
    }
    
    /**
     * Execute optimal action in auto-play mode
     */
    async executeOptimalAction() {
        if (!this.gameSettings.autoPlay || this.gamePhase !== 'playing') return;
        
        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1];
        
        const hint = this.strategyHints.getBasicStrategyHint(
            playerHand, 
            dealerUpCard, 
            this.canDoubleDown(), 
            this.canSplit()
        );
        
        await this.delay(1000); // Brief pause before auto-action
        
        switch (hint.action) {
            case 'Hit':
                this.hit();
                break;
            case 'Stand':
                this.stand();
                break;
            case 'Double Down':
                if (this.canDoubleDown()) {
                    this.doubleDown();
                } else {
                    this.hit();
                }
                break;
            case 'Split':
                if (this.canSplit()) {
                    this.split();
                } else {
                    this.hit();
                }
                break;
            default:
                this.hit();
        }
    }
    
    /**
     * Toggle sound effects
     */
    toggleSoundEffects(enabled) {
        this.gameSettings.soundEffects = enabled;
        this.ui.setSoundEnabled(enabled);
        console.log(`🔊 Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Save game state for undo functionality
     */
    saveGameState() {
        this.gameHistory.push({
            dealerHand: this.dealerHand.clone(),
            playerHands: this.playerHands.map(hand => hand.clone()),
            currentHandIndex: this.currentHandIndex,
            currentBet: this.currentBet,
            gamePhase: this.gamePhase,
            bankAmount: this.statistics.getBankAmount(),
            timestamp: Date.now()
        });
        
        // Keep only last 5 states
        if (this.gameHistory.length > 5) {
            this.gameHistory.shift();
        }
        
        this.canUndo = true;
        this.ui.setButtonState('undo-btn', true);
    }
    
    /**
     * Undo last action
     */
    undoLastAction() {
        if (!this.canUndo || this.gameHistory.length === 0) {
            this.ui.showMessage('No action to undo', 'warning', 2000);
            return;
        }
        
        const lastState = this.gameHistory.pop();
        
        // Restore game state
        this.dealerHand = lastState.dealerHand;
        this.playerHands = lastState.playerHands;
        this.currentHandIndex = lastState.currentHandIndex;
        this.currentBet = lastState.currentBet;
        this.gamePhase = lastState.gamePhase;
        
        // Update UI
        this.ui.clearDealer();
        this.ui.clearPlayer();
        
        // Redraw cards
        this.dealerHand.cards.forEach((card, index) => {
            this.ui.addCardToDealer(card, index > 0); // First card face down
        });
        
        this.playerHands.forEach((hand, handIndex) => {
            hand.cards.forEach(card => {
                this.ui.addCardToPlayer(card, handIndex, true);
            });
        });
        
        this.updateUI();
        this.enablePlayerActions();
        
        this.canUndo = this.gameHistory.length > 0;
        this.ui.setButtonState('undo-btn', this.canUndo);
        
        this.ui.showMessage('Action undone', 'info', 2000);
        console.log('🔄 Last action undone');
    }
    
    /**
     * Show strategy hint modal
     */
    showHintModal() {
        if (this.gamePhase !== 'playing') {
            this.ui.showMessage('Hints only available during play', 'warning', 2000);
            return;
        }
        
        const playerHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[1];
        
        if (playerHand && dealerUpCard) {
            const hint = this.strategyHints.getBasicStrategyHint(
                playerHand, 
                dealerUpCard, 
                this.canDoubleDown(), 
                this.canSplit()
            );
            
            this.ui.showStrategyHint(hint);
        }
    }
    
    /**
     * Show detailed statistics modal
     */
    showStatsModal() {
        const stats = this.statistics.getStats();
        const strategyStats = this.statistics.getStrategyStats();
        
        const statsHtml = `
            <div class="detailed-stats">
                <div class="stats-section">
                    <h4>Session Performance</h4>
                    <p>Hands Played: <strong>${stats.handsPlayed}</strong></p>
                    <p>Win Rate: <strong>${stats.winRate.toFixed(1)}%</strong></p>
                    <p>Net Gain: <strong>$${stats.netGain}</strong></p>
                    <p>Session Duration: <strong>${stats.sessionDuration} minutes</strong></p>
                </div>
                
                <div class="stats-section">
                    <h4>Strategy Accuracy</h4>
                    <p>Overall Accuracy: <strong>${strategyStats.overallAccuracy}%</strong></p>
                    <p>Grade: <strong>${strategyStats.grade}</strong></p>
                    <p>Total Decisions: <strong>${strategyStats.totalDecisions}</strong></p>
                </div>
                
                <div class="stats-section">
                    <h4>Action Breakdown</h4>
                    <p>Hit Accuracy: <strong>${strategyStats.actionAccuracy.hit.toFixed(1)}%</strong></p>
                    <p>Stand Accuracy: <strong>${strategyStats.actionAccuracy.stand.toFixed(1)}%</strong></p>
                    <p>Double Accuracy: <strong>${strategyStats.actionAccuracy.double.toFixed(1)}%</strong></p>
                </div>
            </div>
        `;
        
        this.ui.showModal('Detailed Statistics', statsHtml);
    }
}