/**
 * Game Rules Module - Defines blackjack rules and variations
 */

export class GameRules {
    constructor() {
        this.rules = this.getDefaultRules();
    }

    /**
     * Get default blackjack rules
     */
    getDefaultRules() {
        return {
            // Basic game rules
            blackjackPayout: 1.5, // 3:2 payout
            insurancePayout: 2.0, // 2:1 payout
            dealerStandsOnSoft17: true,
            dealerHitsSoft17: false, // Opposite of dealerStandsOnSoft17 for clarity
            doubleAfterSplit: true,
            resplitAces: false,
            hitSplitAces: false,
            surrenderAllowed: false,
            maxSplitHands: 4,
            
            // Deck rules
            minDecks: 1,
            maxDecks: 8,
            penetration: 0.75, // Deal 75% of cards before reshuffling
            
            // Betting rules
            minBet: 5,
            maxBet: 500,
            
            // Special rules
            charlieRule: false, // 5-card Charlie wins
            charlieCards: 5,
            europeeanNoHoleCard: false,
            originalBetsOnly: false, // Dealer blackjack vs doubled/split hands
            
            // Side bets (not implemented but defined for future)
            allowInsurance: true,
            allowPerfectPairs: false,
            allow21Plus3: false
        };
    }

    /**
     * Check if dealer should hit
     */
    dealerShouldHit(hand) {
        const value = hand.getValue();
        
        if (value < 17) {
            return true;
        }
        
        if (value === 17 && hand.isSoft() && !this.rules.dealerStandsOnSoft17) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if double down is allowed
     */
    canDoubleDown(hand) {
        // Must be exactly 2 cards
        if (hand.cards.length !== 2) {
            return false;
        }
        
        // Respect double-after-split rule
        if (hand.isSplit && !this.rules.doubleAfterSplit) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if split is allowed
     */
    canSplit(hand, currentHandCount, gameState) {
        // Must have exactly 2 cards of same rank
        if (hand.cards.length !== 2) {
            return false;
        }
        
        if (hand.cards[0].rank !== hand.cards[1].rank) {
            return false;
        }
        
        // Check maximum split hands
        if (currentHandCount >= this.rules.maxSplitHands) {
            return false;
        }
        
        // Check if resplitting aces is allowed
        if (hand.cards[0].rank === 'A' && hand.isSplit && !this.rules.resplitAces) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if surrender is allowed
     */
    canSurrender(hand, gameState) {
        if (!this.rules.surrenderAllowed) {
            return false;
        }
        
        // Must be first decision on initial 2 cards
        if (hand.cards.length !== 2 || gameState.actionsPerformed > 0) {
            return false;
        }
        
        // Cannot surrender on split hands
        if (gameState.isSplitHand) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if insurance is allowed
     */
    canTakeInsurance(dealerUpCard, playerHand) {
        if (!this.rules.allowInsurance) {
            return false;
        }
        
        // Dealer must show ace
        if (dealerUpCard.rank !== 'A') {
            return false;
        }
        
        // Must be on initial hand
        if (playerHand.cards.length !== 2) {
            return false;
        }
        
        return true;
    }

    /**
     * Calculate blackjack payout
     */
    calculateBlackjackPayout(bet) {
        return Math.floor(bet * this.rules.blackjackPayout);
    }

    /**
     * Calculate insurance payout
     */
    calculateInsurancePayout(insuranceBet) {
        return insuranceBet * this.rules.insurancePayout;
    }

    /**
     * Check if hand qualifies for Charlie rule
     */
    isCharlie(hand) {
        if (!this.rules.charlieRule) {
            return false;
        }
        
        return hand.cards.length >= this.rules.charlieCards && 
               hand.getValue() <= 21;
    }

    /**
     * Determine hand result
     */
    determineResult(playerHand, dealerHand, gameContext = {}) {
        const playerValue = playerHand.getValue();
        const dealerValue = dealerHand.getValue();
        const playerBusted = playerHand.isBusted();
        const dealerBusted = dealerHand.isBusted();
        const playerBlackjack = playerHand.isBlackjack();
        const dealerBlackjack = dealerHand.isBlackjack();
        
        // Handle blackjacks
        if (playerBlackjack && dealerBlackjack) {
            return { result: 'push', payout: 0, message: 'Both blackjack - Push' };
        }
        
        if (playerBlackjack && !dealerBlackjack) {
            const payout = this.calculateBlackjackPayout(gameContext.bet || 0);
            return { result: 'blackjack', payout, message: 'Blackjack!' };
        }
        
        if (dealerBlackjack && !playerBlackjack) {
            return { result: 'lose', payout: -gameContext.bet || 0, message: 'Dealer blackjack' };
        }
        
        // Handle busts
        if (playerBusted) {
            return { result: 'lose', payout: -gameContext.bet || 0, message: 'Player bust' };
        }
        
        if (dealerBusted) {
            return { result: 'win', payout: gameContext.bet || 0, message: 'Dealer bust' };
        }
        
        // Handle Charlie rule
        if (this.isCharlie(playerHand)) {
            return { result: 'win', payout: gameContext.bet || 0, message: `${this.rules.charlieCards}-card Charlie!` };
        }
        
        // Compare values
        if (playerValue > dealerValue) {
            return { result: 'win', payout: gameContext.bet || 0, message: 'Win!' };
        } else if (playerValue < dealerValue) {
            return { result: 'lose', payout: -gameContext.bet || 0, message: 'Lose' };
        } else {
            return { result: 'push', payout: 0, message: 'Push' };
        }
    }

    /**
     * Check if deck penetration requires reshuffle
     */
    needsReshuffle(cardsDealt, totalCards) {
        const penetrationPercent = cardsDealt / totalCards;
        return penetrationPercent >= this.rules.penetration;
    }

    /**
     * Validate bet amount
     */
    isValidBet(amount, bankAmount) {
        if (amount < this.rules.minBet) {
            return { valid: false, message: `Minimum bet is $${this.rules.minBet}` };
        }
        
        if (amount > this.rules.maxBet) {
            return { valid: false, message: `Maximum bet is $${this.rules.maxBet}` };
        }
        
        if (amount > bankAmount) {
            return { valid: false, message: 'Insufficient funds' };
        }
        
        return { valid: true, message: 'Valid bet' };
    }

    /**
     * Get rule variations for different casino types
     */
    getVariation(variationType) {
        const variations = {
            'las-vegas': {
                ...this.getDefaultRules(),
                dealerStandsOnSoft17: true,
                doubleAfterSplit: true,
                surrenderAllowed: true,
                blackjackPayout: 1.5
            },
            
            'atlantic-city': {
                ...this.getDefaultRules(),
                dealerStandsOnSoft17: false,
                doubleAfterSplit: true,
                surrenderAllowed: true,
                blackjackPayout: 1.5
            },
            
            'european': {
                ...this.getDefaultRules(),
                dealerStandsOnSoft17: true,
                doubleAfterSplit: false,
                surrenderAllowed: false,
                europeeanNoHoleCard: true,
                originalBetsOnly: true
            },
            
            'single-deck': {
                ...this.getDefaultRules(),
                minDecks: 1,
                maxDecks: 1,
                dealerStandsOnSoft17: true,
                doubleAfterSplit: false,
                blackjackPayout: 1.2 // 6:5 often in single deck
            },
            
            'liberal': {
                ...this.getDefaultRules(),
                dealerStandsOnSoft17: true,
                doubleAfterSplit: true,
                surrenderAllowed: true,
                resplitAces: true,
                hitSplitAces: true,
                charlieRule: true,
                maxSplitHands: 4
            },
            
            'conservative': {
                ...this.getDefaultRules(),
                dealerStandsOnSoft17: false,
                doubleAfterSplit: false,
                surrenderAllowed: false,
                resplitAces: false,
                hitSplitAces: false,
                blackjackPayout: 1.2,
                maxSplitHands: 2
            }
        };
        
        return variations[variationType] || this.getDefaultRules();
    }

    /**
     * Apply rule variation
     */
    setVariation(variationType) {
        this.rules = this.getVariation(variationType);
        console.log(`🎰 Applied ${variationType} rules variation`);
    }

    /**
     * Update specific rule
     */
    updateRule(ruleName, value) {
        if (this.rules.hasOwnProperty(ruleName)) {
            this.rules[ruleName] = value;
            console.log(`⚙️ Updated rule: ${ruleName} = ${value}`);
        } else {
            console.warn(`⚠️ Unknown rule: ${ruleName}`);
        }
    }

    /**
     * Get current rules
     */
    getRules() {
        return { ...this.rules };
    }

    /**
     * Export rules as JSON
     */
    exportRules() {
        return JSON.stringify(this.rules, null, 2);
    }

    /**
     * Import rules from JSON
     */
    importRules(rulesJson) {
        try {
            const importedRules = JSON.parse(rulesJson);
            this.rules = { ...this.getDefaultRules(), ...importedRules };
            console.log('📥 Rules imported successfully');
        } catch (error) {
            console.error('❌ Failed to import rules:', error);
        }
    }

    /**
     * Reset to default rules
     */
    resetToDefaults() {
        this.rules = this.getDefaultRules();
        console.log('🔄 Rules reset to defaults');
    }

    /**
     * Get house edge estimate for current rules
     */
    getHouseEdge() {
        // Simplified house edge calculation based on major rules
        let houseEdge = 0.5; // Base house edge with perfect basic strategy
        
        // Adjust for rule variations
        if (!this.rules.dealerStandsOnSoft17) houseEdge += 0.22;
        if (!this.rules.doubleAfterSplit) houseEdge += 0.14;
        if (!this.rules.surrenderAllowed) houseEdge += 0.07;
        if (this.rules.blackjackPayout < 1.5) houseEdge += (1.5 - this.rules.blackjackPayout) * 2.3;
        if (this.rules.charlieRule) houseEdge -= 0.16;
        
        return Math.round(houseEdge * 100) / 100;
    }

    /**
     * Get rule summary for display
     */
    getRuleSummary() {
        return {
            'Dealer Stands on Soft 17': this.rules.dealerStandsOnSoft17 ? 'Yes' : 'No',
            'Double After Split': this.rules.doubleAfterSplit ? 'Allowed' : 'Not Allowed',
            'Surrender': this.rules.surrenderAllowed ? 'Allowed' : 'Not Allowed',
            'Blackjack Payout': `${this.rules.blackjackPayout}:1`,
            'Max Split Hands': this.rules.maxSplitHands,
            'Resplit Aces': this.rules.resplitAces ? 'Allowed' : 'Not Allowed',
            'Hit Split Aces': this.rules.hitSplitAces ? 'Allowed' : 'Not Allowed',
            'House Edge': `${this.getHouseEdge()}%`
        };
    }
}