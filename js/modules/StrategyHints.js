/**
 * Strategy Hints Module - Provides basic strategy recommendations
 */

export class StrategyHints {
    constructor() {
        this.basicStrategy = {};
        this.isInitialized = false;
    }

    /**
     * Initialize strategy hints
     */
    async init() {
        try {
            console.log('💡 Initializing Strategy Hints...');
            
            // Load basic strategy charts
            this.loadBasicStrategy();
            
            this.isInitialized = true;
            console.log('✅ Strategy Hints initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Strategy Hints:', error);
            throw error;
        }
    }

    /**
     * Load basic strategy data
     */
    loadBasicStrategy() {
        // Hard totals (no ace or ace counted as 1)
        this.basicStrategy.hard = {
            5: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            6: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            7: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            8: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            9: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            10: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'H', 11: 'H' },
            11: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'D', 11: 'H' },
            12: { 2: 'H', 3: 'H', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            13: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            14: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            15: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            16: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            17: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            18: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
        };

        // Soft totals (ace counted as 11)
        this.basicStrategy.soft = {
            13: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            14: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            15: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            16: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            17: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            18: { 2: 'S', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'S', 8: 'S', 9: 'H', 10: 'H', 11: 'H' },
            19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
        };

        // Enhanced Pairs Strategy - Mathematically Optimal
        this.basicStrategy.pairs = {
            'A': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'SP', 9: 'SP', 10: 'SP', 11: 'SP' },
            '2': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            '3': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            '4': { 2: 'H', 3: 'H', 4: 'H', 5: 'SP', 6: 'SP', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            '5': { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'H', 11: 'H' },
            '6': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            '7': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
            '8': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'SP', 8: 'SP', 9: 'SP', 10: 'SP', 11: 'SP' },
            '9': { 2: 'SP', 3: 'SP', 4: 'SP', 5: 'SP', 6: 'SP', 7: 'S', 8: 'SP', 9: 'SP', 10: 'S', 11: 'S' },
            '10': { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            'J': { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            'Q': { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
            'K': { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
        };
        
        // Strategy accuracy tracking
        this.strategyAccuracy = {
            totalHints: 0,
            correctFollows: 0,
            playerActions: []
        };

        console.log('📚 Basic strategy charts loaded');
    }

    /**
     * Get basic strategy hint for current situation - Enhanced Version
     */
    getBasicStrategyHint(playerHand, dealerUpCard, canDoubleDown = true, canSplit = true) {
        const dealerValue = this.getDealerValue(dealerUpCard);
        const hintId = `${playerHand.toString()}_vs_${dealerUpCard.toString()}`;
        
        this.strategyAccuracy.totalHints++;
        
        let recommendedAction;
        let explanation;
        let handType;
        
        // Handle pairs first (highest priority)
        if (playerHand.isPair() && canSplit) {
            handType = 'pair';
            const pairRank = playerHand.cards[0].rank;
            const action = this.basicStrategy.pairs[pairRank]?.[dealerValue];
            
            if (action && action === 'SP') {
                recommendedAction = 'Split';
                explanation = this.getPairExplanation(pairRank, dealerValue, action);
            } else {
                // If can't split or shouldn't split, treat as hard total
                const hardValue = playerHand.getValue();
                const hardAction = this.basicStrategy.hard[hardValue]?.[dealerValue];
                recommendedAction = this.getActionName(hardAction);
                explanation = this.getHardExplanation(hardValue, dealerValue, hardAction);
            }
        }
        // Handle soft totals
        else if (playerHand.isSoft()) {
            handType = 'soft';
            const softValue = playerHand.getValue();
            const action = this.basicStrategy.soft[softValue]?.[dealerValue];
            
            // Check if double down is available
            if (action === 'D' && !canDoubleDown) {
                recommendedAction = 'Hit';
                explanation = `Would double on soft ${softValue}, but since doubling isn't available, hit instead.`;
            } else {
                recommendedAction = this.getActionName(action);
                explanation = this.getSoftExplanation(softValue, dealerValue, action);
            }
        }
        // Handle hard totals
        else {
            handType = 'hard';
            const hardValue = playerHand.getValue();
            const action = this.basicStrategy.hard[hardValue]?.[dealerValue];
            
            // Check if double down is available
            if (action === 'D' && !canDoubleDown) {
                recommendedAction = 'Hit';
                explanation = `Would double on ${hardValue}, but since doubling isn't available, hit instead.`;
            } else {
                recommendedAction = this.getActionName(action);
                explanation = this.getHardExplanation(hardValue, dealerValue, action);
            }
        }
        
        // Fallback
        if (!recommendedAction) {
            recommendedAction = 'Hit';
            explanation = 'Unable to determine optimal strategy for this situation.';
        }
        
        return {
            id: hintId,
            action: recommendedAction,
            explanation: explanation,
            confidence: 'high',
            handType: handType,
            playerValue: playerHand.getValue(),
            dealerUpCard: dealerValue,
            alternativeActions: this.getAlternativeActions(playerHand, dealerUpCard, canDoubleDown, canSplit)
        };
    }

    /**
     * Get dealer card value for strategy lookup
     */
    getDealerValue(dealerCard) {
        if (dealerCard.rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(dealerCard.rank)) return 10;
        return parseInt(dealerCard.rank);
    }

    /**
     * Convert action code to readable name
     */
    getActionName(actionCode) {
        const actions = {
            'H': 'Hit',
            'S': 'Stand',
            'D': 'Double Down',
            'SP': 'Split',
            'SU': 'Surrender'
        };
        return actions[actionCode] || 'Hit';
    }

    /**
     * Get explanation for pair decisions
     */
    getPairExplanation(pairRank, dealerValue, action) {
        const explanations = {
            'A': 'Always split Aces - gives you two chances at blackjack.',
            '8': 'Always split 8s - 16 is a terrible hand, but 8 is a good starting point.',
            '5': 'Never split 5s - 10 is a great doubling hand.',
            '10': 'Never split 10s - 20 is an excellent hand.',
            'J': 'Never split face cards - 20 is an excellent hand.',
            'Q': 'Never split face cards - 20 is an excellent hand.',
            'K': 'Never split face cards - 20 is an excellent hand.'
        };

        if (explanations[pairRank]) {
            return explanations[pairRank];
        }

        if (action === 'SP') {
            return `Split against dealer ${dealerValue} - mathematically optimal play.`;
        } else if (action === 'H') {
            return `Hit the pair - splitting is not advantageous against dealer ${dealerValue}.`;
        } else {
            return `${this.getActionName(action)} - best mathematical play against dealer ${dealerValue}.`;
        }
    }

    /**
     * Get explanation for soft total decisions
     */
    getSoftExplanation(softValue, dealerValue, action) {
        if (action === 'D') {
            return `Double down on soft ${softValue} against dealer ${dealerValue} - great opportunity to increase bet with low bust risk.`;
        } else if (action === 'H') {
            return `Hit soft ${softValue} - you cannot bust and may improve to a strong hand.`;
        } else if (action === 'S') {
            return `Stand on soft ${softValue} - good hand that likely beats dealer ${dealerValue}.`;
        }
        return `${this.getActionName(action)} is optimal for soft ${softValue} against dealer ${dealerValue}.`;
    }

    /**
     * Get explanation for hard total decisions
     */
    getHardExplanation(hardValue, dealerValue, action) {
        if (hardValue <= 11) {
            if (action === 'D') {
                return `Double down on ${hardValue} - great doubling opportunity with no bust risk.`;
            } else {
                return `Always hit ${hardValue} - cannot bust and need to improve.`;
            }
        } else if (hardValue === 12) {
            if (dealerValue >= 4 && dealerValue <= 6) {
                return `Stand on 12 against dealer ${dealerValue} - dealer likely to bust.`;
            } else {
                return `Hit 12 against dealer ${dealerValue} - dealer unlikely to bust.`;
            }
        } else if (hardValue >= 13 && hardValue <= 16) {
            if (dealerValue >= 2 && dealerValue <= 6) {
                return `Stand on ${hardValue} against weak dealer ${dealerValue} - let dealer bust.`;
            } else {
                return `Hit ${hardValue} against strong dealer ${dealerValue} - must try to improve.`;
            }
        } else if (hardValue >= 17) {
            return `Always stand on ${hardValue} - strong hand, high bust risk if hitting.`;
        }

        return `${this.getActionName(action)} is the mathematically optimal play.`;
    }

    /**
     * Get strategy recommendation with detailed analysis
     */
    getDetailedRecommendation(playerHand, dealerUpCard) {
        const hint = this.getBasicStrategyHint(playerHand, dealerUpCard);
        
        return {
            ...hint,
            situation: this.analyzeSituation(playerHand, dealerUpCard),
            alternatives: this.getAlternativeActions(playerHand, dealerUpCard),
            riskAssessment: this.assessRisk(playerHand, dealerUpCard, hint.action)
        };
    }

    /**
     * Analyze the current game situation
     */
    analyzeSituation(playerHand, dealerUpCard) {
        const playerValue = playerHand.getValue();
        const dealerValue = this.getDealerValue(dealerUpCard);
        
        return {
            playerTotal: playerValue,
            dealerUpCard: dealerValue,
            playerHandType: this.getHandType(playerHand),
            dealerStrength: this.assessDealerStrength(dealerValue),
            bustRisk: this.calculateBustRisk(playerValue),
            improvementChances: this.calculateImprovementChances(playerValue)
        };
    }

    /**
     * Get hand type description
     */
    getHandType(hand) {
        if (hand.isPair()) return 'pair';
        if (hand.isSoft()) return 'soft';
        return 'hard';
    }

    /**
     * Assess dealer strength
     */
    assessDealerStrength(dealerValue) {
        if (dealerValue >= 2 && dealerValue <= 6) return 'weak';
        if (dealerValue >= 7 && dealerValue <= 9) return 'medium';
        return 'strong'; // 10, J, Q, K, A
    }

    /**
     * Calculate bust risk for hitting
     */
    calculateBustRisk(playerValue) {
        if (playerValue <= 11) return 0;
        if (playerValue === 12) return 31; // 4 tens out of 13 cards
        if (playerValue === 13) return 38; // 5 cards (9, 10, J, Q, K)
        if (playerValue === 14) return 46; // 6 cards
        if (playerValue === 15) return 54; // 7 cards
        if (playerValue === 16) return 62; // 8 cards
        if (playerValue === 17) return 69; // 9 cards
        return 100; // 18+ always busts
    }

    /**
     * Calculate improvement chances
     */
    calculateImprovementChances(playerValue) {
        // This is a simplified calculation
        // Real implementation would consider specific cards and situations
        const cardsToImprove = Math.max(0, 21 - playerValue);
        return Math.min(100, (cardsToImprove / 13) * 100);
    }

    /**
     * Get alternative actions with analysis - Enhanced Version
     */
    getAlternativeActions(playerHand, dealerUpCard, canDoubleDown = true, canSplit = true) {
        const dealerValue = this.getDealerValue(dealerUpCard);
        const playerValue = playerHand.getValue();
        const alternatives = [];
        
        // Hit is always available (unless 21)
        if (playerValue < 21) {
            alternatives.push({
                action: 'Hit',
                available: true,
                description: 'Take another card',
                risk: this.calculateBustRisk(playerValue),
                situation: playerValue <= 11 ? 'safe' : playerValue <= 16 ? 'moderate' : 'high-risk'
            });
        }
        
        // Stand is always available
        alternatives.push({
            action: 'Stand',
            available: true,
            description: 'Keep current total',
            risk: this.assessStandRisk(playerValue, dealerValue),
            situation: playerValue >= 17 ? 'strong' : playerValue >= 13 ? 'moderate' : 'weak'
        });
        
        // Double Down (if available and valid)
        if (canDoubleDown && playerHand.cards.length === 2) {
            alternatives.push({
                action: 'Double Down',
                available: true,
                description: 'Double bet, take exactly one card',
                risk: this.calculateBustRisk(playerValue),
                situation: this.assessDoubleDownSituation(playerHand, dealerValue)
            });
        }
        
        // Split (if available and valid)
        if (canSplit && playerHand.isPair()) {
            alternatives.push({
                action: 'Split',
                available: true,
                description: 'Split pair into two hands',
                risk: 'moderate',
                situation: this.assessSplitSituation(playerHand.cards[0].rank, dealerValue)
            });
        }
        
        return alternatives;
    }
    
    /**
     * Assess risk of standing with current total
     */
    assessStandRisk(playerValue, dealerValue) {
        if (playerValue >= 17) return 'low';
        if (playerValue >= 13 && dealerValue <= 6) return 'low';
        if (playerValue >= 12 && dealerValue <= 4) return 'medium';
        return 'high';
    }
    
    /**
     * Assess double down situation
     */
    assessDoubleDownSituation(playerHand, dealerValue) {
        const playerValue = playerHand.getValue();
        
        if (playerValue === 11) return 'excellent';
        if (playerValue === 10 && dealerValue <= 9) return 'very-good';
        if (playerValue === 9 && dealerValue >= 3 && dealerValue <= 6) return 'good';
        if (playerHand.isSoft() && dealerValue >= 4 && dealerValue <= 6) return 'favorable';
        
        return 'unfavorable';
    }
    
    /**
     * Assess split situation
     */
    assessSplitSituation(pairRank, dealerValue) {
        if (pairRank === 'A' || pairRank === '8') return 'always-split';
        if ((pairRank === '2' || pairRank === '3' || pairRank === '6' || pairRank === '7') && dealerValue <= 7) return 'favorable';
        if (pairRank === '9' && dealerValue !== 7 && dealerValue !== 10 && dealerValue !== 11) return 'favorable';
        if (pairRank === '5' || pairRank === '10' || pairRank === 'J' || pairRank === 'Q' || pairRank === 'K') return 'never-split';
        
        return 'situational';
    }

    /**
     * Assess risk for recommended action
     */
    assessRisk(playerHand, dealerUpCard, recommendedAction) {
        const playerValue = playerHand.getValue();
        
        switch (recommendedAction.toLowerCase()) {
            case 'hit':
                return {
                    level: playerValue >= 16 ? 'high' : playerValue >= 12 ? 'medium' : 'low',
                    description: `${this.calculateBustRisk(playerValue)}% chance of busting`
                };
            case 'stand':
                return {
                    level: playerValue >= 17 ? 'low' : 'medium',
                    description: 'Risk depends on dealer\'s hole card'
                };
            case 'double down':
                return {
                    level: 'medium',
                    description: 'Higher reward but only one card received'
                };
            case 'split':
                return {
                    level: 'medium',
                    description: 'Creates two hands with additional bet required'
                };
            default:
                return {
                    level: 'unknown',
                    description: 'Risk assessment not available'
                };
        }
    }

    /**
     * Track player action for strategy accuracy
     */
    trackPlayerAction(hintId, playerAction, recommendedAction) {
        this.strategyAccuracy.playerActions.push({
            hintId,
            playerAction,
            recommendedAction,
            correct: playerAction === recommendedAction,
            timestamp: Date.now()
        });
        
        if (playerAction === recommendedAction) {
            this.strategyAccuracy.correctFollows++;
        }
    }
    
    /**
     * Get strategy accuracy statistics
     */
    getStrategyAccuracy() {
        const accuracy = this.strategyAccuracy.totalHints > 0 ? 
            (this.strategyAccuracy.correctFollows / this.strategyAccuracy.totalHints) * 100 : 0;
            
        return {
            totalHints: this.strategyAccuracy.totalHints,
            correctFollows: this.strategyAccuracy.correctFollows,
            accuracy: Math.round(accuracy * 100) / 100,
            grade: this.getAccuracyGrade(accuracy),
            recentActions: this.strategyAccuracy.playerActions.slice(-10)
        };
    }
    
    /**
     * Get accuracy grade
     */
    getAccuracyGrade(accuracy) {
        if (accuracy >= 95) return 'A+';
        if (accuracy >= 90) return 'A';
        if (accuracy >= 85) return 'B+';
        if (accuracy >= 80) return 'B';
        if (accuracy >= 75) return 'C+';
        if (accuracy >= 70) return 'C';
        if (accuracy >= 65) return 'D+';
        if (accuracy >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Reset strategy accuracy tracking
     */
    resetAccuracyTracking() {
        this.strategyAccuracy = {
            totalHints: 0,
            correctFollows: 0,
            playerActions: []
        };
    }
    
    /**
     * Check if basic strategy hints are available
     */
    isAvailable() {
        return this.isInitialized && Object.keys(this.basicStrategy).length > 0;
    }

    /**
     * Get strategy chart data for display
     */
    getStrategyChart(chartType) {
        return this.basicStrategy[chartType] || {};
    }

    /**
     * Get all strategy charts
     */
    getAllCharts() {
        return {
            hard: this.basicStrategy.hard,
            soft: this.basicStrategy.soft,
            pairs: this.basicStrategy.pairs
        };
    }
}