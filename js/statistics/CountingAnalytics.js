/**
 * CountingAnalytics - Tracks and analyzes card counting performance
 * Extracted from Statistics.js for better organization
 */

export class CountingAnalytics {
    constructor() {
        this.countingData = {
            totalCountingHands: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            
            // Count range tracking
            countByRange: {
                '-4': 0,   // TC -4 or lower
                '-3': 0,   // TC -3
                '-2': 0,   // TC -2
                '-1': 0,   // TC -1
                '0': 0,    // TC 0
                '1': 0,    // TC +1
                '2': 0,    // TC +2  
                '3': 0,    // TC +3
                '4': 0,    // TC +4
                '5+': 0    // TC +5 or higher
            },
            
            // Performance by count
            performanceByCount: {
                '-4': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-3': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-2': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-1': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '0': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '1': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '2': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '3': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '4': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '5+': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 }
            },
            
            // Counting accuracy tracking
            countingMistakes: [],
            accuracyByRange: {},
            
            // Statistical tracking
            maxTrueCount: 0,
            minTrueCount: 0,
            averageCount: 0,
            countVariance: 0
        };
        
        this.countHistory = [];
        this.bettingHistory = [];
        this.maxHistorySize = 500;
        
        // Expected values by count (Hi-Lo)
        this.expectedEV = {
            '-4': -2.5,
            '-3': -2.0,
            '-2': -1.5,
            '-1': -1.0,
            '0': -0.5,
            '1': 0.0,
            '2': 0.5,
            '3': 1.0,
            '4': 1.5,
            '5+': 2.0
        };
    }

    /**
     * Initialize counting analytics
     */
    init() {
        console.log('🧮 CountingAnalytics initialized');
    }

    /**
     * Record a counting hand result
     */
    recordCountingHand(handData) {
        const {
            trueCount,
            betAmount,
            result,
            estimatedCount,
            actualCount,
            payout = 0
        } = handData;

        this.countingData.totalCountingHands++;
        
        // Update count range statistics
        const countRange = this.getCountRange(trueCount);
        this.countingData.countByRange[countRange]++;
        
        // Update performance by count
        const performance = this.countingData.performanceByCount[countRange];
        performance.hands++;
        performance.totalWagered += betAmount;
        performance.totalWon += payout;
        
        if (result === 'win') {
            performance.wins++;
        }
        
        // Update max/min counts
        this.countingData.maxTrueCount = Math.max(this.countingData.maxTrueCount, trueCount);
        this.countingData.minTrueCount = Math.min(this.countingData.minTrueCount, trueCount);
        
        // Create count record
        const countRecord = {
            handNumber: this.countingData.totalCountingHands,
            timestamp: new Date(),
            trueCount,
            countRange,
            betAmount,
            result,
            payout,
            netResult: payout - betAmount,
            estimatedCount,
            actualCount
        };
        
        this.countHistory.push(countRecord);
        
        // Record counting accuracy if provided
        if (estimatedCount !== undefined && actualCount !== undefined) {
            this.recordCountingAccuracy(estimatedCount, actualCount, trueCount);
        }
        
        // Maintain history size
        if (this.countHistory.length > this.maxHistorySize) {
            this.countHistory.shift();
        }
        
        // Update derived statistics
        this.updateCountingStatistics();
        
        console.log(`🧮 Counting hand recorded: TC=${trueCount.toFixed(1)}, Bet=$${betAmount}, ${result.toUpperCase()}`);
        
        return countRecord;
    }

    /**
     * Record betting decision for analysis
     */
    recordBettingDecision(bettingData) {
        const {
            betAmount,
            recommendedBet,
            trueCount,
            bankroll,
            advantage,
            kellyBet
        } = bettingData;

        const bettingRecord = {
            timestamp: new Date(),
            betAmount,
            recommendedBet,
            trueCount,
            bankroll,
            advantage,
            kellyBet,
            bettingAccuracy: this.calculateBettingAccuracy(betAmount, recommendedBet),
            isOptimal: Math.abs(betAmount - recommendedBet) <= (recommendedBet * 0.1) // Within 10%
        };

        this.bettingHistory.push(bettingRecord);

        // Maintain betting history size
        if (this.bettingHistory.length > this.maxHistorySize) {
            this.bettingHistory.shift();
        }

        // Update betting correlation
        this.updateBettingCorrelation();

        return bettingRecord;
    }

    /**
     * Record counting accuracy for practice mode
     */
    recordCountingAccuracy(estimatedCount, actualCount, trueCount) {
        const deviation = Math.abs(estimatedCount - actualCount);
        const countRange = this.getCountRange(trueCount);

        const mistake = {
            timestamp: new Date(),
            estimatedCount,
            actualCount,
            trueCount,
            deviation,
            countRange,
            handNumber: this.countingData.totalCountingHands
        };

        this.countingData.countingMistakes.push(mistake);

        // Keep only last 100 mistakes
        if (this.countingData.countingMistakes.length > 100) {
            this.countingData.countingMistakes.shift();
        }

        // Update accuracy by range
        if (!this.countingData.accuracyByRange[countRange]) {
            this.countingData.accuracyByRange[countRange] = {
                total: 0,
                correct: 0,
                averageDeviation: 0
            };
        }

        const rangeData = this.countingData.accuracyByRange[countRange];
        rangeData.total++;
        
        if (deviation === 0) {
            rangeData.correct++;
        }
        
        // Update average deviation for this range
        rangeData.averageDeviation = (rangeData.averageDeviation * (rangeData.total - 1) + deviation) / rangeData.total;

        this.updateCountAccuracy();
    }

    /**
     * Update overall counting accuracy
     */
    updateCountAccuracy() {
        if (this.countingData.countingMistakes.length === 0) return;

        const recentMistakes = this.countingData.countingMistakes.slice(-50); // Last 50 counts
        const totalDeviations = recentMistakes.reduce((sum, mistake) => sum + mistake.deviation, 0);
        
        this.countingData.averageDeviation = totalDeviations / recentMistakes.length;
        
        // Calculate accuracy percentage (perfect count = 100%, off by 1 = 90%, etc.)
        const accuracyScores = recentMistakes.map(mistake => {
            if (mistake.deviation === 0) return 100;
            if (mistake.deviation === 1) return 90;
            if (mistake.deviation === 2) return 75;
            if (mistake.deviation === 3) return 60;
            return Math.max(0, 50 - (mistake.deviation - 3) * 10);
        });
        
        this.countingData.countAccuracy = accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length;
    }

    /**
     * Update betting correlation with count
     */
    updateBettingCorrelation() {
        if (this.bettingHistory.length < 10) return;

        const recentBets = this.bettingHistory.slice(-50);
        
        // Calculate correlation between true count and bet amount
        const counts = recentBets.map(bet => bet.trueCount);
        const bets = recentBets.map(bet => bet.betAmount);
        
        const correlation = this.calculateCorrelation(counts, bets);
        this.countingData.bettingCorrelation = Math.max(0, correlation * 100);
    }

    /**
     * Calculate correlation coefficient
     */
    calculateCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
        const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Calculate betting accuracy score
     */
    calculateBettingAccuracy(actualBet, recommendedBet) {
        if (recommendedBet === 0) return actualBet === 0 ? 100 : 0;
        
        const ratio = actualBet / recommendedBet;
        if (ratio >= 0.9 && ratio <= 1.1) return 100; // Within 10%
        if (ratio >= 0.8 && ratio <= 1.2) return 85;  // Within 20%
        if (ratio >= 0.7 && ratio <= 1.3) return 70;  // Within 30%
        return Math.max(0, 50 - Math.abs(ratio - 1) * 50);
    }

    /**
     * Get count range for statistics grouping
     */
    getCountRange(trueCount) {
        if (trueCount <= -4) return '-4';
        if (trueCount <= -3) return '-3';
        if (trueCount <= -2) return '-2';
        if (trueCount <= -1) return '-1';
        if (trueCount < 1) return '0';
        if (trueCount < 2) return '1';
        if (trueCount < 3) return '2';
        if (trueCount < 4) return '3';
        if (trueCount < 5) return '4';
        return '5+';
    }

    /**
     * Update overall counting statistics
     */
    updateCountingStatistics() {
        if (this.countHistory.length === 0) return;

        const counts = this.countHistory.map(record => record.trueCount);
        
        // Calculate average count
        this.countingData.averageCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        
        // Calculate count variance
        const avgCount = this.countingData.averageCount;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
        this.countingData.countVariance = variance;
    }

    /**
     * Get comprehensive counting statistics
     */
    getCountingStats() {
        return {
            totalHands: this.countingData.totalCountingHands,
            countAccuracy: Math.round(this.countingData.countAccuracy * 100) / 100,
            averageDeviation: Math.round(this.countingData.averageDeviation * 100) / 100,
            bettingCorrelation: Math.round(this.countingData.bettingCorrelation * 100) / 100,
            
            countRanges: { ...this.countingData.countByRange },
            performanceByCount: this.getPerformanceByCount(),
            accuracyByRange: this.getAccuracyByRange(),
            
            countDistribution: {
                averageCount: Math.round(this.countingData.averageCount * 100) / 100,
                variance: Math.round(this.countingData.countVariance * 100) / 100,
                maxCount: this.countingData.maxTrueCount,
                minCount: this.countingData.minTrueCount,
                range: this.countingData.maxTrueCount - this.countingData.minTrueCount
            },
            
            recentPerformance: this.getRecentCountingPerformance()
        };
    }

    /**
     * Get performance statistics by count range
     */
    getPerformanceByCount() {
        const performance = {};
        
        Object.entries(this.countingData.performanceByCount).forEach(([range, data]) => {
            if (data.hands > 0) {
                performance[range] = {
                    hands: data.hands,
                    wins: data.wins,
                    winRate: Math.round((data.wins / data.hands) * 100 * 100) / 100,
                    averageBet: Math.round((data.totalWagered / data.hands) * 100) / 100,
                    netResult: data.totalWon - data.totalWagered,
                    profitPerHand: Math.round(((data.totalWon - data.totalWagered) / data.hands) * 100) / 100,
                    expectedEV: this.expectedEV[range] || 0
                };
            } else {
                performance[range] = {
                    hands: 0,
                    wins: 0,
                    winRate: 0,
                    averageBet: 0,
                    netResult: 0,
                    profitPerHand: 0,
                    expectedEV: this.expectedEV[range] || 0
                };
            }
        });
        
        return performance;
    }

    /**
     * Get counting accuracy by range
     */
    getAccuracyByRange() {
        const accuracy = {};
        
        Object.entries(this.countingData.accuracyByRange).forEach(([range, data]) => {
            if (data.total > 0) {
                accuracy[range] = {
                    total: data.total,
                    correct: data.correct,
                    accuracy: Math.round((data.correct / data.total) * 100 * 100) / 100,
                    averageDeviation: Math.round(data.averageDeviation * 100) / 100
                };
            }
        });
        
        return accuracy;
    }

    /**
     * Get recent counting performance trend
     */
    getRecentCountingPerformance(hands = 25) {
        if (this.countHistory.length === 0) return null;
        
        const recentHands = this.countHistory.slice(-hands);
        const wins = recentHands.filter(hand => hand.result === 'win').length;
        const totalWagered = recentHands.reduce((sum, hand) => sum + hand.betAmount, 0);
        const totalWon = recentHands.reduce((sum, hand) => sum + hand.payout, 0);
        
        return {
            hands: recentHands.length,
            wins,
            winRate: Math.round((wins / recentHands.length) * 100 * 100) / 100,
            netResult: totalWon - totalWagered,
            averageCount: Math.round((recentHands.reduce((sum, hand) => sum + hand.trueCount, 0) / recentHands.length) * 100) / 100,
            profitPerHand: Math.round(((totalWon - totalWagered) / recentHands.length) * 100) / 100
        };
    }

    /**
     * Get betting efficiency analysis
     */
    getBettingEfficiency() {
        if (this.bettingHistory.length === 0) return null;
        
        const recentBets = this.bettingHistory.slice(-50);
        const optimalBets = recentBets.filter(bet => bet.isOptimal).length;
        const averageAccuracy = recentBets.reduce((sum, bet) => sum + bet.bettingAccuracy, 0) / recentBets.length;
        
        return {
            totalDecisions: recentBets.length,
            optimalBets,
            efficiency: Math.round((optimalBets / recentBets.length) * 100 * 100) / 100,
            averageAccuracy: Math.round(averageAccuracy * 100) / 100,
            correlation: this.countingData.bettingCorrelation
        };
    }

    /**
     * Get count learning progress
     */
    getCountLearningProgress() {
        if (this.countingData.countingMistakes.length === 0) return null;
        
        const chunkSize = Math.max(5, Math.floor(this.countingData.countingMistakes.length / 10));
        const progress = [];
        
        for (let i = 0; i < this.countingData.countingMistakes.length; i += chunkSize) {
            const chunk = this.countingData.countingMistakes.slice(i, i + chunkSize);
            const avgDeviation = chunk.reduce((sum, mistake) => sum + mistake.deviation, 0) / chunk.length;
            const perfectCounts = chunk.filter(mistake => mistake.deviation === 0).length;
            
            progress.push({
                range: `${i + 1}-${Math.min(i + chunkSize, this.countingData.countingMistakes.length)}`,
                attempts: chunk.length,
                averageDeviation: Math.round(avgDeviation * 100) / 100,
                perfectRate: Math.round((perfectCounts / chunk.length) * 100 * 100) / 100
            });
        }
        
        return progress;
    }

    /**
     * Get count distribution analysis
     */
    getCountDistribution() {
        const distribution = {};
        const total = Object.values(this.countingData.countByRange).reduce((sum, count) => sum + count, 0);
        
        Object.entries(this.countingData.countByRange).forEach(([range, count]) => {
            distribution[range] = {
                count,
                percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
            };
        });
        
        return {
            distribution,
            totalHands: total,
            favorableCounts: (distribution['2']?.count || 0) + (distribution['3']?.count || 0) + 
                           (distribution['4']?.count || 0) + (distribution['5+']?.count || 0),
            unfavorableCounts: (distribution['-4']?.count || 0) + (distribution['-3']?.count || 0) + 
                             (distribution['-2']?.count || 0) + (distribution['-1']?.count || 0)
        };
    }

    /**
     * Export counting analytics data
     */
    exportData() {
        return {
            countingData: { ...this.countingData },
            countHistory: [...this.countHistory],
            bettingHistory: [...this.bettingHistory],
            stats: this.getCountingStats(),
            exportTimestamp: new Date().toISOString()
        };
    }

    /**
     * Import counting analytics data
     */
    importData(importedData) {
        try {
            if (importedData.countingData) {
                this.countingData = { ...this.countingData, ...importedData.countingData };
            }
            
            if (importedData.countHistory) {
                this.countHistory = [...importedData.countHistory];
            }
            
            if (importedData.bettingHistory) {
                this.bettingHistory = [...importedData.bettingHistory];
            }
            
            this.updateCountingStatistics();
            this.updateBettingCorrelation();
            
            console.log('📥 Counting analytics data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import counting analytics data:', error);
            return false;
        }
    }

    /**
     * Reset all counting statistics
     */
    reset() {
        this.countingData = {
            totalCountingHands: 0,
            countAccuracy: 0,
            averageDeviation: 0,
            bettingCorrelation: 0,
            countByRange: {
                '-4': 0, '-3': 0, '-2': 0, '-1': 0, '0': 0,
                '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0
            },
            performanceByCount: {
                '-4': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-3': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-2': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '-1': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '0': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '1': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '2': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '3': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '4': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 },
                '5+': { hands: 0, wins: 0, totalWagered: 0, totalWon: 0 }
            },
            countingMistakes: [],
            accuracyByRange: {},
            maxTrueCount: 0,
            minTrueCount: 0,
            averageCount: 0,
            countVariance: 0
        };
        
        this.countHistory = [];
        this.bettingHistory = [];
        
        console.log('🔄 Counting analytics reset');
    }

    /**
     * Get real-time counting update
     */
    getRealTimeUpdate() {
        return {
            totalHands: this.countingData.totalCountingHands,
            countAccuracy: this.countingData.countAccuracy,
            averageDeviation: this.countingData.averageDeviation,
            bettingCorrelation: this.countingData.bettingCorrelation,
            recentPerformance: this.getRecentCountingPerformance(10),
            currentCountRange: this.countHistory.length > 0 ? 
                this.countHistory[this.countHistory.length - 1].countRange : '0'
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.countHistory = [];
        this.bettingHistory = [];
        console.log('🧹 CountingAnalytics cleaned up');
    }
}