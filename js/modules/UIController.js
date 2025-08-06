/**
 * UI Controller - Manages all user interface updates and interactions
 */

export class UIController {
    constructor() {
        this.elements = {};
        this.animations = {
            cardDealing: true,
            results: true,
            transitions: true
        };
        this.sounds = {
            enabled: false, // Disabled by default
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
            console.log('🖼️ Initializing UI Controller...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up UI event listeners
            this.setupUIEventListeners();
            
            // Initialize UI state
            this.initializeUI();
            
            this.isInitialized = true;
            console.log('✅ UI Controller initialized');
        } catch (error) {
            console.error('❌ Failed to initialize UI Controller:', error);
            throw error;
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Game messages
            gameMessages: document.getElementById('game-messages'),
            
            // Dealer elements
            dealerCards: document.getElementById('dealer-cards'),
            dealerTotal: document.getElementById('dealer-total'),
            
            // Player elements
            playerCards: document.getElementById('player-cards'),
            playerTotal: document.getElementById('player-total'),
            
            // Statistics
            handsPlayed: document.getElementById('hands-played'),
            wins: document.getElementById('wins'),
            winRate: document.getElementById('win-rate'),
            bank: document.getElementById('bank'),
            runningCount: document.getElementById('running-count'),
            trueCount: document.getElementById('true-count'),
            decksRemaining: document.getElementById('decks-remaining'),
            strategyAccuracy: document.getElementById('strategy-accuracy'),
            strategyGrade: document.getElementById('strategy-grade'),
            totalDecisions: document.getElementById('total-decisions'),
            
            // Betting
            betAmount: document.getElementById('bet-amount'),
            currentBet: document.getElementById('current-bet'),
            
            // Buttons
            newGameBtn: document.getElementById('new-game-btn'),
            dealBtn: document.getElementById('deal-btn'),
            hitBtn: document.getElementById('hit-btn'),
            standBtn: document.getElementById('stand-btn'),
            doubleBtn: document.getElementById('double-btn'),
            splitBtn: document.getElementById('split-btn'),
            
            // Modal
            strategyHintModal: document.getElementById('strategy-hint-modal'),
            strategyHintText: document.getElementById('strategy-hint-text'),
            closeHint: document.getElementById('close-hint')
        };
    }

    /**
     * Set up UI-specific event listeners
     */
    setupUIEventListeners() {
        // Modal close handlers
        if (this.elements.closeHint) {
            this.elements.closeHint.addEventListener('click', () => {
                this.hideModal();
            });
        }

        if (this.elements.strategyHintModal) {
            this.elements.strategyHintModal.addEventListener('click', (e) => {
                if (e.target === this.elements.strategyHintModal) {
                    this.hideModal();
                }
            });
        }

        // Keyboard handler for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalVisible()) {
                this.hideModal();
            }
        });
    }

    /**
     * Initialize UI to default state
     */
    initializeUI() {
        // Clear all card displays
        this.clearDealer();
        this.clearPlayer();
        
        // Reset totals
        this.updateDealerTotal('', false);
        this.updatePlayerTotal('', false);
        
        // Set initial message
        this.showMessage('Welcome to BlackjackPro! Click "New Game" to start.', 'info');
        
        // Set initial button states
        this.setButtonState('new-game-btn', true);
        this.setButtonState('deal-btn', false);
        this.disableGameButtons();
        
        // Hide card counting display initially
        this.toggleCardCountingDisplay(false);
        
        // Initialize card counting UI elements
        this.initializeCardCountingUI();
    }

    /**
     * Add card to dealer's hand with enhanced animations
     */
    addCardToDealer(card, faceUp = true) {
        const cardElement = this.createCardElement(card, faceUp);
        
        if (this.animations.cardDealing) {
            cardElement.classList.add('dealing');
            cardElement.style.opacity = '0';
        }
        
        this.elements.dealerCards.appendChild(cardElement);
        
        if (this.animations.cardDealing) {
            // Enhanced card dealing animation
            setTimeout(() => {
                cardElement.style.opacity = '1';
                cardElement.classList.remove('dealing');
            }, 50);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                cardElement.classList.remove('dealing');
            }, 500);
        }
        
        this.playCardSound();
        return cardElement;
    }

    /**
     * Add card to player's hand with enhanced animations
     */
    addCardToPlayer(card, handIndex = 0, faceUp = true) {
        const cardElement = this.createCardElement(card, faceUp);
        
        if (this.animations.cardDealing) {
            cardElement.classList.add('dealing');
            cardElement.style.opacity = '0';
        }
        
        // Determine where to add the card
        let targetContainer;
        const splitHandContainer = document.querySelector(`#player-cards-${handIndex}`);
        
        if (splitHandContainer) {
            targetContainer = splitHandContainer;
        } else {
            targetContainer = this.elements.playerCards;
        }
        
        targetContainer.appendChild(cardElement);
        
        if (this.animations.cardDealing) {
            setTimeout(() => {
                cardElement.style.opacity = '1';
                cardElement.classList.remove('dealing');
            }, 50);
            
            setTimeout(() => {
                cardElement.classList.remove('dealing');
            }, 500);
        }
        
        this.playCardSound();
        return cardElement;
    }

    /**
     * Create a card DOM element
     */
    createCardElement(card, faceUp = true) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        
        if (faceUp) {
            cardDiv.innerHTML = `
                <div class="card-top">${card.getDisplayValue()}<span class="suit">${card.suit}</span></div>
                <div class="card-center">${card.suit}</div>
                <div class="card-bottom">${card.getDisplayValue()}<span class="suit">${card.suit}</span></div>
            `;
        } else {
            cardDiv.className = 'card card-back';
            cardDiv.innerHTML = '<div class="card-back-design">🎴</div>';
            cardDiv.dataset.hiddenCard = JSON.stringify({
                suit: card.suit,
                rank: card.rank,
                color: card.color
            });
        }
        
        return cardDiv;
    }

    /**
     * Reveal dealer's hole card with flip animation
     */
    revealDealerHoleCard() {
        const holeCard = this.elements.dealerCards.querySelector('.card-back');
        if (holeCard && holeCard.dataset.hiddenCard) {
            const cardData = JSON.parse(holeCard.dataset.hiddenCard);
            
            if (this.animations.transitions) {
                holeCard.classList.add('flipping');
                
                setTimeout(() => {
                    holeCard.className = `card ${cardData.color}`;
                    holeCard.innerHTML = `
                        <div class="card-top">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
                        <div class="card-center">${cardData.suit}</div>
                        <div class="card-bottom">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
                    `;
                }, 300);
                
                setTimeout(() => {
                    holeCard.classList.remove('flipping');
                }, 600);
            } else {
                holeCard.className = `card ${cardData.color}`;
                holeCard.innerHTML = `
                    <div class="card-top">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
                    <div class="card-center">${cardData.suit}</div>
                    <div class="card-bottom">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
                `;
            }
            
            this.playCardSound();
        }
    }

    /**
     * Update dealer total display
     */
    updateDealerTotal(total, isBusted = false) {
        if (!this.elements.dealerTotal) return;
        
        if (total === '') {
            this.elements.dealerTotal.textContent = '';
            return;
        }
        
        this.elements.dealerTotal.textContent = isBusted ? `${total} - BUST!` : total;
        this.elements.dealerTotal.className = `dealer-total ${isBusted ? 'busted' : ''}`;
    }

    /**
     * Update player total display
     */
    updatePlayerTotal(total, isBusted = false, handIndex = 0) {
        const splitTotalElement = document.querySelector(`#player-total-${handIndex}`);
        
        if (splitTotalElement) {
            // Update split hand total
            if (total === '') {
                splitTotalElement.textContent = '';
                return;
            }
            splitTotalElement.textContent = isBusted ? `${total} - BUST!` : total;
            splitTotalElement.className = `hand-total ${isBusted ? 'busted' : ''}`;
        } else if (handIndex === 0 && this.elements.playerTotal) {
            // Update main player total
            if (total === '') {
                this.elements.playerTotal.textContent = '';
                return;
            }
            this.elements.playerTotal.textContent = isBusted ? `${total} - BUST!` : total;
            this.elements.playerTotal.className = `player-total ${isBusted ? 'busted' : ''}`;
        }
    }

    /**
     * Clear dealer cards
     */
    clearDealer() {
        if (this.elements.dealerCards) {
            this.elements.dealerCards.innerHTML = '';
        }
    }

    /**
     * Clear player cards
     */
    clearPlayer() {
        if (this.elements.playerCards) {
            this.elements.playerCards.innerHTML = '';
            this.elements.playerCards.style.display = 'block';
        }
        
        // Remove split hands container
        const splitContainer = document.querySelector('.split-hands-container');
        if (splitContainer) {
            splitContainer.remove();
        }
        
        // Show regular player total
        if (this.elements.playerTotal) {
            this.elements.playerTotal.style.display = 'block';
        }
    }

    /**
     * Show message to player
     */
    showMessage(message, type = 'info', duration = 0) {
        if (!this.elements.gameMessages) return;
        
        // Clear existing message
        this.elements.gameMessages.className = 'game-messages';
        
        // Set message content
        this.elements.gameMessages.innerHTML = `<p>${message}</p>`;
        
        // Add type-specific styling
        switch (type) {
            case 'success':
                this.elements.gameMessages.style.borderColor = '#22c55e';
                this.elements.gameMessages.style.background = 'rgba(34, 197, 94, 0.2)';
                break;
            case 'error':
                this.elements.gameMessages.style.borderColor = '#dc2626';
                this.elements.gameMessages.style.background = 'rgba(220, 38, 38, 0.2)';
                break;
            case 'warning':
                this.elements.gameMessages.style.borderColor = '#f59e0b';
                this.elements.gameMessages.style.background = 'rgba(245, 158, 11, 0.2)';
                break;
            default:
                this.elements.gameMessages.style.borderColor = '#ffd700';
                this.elements.gameMessages.style.background = 'rgba(0, 0, 0, 0.6)';
        }
        
        // Auto-hide message
        if (duration > 0) {
            setTimeout(() => {
                this.clearMessage();
            }, duration);
        }
    }

    /**
     * Clear game message
     */
    clearMessage() {
        if (this.elements.gameMessages) {
            this.elements.gameMessages.innerHTML = '';
            this.elements.gameMessages.style.background = '';
            this.elements.gameMessages.style.borderColor = '';
        }
    }

    /**
     * Update game statistics display with strategy stats
     */
    updateGameStats(stats) {
        if (this.elements.handsPlayed) {
            this.elements.handsPlayed.textContent = stats.handsPlayed || 0;
        }
        if (this.elements.wins) {
            this.elements.wins.textContent = stats.wins || 0;
        }
        if (this.elements.winRate) {
            const winRate = stats.handsPlayed > 0 ? 
                ((stats.wins / stats.handsPlayed) * 100).toFixed(1) : 0;
            this.elements.winRate.textContent = `${winRate}%`;
        }
        if (this.elements.bank) {
            const bankColor = (stats.bankAmount || 1000) >= 1000 ? '#22c55e' : '#ef4444';
            this.elements.bank.textContent = `$${stats.bankAmount || 1000}`;
            this.elements.bank.style.color = bankColor;
        }
        
        // Strategy accuracy stats
        if (this.elements.strategyAccuracy) {
            const accuracy = stats.strategyAccuracy || 0;
            this.elements.strategyAccuracy.textContent = `${accuracy.toFixed(1)}%`;
            
            // Color code accuracy
            let accuracyColor = '#ef4444'; // Red for poor
            if (accuracy >= 90) accuracyColor = '#22c55e'; // Green for excellent
            else if (accuracy >= 80) accuracyColor = '#f59e0b'; // Yellow for good
            else if (accuracy >= 70) accuracyColor = '#f97316'; // Orange for fair
            
            this.elements.strategyAccuracy.style.color = accuracyColor;
        }
        
        if (this.elements.strategyGrade) {
            this.elements.strategyGrade.textContent = stats.strategyGrade || 'N/A';
        }
        
        if (this.elements.totalDecisions) {
            this.elements.totalDecisions.textContent = stats.totalDecisions || 0;
        }
    }

    /**
     * Update card counting display
     */
    updateCardCount(countData) {
        if (this.elements.runningCount) {
            this.elements.runningCount.textContent = countData.running || 0;
        }
        if (this.elements.trueCount) {
            this.elements.trueCount.textContent = (countData.true || 0).toFixed(1);
        }
        if (this.elements.decksRemaining) {
            this.elements.decksRemaining.textContent = (countData.decksRemaining || 6).toFixed(1);
        }
    }

    /**
     * Toggle card counting display visibility
     */
    toggleCardCountingDisplay(show) {
        const countCard = document.querySelector('.stats-card:last-child');
        if (countCard) {
            countCard.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Update current bet display
     */
    updateCurrentBet(amount) {
        if (this.elements.currentBet) {
            this.elements.currentBet.textContent = amount;
        }
    }

    /**
     * Set button enabled/disabled state
     */
    setButtonState(buttonId, enabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !enabled;
            button.style.opacity = enabled ? '1' : '0.5';
        }
    }

    /**
     * Disable all game action buttons
     */
    disableGameButtons() {
        this.setButtonState('hit-btn', false);
        this.setButtonState('stand-btn', false);
        this.setButtonState('double-btn', false);
        this.setButtonState('split-btn', false);
    }

    /**
     * Show basic strategy hint
     */
    showStrategyHint(hint) {
        if (!hint) return;
        
        if (this.elements.strategyHintText) {
            this.elements.strategyHintText.innerHTML = `
                <p><strong>Recommended Action:</strong> ${hint.action}</p>
                <p><strong>Reason:</strong> ${hint.explanation}</p>
            `;
        }
        
        this.showModal();
    }

    // Removed - replaced with enhanced version above

    /**
     * Hide modal
     */
    hideModal() {
        if (this.elements.strategyHintModal) {
            this.elements.strategyHintModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Check if modal is visible
     */
    isModalVisible() {
        return this.elements.strategyHintModal && 
               this.elements.strategyHintModal.style.display === 'block';
    }

    /**
     * Show hand result
     */
    showHandResult(handIndex, result, message) {
        const splitHandsContainer = document.querySelector('.split-hands-container');
        
        if (splitHandsContainer) {
            // Show result for specific split hand
            const handElement = document.querySelector(`.hand-${handIndex}`);
            if (handElement) {
                const resultElement = document.createElement('div');
                resultElement.className = `hand-result ${result}`;
                resultElement.textContent = message;
                handElement.appendChild(resultElement);
            }
        }
        
        // Also show general message
        if (handIndex === 0 || !splitHandsContainer) {
            this.showMessage(message, result === 'win' ? 'success' : result === 'lose' ? 'error' : 'info', 3000);
        }
    }

    /**
     * Show split hands with proper layout
     */
    showSplitHands(hands) {
        if (hands.length <= 1) return;
        
        // Clear existing player cards
        this.clearPlayer();
        
        // Create container for split hands
        const playerSection = document.querySelector('.player-section');
        const existingContainer = playerSection.querySelector('.split-hands-container');
        
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const splitContainer = document.createElement('div');
        splitContainer.className = 'split-hands-container';
        
        hands.forEach((hand, index) => {
            const handDiv = document.createElement('div');
            handDiv.className = `split-hand hand-${index}`;
            handDiv.innerHTML = `
                <div class="hand-label">Hand ${index + 1}</div>
                <div class="hand-cards" id="player-cards-${index}"></div>
                <div class="hand-total" id="player-total-${index}"></div>
            `;
            
            // Add cards to this hand
            const cardsContainer = handDiv.querySelector('.hand-cards');
            hand.cards.forEach(card => {
                const cardElement = this.createCardElement(card, true);
                cardsContainer.appendChild(cardElement);
            });
            
            // Update total
            const totalElement = handDiv.querySelector('.hand-total');
            const value = hand.getValue();
            totalElement.textContent = hand.isBusted() ? `${value} - BUST!` : value;
            totalElement.className = `hand-total ${hand.isBusted() ? 'busted' : ''}`;
            
            splitContainer.appendChild(handDiv);
        });
        
        // Replace player cards area with split container
        const playerCards = playerSection.querySelector('.player-cards');
        const playerTotal = playerSection.querySelector('.player-total');
        
        if (playerCards) playerCards.style.display = 'none';
        if (playerTotal) playerTotal.style.display = 'none';
        
        playerSection.appendChild(splitContainer);
        
        console.log(`🃏 Split hands displayed: ${hands.length} hands`);
    }

    /**
     * Highlight current hand (for splits)
     */
    highlightCurrentHand(handIndex) {
        // Remove existing highlights
        document.querySelectorAll('.split-hand').forEach(hand => {
            hand.classList.remove('current-hand');
        });
        
        // Highlight current hand
        const currentHand = document.querySelector(`.hand-${handIndex}`);
        if (currentHand) {
            currentHand.classList.add('current-hand');
            console.log(`✨ Highlighting hand ${handIndex}`);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layout if necessary
        const viewport = window.innerWidth;
        
        if (viewport < 768) {
            // Mobile adjustments
            this.adjustForMobile();
        } else {
            // Desktop adjustments
            this.adjustForDesktop();
        }
    }

    /**
     * Adjust UI for mobile
     */
    adjustForMobile() {
        // Reduce card sizes, adjust layouts, etc.
        document.body.classList.add('mobile-view');
    }

    /**
     * Adjust UI for desktop
     */
    adjustForDesktop() {
        document.body.classList.remove('mobile-view');
    }

    /**
     * Animation and sound settings
     */
    setAnimationsEnabled(enabled) {
        this.animations.cardDealing = enabled;
        this.animations.results = enabled;
        this.animations.transitions = enabled;
    }

    getAnimationsEnabled() {
        return this.animations.cardDealing;
    }

    setSoundEnabled(enabled) {
        this.sounds.enabled = enabled;
    }

    getSoundEnabled() {
        return this.sounds.enabled;
    }
    
    /**
     * Play card sound effect
     */
    playCardSound() {
        if (this.sounds.enabled && this.sounds.cardFlip) {
            this.sounds.cardFlip.currentTime = 0;
            this.sounds.cardFlip.play().catch(() => {
                // Ignore audio play errors (common in browsers without user interaction)
            });
        }
    }
    
    /**
     * Add win/lose effects to cards
     */
    addCardEffect(handIndex, effect) {
        const selector = handIndex === undefined ? 
            '.card' : 
            `#player-cards-${handIndex} .card, .player-cards .card`;
        
        document.querySelectorAll(selector).forEach(card => {
            card.classList.add(effect);
            setTimeout(() => {
                card.classList.remove(effect);
            }, 1000);
        });
    }
    
    /**
     * Show game result celebration
     */
    showResultCelebration(result, message) {
        if (!this.animations.results) return;
        
        const celebration = document.createElement('div');
        celebration.className = `result-celebration ${result}`;
        
        const text = document.createElement('div');
        text.className = 'celebration-text';
        text.textContent = message;
        
        // Add color based on result
        switch (result) {
            case 'win':
            case 'blackjack':
                text.style.color = '#22c55e';
                break;
            case 'lose':
                text.style.color = '#ef4444';
                break;
            case 'push':
                text.style.color = '#ffd700';
                break;
        }
        
        celebration.appendChild(text);
        
        // Add fireworks for big wins
        if (result === 'blackjack' || result === 'win') {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const firework = document.createElement('div');
                    firework.className = 'celebration-fireworks';
                    firework.style.left = `${Math.random() * 200 - 100}px`;
                    firework.style.top = `${Math.random() * 200 - 100}px`;
                    celebration.appendChild(firework);
                    
                    setTimeout(() => firework.remove(), 1000);
                }, i * 200);
            }
        }
        
        document.body.appendChild(celebration);
        
        // Remove celebration after animation
        const duration = result === 'blackjack' ? 3000 : result === 'win' ? 2000 : 1500;
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.remove();
            }
        }, duration);
    }
    
    /**
     * Add chip selection animation
     */
    animateChipSelection(chipValue) {
        const chipBtn = document.querySelector(`[data-value="${chipValue}"]`);
        if (chipBtn) {
            // Remove existing selection from all chips
            document.querySelectorAll('.chip-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Add selection to clicked chip
            chipBtn.classList.add('selected');
            
            setTimeout(() => {
                chipBtn.classList.remove('selected');
            }, 600);
        }
    }
    
    /**
     * Show loading overlay
     */
    showLoadingOverlay(message = 'Loading...') {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    /**
     * Update game phase indicator
     */
    updateGamePhase(phase, message = '') {
        let indicator = document.querySelector('.game-phase-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'game-phase-indicator';
            document.querySelector('.table-container').appendChild(indicator);
        }
        
        indicator.className = `game-phase-indicator ${phase}`;
        indicator.textContent = message || phase.toUpperCase();
    }
    
    /**
     * Add button loading state
     */
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
            }
        }
    }
    
    /**
     * Enhanced modal display with custom content
     */
    showModal(title, content) {
        if (this.elements.strategyHintModal) {
            // Update modal content
            const titleElement = this.elements.strategyHintModal.querySelector('.modal-header h3');
            const bodyElement = this.elements.strategyHintModal.querySelector('.modal-body');
            
            if (titleElement) titleElement.textContent = title;
            if (bodyElement) bodyElement.innerHTML = content;
            
            this.elements.strategyHintModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Initialize card counting UI elements
     */
    initializeCardCountingUI() {
        this.createCardCountingElements();
        this.createBettingRecommendationPanel();
        this.createCountingPracticePanel();
    }
    
    /**
     * Create enhanced card counting display elements
     */
    createCardCountingElements() {
        // Find the existing card count stats card
        const existingCard = document.querySelector('.stats-card h3');
        if (existingCard && existingCard.textContent === 'Card Count') {
            const statsCard = existingCard.closest('.stats-card');
            
            // Enhanced card counting display
            statsCard.innerHTML = `
                <h3>Card Counting <span id="counting-mode-indicator" class="mode-indicator">OFF</span></h3>
                <div class="count-display">
                    <div class="stat-item">
                        <span class="stat-label">Running Count:</span>
                        <span class="stat-value count-value" id="running-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">True Count:</span>
                        <span class="stat-value count-value" id="true-count">0.0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Decks Remaining:</span>
                        <span class="stat-value" id="decks-remaining">6.0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Penetration:</span>
                        <span class="stat-value" id="penetration">0%</span>
                    </div>
                </div>
                
                <div class="count-extras" id="count-extras" style="display: none;">
                    <div class="side-counts">
                        <h4>Side Counts</h4>
                        <div class="stat-item">
                            <span class="stat-label">Aces:</span>
                            <span class="stat-value" id="aces-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tens:</span>
                            <span class="stat-value" id="tens-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Fives:</span>
                            <span class="stat-value" id="fives-count">0</span>
                        </div>
                    </div>
                    
                    <div class="counting-performance">
                        <h4>Performance</h4>
                        <div class="stat-item">
                            <span class="stat-label">Count Accuracy:</span>
                            <span class="stat-value" id="count-accuracy">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Efficiency:</span>
                            <span class="stat-value" id="counting-efficiency">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Advantage:</span>
                            <span class="stat-value" id="player-advantage">0%</span>
                        </div>
                    </div>
                </div>
                
                <div class="count-controls">
                    <button class="btn btn-sm" id="toggle-count-extras">More Details</button>
                    <button class="btn btn-sm" id="practice-count-btn">Practice Mode</button>
                </div>
            `;
            
            // Add event listeners for new buttons
            const toggleExtrasBtn = document.getElementById('toggle-count-extras');
            const practiceBtn = document.getElementById('practice-count-btn');
            
            if (toggleExtrasBtn) {
                toggleExtrasBtn.addEventListener('click', () => {
                    const extras = document.getElementById('count-extras');
                    const isVisible = extras.style.display !== 'none';
                    extras.style.display = isVisible ? 'none' : 'block';
                    toggleExtrasBtn.textContent = isVisible ? 'More Details' : 'Less Details';
                });
            }
            
            if (practiceBtn) {
                practiceBtn.addEventListener('click', () => {
                    this.toggleCountingPracticeMode();
                });
            }
        }
    }
    
    /**
     * Create betting recommendation panel
     */
    createBettingRecommendationPanel() {
        // Create a new stats card for betting recommendations
        const statsPanel = document.querySelector('.stats-panel');
        if (statsPanel) {
            const bettingCard = document.createElement('div');
            bettingCard.className = 'stats-card betting-recommendations';
            bettingCard.id = 'betting-recommendations';
            bettingCard.style.display = 'none';
            
            bettingCard.innerHTML = `
                <h3>Betting Strategy <span class="confidence-indicator" id="confidence-indicator">LOW</span></h3>
                <div class="betting-display">
                    <div class="stat-item recommended-bet">
                        <span class="stat-label">Recommended Bet:</span>
                        <span class="stat-value" id="recommended-bet">$25</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Kelly Bet:</span>
                        <span class="stat-value" id="kelly-bet">$25</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Spread:</span>
                        <span class="stat-value" id="betting-spread">1x</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Advantage:</span>
                        <span class="stat-value" id="betting-advantage">-0.5%</span>
                    </div>
                </div>
                
                <div class="betting-reasoning">
                    <p class="reasoning-text" id="betting-reasoning">Count is neutral. Use minimum bet.</p>
                </div>
                
                <div class="risk-management">
                    <div class="stat-item">
                        <span class="stat-label">Risk of Ruin:</span>
                        <span class="stat-value risk-value" id="risk-of-ruin">0%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Expected EV:</span>
                        <span class="stat-value" id="expected-ev">$0.00</span>
                    </div>
                </div>
            `;
            
            statsPanel.appendChild(bettingCard);
        }
    }
    
    /**
     * Create counting practice panel
     */
    createCountingPracticePanel() {
        const statsPanel = document.querySelector('.stats-panel');
        if (statsPanel) {
            const practiceCard = document.createElement('div');
            practiceCard.className = 'stats-card practice-panel';
            practiceCard.id = 'practice-panel';
            practiceCard.style.display = 'none';
            
            practiceCard.innerHTML = `
                <h3>Practice Mode <span class="practice-status" id="practice-status">INACTIVE</span></h3>
                <div class="practice-controls">
                    <div class="count-input">
                        <label for="player-count-estimate">Your Count Estimate:</label>
                        <input type="number" id="player-count-estimate" min="-20" max="20" value="0">
                        <button class="btn btn-sm" id="submit-count">Submit</button>
                    </div>
                </div>
                
                <div class="practice-stats">
                    <div class="stat-item">
                        <span class="stat-label">Estimates Made:</span>
                        <span class="stat-value" id="estimates-made">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Accuracy:</span>
                        <span class="stat-value" id="practice-accuracy">0%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg Deviation:</span>
                        <span class="stat-value" id="avg-deviation">0</span>
                    </div>
                </div>
                
                <div class="practice-feedback" id="practice-feedback">
                    <p>Enter your count estimate and click Submit to check accuracy.</p>
                </div>
            `;
            
            statsPanel.appendChild(practiceCard);
            
            // Add event listener for count submission
            const submitBtn = document.getElementById('submit-count');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.handleCountEstimateSubmission();
                });
            }
        }
    }
    
    /**
     * Update card counting display with enhanced visual feedback
     */
    updateCardCountingDisplay(countData) {
        const { runningCount, trueCount, decksRemaining, penetration, 
                acesCount, tensCount, fivesCount, countAccuracy, 
                efficiency, advantage } = countData;
        
        // Update main count values with color coding
        this.updateCountValue('running-count', runningCount);
        this.updateCountValue('true-count', trueCount.toFixed(1));
        
        // Update supporting information
        this.updateElement('decks-remaining', decksRemaining.toFixed(1));
        this.updateElement('penetration', penetration.toFixed(1) + '%');
        
        // Update side counts
        this.updateElement('aces-count', acesCount);
        this.updateElement('tens-count', tensCount);
        this.updateElement('fives-count', fivesCount);
        
        // Update performance metrics
        this.updateElement('count-accuracy', countAccuracy.toFixed(1) + '%');
        this.updateElement('counting-efficiency', efficiency.toFixed(1) + '%');
        this.updateElement('player-advantage', advantage.toFixed(2) + '%');
    }
    
    /**
     * Update count value with color coding
     */
    updateCountValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            
            // Remove existing color classes
            element.classList.remove('positive-count', 'negative-count', 'neutral-count');
            
            // Add color class based on value
            const numValue = parseFloat(value);
            if (numValue > 0) {
                element.classList.add('positive-count');
            } else if (numValue < 0) {
                element.classList.add('negative-count');
            } else {
                element.classList.add('neutral-count');
            }
        }
    }
    
    /**
     * Update betting recommendations display
     */
    updateBettingRecommendations(bettingData) {
        const { recommendedBet, kellyBet, spread, advantage, confidence, 
                reasoning, riskOfRuin, expectedEV } = bettingData;
        
        // Update betting values
        this.updateElement('recommended-bet', '$' + recommendedBet);
        this.updateElement('kelly-bet', '$' + kellyBet);
        this.updateElement('betting-spread', spread.toFixed(1) + 'x');
        this.updateElement('betting-advantage', advantage.toFixed(2) + '%');
        this.updateElement('betting-reasoning', reasoning);
        this.updateElement('risk-of-ruin', (riskOfRuin * 100).toFixed(1) + '%');
        this.updateElement('expected-ev', '$' + expectedEV.toFixed(2));
        
        // Update confidence indicator
        const confidenceIndicator = document.getElementById('confidence-indicator');
        if (confidenceIndicator) {
            confidenceIndicator.textContent = confidence.toUpperCase();
            confidenceIndicator.className = 'confidence-indicator ' + confidence;
        }
        
        // Show the betting recommendations panel
        const bettingPanel = document.getElementById('betting-recommendations');
        if (bettingPanel) {
            bettingPanel.style.display = 'block';
        }
    }
    
    /**
     * Highlight card with counting value
     */
    highlightCardForCounting(cardElement, countValue) {
        if (!cardElement || !document.getElementById('card-counting-practice').checked) return;
        
        // Add visual indicator for counting value
        const indicator = document.createElement('div');
        indicator.className = 'count-indicator';
        indicator.textContent = countValue > 0 ? '+' + countValue : countValue.toString();
        
        if (countValue > 0) indicator.classList.add('positive');
        else if (countValue < 0) indicator.classList.add('negative');
        else indicator.classList.add('neutral');
        
        cardElement.appendChild(indicator);
        
        // Animate the indicator
        setTimeout(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'scale(1)';
        }, 100);
        
        // Remove indicator after delay
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 2000);
    }
    
    /**
     * Toggle counting practice mode
     */
    toggleCountingPracticeMode() {
        const practicePanel = document.getElementById('practice-panel');
        const practiceStatus = document.getElementById('practice-status');
        
        if (practicePanel && practiceStatus) {
            const isActive = practiceStatus.textContent === 'ACTIVE';
            
            if (isActive) {
                practicePanel.style.display = 'none';
                practiceStatus.textContent = 'INACTIVE';
                practiceStatus.className = 'practice-status inactive';
            } else {
                practicePanel.style.display = 'block';
                practiceStatus.textContent = 'ACTIVE';
                practiceStatus.className = 'practice-status active';
            }
        }
    }
    
    /**
     * Handle count estimate submission in practice mode
     */
    handleCountEstimateSubmission() {
        const estimateInput = document.getElementById('player-count-estimate');
        const feedbackDiv = document.getElementById('practice-feedback');
        
        if (estimateInput && feedbackDiv) {
            const estimate = parseInt(estimateInput.value);
            
            // This would be called by the game controller
            // For now, just show feedback
            feedbackDiv.innerHTML = `
                <p class="estimate-feedback">
                    Your estimate: <strong>${estimate}</strong><br>
                    <em>Actual count will be revealed after hand completion.</em>
                </p>
            `;
            
            // Reset input
            estimateInput.value = '0';
        }
    }
    
    /**
     * Show practice mode feedback
     */
    showPracticeFeedback(actualCount, estimate, deviation, isCorrect) {
        const feedbackDiv = document.getElementById('practice-feedback');
        if (feedbackDiv) {
            const feedbackClass = isCorrect ? 'correct' : 'incorrect';
            feedbackDiv.innerHTML = `
                <div class="practice-result ${feedbackClass}">
                    <p><strong>Your Estimate:</strong> ${estimate}</p>
                    <p><strong>Actual Count:</strong> ${actualCount}</p>
                    <p><strong>Deviation:</strong> ${deviation}</p>
                    <p class="result-message">${isCorrect ? 'Perfect!' : 'Keep practicing!'}</p>
                </div>
            `;
        }
        
        // Update practice stats
        this.updatePracticeStats();
    }
    
    /**
     * Update practice statistics display
     */
    updatePracticeStats() {
        // This would be updated with actual stats from the counting module
        // Implementation would depend on integration with CardCounting module
    }
    
    /**
     * Show index play recommendations
     */
    showIndexPlayRecommendation(recommendation) {
        if (!recommendation.hasDeviation) return;
        
        const message = `
            <div class="index-play-recommendation">
                <h4>Index Play Recommendation</h4>
                <p class="deviation-action"><strong>${recommendation.action}</strong></p>
                <p class="deviation-reason">${recommendation.reason}</p>
                <p class="confidence">Confidence: ${recommendation.confidence}</p>
            </div>
        `;
        
        this.showMessage(message, 'index-play', 5000);
    }
    
    /**
     * Update counting mode indicator
     */
    updateCountingModeIndicator(isEnabled, practiceMode = false) {
        const indicator = document.getElementById('counting-mode-indicator');
        if (indicator) {
            if (isEnabled) {
                indicator.textContent = practiceMode ? 'PRACTICE' : 'ON';
                indicator.className = practiceMode ? 'mode-indicator practice' : 'mode-indicator on';
            } else {
                indicator.textContent = 'OFF';
                indicator.className = 'mode-indicator off';
            }
        }
    }
    
    /**
     * Generic element update helper
     */
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
    
    /**
     * Show heat management warnings
     */
    showHeatWarning(suggestions) {
        if (suggestions.length === 0) return;
        
        const highPrioritySuggestions = suggestions.filter(s => s.level === 'high');
        if (highPrioritySuggestions.length > 0) {
            const warningMessage = `
                <div class="heat-warning">
                    <h4>⚠️ Heat Management Alert</h4>
                    ${highPrioritySuggestions.map(s => `<p>• ${s.message}</p>`).join('')}
                </div>
            `;
            
            this.showMessage(warningMessage, 'warning', 8000);
        }
    }
}