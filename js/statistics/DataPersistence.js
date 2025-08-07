/**
 * DataPersistence - Handles saving and loading of statistics data
 * Extracted from Statistics.js for better organization
 */

export class DataPersistence {
    constructor() {
        this.storageKeys = {
            session: 'blackjackpro_session',
            strategy: 'blackjackpro_strategy',
            counting: 'blackjackpro_counting',
            settings: 'blackjackpro_settings',
            backup: 'blackjackpro_backup'
        };
        
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        
        this.compressionEnabled = true;
        this.encryptionEnabled = false; // For future enhancement
        
        this.isInitialized = false;
    }

    /**
     * Initialize data persistence
     */
    init() {
        // Check localStorage availability
        if (!this.isStorageAvailable()) {
            console.warn('⚠️ localStorage not available - data will not persist');
            return false;
        }
        
        // Start auto-save if enabled
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
        
        this.isInitialized = true;
        console.log('💾 DataPersistence initialized');
        return true;
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = 'test_storage';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save session statistics
     */
    saveSessionData(sessionStats) {
        try {
            const data = {
                ...sessionStats.exportSessionData(),
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            return this.saveToStorage(this.storageKeys.session, data);
        } catch (error) {
            console.error('❌ Failed to save session data:', error);
            return false;
        }
    }

    /**
     * Load session statistics
     */
    loadSessionData() {
        try {
            const data = this.loadFromStorage(this.storageKeys.session);
            
            if (data && data.sessionData) {
                console.log('📋 Session data loaded from storage');
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Failed to load session data:', error);
            return null;
        }
    }

    /**
     * Save strategy analytics
     */
    saveStrategyData(strategyAnalytics) {
        try {
            const data = {
                ...strategyAnalytics.exportData(),
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            return this.saveToStorage(this.storageKeys.strategy, data);
        } catch (error) {
            console.error('❌ Failed to save strategy data:', error);
            return false;
        }
    }

    /**
     * Load strategy analytics
     */
    loadStrategyData() {
        try {
            const data = this.loadFromStorage(this.storageKeys.strategy);
            
            if (data && data.strategyData) {
                console.log('📋 Strategy data loaded from storage');
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Failed to load strategy data:', error);
            return null;
        }
    }

    /**
     * Save counting analytics
     */
    saveCountingData(countingAnalytics) {
        try {
            const data = {
                ...countingAnalytics.exportData(),
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            return this.saveToStorage(this.storageKeys.counting, data);
        } catch (error) {
            console.error('❌ Failed to save counting data:', error);
            return false;
        }
    }

    /**
     * Load counting analytics
     */
    loadCountingData() {
        try {
            const data = this.loadFromStorage(this.storageKeys.counting);
            
            if (data && data.countingData) {
                console.log('📋 Counting data loaded from storage');
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Failed to load counting data:', error);
            return null;
        }
    }

    /**
     * Save all statistics data
     */
    saveAllData(sessionStats, strategyAnalytics, countingAnalytics) {
        const results = {
            session: false,
            strategy: false,
            counting: false
        };
        
        if (sessionStats) {
            results.session = this.saveSessionData(sessionStats);
        }
        
        if (strategyAnalytics) {
            results.strategy = this.saveStrategyData(strategyAnalytics);
        }
        
        if (countingAnalytics) {
            results.counting = this.saveCountingData(countingAnalytics);
        }
        
        const allSaved = Object.values(results).every(result => result);
        
        if (allSaved) {
            console.log('✅ All statistics data saved successfully');
        } else {
            console.warn('⚠️ Some statistics data failed to save:', results);
        }
        
        return results;
    }

    /**
     * Load all statistics data
     */
    loadAllData() {
        return {
            session: this.loadSessionData(),
            strategy: this.loadStrategyData(),
            counting: this.loadCountingData()
        };
    }

    /**
     * Create complete backup of all data
     */
    createBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                session: this.loadFromStorage(this.storageKeys.session),
                strategy: this.loadFromStorage(this.storageKeys.strategy),
                counting: this.loadFromStorage(this.storageKeys.counting),
                settings: this.loadFromStorage(this.storageKeys.settings)
            };
            
            const success = this.saveToStorage(this.storageKeys.backup, backupData);
            
            if (success) {
                console.log('📦 Complete backup created');
            }
            
            return success;
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            return false;
        }
    }

    /**
     * Restore from backup
     */
    restoreFromBackup() {
        try {
            const backupData = this.loadFromStorage(this.storageKeys.backup);
            
            if (!backupData) {
                console.warn('⚠️ No backup data found');
                return false;
            }
            
            let restoredCount = 0;
            
            // Restore each data type
            if (backupData.session) {
                this.saveToStorage(this.storageKeys.session, backupData.session);
                restoredCount++;
            }
            
            if (backupData.strategy) {
                this.saveToStorage(this.storageKeys.strategy, backupData.strategy);
                restoredCount++;
            }
            
            if (backupData.counting) {
                this.saveToStorage(this.storageKeys.counting, backupData.counting);
                restoredCount++;
            }
            
            if (backupData.settings) {
                this.saveToStorage(this.storageKeys.settings, backupData.settings);
                restoredCount++;
            }
            
            console.log(`📥 Restored ${restoredCount} data sets from backup (${backupData.timestamp})`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to restore from backup:', error);
            return false;
        }
    }

    /**
     * Export all data as downloadable JSON
     */
    exportToFile() {
        try {
            const exportData = {
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    source: 'BlackjackPro Statistics'
                },
                session: this.loadFromStorage(this.storageKeys.session),
                strategy: this.loadFromStorage(this.storageKeys.strategy),
                counting: this.loadFromStorage(this.storageKeys.counting),
                settings: this.loadFromStorage(this.storageKeys.settings)
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('❌ Failed to export data:', error);
            return null;
        }
    }

    /**
     * Import data from JSON string
     */
    importFromFile(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (!importData.exportInfo) {
                throw new Error('Invalid export format');
            }
            
            let importedCount = 0;
            
            // Import each data type
            if (importData.session) {
                this.saveToStorage(this.storageKeys.session, importData.session);
                importedCount++;
            }
            
            if (importData.strategy) {
                this.saveToStorage(this.storageKeys.strategy, importData.strategy);
                importedCount++;
            }
            
            if (importData.counting) {
                this.saveToStorage(this.storageKeys.counting, importData.counting);
                importedCount++;
            }
            
            if (importData.settings) {
                this.saveToStorage(this.storageKeys.settings, importData.settings);
                importedCount++;
            }
            
            console.log(`📥 Imported ${importedCount} data sets from file`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to import data from file:', error);
            return false;
        }
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('🗑️ All stored data cleared');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isStorageAvailable()) {
            return { available: false };
        }
        
        try {
            const info = {
                available: true,
                totalItems: 0,
                totalSize: 0,
                itemSizes: {}
            };
            
            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                if (data) {
                    const size = new Blob([data]).size;
                    info.itemSizes[name] = {
                        key,
                        size,
                        sizeFormatted: this.formatBytes(size),
                        lastModified: this.getLastModified(data)
                    };
                    info.totalSize += size;
                    info.totalItems++;
                }
            });
            
            info.totalSizeFormatted = this.formatBytes(info.totalSize);
            info.storageQuota = this.getStorageQuota();
            
            return info;
        } catch (error) {
            console.error('❌ Failed to get storage info:', error);
            return { available: false, error: error.message };
        }
    }

    /**
     * Get last modified timestamp from stored data
     */
    getLastModified(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            return data.lastSaved || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get storage quota information
     */
    getStorageQuota() {
        try {
            // Modern browsers
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                return navigator.storage.estimate().then(estimate => ({
                    quota: estimate.quota,
                    usage: estimate.usage,
                    quotaFormatted: this.formatBytes(estimate.quota || 0),
                    usageFormatted: this.formatBytes(estimate.usage || 0)
                }));
            }
            
            // Fallback estimation
            return Promise.resolve({
                quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
                usage: null,
                quotaFormatted: '5 MB (estimated)',
                usageFormatted: 'Unknown'
            });
        } catch (error) {
            return Promise.resolve({
                quota: null,
                usage: null,
                quotaFormatted: 'Unknown',
                usageFormatted: 'Unknown'
            });
        }
    }

    /**
     * Save data to localStorage with optional compression
     */
    saveToStorage(key, data) {
        try {
            let jsonString = JSON.stringify(data);
            
            // Apply compression if enabled (simple implementation)
            if (this.compressionEnabled) {
                jsonString = this.compressData(jsonString);
            }
            
            localStorage.setItem(key, jsonString);
            return true;
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('💾 Storage quota exceeded');
                this.handleQuotaExceeded();
            } else {
                console.error('❌ Failed to save to storage:', error);
            }
            return false;
        }
    }

    /**
     * Load data from localStorage with decompression
     */
    loadFromStorage(key) {
        try {
            let jsonString = localStorage.getItem(key);
            
            if (!jsonString) {
                return null;
            }
            
            // Apply decompression if needed
            if (this.compressionEnabled) {
                jsonString = this.decompressData(jsonString);
            }
            
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('❌ Failed to load from storage:', error);
            return null;
        }
    }

    /**
     * Simple data compression (placeholder for future enhancement)
     */
    compressData(data) {
        // This is a placeholder for actual compression
        // Could implement LZ-string or similar library
        return data;
    }

    /**
     * Simple data decompression (placeholder for future enhancement)
     */
    decompressData(data) {
        // This is a placeholder for actual decompression
        return data;
    }

    /**
     * Handle storage quota exceeded
     */
    handleQuotaExceeded() {
        console.warn('⚠️ Storage quota exceeded, attempting cleanup...');
        
        // Remove backup data first as it's least critical
        try {
            localStorage.removeItem(this.storageKeys.backup);
            console.log('🗑️ Backup data cleared to free space');
        } catch (error) {
            console.error('❌ Failed to clear backup data:', error);
        }
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            // This will be called by the Statistics class
            console.log('🔄 Auto-save triggered');
        }, this.autoSaveInterval);
        
        console.log(`⏰ Auto-save started (${this.autoSaveInterval / 1000}s interval)`);
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ Auto-save stopped');
        }
    }

    /**
     * Configure auto-save settings
     */
    configureAutoSave(enabled, interval = 30000) {
        this.autoSaveEnabled = enabled;
        this.autoSaveInterval = Math.max(5000, interval); // Minimum 5 seconds
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
        
        console.log(`⚙️ Auto-save configured: ${enabled ? 'enabled' : 'disabled'} (${this.autoSaveInterval / 1000}s)`);
    }

    /**
     * Check data integrity
     */
    checkDataIntegrity() {
        const results = {
            session: this.validateData(this.loadSessionData()),
            strategy: this.validateData(this.loadStrategyData()),
            counting: this.validateData(this.loadCountingData()),
            overall: true
        };
        
        results.overall = Object.values(results).every(result => result !== false);
        
        return results;
    }

    /**
     * Validate data structure
     */
    validateData(data) {
        if (!data) return null; // No data to validate
        
        try {
            // Basic validation - check if data has required structure
            if (typeof data !== 'object') return false;
            if (!data.exportTimestamp && !data.lastSaved) return false;
            
            return true;
        } catch (error) {
            console.error('❌ Data validation failed:', error);
            return false;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopAutoSave();
        console.log('🧹 DataPersistence cleaned up');
    }
}