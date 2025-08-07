/**
 * SessionStats - Manages basic game session statistics
 * Extracted from Statistics.js for better organization
 */

export class SessionStats {
    constructor() {
        this.sessionData = {
            handsPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            blackjacks: 0,
            busts: 0,
            bankAmount: 1000,
            totalWagered: 0,
            totalWon: 0,
            sessionStartTime: null,
            sessionEndTime: null,
            sessionId: null
        };
        
        this.handHistory = [];
        this.maxHistorySize = 100;
        
        this.isActive = false;
    }

    /**
     * Initialize session statistics
     */
    init() {
        this.sessionData.sessionId = Date.now();
        this.isActive = true;
        console.log('📊 SessionStats initialized');
    }

    /**
     * Start a new session
     */
    startNewSession(initialBank = 1000) {
        this.sessionData = {
            handsPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            blackjacks: 0,
            busts: 0,
            bankAmount: initialBank,
            totalWagered: 0,
            totalWon: 0,
            sessionStartTime: new Date(),
            sessionEndTime: null,
            sessionId: Date.now()
        };
        
        this.handHistory = [];
        this.isActive = true;
        
        console.log('🆕 New session started with $' + initialBank);
        return this.sessionData.sessionId;
    }

    /**
     * End current session
     */
    endSession() {
        this.sessionData.sessionEndTime = new Date();
        this.isActive = false;
        
        const duration = this.getSessionDuration();
        const netResult = this.getNetGain();
        
        console.log(`🏁 Session ended after ${duration} minutes. Net: $${netResult}`);
        
        return {
            sessionId: this.sessionData.sessionId,
            duration,
            netResult,
            handsPlayed: this.sessionData.handsPlayed,
            finalBank: this.sessionData.bankAmount
        };
    }

    /**
     * Record a completed hand
     */
    recordHand(handData) {
        if (!this.isActive) return false;

        const { playerHands, dealerHand, bet, payout, handsWon, handsLost, handsPushed } = handData;
        
        // Update basic counters
        this.sessionData.handsPlayed++;
        this.sessionData.wins += handsWon;
        this.sessionData.losses += handsLost;
        this.sessionData.pushes += handsPushed;
        
        // Update financial tracking
        this.sessionData.totalWagered += bet;
        this.sessionData.totalWon += payout;
        
        // Check for blackjacks and busts
        playerHands.forEach(hand => {
            if (hand.value === 21 && hand.cards && hand.cards.length === 2) {
                this.sessionData.blackjacks++;
            }
            if (hand.busted) {
                this.sessionData.busts++;
            }
        });
        
        // Create hand record
        const handRecord = {
            handNumber: this.sessionData.handsPlayed,
            timestamp: new Date(),
            bet,
            payout,
            netResult: payout - bet,
            playerHands: playerHands.map(h => ({
                value: h.value,
                busted: h.busted,
                isDoubled: h.isDoubled,
                isSplit: h.isSplit,
                cardCount: h.cards ? h.cards.length : 0
            })),
            dealerHand: {
                value: dealerHand.value,
                busted: dealerHand.busted,
                cardCount: dealerHand.cards ? dealerHand.cards.length : 0
            },
            result: handsWon > 0 ? 'win' : handsLost > 0 ? 'loss' : 'push'
        };
        
        this.handHistory.push(handRecord);
        
        // Maintain history size limit
        if (this.handHistory.length > this.maxHistorySize) {
            this.handHistory.shift();
        }
        
        console.log(`📝 Hand #${this.sessionData.handsPlayed} recorded: ${handRecord.result.toUpperCase()}`);
        return true;
    }

    /**
     * Update bank amount
     */
    updateBank(amount) {
        if (!this.isActive) return false;

        const previousAmount = this.sessionData.bankAmount;
        this.sessionData.bankAmount += amount;
        
        console.log(`💰 Bank ${amount >= 0 ? '+' : ''}${amount}: $${previousAmount} → $${this.sessionData.bankAmount}`);
        
        // Check for bankruptcy
        if (this.sessionData.bankAmount <= 0) {
            console.warn('💸 Bank depleted! Consider ending session.');
            this.sessionData.bankAmount = 0;
        }
        
        return this.sessionData.bankAmount;
    }

    /**
     * Get current session statistics
     */
    getSessionStats() {
        return {
            ...this.sessionData,
            winRate: this.calculateWinRate(),
            averageBet: this.calculateAverageBet(),
            netGain: this.getNetGain(),
            sessionDuration: this.getSessionDuration(),
            handsPerHour: this.calculateHandsPerHour(),
            profitPerHour: this.calculateProfitPerHour(),
            blackjackFrequency: this.calculateBlackjackFrequency(),
            bustFrequency: this.calculateBustFrequency()
        };
    }

    /**
     * Calculate win rate percentage
     */
    calculateWinRate() {
        if (this.sessionData.handsPlayed === 0) return 0;
        return Math.round((this.sessionData.wins / this.sessionData.handsPlayed) * 100 * 100) / 100;
    }

    /**
     * Calculate average bet size
     */
    calculateAverageBet() {
        if (this.sessionData.handsPlayed === 0) return 0;
        return Math.round((this.sessionData.totalWagered / this.sessionData.handsPlayed) * 100) / 100;
    }

    /**
     * Calculate net gain/loss
     */
    getNetGain() {
        return this.sessionData.totalWon - this.sessionData.totalWagered;
    }

    /**
     * Get session duration in minutes
     */
    getSessionDuration() {
        if (!this.sessionData.sessionStartTime) return 0;
        const endTime = this.sessionData.sessionEndTime || new Date();
        return Math.floor((endTime - this.sessionData.sessionStartTime) / 60000);
    }

    /**
     * Calculate hands per hour
     */
    calculateHandsPerHour() {
        const durationHours = this.getSessionDuration() / 60;
        if (durationHours === 0) return 0;
        return Math.round(this.sessionData.handsPlayed / durationHours);
    }

    /**
     * Calculate profit per hour
     */
    calculateProfitPerHour() {
        const durationHours = this.getSessionDuration() / 60;
        if (durationHours === 0) return 0;
        return Math.round((this.getNetGain() / durationHours) * 100) / 100;
    }

    /**
     * Calculate blackjack frequency
     */
    calculateBlackjackFrequency() {
        if (this.sessionData.handsPlayed === 0) return 0;
        return Math.round((this.sessionData.blackjacks / this.sessionData.handsPlayed) * 100 * 100) / 100;
    }

    /**
     * Calculate bust frequency
     */
    calculateBustFrequency() {
        if (this.sessionData.handsPlayed === 0) return 0;
        return Math.round((this.sessionData.busts / this.sessionData.handsPlayed) * 100 * 100) / 100;
    }

    /**
     * Get recent performance (configurable number of hands)
     */
    getRecentPerformance(handCount = 20) {
        const recentHands = this.handHistory.slice(-handCount);
        if (recentHands.length === 0) return null;
        
        const wins = recentHands.filter(hand => hand.result === 'win').length;
        const losses = recentHands.filter(hand => hand.result === 'loss').length;
        const pushes = recentHands.filter(hand => hand.result === 'push').length;
        
        const totalWagered = recentHands.reduce((sum, hand) => sum + hand.bet, 0);
        const totalWon = recentHands.reduce((sum, hand) => sum + hand.payout, 0);
        
        return {
            hands: recentHands.length,
            wins,
            losses,
            pushes,
            winRate: Math.round((wins / recentHands.length) * 100 * 100) / 100,
            netGain: totalWon - totalWagered,
            averageBet: Math.round((totalWagered / recentHands.length) * 100) / 100
        };
    }

    /**
     * Find best winning streak
     */
    getBestWinStreak() {
        let bestStreak = 0;
        let currentStreak = 0;
        
        this.handHistory.forEach(hand => {
            if (hand.result === 'win') {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        
        return bestStreak;
    }

    /**
     * Find worst losing streak
     */
    getWorstLossStreak() {
        let worstStreak = 0;
        let currentStreak = 0;
        
        this.handHistory.forEach(hand => {
            if (hand.result === 'loss') {
                currentStreak++;
                worstStreak = Math.max(worstStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        
        return worstStreak;
    }

    /**
     * Get comprehensive session summary
     */
    getSessionSummary() {
        const stats = this.getSessionStats();
        const recent = this.getRecentPerformance();
        
        return {
            sessionInfo: {
                sessionId: this.sessionData.sessionId,
                startTime: this.sessionData.sessionStartTime,
                endTime: this.sessionData.sessionEndTime,
                duration: stats.sessionDuration,
                isActive: this.isActive
            },
            performance: {
                handsPlayed: stats.handsPlayed,
                winRate: stats.winRate,
                netGain: stats.netGain,
                bankAmount: stats.bankAmount,
                averageBet: stats.averageBet,
                handsPerHour: stats.handsPerHour,
                profitPerHour: stats.profitPerHour
            },
            streaks: {
                bestWinStreak: this.getBestWinStreak(),
                worstLossStreak: this.getWorstLossStreak()
            },
            frequencies: {
                blackjackFrequency: stats.blackjackFrequency,
                bustFrequency: stats.bustFrequency
            },
            recentPerformance: recent
        };
    }

    /**
     * Get hand history (with optional filtering)
     */
    getHandHistory(filter = null, limit = null) {
        let history = [...this.handHistory];
        
        // Apply filter if provided
        if (filter) {
            if (filter.result) {
                history = history.filter(hand => hand.result === filter.result);
            }
            if (filter.minBet !== undefined) {
                history = history.filter(hand => hand.bet >= filter.minBet);
            }
            if (filter.maxBet !== undefined) {
                history = history.filter(hand => hand.bet <= filter.maxBet);
            }
        }
        
        // Apply limit if provided
        if (limit && limit > 0) {
            history = history.slice(-limit);
        }
        
        return history;
    }

    /**
     * Export session data
     */
    exportSessionData() {
        return {
            sessionData: { ...this.sessionData },
            handHistory: [...this.handHistory],
            summary: this.getSessionSummary(),
            exportTimestamp: new Date().toISOString()
        };
    }

    /**
     * Import session data
     */
    importSessionData(importedData) {
        try {
            if (importedData.sessionData) {
                this.sessionData = { ...this.sessionData, ...importedData.sessionData };
            }
            
            if (importedData.handHistory) {
                this.handHistory = [...importedData.handHistory];
            }
            
            // Validate data integrity
            const calculatedHands = this.handHistory.length;
            if (calculatedHands !== this.sessionData.handsPlayed) {
                console.warn('⚠️ Hand count mismatch in imported data');
            }
            
            console.log('📥 Session data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import session data:', error);
            return false;
        }
    }

    /**
     * Reset session statistics
     */
    reset() {
        const wasActive = this.isActive;
        this.startNewSession(1000);
        
        if (!wasActive) {
            this.isActive = false;
        }
        
        console.log('🔄 Session statistics reset');
    }

    /**
     * Get real-time session update
     */
    getRealTimeUpdate() {
        return {
            handsPlayed: this.sessionData.handsPlayed,
            bankAmount: this.sessionData.bankAmount,
            winRate: this.calculateWinRate(),
            netGain: this.getNetGain(),
            sessionDuration: this.getSessionDuration(),
            lastHandResult: this.handHistory.length > 0 ? 
                this.handHistory[this.handHistory.length - 1].result : null,
            isActive: this.isActive
        };
    }

    /**
     * Check if session is profitable
     */
    isProfitable() {
        return this.getNetGain() > 0;
    }

    /**
     * Get session health metrics
     */
    getSessionHealth() {
        const stats = this.getSessionStats();
        const health = {
            bankStatus: 'healthy',
            performanceStatus: 'good',
            riskLevel: 'low',
            warnings: []
        };
        
        // Bank health
        if (this.sessionData.bankAmount <= 100) {
            health.bankStatus = 'critical';
            health.warnings.push('Bank amount critically low');
        } else if (this.sessionData.bankAmount <= 300) {
            health.bankStatus = 'warning';
            health.warnings.push('Bank amount getting low');
        }
        
        // Performance health
        if (stats.winRate < 30) {
            health.performanceStatus = 'poor';
            health.riskLevel = 'high';
            health.warnings.push('Win rate very low');
        } else if (stats.winRate < 40) {
            health.performanceStatus = 'fair';
            health.riskLevel = 'medium';
        }
        
        // Duration warnings
        if (stats.sessionDuration > 240) { // 4 hours
            health.warnings.push('Long session - consider taking a break');
        }
        
        return health;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.endSession();
        this.handHistory = [];
        console.log('🧹 SessionStats cleaned up');
    }
}