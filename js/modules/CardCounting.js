/**
 * Card Counting Module - Comprehensive Hi-Lo counting system
 * Handles running count, true count, betting recommendations, and practice mode
 */

export class CardCounting {
    constructor() {
        this.isEnabled = false;
        this.practiceMode = false;
        this.showCountHints = true;
        this.showCardValues = false;
        
        // Hi-Lo counting system
        this.runningCount = 0;
        this.trueCount = 0;
        this.decksRemaining = 6;
        this.totalDecks = 6;
        this.cardsDealt = 0;
        this.penetration = 0;
        
        // Practice mode tracking
        this.practiceCount = 0;
        this.playerEstimate = 0;
        this.countingAccuracy = [];
        this.practiceStartTime = null;
        
        // Side count tracking
        this.acesCount = 0;
        this.fivesCount = 0;
        this.tensCount = 0;
        
        // Betting correlation
        this.bettingHistory = [];
        this.countHistory = [];
        
        // Performance tracking
        this.sessionStats = {
            handsPlayed: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            maxCount: 0,
            minCount: 0,
            startTime: null
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize the card counting module
     */
    async init() {
        try {
            console.log('🧮 Initializing Card Counting module...');
            
            this.loadCountingData();
            this.resetSession();
            
            this.isInitialized = true;
            console.log('✅ Card Counting module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Card Counting:', error);
            throw error;
        }
    }

    /**
     * Enable/disable card counting
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🧮 Card counting ${enabled ? 'enabled' : 'disabled'}`);
        
        if (!enabled) {
            this.reset();
        }
    }

    /**
     * Enable/disable practice mode
     */
    setPracticeMode(enabled) {
        this.practiceMode = enabled;
        console.log(`📚 Practice mode ${enabled ? 'enabled' : 'disabled'}`);
        
        if (enabled) {
            this.startPracticeSession();
        } else {
            this.endPracticeSession();
        }
    }

    /**
     * Set total number of decks
     */
    setTotalDecks(decks) {
        this.totalDecks = decks;
        this.decksRemaining = decks;
        this.calculateTrueCount();
        console.log(`🎴 Total decks set to: ${decks}`);
    }

    /**
     * Reset counting session
     */
    reset() {
        this.runningCount = 0;
        this.trueCount = 0;
        this.decksRemaining = this.totalDecks;
        this.cardsDealt = 0;
        this.penetration = 0;
        this.acesCount = 0;
        this.fivesCount = 0;
        this.tensCount = 0;
        this.countHistory = [];
        
        console.log('🔄 Card count reset');
    }

    /**
     * Reset session statistics
     */
    resetSession() {
        this.sessionStats = {
            handsPlayed: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            maxCount: 0,
            minCount: 0,
            startTime: new Date()
        };
        
        this.countingAccuracy = [];
        this.bettingHistory = [];
        console.log('📊 Session statistics reset');
    }

    /**
     * Update count when a card is dealt
     */
    updateCount(card, isVisible = true) {
        if (!this.isEnabled || !isVisible) return;

        const hiLoValue = this.getHiLoValue(card);
        this.runningCount += hiLoValue;
        this.cardsDealt++;
        
        // Update side counts
        this.updateSideCounts(card);
        
        // Calculate decks remaining and penetration
        this.calculateDecksRemaining();
        this.calculatePenetration();
        this.calculateTrueCount();
        
        // Track count history
        this.countHistory.push({
            card: card.toString(),
            hiLoValue,
            runningCount: this.runningCount,
            trueCount: this.trueCount,
            timestamp: Date.now()
        });
        
        // Update session stats
        this.sessionStats.maxCount = Math.max(this.sessionStats.maxCount, this.runningCount);
        this.sessionStats.minCount = Math.min(this.sessionStats.minCount, this.runningCount);
        
        console.log(`🧮 Count updated: RC=${this.runningCount}, TC=${this.trueCount.toFixed(1)}, Card=${card.toString()}`);
    }

    /**
     * Get Hi-Lo value for a card
     */
    getHiLoValue(card) {
        if (['2', '3', '4', '5', '6'].includes(card.rank)) return 1;
        if (['7', '8', '9'].includes(card.rank)) return 0;
        if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) return -1;
        return 0;
    }

    /**
     * Update side counts
     */
    updateSideCounts(card) {
        if (card.rank === 'A') this.acesCount++;
        if (card.rank === '5') this.fivesCount++;
        if (['10', 'J', 'Q', 'K'].includes(card.rank)) this.tensCount++;
    }

    /**
     * Calculate decks remaining
     */
    calculateDecksRemaining() {
        const cardsRemaining = (52 * this.totalDecks) - this.cardsDealt;
        this.decksRemaining = Math.max(0.5, cardsRemaining / 52);
    }

    /**
     * Calculate penetration percentage
     */
    calculatePenetration() {
        const totalCards = 52 * this.totalDecks;
        this.penetration = (this.cardsDealt / totalCards) * 100;
    }

    /**
     * Calculate true count
     */
    calculateTrueCount() {
        if (this.decksRemaining > 0) {
            this.trueCount = this.runningCount / this.decksRemaining;
        } else {
            this.trueCount = 0;
        }
    }

    /**
     * Update decks remaining (from Deck) for true count calc
     */
    updateDecksRemaining(decksRemaining) {
        if (typeof decksRemaining === 'number' && decksRemaining > 0) {
            this.decksRemaining = decksRemaining;
            this.calculateTrueCount();
        }
    }

    /**
     * Get betting recommendation based on true count
     */
    getBettingRecommendation(baseBet = 25, bankroll = 1000, riskLevel = 'moderate') {
        const tc = this.trueCount;
        
        // Conservative betting strategy
        const conservativeSpread = {
            '-10': 0,      // Don't bet at very negative counts
            '-2': baseBet,  // Minimum bet at negative counts
            '1': baseBet,   // Minimum bet at neutral/low positive
            '2': baseBet * 2,
            '3': baseBet * 3,
            '4': baseBet * 4,
            '5': baseBet * 5,
            '10': baseBet * 6  // Cap at 6x for very high counts
        };

        // Aggressive betting strategy
        const aggressiveSpread = {
            '-10': 0,
            '-2': baseBet,
            '1': baseBet,
            '2': baseBet * 3,
            '3': baseBet * 5,
            '4': baseBet * 7,
            '5': baseBet * 10,
            '10': baseBet * 12
        };

        const spread = riskLevel === 'aggressive' ? aggressiveSpread : conservativeSpread;
        
        // Find appropriate bet size
        let betSize = baseBet;
        for (const [countThreshold, betAmount] of Object.entries(spread)) {
            if (tc >= parseFloat(countThreshold)) {
                betSize = betAmount;
            }
        }

        // Kelly Criterion adjustment
        const advantage = this.calculateAdvantage();
        const kellyBet = this.calculateKellyBet(bankroll, advantage);
        const kellyAdjustedBet = Math.min(betSize, kellyBet);

        return {
            recommendedBet: Math.max(baseBet, Math.min(betSize, bankroll * 0.1)), // Cap at 10% of bankroll
            kellyBet: kellyAdjustedBet,
            spread: betSize / baseBet,
            advantage: advantage,
            confidence: this.getConfidenceLevel(),
            reasoning: this.getBettingReasoning(tc, advantage)
        };
    }

    /**
     * Calculate player advantage based on true count
     */
    calculateAdvantage() {
        const baseAdvantage = -0.5; // House edge with basic strategy
        const advantagePerCount = 0.5; // Approximate advantage gain per true count
        return baseAdvantage + (this.trueCount * advantagePerCount);
    }

    /**
     * Calculate Kelly Criterion bet size
     */
    calculateKellyBet(bankroll, advantage) {
        if (advantage <= 0) return 0;
        
        // Kelly formula: f = (bp - q) / b
        // Where: f = fraction of bankroll to bet, b = odds, p = probability of win, q = probability of loss
        const probability = 0.5 + (advantage / 100); // Rough approximation
        const kellyFraction = (probability * 2 - 1) / 1; // Simplified for even odds
        
        return Math.max(0, bankroll * kellyFraction * 0.25); // Use quarter Kelly for safety
    }

    /**
     * Get confidence level for current count
     */
    getConfidenceLevel() {
        const penetrationFactor = Math.min(1, this.penetration / 50); // Higher confidence with more penetration
        const countMagnitude = Math.abs(this.trueCount);
        const confidenceScore = (penetrationFactor * 0.7) + (Math.min(countMagnitude / 5, 1) * 0.3);
        
        if (confidenceScore > 0.8) return 'high';
        if (confidenceScore > 0.5) return 'medium';
        return 'low';
    }

    /**
     * Get betting reasoning text
     */
    getBettingReasoning(trueCount, advantage) {
        if (trueCount <= 1) {
            return 'Count is neutral/negative. Stick to minimum bet.';
        } else if (trueCount <= 2) {
            return 'Slight positive count. Small bet increase recommended.';
        } else if (trueCount <= 4) {
            return 'Good positive count. Increase bet significantly.';
        } else {
            return 'Very high count. Maximum betting advantage.';
        }
    }

    /**
     * Get index play recommendation for strategy deviations
     */
    getIndexPlayRecommendation(playerHand, dealerUpCard) {
        const tc = this.trueCount;
        const playerTotal = playerHand.getValue();
        const dealerRank = dealerUpCard.rank;
        
        // Common index plays based on true count
        const indexPlays = [
            {
                condition: () => playerTotal === 16 && dealerRank === '10' && tc >= 0,
                action: 'Stand',
                reason: 'Stand 16 vs 10 when TC ≥ 0'
            },
            {
                condition: () => playerTotal === 15 && dealerRank === '10' && tc >= 4,
                action: 'Stand',
                reason: 'Stand 15 vs 10 when TC ≥ +4'
            },
            {
                condition: () => playerTotal === 12 && dealerRank === '2' && tc >= 3,
                action: 'Stand',
                reason: 'Stand 12 vs 2 when TC ≥ +3'
            },
            {
                condition: () => playerTotal === 12 && dealerRank === '3' && tc >= 2,
                action: 'Stand',
                reason: 'Stand 12 vs 3 when TC ≥ +2'
            },
            {
                condition: () => playerTotal === 11 && dealerRank === 'A' && tc >= 1,
                action: 'Double Down',
                reason: 'Double 11 vs A when TC ≥ +1'
            },
            {
                condition: () => dealerRank === 'A' && tc >= 3,
                action: 'Take Insurance',
                reason: 'Take insurance when TC ≥ +3'
            }
        ];

        for (const play of indexPlays) {
            if (play.condition()) {
                return {
                    hasDeviation: true,
                    action: play.action,
                    reason: play.reason,
                    confidence: this.getConfidenceLevel()
                };
            }
        }

        return {
            hasDeviation: false,
            action: null,
            reason: 'No index play deviation recommended',
            confidence: this.getConfidenceLevel()
        };
    }

    /**
     * Record player's count estimate for practice mode
     */
    recordCountEstimate(estimate) {
        if (!this.practiceMode) return;

        this.playerEstimate = estimate;
        const actualCount = this.runningCount;
        const deviation = Math.abs(estimate - actualCount);
        
        this.countingAccuracy.push({
            estimate,
            actual: actualCount,
            deviation,
            timestamp: Date.now()
        });

        // Update session accuracy
        this.updateSessionAccuracy();
        
        console.log(`📚 Practice estimate: ${estimate}, Actual: ${actualCount}, Deviation: ${deviation}`);
    }

    /**
     * Update session accuracy statistics
     */
    updateSessionAccuracy() {
        if (this.countingAccuracy.length === 0) return;

        const totalDeviation = this.countingAccuracy.reduce((sum, record) => sum + record.deviation, 0);
        const perfectCount = this.countingAccuracy.filter(record => record.deviation === 0).length;
        
        this.sessionStats.averageDeviation = totalDeviation / this.countingAccuracy.length;
        this.sessionStats.countAccuracy = (perfectCount / this.countingAccuracy.length) * 100;
    }

    /**
     * Start practice session
     */
    startPracticeSession() {
        this.practiceStartTime = Date.now();
        this.countingAccuracy = [];
        this.practiceCount = 0;
        console.log('📚 Practice session started');
    }

    /**
     * End practice session
     */
    endPracticeSession() {
        if (!this.practiceStartTime) return;

        const sessionDuration = (Date.now() - this.practiceStartTime) / 1000;
        const accuracy = this.getCountingAccuracy();
        
        console.log(`📚 Practice session ended: ${sessionDuration}s, Accuracy: ${accuracy}%`);
        
        return {
            duration: sessionDuration,
            accuracy,
            totalEstimates: this.countingAccuracy.length,
            averageDeviation: this.sessionStats.averageDeviation
        };
    }

    /**
     * Get counting accuracy percentage
     */
    getCountingAccuracy() {
        return this.sessionStats.countAccuracy;
    }

    /**
     * Get heat management suggestions
     */
    getHeatManagementSuggestions() {
        const suggestions = [];
        
        // Betting pattern analysis
        const recentBets = this.bettingHistory.slice(-10);
        if (recentBets.length > 5) {
            const betSpread = Math.max(...recentBets) / Math.min(...recentBets);
            if (betSpread > 8) {
                suggestions.push({
                    type: 'betting',
                    level: 'high',
                    message: 'High betting spread detected. Consider reducing spread or taking a break.'
                });
            }
        }

        // Play time suggestions
        const playTime = this.getSessionDuration();
        if (playTime > 120) { // 2 hours
            suggestions.push({
                type: 'time',
                level: 'medium',
                message: 'Long session detected. Consider taking a break to avoid fatigue.'
            });
        }

        // Count-based suggestions
        if (Math.abs(this.trueCount) > 4) {
            suggestions.push({
                type: 'count',
                level: 'medium',
                message: 'Extreme count detected. Be aware of increased scrutiny.'
            });
        }

        return suggestions;
    }

    /**
     * Get comprehensive counting statistics
     */
    getCountingStats() {
        return {
            // Current state
            runningCount: this.runningCount,
            trueCount: parseFloat(this.trueCount.toFixed(1)),
            decksRemaining: parseFloat(this.decksRemaining.toFixed(1)),
            penetration: parseFloat(this.penetration.toFixed(1)),
            
            // Side counts
            acesCount: this.acesCount,
            fivesCount: this.fivesCount,
            tensCount: this.tensCount,
            
            // Session stats
            handsPlayed: this.sessionStats.handsPlayed,
            maxCount: this.sessionStats.maxCount,
            minCount: this.sessionStats.minCount,
            countAccuracy: this.sessionStats.countAccuracy,
            averageDeviation: this.sessionStats.averageDeviation,
            
            // Betting correlation
            bettingCorrelation: this.calculateBettingCorrelation(),
            
            // Advantage calculation
            currentAdvantage: this.calculateAdvantage(),
            confidence: this.getConfidenceLevel(),
            
            // Practice mode
            practiceMode: this.practiceMode,
            practiceAccuracy: this.getCountingAccuracy()
        };
    }

    /**
     * Calculate betting correlation with count
     */
    calculateBettingCorrelation() {
        if (this.bettingHistory.length < 5 || this.countHistory.length < 5) return 0;

        // Simple correlation calculation
        // This would ideally use Pearson correlation coefficient
        const recentBets = this.bettingHistory.slice(-10);
        const correspondingCounts = this.countHistory.slice(-10).map(h => h.trueCount);
        
        let correlation = 0;
        for (let i = 0; i < Math.min(recentBets.length, correspondingCounts.length); i++) {
            if (correspondingCounts[i] > 1 && recentBets[i] > 25) {
                correlation += 0.1;
            }
        }
        
        return Math.min(1, correlation);
    }

    /**
     * Get session duration in minutes
     */
    getSessionDuration() {
        if (!this.sessionStats.startTime) return 0;
        return Math.floor((Date.now() - this.sessionStats.startTime.getTime()) / 60000);
    }

    /**
     * Record a bet for correlation tracking
     */
    recordBet(amount) {
        this.bettingHistory.push(amount);
        
        // Keep only recent betting history
        if (this.bettingHistory.length > 50) {
            this.bettingHistory.shift();
        }
    }

    /**
     * Get EV calculation based on count and betting
     */
    getEVCalculation(betAmount) {
        const advantage = this.calculateAdvantage();
        const ev = (betAmount * advantage) / 100;
        
        return {
            betAmount,
            advantage: parseFloat(advantage.toFixed(2)),
            expectedValue: parseFloat(ev.toFixed(2)),
            hourlyEV: parseFloat((ev * 60).toFixed(2)) // Assuming 60 hands per hour
        };
    }

    /**
     * Save counting data to localStorage
     */
    saveCountingData() {
        try {
            const data = {
                sessionStats: this.sessionStats,
                countingAccuracy: this.countingAccuracy,
                bettingHistory: this.bettingHistory.slice(-20), // Save recent history
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('blackjackpro_counting', JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Failed to save counting data:', error);
        }
    }

    /**
     * Load counting data from localStorage
     */
    loadCountingData() {
        try {
            const saved = localStorage.getItem('blackjackpro_counting');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.sessionStats) {
                    this.sessionStats = { ...this.sessionStats, ...data.sessionStats };
                    // Convert date string back to Date object
                    if (data.sessionStats.startTime) {
                        this.sessionStats.startTime = new Date(data.sessionStats.startTime);
                    }
                }
                
                if (data.countingAccuracy) {
                    this.countingAccuracy = data.countingAccuracy;
                }
                
                if (data.bettingHistory) {
                    this.bettingHistory = data.bettingHistory;
                }
                
                console.log('📋 Counting data loaded from storage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load counting data:', error);
        }
    }

    /**
     * Export counting data
     */
    exportData() {
        return {
            sessionStats: this.sessionStats,
            countingAccuracy: this.countingAccuracy,
            bettingHistory: this.bettingHistory,
            countHistory: this.countHistory,
            currentState: {
                runningCount: this.runningCount,
                trueCount: this.trueCount,
                decksRemaining: this.decksRemaining,
                penetration: this.penetration
            },
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Get risk of ruin calculation
     */
    getRiskOfRuin(bankroll, betSize, advantage) {
        // Simplified risk of ruin calculation
        // ROR = ((1-advantage)/(1+advantage))^(bankroll/betSize)
        
        if (advantage <= 0) return 1; // 100% risk if no advantage
        
        const riskRatio = (1 - advantage/100) / (1 + advantage/100);
        const units = bankroll / betSize;
        const ror = Math.pow(riskRatio, units);
        
        return Math.min(1, Math.max(0, ror));
    }

    // Getters
    isCountingEnabled() { return this.isEnabled; }
    isPracticeModeEnabled() { return this.practiceMode; }
    getRunningCount() { return this.runningCount; }
    getTrueCount() { return parseFloat(this.trueCount.toFixed(1)); }
    getDecksRemaining() { return parseFloat(this.decksRemaining.toFixed(1)); }
    getPenetration() { return parseFloat(this.penetration.toFixed(1)); }
    
    // Setters
    setShowCardValues(show) { this.showCardValues = show; }
    setShowCountHints(show) { this.showCountHints = show; }
}