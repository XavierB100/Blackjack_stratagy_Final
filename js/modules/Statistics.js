/**
 * Statistics - Refactored coordinator using specialized analytics modules
 * Reduced from 717 lines by extracting SessionStats, StrategyAnalytics, CountingAnalytics, and DataPersistence
 * Now focuses on coordination and providing unified interface
 */

import { SessionStats } from '../statistics/SessionStats.js';
import { StrategyAnalytics } from '../statistics/StrategyAnalytics.js';
import { CountingAnalytics } from '../statistics/CountingAnalytics.js';
import { DataPersistence } from '../statistics/DataPersistence.js';

export class Statistics {
    constructor() {
        // Initialize specialized modules
        this.sessionStats = new SessionStats();
        this.strategyAnalytics = new StrategyAnalytics();
        this.countingAnalytics = new CountingAnalytics();
        this.dataPersistence = new DataPersistence();
        
        // Legacy card count support (for backward compatibility)
        this.cardCount = {
            running: 0,
            true: 0,
            decksRemaining: 6
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize statistics module
     */
    async init() {
        try {
            console.log('📊 Initializing Statistics (Optimized)...');
            
            // Initialize all modules
            this.sessionStats.init();
            this.strategyAnalytics.init();
            this.countingAnalytics.init();
            this.dataPersistence.init();
            
            // Load saved statistics
            this.loadAllStatistics();
            
            this.isInitialized = true;
            console.log('✅ Statistics initialized with modular architecture');
        } catch (error) {
            console.error('❌ Failed to initialize Statistics:', error);
            throw error;
        }
    }

    // ===== SESSION STATISTICS (delegated to SessionStats) =====

    /**
     * Start a new session
     */
    startNewSession(initialBank = 1000) {
        const sessionId = this.sessionStats.startNewSession(initialBank);
        this.saveStatistics();
        return sessionId;
    }

    /**
     * Record a completed hand
     */
    recordHand(handData) {
        const success = this.sessionStats.recordHand(handData);
        if (success) {
            this.saveStatistics();
        }
        return success;
    }

    /**
     * Update bank amount
     */
    updateBank(amount) {
        const newAmount = this.sessionStats.updateBank(amount);
        this.saveStatistics();
        return newAmount;
    }

    /**
     * Get current statistics
     */
    getStats() {
        return this.sessionStats.getSessionStats();
    }

    /**
     * Get bank amount
     */
    getBankAmount() {
        return this.sessionStats.sessionData.bankAmount;
    }

    /**
     * Get hands played
     */
    getHandsPlayed() {
        return this.sessionStats.sessionData.handsPlayed;
    }

    /**
     * Get wins
     */
    getWins() {
        return this.sessionStats.sessionData.wins;
    }

    // ===== STRATEGY ANALYTICS (delegated to StrategyAnalytics) =====

    /**
     * Record strategy decision for accuracy tracking
     */
    recordStrategyDecision(playerAction, recommendedAction, handType = 'hard', additionalData = {}) {
        const decisionData = {
            playerAction,
            recommendedAction,
            handType,
            ...additionalData
        };
        
        const record = this.strategyAnalytics.recordDecision(decisionData);
        this.saveStatistics();
        return record;
    }

    /**
     * Get strategy accuracy statistics
     */
    getStrategyStats() {
        return this.strategyAnalytics.getStrategyStats();
    }

    /**
     * Get strategy improvement recommendations
     */
    getStrategyRecommendations() {
        return this.strategyAnalytics.getImprovementRecommendations();
    }

    // ===== COUNTING ANALYTICS (delegated to CountingAnalytics) =====

    /**
     * Record card counting statistics for a hand
     */
    recordCountingHand(handData) {
        const record = this.countingAnalytics.recordCountingHand(handData);
        this.saveStatistics();
        return record;
    }

    /**
     * Record betting decision for analysis
     */
    recordBettingDecision(bettingData) {
        const record = this.countingAnalytics.recordBettingDecision(bettingData);
        this.saveStatistics();
        return record;
    }

    /**
     * Get counting statistics
     */
    getCountingStats() {
        return this.countingAnalytics.getCountingStats();
    }

    // ===== CARD COUNT MANAGEMENT (Legacy Support) =====

    /**
     * Update card count (Hi-Lo system)
     */
    updateCardCount(card) {
        const countValue = card.getHiLoValue ? card.getHiLoValue() : 0;
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
     * Get card count data
     */
    getCardCount() {
        return { ...this.cardCount };
    }

    // ===== COMPREHENSIVE ANALYTICS =====

    /**
     * Get detailed statistics for analysis
     */
    getDetailedStats() {
        return {
            session: this.sessionStats.getSessionSummary(),
            strategy: this.strategyAnalytics.getStrategyStats(),
            counting: this.countingAnalytics.getCountingStats(),
            recommendations: {
                strategy: this.strategyAnalytics.getImprovementRecommendations(),
                counting: this.countingAnalytics.getBettingEfficiency()
            }
        };
    }

    /**
     * Get real-time statistics update
     */
    getRealTimeUpdate() {
        return {
            session: this.sessionStats.getRealTimeUpdate(),
            strategy: this.strategyAnalytics.getRealTimeUpdate(),
            counting: this.countingAnalytics.getRealTimeUpdate()
        };
    }

    /**
     * Get performance analytics
     */
    getPerformanceAnalytics() {
        const sessionSummary = this.sessionStats.getSessionSummary();
        const strategyStats = this.strategyAnalytics.getStrategyStats();
        const countingStats = this.countingAnalytics.getCountingStats();
        
        return {
            overall: {
                handsPlayed: sessionSummary.performance.handsPlayed,
                winRate: sessionSummary.performance.winRate,
                netGain: sessionSummary.performance.netGain,
                profitPerHour: sessionSummary.performance.profitPerHour,
                sessionHealth: this.sessionStats.getSessionHealth()
            },
            strategy: {
                overallAccuracy: strategyStats.overallAccuracy,
                grade: strategyStats.grade,
                totalDecisions: strategyStats.totalDecisions,
                recentTrend: this.strategyAnalytics.getRecentTrend(),
                topWeakness: this.strategyAnalytics.getImprovementRecommendations()[0]
            },
            counting: {
                countAccuracy: countingStats.countAccuracy,
                bettingCorrelation: countingStats.bettingCorrelation,
                totalHands: countingStats.totalHands,
                recentPerformance: countingStats.recentPerformance
            }
        };
    }

    // ===== DATA PERSISTENCE (delegated to DataPersistence) =====

    /**
     * Save all statistics
     */
    saveStatistics() {
        if (!this.isInitialized) return;
        
        this.dataPersistence.saveAllData(
            this.sessionStats,
            this.strategyAnalytics,
            this.countingAnalytics
        );
    }

    /**
     * Load all statistics
     */
    loadAllStatistics() {
        const data = this.dataPersistence.loadAllData();
        
        // Load session data
        if (data.session) {
            this.sessionStats.importSessionData(data.session);
        }
        
        // Load strategy data
        if (data.strategy) {
            this.strategyAnalytics.importData(data.strategy);
        }
        
        // Load counting data
        if (data.counting) {
            this.countingAnalytics.importData(data.counting);
        }
        
        console.log('📋 All statistics loaded from storage');
    }

    /**
     * Export all data for backup/sharing
     */
    exportAllData() {
        return {
            exportInfo: {
                timestamp: new Date().toISOString(),
                version: '1.0',
                source: 'BlackjackPro Statistics (Optimized)'
            },
            session: this.sessionStats.exportSessionData(),
            strategy: this.strategyAnalytics.exportData(),
            counting: this.countingAnalytics.exportData()
        };
    }

    /**
     * Import data from backup/sharing
     */
    importAllData(importData) {
        try {
            if (importData.session) {
                this.sessionStats.importSessionData(importData.session);
            }
            
            if (importData.strategy) {
                this.strategyAnalytics.importData(importData.strategy);
            }
            
            if (importData.counting) {
                this.countingAnalytics.importData(importData.counting);
            }
            
            this.saveStatistics();
            console.log('📥 All data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import data:', error);
            return false;
        }
    }

    /**
     * Create backup
     */
    createBackup() {
        return this.dataPersistence.createBackup();
    }

    /**
     * Restore from backup
     */
    restoreFromBackup() {
        const success = this.dataPersistence.restoreFromBackup();
        if (success) {
            this.loadAllStatistics();
        }
        return success;
    }

    /**
     * Get storage information
     */
    getStorageInfo() {
        return this.dataPersistence.getStorageInfo();
    }

    // ===== UTILITY METHODS =====

    /**
     * Reset all statistics
     */
    resetAllStats() {
        this.sessionStats.reset();
        this.strategyAnalytics.reset();
        this.countingAnalytics.reset();
        this.resetCardCount();
        
        this.saveStatistics();
        console.log('🔄 All statistics reset');
    }

    /**
     * Validate statistics integrity
     */
    validateData() {
        return this.dataPersistence.checkDataIntegrity();
    }

    /**
     * Get module references for advanced usage
     */
    getModules() {
        return {
            session: this.sessionStats,
            strategy: this.strategyAnalytics,
            counting: this.countingAnalytics,
            persistence: this.dataPersistence
        };
    }

    /**
     * Configure auto-save settings
     */
    configureAutoSave(enabled, interval = 30000) {
        this.dataPersistence.configureAutoSave(enabled, interval);
    }

    /**
     * Get comprehensive statistics summary
     */
    getStatsSummary() {
        const performance = this.getPerformanceAnalytics();
        const detailed = this.getDetailedStats();
        
        return {
            summary: {
                handsPlayed: performance.overall.handsPlayed,
                winRate: performance.overall.winRate,
                netGain: performance.overall.netGain,
                bankAmount: this.getBankAmount(),
                strategyAccuracy: performance.strategy.overallAccuracy,
                strategyGrade: performance.strategy.grade,
                countAccuracy: performance.counting.countAccuracy || 0
            },
            performance,
            detailed,
            recommendations: detailed.recommendations,
            health: performance.overall.sessionHealth
        };
    }

    /**
     * Check if statistics are ready
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            modules: {
                session: this.sessionStats.isActive,
                strategy: this.strategyAnalytics.strategyData.totalDecisions,
                counting: this.countingAnalytics.countingData.totalCountingHands
            },
            storage: this.getStorageInfo(),
            validation: this.validateData()
        };
    }

    /**
     * Emergency data save
     */
    emergencySave() {
        try {
            this.saveStatistics();
            this.createBackup();
            console.log('🚨 Emergency save completed');
            return true;
        } catch (error) {
            console.error('❌ Emergency save failed:', error);
            return false;
        }
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        console.log('🧹 Cleaning up Statistics...');
        
        // Save final state
        this.saveStatistics();
        
        // Cleanup modules
        this.sessionStats.cleanup();
        this.strategyAnalytics.cleanup();
        this.countingAnalytics.cleanup();
        this.dataPersistence.cleanup();
        
        this.isInitialized = false;
        
        console.log('✅ Statistics cleanup complete');
    }
}