/**
 * StrategyAnalytics - Tracks and analyzes strategy decision accuracy
 * Extracted from Statistics.js for better organization
 */

export class StrategyAnalytics {
    constructor() {
        this.strategyData = {
            totalDecisions: 0,
            correctDecisions: 0,
            
            // Decision tracking by action type
            decisionsByType: {
                hit: { total: 0, correct: 0 },
                stand: { total: 0, correct: 0 },
                double: { total: 0, correct: 0 },
                split: { total: 0, correct: 0 },
                insurance: { total: 0, correct: 0 }
            },
            
            // Decision tracking by hand type
            decisionsByHandType: {
                hard: { total: 0, correct: 0 },
                soft: { total: 0, correct: 0 },
                pair: { total: 0, correct: 0 }
            },
            
            // Decision tracking by dealer up card
            decisionsByDealerCard: {
                'A': { total: 0, correct: 0 },
                '2': { total: 0, correct: 0 },
                '3': { total: 0, correct: 0 },
                '4': { total: 0, correct: 0 },
                '5': { total: 0, correct: 0 },
                '6': { total: 0, correct: 0 },
                '7': { total: 0, correct: 0 },
                '8': { total: 0, correct: 0 },
                '9': { total: 0, correct: 0 },
                '10': { total: 0, correct: 0 }
            },
            
            // Specific scenario tracking
            commonMistakes: [],
            improvementAreas: [],
            strongSituations: []
        };
        
        this.decisionHistory = [];
        this.maxHistorySize = 200;
        
        // Performance thresholds
        this.thresholds = {
            excellent: 98,
            good: 90,
            fair: 80,
            poor: 70
        };
    }

    /**
     * Initialize strategy analytics
     */
    init() {
        console.log('🎯 StrategyAnalytics initialized');
    }

    /**
     * Record a strategy decision
     */
    recordDecision(decisionData) {
        const {
            playerAction,
            recommendedAction,
            handType = 'hard',
            dealerUpCard = '10',
            playerValue,
            canDouble = false,
            canSplit = false,
            confidence = 'medium'
        } = decisionData;

        const isCorrect = this.normalizeAction(playerAction) === this.normalizeAction(recommendedAction);
        
        // Update overall stats
        this.strategyData.totalDecisions++;
        if (isCorrect) {
            this.strategyData.correctDecisions++;
        }

        // Update by action type
        const actionKey = this.normalizeAction(playerAction);
        if (this.strategyData.decisionsByType[actionKey]) {
            this.strategyData.decisionsByType[actionKey].total++;
            if (isCorrect) {
                this.strategyData.decisionsByType[actionKey].correct++;
            }
        }

        // Update by hand type
        if (this.strategyData.decisionsByHandType[handType]) {
            this.strategyData.decisionsByHandType[handType].total++;
            if (isCorrect) {
                this.strategyData.decisionsByHandType[handType].correct++;
            }
        }

        // Update by dealer card
        const dealerKey = dealerUpCard.toString();
        if (this.strategyData.decisionsByDealerCard[dealerKey]) {
            this.strategyData.decisionsByDealerCard[dealerKey].total++;
            if (isCorrect) {
                this.strategyData.decisionsByDealerCard[dealerKey].correct++;
            }
        }

        // Create decision record
        const decisionRecord = {
            timestamp: new Date(),
            playerAction,
            recommendedAction,
            isCorrect,
            handType,
            dealerUpCard,
            playerValue,
            canDouble,
            canSplit,
            confidence,
            scenario: this.createScenarioKey(handType, playerValue, dealerUpCard)
        };

        this.decisionHistory.push(decisionRecord);

        // Maintain history size
        if (this.decisionHistory.length > this.maxHistorySize) {
            this.decisionHistory.shift();
        }

        // Analyze mistakes and patterns
        if (!isCorrect) {
            this.analyzeMistake(decisionRecord);
        } else {
            this.analyzeStrengths(decisionRecord);
        }

        console.log(`🎯 Decision recorded: ${playerAction} ${isCorrect ? '✅' : '❌'} (${this.calculateOverallAccuracy().toFixed(1)}%)`);
        
        return decisionRecord;
    }

    /**
     * Normalize action strings for comparison
     */
    normalizeAction(action) {
        return action.toLowerCase()
            .replace(/\s+/g, '')
            .replace('doubledown', 'double')
            .replace('takeinsurance', 'insurance');
    }

    /**
     * Create scenario key for pattern analysis
     */
    createScenarioKey(handType, playerValue, dealerUpCard) {
        return `${handType}_${playerValue}_vs_${dealerUpCard}`;
    }

    /**
     * Analyze mistakes for pattern detection
     */
    analyzeMistake(decisionRecord) {
        const scenario = decisionRecord.scenario;
        const mistake = {
            scenario,
            playerAction: decisionRecord.playerAction,
            recommendedAction: decisionRecord.recommendedAction,
            timestamp: decisionRecord.timestamp,
            frequency: 1
        };

        // Check if this mistake pattern exists
        const existingMistake = this.strategyData.commonMistakes.find(m => 
            m.scenario === scenario && 
            m.playerAction === decisionRecord.playerAction &&
            m.recommendedAction === decisionRecord.recommendedAction
        );

        if (existingMistake) {
            existingMistake.frequency++;
            existingMistake.lastOccurrence = decisionRecord.timestamp;
        } else {
            this.strategyData.commonMistakes.push({
                ...mistake,
                lastOccurrence: decisionRecord.timestamp
            });
        }

        // Keep only top 10 most frequent mistakes
        this.strategyData.commonMistakes.sort((a, b) => b.frequency - a.frequency);
        if (this.strategyData.commonMistakes.length > 10) {
            this.strategyData.commonMistakes.length = 10;
        }
    }

    /**
     * Analyze strengths for reinforcement
     */
    analyzeStrengths(decisionRecord) {
        const scenario = decisionRecord.scenario;
        
        const strength = this.strategyData.strongSituations.find(s => s.scenario === scenario);
        if (strength) {
            strength.correctCount++;
        } else {
            this.strategyData.strongSituations.push({
                scenario,
                correctCount: 1,
                handType: decisionRecord.handType,
                dealerUpCard: decisionRecord.dealerUpCard,
                playerValue: decisionRecord.playerValue
            });
        }
    }

    /**
     * Calculate overall accuracy percentage
     */
    calculateOverallAccuracy() {
        if (this.strategyData.totalDecisions === 0) return 0;
        return (this.strategyData.correctDecisions / this.strategyData.totalDecisions) * 100;
    }

    /**
     * Calculate accuracy by action type
     */
    calculateActionAccuracy() {
        const actionAccuracy = {};
        
        Object.entries(this.strategyData.decisionsByType).forEach(([action, stats]) => {
            actionAccuracy[action] = stats.total > 0 ? 
                Math.round((stats.correct / stats.total) * 100 * 100) / 100 : 0;
        });
        
        return actionAccuracy;
    }

    /**
     * Calculate accuracy by hand type
     */
    calculateHandTypeAccuracy() {
        const handTypeAccuracy = {};
        
        Object.entries(this.strategyData.decisionsByHandType).forEach(([type, stats]) => {
            handTypeAccuracy[type] = stats.total > 0 ? 
                Math.round((stats.correct / stats.total) * 100 * 100) / 100 : 0;
        });
        
        return handTypeAccuracy;
    }

    /**
     * Calculate accuracy by dealer up card
     */
    calculateDealerCardAccuracy() {
        const dealerAccuracy = {};
        
        Object.entries(this.strategyData.decisionsByDealerCard).forEach(([card, stats]) => {
            dealerAccuracy[card] = stats.total > 0 ? 
                Math.round((stats.correct / stats.total) * 100 * 100) / 100 : 0;
        });
        
        return dealerAccuracy;
    }

    /**
     * Get accuracy grade based on percentage
     */
    getAccuracyGrade(accuracy) {
        if (accuracy >= this.thresholds.excellent) return 'A+';
        if (accuracy >= 95) return 'A';
        if (accuracy >= this.thresholds.good) return 'B+';
        if (accuracy >= 85) return 'B';
        if (accuracy >= this.thresholds.fair) return 'C+';
        if (accuracy >= 75) return 'C';
        if (accuracy >= this.thresholds.poor) return 'D+';
        if (accuracy >= 65) return 'D';
        return 'F';
    }

    /**
     * Get comprehensive strategy statistics
     */
    getStrategyStats() {
        const overallAccuracy = this.calculateOverallAccuracy();
        
        return {
            totalDecisions: this.strategyData.totalDecisions,
            correctDecisions: this.strategyData.correctDecisions,
            overallAccuracy: Math.round(overallAccuracy * 100) / 100,
            grade: this.getAccuracyGrade(overallAccuracy),
            actionAccuracy: this.calculateActionAccuracy(),
            handTypeAccuracy: this.calculateHandTypeAccuracy(),
            dealerCardAccuracy: this.calculateDealerCardAccuracy(),
            decisionsByType: this.strategyData.decisionsByType,
            decisionsByHandType: this.strategyData.decisionsByHandType,
            decisionsByDealerCard: this.strategyData.decisionsByDealerCard
        };
    }

    /**
     * Get improvement recommendations
     */
    getImprovementRecommendations() {
        const recommendations = [];
        const actionAccuracy = this.calculateActionAccuracy();
        const handTypeAccuracy = this.calculateHandTypeAccuracy();
        const dealerAccuracy = this.calculateDealerCardAccuracy();

        // Check action-specific weaknesses
        Object.entries(actionAccuracy).forEach(([action, accuracy]) => {
            if (accuracy < this.thresholds.fair && this.strategyData.decisionsByType[action].total >= 5) {
                recommendations.push({
                    type: 'action',
                    area: action,
                    accuracy,
                    priority: 'high',
                    message: `Focus on improving ${action.toUpperCase()} decisions (${accuracy.toFixed(1)}% accuracy)`
                });
            }
        });

        // Check hand type weaknesses
        Object.entries(handTypeAccuracy).forEach(([handType, accuracy]) => {
            if (accuracy < this.thresholds.fair && this.strategyData.decisionsByHandType[handType].total >= 5) {
                recommendations.push({
                    type: 'handType',
                    area: handType,
                    accuracy,
                    priority: 'medium',
                    message: `Practice ${handType} hand situations (${accuracy.toFixed(1)}% accuracy)`
                });
            }
        });

        // Check dealer card weaknesses
        Object.entries(dealerAccuracy).forEach(([card, accuracy]) => {
            if (accuracy < this.thresholds.fair && this.strategyData.decisionsByDealerCard[card].total >= 3) {
                recommendations.push({
                    type: 'dealerCard',
                    area: card,
                    accuracy,
                    priority: 'medium',
                    message: `Review basic strategy against dealer ${card} (${accuracy.toFixed(1)}% accuracy)`
                });
            }
        });

        // Sort by priority and accuracy
        recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return a.accuracy - b.accuracy;
        });

        return recommendations.slice(0, 5); // Top 5 recommendations
    }

    /**
     * Get most common mistakes
     */
    getCommonMistakes(limit = 5) {
        return this.strategyData.commonMistakes.slice(0, limit).map(mistake => ({
            ...mistake,
            description: this.describeMistake(mistake),
            suggestion: this.getSuggestionForMistake(mistake)
        }));
    }

    /**
     * Describe a mistake in human-readable format
     */
    describeMistake(mistake) {
        const [handType, playerValue, dealerPart] = mistake.scenario.split('_');
        const dealerCard = dealerPart.replace('vs_', '');
        
        return `${handType.toUpperCase()} ${playerValue} vs dealer ${dealerCard}: ` +
               `chose ${mistake.playerAction} instead of ${mistake.recommendedAction}`;
    }

    /**
     * Get suggestion for common mistake
     */
    getSuggestionForMistake(mistake) {
        const suggestions = {
            'hit_stand': 'Remember: when dealer shows weak cards (2-6), let them bust',
            'stand_hit': 'Be more aggressive with good hands against strong dealer cards',
            'hit_double': 'Look for doubling opportunities with favorable counts',
            'double_hit': 'Only double when you have the advantage and bankroll',
            'hit_split': 'Always split Aces and 8s, never split 10s or 5s',
            'split_hit': 'Consider the dealer up card before splitting'
        };
        
        const key = `${this.normalizeAction(mistake.playerAction)}_${this.normalizeAction(mistake.recommendedAction)}`;
        return suggestions[key] || 'Review basic strategy chart for this situation';
    }

    /**
     * Get recent performance trend
     */
    getRecentTrend(decisions = 20) {
        if (this.decisionHistory.length === 0) return null;
        
        const recentDecisions = this.decisionHistory.slice(-decisions);
        const correct = recentDecisions.filter(d => d.isCorrect).length;
        const accuracy = (correct / recentDecisions.length) * 100;
        
        // Compare with overall accuracy
        const overallAccuracy = this.calculateOverallAccuracy();
        const trend = accuracy > overallAccuracy ? 'improving' : 
                     accuracy < overallAccuracy ? 'declining' : 'stable';
        
        return {
            decisions: recentDecisions.length,
            correct,
            accuracy: Math.round(accuracy * 100) / 100,
            trend,
            comparison: Math.round((accuracy - overallAccuracy) * 100) / 100
        };
    }

    /**
     * Get session learning progress
     */
    getLearningProgress() {
        const chunkSize = Math.max(1, Math.floor(this.strategyData.totalDecisions / 10));
        const progress = [];
        
        for (let i = 0; i < this.decisionHistory.length; i += chunkSize) {
            const chunk = this.decisionHistory.slice(i, i + chunkSize);
            const correct = chunk.filter(d => d.isCorrect).length;
            const accuracy = chunk.length > 0 ? (correct / chunk.length) * 100 : 0;
            
            progress.push({
                range: `${i + 1}-${Math.min(i + chunkSize, this.decisionHistory.length)}`,
                decisions: chunk.length,
                accuracy: Math.round(accuracy * 100) / 100
            });
        }
        
        return progress;
    }

    /**
     * Export strategy analytics data
     */
    exportData() {
        return {
            strategyData: { ...this.strategyData },
            decisionHistory: [...this.decisionHistory],
            stats: this.getStrategyStats(),
            recommendations: this.getImprovementRecommendations(),
            exportTimestamp: new Date().toISOString()
        };
    }

    /**
     * Import strategy analytics data
     */
    importData(importedData) {
        try {
            if (importedData.strategyData) {
                this.strategyData = { ...this.strategyData, ...importedData.strategyData };
            }
            
            if (importedData.decisionHistory) {
                this.decisionHistory = [...importedData.decisionHistory];
            }
            
            console.log('📥 Strategy analytics data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import strategy analytics data:', error);
            return false;
        }
    }

    /**
     * Reset all strategy statistics
     */
    reset() {
        this.strategyData = {
            totalDecisions: 0,
            correctDecisions: 0,
            decisionsByType: {
                hit: { total: 0, correct: 0 },
                stand: { total: 0, correct: 0 },
                double: { total: 0, correct: 0 },
                split: { total: 0, correct: 0 },
                insurance: { total: 0, correct: 0 }
            },
            decisionsByHandType: {
                hard: { total: 0, correct: 0 },
                soft: { total: 0, correct: 0 },
                pair: { total: 0, correct: 0 }
            },
            decisionsByDealerCard: {
                'A': { total: 0, correct: 0 },
                '2': { total: 0, correct: 0 },
                '3': { total: 0, correct: 0 },
                '4': { total: 0, correct: 0 },
                '5': { total: 0, correct: 0 },
                '6': { total: 0, correct: 0 },
                '7': { total: 0, correct: 0 },
                '8': { total: 0, correct: 0 },
                '9': { total: 0, correct: 0 },
                '10': { total: 0, correct: 0 }
            },
            commonMistakes: [],
            improvementAreas: [],
            strongSituations: []
        };
        
        this.decisionHistory = [];
        console.log('🔄 Strategy analytics reset');
    }

    /**
     * Get real-time strategy update
     */
    getRealTimeUpdate() {
        return {
            totalDecisions: this.strategyData.totalDecisions,
            overallAccuracy: this.calculateOverallAccuracy(),
            grade: this.getAccuracyGrade(this.calculateOverallAccuracy()),
            recentTrend: this.getRecentTrend(),
            topWeakness: this.getImprovementRecommendations()[0] || null
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.decisionHistory = [];
        console.log('🧹 StrategyAnalytics cleaned up');
    }
}