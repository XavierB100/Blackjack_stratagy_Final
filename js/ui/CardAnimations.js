/**
 * CardAnimations - Handles all card-related animations and visual effects
 * Extracted from UIController.js to improve modularity
 */

export class CardAnimations {
    constructor() {
        this.settings = {
            cardDealing: true,
            results: true,
            transitions: true,
            enabled: true
        };
        
        // Animation timing constants
        this.timings = {
            cardDeal: 400,
            cardFlip: 600,
            fadeIn: 200,
            slideIn: 300,
            celebration: 2000
        };
    }

    /**
     * Enable/disable all animations
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        Object.keys(this.settings).forEach(key => {
            if (key !== 'enabled') {
                this.settings[key] = enabled;
            }
        });
    }

    /**
     * Add dealing animation to a card element
     */
    addDealingAnimation(cardElement) {
        if (!this.settings.cardDealing || !this.settings.enabled) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            cardElement.classList.add('dealing');
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'translateY(-50px) scale(0.8)';

            // Animate card into position
            setTimeout(() => {
                cardElement.style.opacity = '1';
                cardElement.style.transform = 'translateY(0) scale(1)';
                cardElement.classList.remove('dealing');
            }, 50);

            setTimeout(() => {
                cardElement.classList.remove('dealing');
                cardElement.style.transform = '';
                resolve();
            }, this.timings.cardDeal);
        });
    }

    /**
     * Create card flip animation for revealing dealer hole card
     */
    flipCard(cardElement, newCardData) {
        if (!this.settings.transitions || !this.settings.enabled) {
            this.setCardContent(cardElement, newCardData);
            return Promise.resolve();
        }

        return new Promise(resolve => {
            cardElement.classList.add('flipping');
            cardElement.style.transform = 'rotateY(90deg)';

            setTimeout(() => {
                this.setCardContent(cardElement, newCardData);
                cardElement.style.transform = 'rotateY(0deg)';
            }, this.timings.cardFlip / 2);

            setTimeout(() => {
                cardElement.classList.remove('flipping');
                cardElement.style.transform = '';
                resolve();
            }, this.timings.cardFlip);
        });
    }

    /**
     * Set card element content
     */
    setCardContent(cardElement, cardData) {
        cardElement.className = `card ${cardData.color}`;
        cardElement.innerHTML = `
            <div class="card-top">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
            <div class="card-center">${cardData.suit}</div>
            <div class="card-bottom">${cardData.rank}<span class="suit">${cardData.suit}</span></div>
        `;
    }

    /**
     * Add visual effect to cards (winning, losing, busted, etc.)
     */
    addCardEffect(container, effect) {
        if (!this.settings.results || !this.settings.enabled) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const effectClass = `effect-${effect}`;
            
            if (container) {
                container.classList.add(effectClass);
                
                // Add pulsing effect for dramatic moments
                if (effect === 'winning' || effect === 'blackjack') {
                    container.style.animation = 'pulse 0.6s ease-in-out 3';
                } else if (effect === 'busted' || effect === 'losing') {
                    container.style.animation = 'shake 0.5s ease-in-out 2';
                }

                setTimeout(() => {
                    container.classList.remove(effectClass);
                    container.style.animation = '';
                    resolve();
                }, 1500);
            } else {
                resolve();
            }
        });
    }

    /**
     * Highlight card for counting practice
     */
    highlightCardForCounting(cardElement, countValue) {
        if (!this.settings.enabled) return;

        const highlightClass = countValue > 0 ? 'count-positive' : 
                              countValue < 0 ? 'count-negative' : 'count-neutral';
        
        cardElement.classList.add('counting-highlight', highlightClass);
        
        // Show count value temporarily
        const countBadge = document.createElement('div');
        countBadge.className = 'count-badge';
        countBadge.textContent = countValue > 0 ? `+${countValue}` : countValue.toString();
        
        cardElement.appendChild(countBadge);
        
        setTimeout(() => {
            cardElement.classList.remove('counting-highlight', highlightClass);
            if (countBadge.parentNode) {
                countBadge.parentNode.removeChild(countBadge);
            }
        }, 2000);
    }

    /**
     * Animate chip selection
     */
    animateChipSelection(chipValue) {
        if (!this.settings.enabled) return;

        const chipButton = document.querySelector(`[data-value="${chipValue}"]`);
        if (chipButton) {
            chipButton.classList.add('selected');
            
            // Remove other selections
            document.querySelectorAll('.chip-btn.selected').forEach(btn => {
                if (btn !== chipButton) {
                    btn.classList.remove('selected');
                }
            });
            
            setTimeout(() => {
                chipButton.classList.remove('selected');
            }, 1000);
        }
    }

    /**
     * Show result celebration animation
     */
    showResultCelebration(result, message) {
        if (!this.settings.results || !this.settings.enabled) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const celebration = document.createElement('div');
            celebration.className = `result-celebration ${result}`;
            celebration.innerHTML = `
                <div class="celebration-content">
                    <h2>${message}</h2>
                    <div class="celebration-effects"></div>
                </div>
            `;
            
            document.body.appendChild(celebration);
            
            // Trigger animation
            setTimeout(() => {
                celebration.classList.add('show');
            }, 100);
            
            // Auto-hide after duration
            setTimeout(() => {
                celebration.classList.add('hide');
                setTimeout(() => {
                    if (celebration.parentNode) {
                        celebration.parentNode.removeChild(celebration);
                    }
                    resolve();
                }, 500);
            }, this.timings.celebration);
        });
    }

    /**
     * Animate button loading state
     */
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            
            if (this.settings.enabled) {
                const spinner = document.createElement('span');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = '⏳';
                button.appendChild(spinner);
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            
            const spinner = button.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * Animate hand transitions (for split hands)
     */
    highlightCurrentHand(handIndex) {
        if (!this.settings.transitions || !this.settings.enabled) return;

        // Remove existing highlights
        document.querySelectorAll('.player-hand').forEach(hand => {
            hand.classList.remove('active-hand');
        });

        // Add highlight to current hand
        const currentHand = document.querySelector(`#player-hand-${handIndex}`);
        if (currentHand) {
            currentHand.classList.add('active-hand');
            
            // Subtle glow effect
            currentHand.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
            
            setTimeout(() => {
                currentHand.style.boxShadow = '';
            }, 2000);
        }
    }

    /**
     * Animate split hand creation
     */
    animateSplitHands(playerHands) {
        if (!this.settings.transitions || !this.settings.enabled) return;

        const playerArea = document.getElementById('player-area');
        if (!playerArea) return;

        // Add split animation class
        playerArea.classList.add('splitting');
        
        setTimeout(() => {
            playerArea.classList.remove('splitting');
            playerArea.classList.add('split-complete');
        }, 800);
    }

    /**
     * Create card element with proper styling
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
     * Add pulse effect to element
     */
    pulseElement(element, duration = 1000) {
        if (!this.settings.enabled || !element) return;

        element.style.animation = `pulse ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    /**
     * Fade in element
     */
    fadeIn(element, duration = 300) {
        if (!this.settings.enabled || !element) {
            if (element) element.style.opacity = '1';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    /**
     * Fade out element
     */
    fadeOut(element, duration = 300) {
        if (!this.settings.enabled || !element) {
            if (element) element.style.opacity = '0';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    /**
     * Get animation settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update specific animation setting
     */
    updateSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
        }
    }
}