/**
 * Statistics Module - Tracks game statistics and card counting
 */

export class Statistics {
    constructor() {
        this.sessionStats = {
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
            sessionEndTime: null
        };
        
        this.cardCount = {
            running: 0,
            true: 0,
            decksRemaining: 6
        };
        
        this.handHistory = [];
        
        // Strategy accuracy tracking
        this.strategyStats = {
            totalDecisions: 0,
            correctDecisions: 0,
            decisionsByType: {
                hit: { total: 0, correct: 0 },
                stand: { total: 0, correct: 0 },
                double: { total: 0, correct: 0 },
                split: { total: 0, correct: 0 }
            },
            decisionsByHandType: {
                hard: { total: 0, correct: 0 },
                soft: { total: 0, correct: 0 },
                pair: { total: 0, correct: 0 }
            }
        };
        
        // Card counting statistics
        this.countingStats = {
            totalCountingHands: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            countByRange: {
                '1': 0,   // TC +1
                '2': 0,   // TC +2  
                '3': 0,   // TC +3
                '4': 0,   // TC +4
                '5+': 0   // TC +5 or higher
            },
            performanceByCount: {
                '1': { hands: 0, wins: 0, ev: 0 },
                '2': { hands: 0, wins: 0, ev: 0 },
                '3': { hands: 0, wins: 0, ev: 0 },
                '4': { hands: 0, wins: 0, ev: 0 },
                '5+': { hands: 0, wins: 0, ev: 0 }
            },
            countingMistakes: [],
            maxTrueCount: 0,
            minTrueCount: 0
        };
        
        // Betting analysis
        this.bettingStats = {
            bettingSpreads: [],
            optimalBets: 0,
            suboptimalBets: 0,
            kellyCriterionUsage: 0,
            riskOfRuinHistory: [],
            bettingEfficiency: 0
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize statistics module
     */
    async init() {
        try {
            console.log('📊 Initializing Statistics...');
            
            // Load saved statistics
            this.loadStatistics();
            
            this.isInitialized = true;
            console.log('✅ Statistics initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Statistics:', error);
            throw error;
        }
    }

    /**
     * Start a new session
     */
    startNewSession() {
        this.sessionStats = {
            handsPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            blackjacks: 0,
            busts: 0,
            bankAmount: this.sessionStats.bankAmount, // Keep current bank
            totalWagered: 0,
            totalWon: 0,
            sessionStartTime: new Date(),
            sessionEndTime: null
        };
        
        this.resetCardCount();
        this.handHistory = [];
        
        // Reset counting statistics
        this.countingStats = {
            totalCountingHands: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            countByRange: {
                '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0
            },
            performanceByCount: {
                '1': { hands: 0, wins: 0, ev: 0 },
                '2': { hands: 0, wins: 0, ev: 0 },
                '3': { hands: 0, wins: 0, ev: 0 },
                '4': { hands: 0, wins: 0, ev: 0 },
                '5+': { hands: 0, wins: 0, ev: 0 }
            },
            countingMistakes: [],
            maxTrueCount: 0,
            minTrueCount: 0
        };
        
        // Reset betting statistics
        this.bettingStats = {
            bettingSpreads: [],
            optimalBets: 0,
            suboptimalBets: 0,
            kellyCriterionUsage: 0,
            riskOfRuinHistory: [],
            bettingEfficiency: 0
        };
        
        console.log('📈 New session started');
        this.saveStatistics();
    }

    /**
     * Record a completed hand
     */
    recordHand(handData) {
        const { 
            playerHands, 
            dealerHand, 
            bet, 
            payout, 
            handsWon, 
            handsLost, 
            handsPushed 
        } = handData;

        // Update basic stats
        this.sessionStats.handsPlayed++;
        this.sessionStats.wins += handsWon;
        this.sessionStats.losses += handsLost;
        this.sessionStats.pushes += handsPushed;
        this.sessionStats.totalWagered += bet;
        this.sessionStats.totalWon += payout;

        // Check for blackjacks and busts
        playerHands.forEach(hand => {
            if (hand.value === 21 && hand.cards.length === 2) {
                this.sessionStats.blackjacks++;
            }
            if (hand.busted) {
                this.sessionStats.busts++;
            }
        });

        // Store hand in history
        this.handHistory.push({
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            playerHands: playerHands,
            dealerHand: dealerHand,
            bet: bet,
            payout: payout,
            result: this.determineHandResult(handsWon, handsLost, handsPushed)
        });

        // Keep only last 100 hands in memory
        if (this.handHistory.length > 100) {
            this.handHistory.shift();
        }

        console.log(`📝 Hand recorded: ${this.sessionStats.handsPlayed} hands played`);
        this.saveStatistics();
    }

    /**
     * Update bank amount
     */
    updateBank(amount) {
        this.sessionStats.bankAmount += amount;
        console.log(`💰 Bank updated: ${amount > 0 ? '+' : ''}${amount} (Total: $${this.sessionStats.bankAmount})`);
        this.saveStatistics();
    }

    /**
     * Update card count (Hi-Lo system)
     */
    updateCardCount(card) {
        const countValue = card.getHiLoValue();
        this.cardCount.running += countValue;
        
        // Calculate true count
        if (this.cardCount.decksRemaining > 0) {
            this.cardCount.true = this.cardCount.running / this.cardCount.decksRemaining;
        }
        
        console.log(`🧮 Count updated: Running=${this.cardCount.running}, True=${this.cardCount.true.toFixed(1)}`);
    }

    /**
     * Update decks remaining for true count calculation
     */
    updateDecksRemaining(decksRemaining) {
        this.cardCount.decksRemaining = decksRemaining;
        
        // Recalculate true count
        if (this.cardCount.decksRemaining > 0) {
            this.cardCount.true = this.cardCount.running / this.cardCount.decksRemaining;
        }
    }

    /**
     * Reset card count
     */
    resetCardCount() {
        this.cardCount.running = 0;
        this.cardCount.true = 0;
        console.log('🔄 Card count reset');
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.sessionStats,
            winRate: this.getWinRate(),
            averageBet: this.getAverageBet(),
            netGain: this.getNetGain(),
            sessionDuration: this.getSessionDuration(),
            handsPerHour: this.getHandsPerHour()
        };
    }

    /**
     * Get card count data
     */
    getCardCount() {
        return { ...this.cardCount };
    }

    /**
     * Calculate win rate percentage
     */
    getWinRate() {
        if (this.sessionStats.handsPlayed === 0) return 0;
        return (this.sessionStats.wins / this.sessionStats.handsPlayed) * 100;
    }

    /**
     * Calculate average bet
     */
    getAverageBet() {
        if (this.sessionStats.handsPlayed === 0) return 0;
        return this.sessionStats.totalWagered / this.sessionStats.handsPlayed;
    }

    /**
     * Calculate net gain/loss
     */
    getNetGain() {
        return this.sessionStats.totalWon - this.sessionStats.totalWagered;
    }

    /**
     * Get session duration in minutes
     */
    getSessionDuration() {
        if (!this.sessionStats.sessionStartTime) return 0;
        const now = new Date();
        return Math.floor((now - this.sessionStats.sessionStartTime) / 60000);
    }

    /**
     * Calculate hands per hour
     */
    getHandsPerHour() {
        const durationHours = this.getSessionDuration() / 60;
        if (durationHours === 0) return 0;
        return Math.round(this.sessionStats.handsPlayed / durationHours);
    }

    /**
     * Get detailed statistics for analysis
     */
    getDetailedStats() {
        const stats = this.getStats();
        
        return {
            ...stats,
            // Performance metrics
            profitPerHour: this.getProfitPerHour(),
            blackjackFrequency: this.getBlackjackFrequency(),
            bustFrequency: this.getBustFrequency(),
            
            // Card counting effectiveness
            countAccuracy: this.getCountAccuracy(),
            bettingSpread: this.getBettingSpread(),
            
            // Historical data
            recentPerformance: this.getRecentPerformance(),
            bestStreak: this.getBestStreak(),
            worstStreak: this.getWorstStreak()
        };
    }

    /**
     * Calculate profit per hour
     */
    getProfitPerHour() {
        const durationHours = this.getSessionDuration() / 60;
        if (durationHours === 0) return 0;
        return this.getNetGain() / durationHours;
    }

    /**
     * Calculate blackjack frequency
     */
    getBlackjackFrequency() {
        if (this.sessionStats.handsPlayed === 0) return 0;
        return (this.sessionStats.blackjacks / this.sessionStats.handsPlayed) * 100;
    }

    /**
     * Calculate bust frequency
     */
    getBustFrequency() {
        if (this.sessionStats.handsPlayed === 0) return 0;
        return (this.sessionStats.busts / this.sessionStats.handsPlayed) * 100;
    }

    /**
     * Get recent performance (last 20 hands)
     */
    getRecentPerformance() {
        const recentHands = this.handHistory.slice(-20);
        if (recentHands.length === 0) return null;
        
        const wins = recentHands.filter(hand => hand.result === 'win').length;
        const losses = recentHands.filter(hand => hand.result === 'loss').length;
        const pushes = recentHands.filter(hand => hand.result === 'push').length;
        
        return {
            hands: recentHands.length,
            wins,
            losses,
            pushes,
            winRate: (wins / recentHands.length) * 100,
            netGain: recentHands.reduce((sum, hand) => sum + (hand.payout - hand.bet), 0)
        };
    }

    /**
     * Find best winning streak
     */
    getBestStreak() {
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
    getWorstStreak() {
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
     * Get count accuracy (placeholder for future implementation)
     */
    getCountAccuracy() {
        // This would require tracking actual vs. calculated counts
        return 0;
    }

    /**
     * Get betting spread data (placeholder for future implementation)
     */
    getBettingSpread() {
        // This would analyze betting patterns vs. count
        return 0;
    }

    /**
     * Determine hand result
     */
    determineHandResult(wins, losses, pushes) {
        if (wins > 0) return 'win';
        if (losses > 0) return 'loss';
        if (pushes > 0) return 'push';
        return 'unknown';
    }

    /**
     * Export statistics data
     */
    exportData() {
        return {
            sessionStats: this.sessionStats,
            cardCount: this.cardCount,
            handHistory: this.handHistory,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import statistics data
     */
    importData(data) {
        try {
            if (data.sessionStats) this.sessionStats = { ...this.sessionStats, ...data.sessionStats };
            if (data.cardCount) this.cardCount = { ...this.cardCount, ...data.cardCount };
            if (data.handHistory) this.handHistory = data.handHistory;
            
            this.saveStatistics();
            console.log('📥 Statistics data imported successfully');
        } catch (error) {
            console.error('❌ Failed to import statistics:', error);
        }
    }

    /**
     * Save statistics to localStorage
     */
    saveStatistics() {
        try {
            const data = {
                sessionStats: this.sessionStats,
                cardCount: this.cardCount,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('blackjackpro_statistics', JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Failed to save statistics:', error);
        }
    }

    /**
     * Load statistics from localStorage
     */
    loadStatistics() {
        try {
            const saved = localStorage.getItem('blackjackpro_statistics');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.sessionStats) {
                    this.sessionStats = { ...this.sessionStats, ...data.sessionStats };
                }
                
                if (data.cardCount) {
                    this.cardCount = { ...this.cardCount, ...data.cardCount };
                }
                
                console.log('📋 Statistics loaded from storage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load statistics:', error);
        }
    }

    /**
     * Reset all statistics
     */
    resetAllStats() {
        this.sessionStats = {
            handsPlayed: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            blackjacks: 0,
            busts: 0,
            bankAmount: 1000,
            totalWagered: 0,
            totalWon: 0,
            sessionStartTime: new Date(),
            sessionEndTime: null
        };
        
        this.resetCardCount();
        this.handHistory = [];
        this.saveStatistics();
        
        console.log('🔄 All statistics reset');
    }

    // Getters
    getBankAmount() {
        return this.sessionStats.bankAmount;
    }

    getHandsPlayed() {
        return this.sessionStats.handsPlayed;
    }

    getWins() {
        return this.sessionStats.wins;
    }
    
    /**
     * Record strategy decision for accuracy tracking
     */
    recordStrategyDecision(playerAction, recommendedAction, handType = 'hard') {
        this.strategyStats.totalDecisions++;
        
        const isCorrect = playerAction.toLowerCase() === recommendedAction.toLowerCase();
        if (isCorrect) {
            this.strategyStats.correctDecisions++;
        }
        
        // Track by action type
        const actionKey = playerAction.toLowerCase().replace(' ', '').replace('down', '');
        if (this.strategyStats.decisionsByType[actionKey]) {
            this.strategyStats.decisionsByType[actionKey].total++;
            if (isCorrect) {
                this.strategyStats.decisionsByType[actionKey].correct++;
            }
        }
        
        // Track by hand type
        if (this.strategyStats.decisionsByHandType[handType]) {
            this.strategyStats.decisionsByHandType[handType].total++;
            if (isCorrect) {
                this.strategyStats.decisionsByHandType[handType].correct++;
            }
        }
        
        console.log(`📊 Strategy decision recorded: ${playerAction} (${isCorrect ? 'Correct' : 'Incorrect'})`);
        this.saveStatistics();
    }
    
    /**
     * Get strategy accuracy statistics
     */
    getStrategyStats() {
        const overallAccuracy = this.strategyStats.totalDecisions > 0 ? 
            (this.strategyStats.correctDecisions / this.strategyStats.totalDecisions) * 100 : 0;
            
        const actionAccuracy = {};
        Object.entries(this.strategyStats.decisionsByType).forEach(([action, stats]) => {
            actionAccuracy[action] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        });
        
        const handTypeAccuracy = {};
        Object.entries(this.strategyStats.decisionsByHandType).forEach(([type, stats]) => {
            handTypeAccuracy[type] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        });
        
        return {
            totalDecisions: this.strategyStats.totalDecisions,
            correctDecisions: this.strategyStats.correctDecisions,
            overallAccuracy: Math.round(overallAccuracy * 100) / 100,
            grade: this.getAccuracyGrade(overallAccuracy),
            actionAccuracy,
            handTypeAccuracy,
            decisionsByType: this.strategyStats.decisionsByType,
            decisionsByHandType: this.strategyStats.decisionsByHandType
        };
    }
    
    /**
     * Get accuracy grade based on percentage
     */
    getAccuracyGrade(accuracy) {
        if (accuracy >= 98) return 'A+';
        if (accuracy >= 95) return 'A';
        if (accuracy >= 90) return 'B+';
        if (accuracy >= 85) return 'B';
        if (accuracy >= 80) return 'C+';
        if (accuracy >= 75) return 'C';
        if (accuracy >= 70) return 'D+';
        if (accuracy >= 65) return 'D';
        return 'F';
    }
    
    /**
     * Get real-time statistics update
     */
    getRealTimeUpdate() {
        return {
            bankAmount: this.sessionStats.bankAmount,
            handsPlayed: this.sessionStats.handsPlayed,
            winRate: this.getWinRate(),
            netGain: this.getNetGain(),
            strategyAccuracy: this.getStrategyStats().overallAccuracy,
            sessionDuration: this.getSessionDuration()
        };
    }
    
    /**
     * Record card counting statistics for a hand
     */
    recordCountingHand(handData) {
        const { trueCount, betAmount, result, estimatedCount, actualCount } = handData;
        
        this.countingStats.totalCountingHands++;
        
        // Update count range statistics
        const countRange = this.getCountRange(trueCount);
        this.countingStats.countByRange[countRange]++;
        
        // Update performance by count
        this.countingStats.performanceByCount[countRange].hands++;
        if (result === 'win') {
            this.countingStats.performanceByCount[countRange].wins++;
        }
        
        // Update max/min counts
        this.countingStats.maxTrueCount = Math.max(this.countingStats.maxTrueCount, trueCount);
        this.countingStats.minTrueCount = Math.min(this.countingStats.minTrueCount, trueCount);
        
        // Record counting accuracy if player provided estimate
        if (estimatedCount !== undefined && actualCount !== undefined) {
            const deviation = Math.abs(estimatedCount - actualCount);
            this.countingStats.countingMistakes.push({
                hand: this.countingStats.totalCountingHands,
                estimated: estimatedCount,
                actual: actualCount,
                deviation,
                timestamp: new Date()
            });
            
            // Update accuracy
            this.updateCountingAccuracy();
        }
        
        console.log(`🧮 Counting hand recorded: TC=${trueCount}, Range=${countRange}`);
    }
    
    /**
     * Get count range for statistics
     */
    getCountRange(trueCount) {
        if (trueCount >= 5) return '5+';
        if (trueCount >= 4) return '4';
        if (trueCount >= 3) return '3';
        if (trueCount >= 2) return '2';
        if (trueCount >= 1) return '1';
        return '0';
    }
    
    /**
     * Update counting accuracy
     */
    updateCountingAccuracy() {
        if (this.countingStats.countingMistakes.length === 0) return;
        
        const recentMistakes = this.countingStats.countingMistakes.slice(-50);
        const perfectCounts = recentMistakes.filter(m => m.deviation === 0).length;
        const totalDeviation = recentMistakes.reduce((sum, m) => sum + m.deviation, 0);
        
        this.countingStats.countAccuracy = (perfectCounts / recentMistakes.length) * 100;
        this.countingStats.averageDeviation = totalDeviation / recentMistakes.length;
    }
    
    /**
     * Record betting decision for analysis
     */
    recordBettingDecision(bettingData) {
        const { betAmount, recommendedBet, trueCount, bankroll, advantage } = bettingData;\n        \n        // Calculate betting spread\n        const baseBet = 25; // Default base bet\n        const spread = betAmount / baseBet;\n        this.bettingStats.bettingSpreads.push(spread);\n        \n        // Check if bet was optimal\n        const tolerance = 0.2; // 20% tolerance\n        const isOptimal = Math.abs(betAmount - recommendedBet) / recommendedBet <= tolerance;\n        \n        if (isOptimal) {\n            this.bettingStats.optimalBets++;\n        } else {\n            this.bettingStats.suboptimalBets++;\n        }\n        \n        // Calculate betting efficiency\n        const totalBets = this.bettingStats.optimalBets + this.bettingStats.suboptimalBets;\n        if (totalBets > 0) {\n            this.bettingStats.bettingEfficiency = (this.bettingStats.optimalBets / totalBets) * 100;\n        }\n        \n        // Calculate risk of ruin\n        const ror = this.calculateRiskOfRuin(bankroll, betAmount, advantage);\n        this.bettingStats.riskOfRuinHistory.push({\n            bankroll,\n            betAmount,\n            advantage,\n            riskOfRuin: ror,\n            timestamp: new Date()\n        });\n        \n        console.log(`💰 Betting decision recorded: $${betAmount} (${isOptimal ? 'Optimal' : 'Suboptimal'})`);\n    }\n    \n    /**\n     * Calculate risk of ruin\n     */\n    calculateRiskOfRuin(bankroll, betSize, advantage) {\n        if (advantage <= 0) return 1;\n        \n        const riskRatio = (1 - advantage/100) / (1 + advantage/100);\n        const units = bankroll / betSize;\n        return Math.pow(riskRatio, units);\n    }\n    \n    /**\n     * Get counting statistics\n     */\n    getCountingStats() {\n        return {\n            ...this.countingStats,\n            countingEfficiency: this.calculateCountingEfficiency(),\n            bettingCorrelation: this.calculateBettingCorrelation(),\n            evByCount: this.calculateEVByCount()\n        };\n    }\n    \n    /**\n     * Calculate counting efficiency\n     */\n    calculateCountingEfficiency() {\n        if (this.countingStats.totalCountingHands === 0) return 0;\n        \n        // Efficiency based on performance in high count situations\n        const highCountHands = this.countingStats.performanceByCount['3'].hands +\n                              this.countingStats.performanceByCount['4'].hands +\n                              this.countingStats.performanceByCount['5+'].hands;\n                              \n        const highCountWins = this.countingStats.performanceByCount['3'].wins +\n                             this.countingStats.performanceByCount['4'].wins +\n                             this.countingStats.performanceByCount['5+'].wins;\n                             \n        if (highCountHands === 0) return 0;\n        \n        const highCountWinRate = (highCountWins / highCountHands) * 100;\n        const expectedWinRate = 55; // Expected win rate with advantage\n        \n        return Math.min(100, (highCountWinRate / expectedWinRate) * 100);\n    }\n    \n    /**\n     * Calculate betting correlation with count\n     */\n    calculateBettingCorrelation() {\n        // Simple correlation - would need more sophisticated calculation in real implementation\n        if (this.bettingStats.bettingSpreads.length < 10) return 0;\n        \n        return Math.min(100, this.bettingStats.bettingEfficiency);\n    }\n    \n    /**\n     * Calculate expected value by count range\n     */\n    calculateEVByCount() {\n        const evByCount = {};\n        \n        Object.entries(this.countingStats.performanceByCount).forEach(([range, data]) => {\n            if (data.hands > 0) {\n                const winRate = (data.wins / data.hands) * 100;\n                const advantage = this.getAdvantageByCount(range);\n                evByCount[range] = {\n                    winRate,\n                    advantage,\n                    hands: data.hands,\n                    expectedEV: advantage * 25 // Assuming base bet of $25\n                };\n            }\n        });\n        \n        return evByCount;\n    }\n    \n    /**\n     * Get theoretical advantage by count range\n     */\n    getAdvantageByCount(countRange) {\n        const advantages = {\n            '0': -0.5,  // House edge\n            '1': 0,     // Break even\n            '2': 0.5,   // Small advantage\n            '3': 1.0,   // Good advantage\n            '4': 1.5,   // Strong advantage\n            '5+': 2.0   // Very strong advantage\n        };\n        \n        return advantages[countRange] || -0.5;\n    }\n    \n    /**\n     * Get betting statistics\n     */\n    getBettingStats() {\n        const currentROR = this.bettingStats.riskOfRuinHistory.length > 0 ?\n            this.bettingStats.riskOfRuinHistory[this.bettingStats.riskOfRuinHistory.length - 1].riskOfRuin : 0;\n            \n        return {\n            ...this.bettingStats,\n            averageSpread: this.calculateAverageSpread(),\n            currentRiskOfRuin: currentROR,\n            totalBetsAnalyzed: this.bettingStats.optimalBets + this.bettingStats.suboptimalBets\n        };\n    }\n    \n    /**\n     * Calculate average betting spread\n     */\n    calculateAverageSpread() {\n        if (this.bettingStats.bettingSpreads.length === 0) return 1;\n        \n        const sum = this.bettingStats.bettingSpreads.reduce((a, b) => a + b, 0);\n        return sum / this.bettingStats.bettingSpreads.length;\n    }\n    \n    /**\n     * Get comprehensive card counting report\n     */\n    getCountingReport() {\n        return {\n            session: {\n                totalHands: this.countingStats.totalCountingHands,\n                accuracy: this.countingStats.countAccuracy,\n                averageDeviation: this.countingStats.averageDeviation,\n                efficiency: this.calculateCountingEfficiency()\n            },\n            performance: {\n                byCountRange: this.countingStats.performanceByCount,\n                maxCount: this.countingStats.maxTrueCount,\n                minCount: this.countingStats.minTrueCount,\n                countDistribution: this.countingStats.countByRange\n            },\n            betting: {\n                efficiency: this.bettingStats.bettingEfficiency,\n                averageSpread: this.calculateAverageSpread(),\n                correlation: this.calculateBettingCorrelation(),\n                riskManagement: this.assessRiskManagement()\n            },\n            recommendations: this.getCountingRecommendations()\n        };\n    }\n    \n    /**\n     * Assess risk management\n     */\n    assessRiskManagement() {\n        const recentROR = this.bettingStats.riskOfRuinHistory.slice(-10);\n        const averageROR = recentROR.length > 0 ?\n            recentROR.reduce((sum, r) => sum + r.riskOfRuin, 0) / recentROR.length : 0;\n            \n        return {\n            averageRiskOfRuin: averageROR,\n            riskLevel: averageROR > 0.1 ? 'high' : averageROR > 0.05 ? 'medium' : 'low',\n            bankrollPreservation: averageROR < 0.05 ? 'excellent' : averageROR < 0.1 ? 'good' : 'poor'\n        };\n    }\n    \n    /**\n     * Get counting recommendations\n     */\n    getCountingRecommendations() {\n        const recommendations = [];\n        \n        if (this.countingStats.countAccuracy < 90) {\n            recommendations.push({\n                type: 'accuracy',\n                priority: 'high',\n                message: 'Practice counting accuracy. Aim for 95%+ accuracy before betting significant amounts.'\n            });\n        }\n        \n        if (this.bettingStats.bettingEfficiency < 80) {\n            recommendations.push({\n                type: 'betting',\n                priority: 'medium',\n                message: 'Improve bet sizing. Follow recommended bets more closely.'\n            });\n        }\n        \n        const avgSpread = this.calculateAverageSpread();\n        if (avgSpread > 10) {\n            recommendations.push({\n                type: 'heat',\n                priority: 'high',\n                message: 'Betting spread too wide. Consider reducing spread to avoid detection.'\n            });\n        }\n        \n        return recommendations;\n    }\n}