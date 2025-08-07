/**
 * ModalManager - Handles all modal dialogs and messaging
 * Extracted from UIController.js to improve modularity
 */

export class ModalManager {
    constructor() {
        this.elements = {};
        this.activeModals = new Set();
        this.messageQueue = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the modal manager
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ ModalManager initialized');
    }

    /**
     * Cache modal-related DOM elements
     */
    cacheElements() {
        this.elements = {
            // Message system
            gameMessages: document.getElementById('game-messages'),
            
            // Modals
            strategyHintModal: document.getElementById('strategy-hint-modal'),
            statsModal: document.getElementById('stats-modal'),
            settingsModal: document.getElementById('settings-modal'),
            hintModal: document.getElementById('hint-modal'),
            
            // Modal close buttons
            closeButtons: document.querySelectorAll('.modal-close'),
            
            // Overlay
            modalOverlay: document.getElementById('modal-overlay')
        };
    }

    /**
     * Set up event listeners for modals
     */
    setupEventListeners() {
        // Close button handlers
        this.elements.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hideActiveModal());
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && this.isModalVisible()) {
                this.hideActiveModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalVisible()) {
                this.hideActiveModal();
            }
        });
    }

    /**
     * Show message with styling and auto-hide
     */
    showMessage(message, type = 'info', duration = 0) {
        if (!this.elements.gameMessages) return;

        // Queue message if another is showing
        if (this.elements.gameMessages.innerHTML && duration > 0) {
            this.messageQueue.push({ message, type, duration });
            return;
        }

        // Clear existing message
        this.clearMessage();

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${this.getMessageIcon(type)}</span>
                <span class="message-text">${message}</span>
            </div>
        `;

        this.elements.gameMessages.appendChild(messageElement);

        // Animate in
        setTimeout(() => messageElement.classList.add('show'), 10);

        // Auto-hide if duration specified
        if (duration > 0) {
            setTimeout(() => {
                this.hideMessage(messageElement);
            }, duration);
        }
    }

    /**
     * Get icon for message type
     */
    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            hint: '💡'
        };
        return icons[type] || icons.info;
    }

    /**
     * Hide specific message with animation
     */
    hideMessage(messageElement) {
        if (!messageElement) return;

        messageElement.classList.add('hide');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
            this.processMessageQueue();
        }, 300);
    }

    /**
     * Clear all messages
     */
    clearMessage() {
        if (this.elements.gameMessages) {
            this.elements.gameMessages.innerHTML = '';
        }
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
        if (this.messageQueue.length > 0) {
            const nextMessage = this.messageQueue.shift();
            this.showMessage(nextMessage.message, nextMessage.type, nextMessage.duration);
        }
    }

    /**
     * Show strategy hint modal
     */
    showStrategyHint(hint) {
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💡 Strategy Recommendation</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="hint-recommendation">
                        <h4>Recommended Action: <span class="action-${hint.action.toLowerCase().replace(' ', '-')}">${hint.action}</span></h4>
                        <p class="hint-explanation">${hint.explanation}</p>
                    </div>
                    
                    <div class="hand-analysis">
                        <h5>Hand Analysis</h5>
                        <div class="analysis-grid">
                            <div class="analysis-item">
                                <label>Your Hand:</label>
                                <span>${hint.playerValue} (${hint.handType})</span>
                            </div>
                            <div class="analysis-item">
                                <label>Dealer Up Card:</label>
                                <span>${hint.dealerUpCard}</span>
                            </div>
                            <div class="analysis-item">
                                <label>Confidence:</label>
                                <span class="confidence-${hint.confidence}">${hint.confidence}</span>
                            </div>
                        </div>
                    </div>

                    ${hint.alternativeActions ? this.renderAlternativeActions(hint.alternativeActions) : ''}
                </div>
            </div>
        `;

        this.showModal('strategy-hint-modal', modalContent);
    }

    /**
     * Render alternative actions
     */
    renderAlternativeActions(alternatives) {
        return `
            <div class="alternative-actions">
                <h5>Alternative Actions</h5>
                <div class="actions-list">
                    ${alternatives.map(action => `
                        <div class="action-option ${action.available ? '' : 'unavailable'}">
                            <span class="action-name">${action.action}</span>
                            <span class="action-description">${action.description}</span>
                            <span class="action-risk">Risk: ${action.risk}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Show statistics modal
     */
    showStatsModal(statsData) {
        const { gameStats, strategyStats, countingStats } = statsData;
        
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Detailed Statistics</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-tabs">
                        <button class="stats-tab active" data-tab="game">Game Stats</button>
                        <button class="stats-tab" data-tab="strategy">Strategy</button>
                        ${countingStats ? '<button class="stats-tab" data-tab="counting">Counting</button>' : ''}
                    </div>
                    
                    <div class="stats-content">
                        <div class="stats-panel active" data-panel="game">
                            ${this.renderGameStats(gameStats)}
                        </div>
                        <div class="stats-panel" data-panel="strategy">
                            ${this.renderStrategyStats(strategyStats)}
                        </div>
                        ${countingStats ? `<div class="stats-panel" data-panel="counting">${this.renderCountingStats(countingStats)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;

        this.showModal('stats-modal', modalContent);
        this.setupStatsTabs();
    }

    /**
     * Render game statistics
     */
    renderGameStats(stats) {
        return `
            <div class="stats-section">
                <h4>Session Performance</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Hands Played:</label>
                        <span>${stats.handsPlayed}</span>
                    </div>
                    <div class="stat-item">
                        <label>Win Rate:</label>
                        <span class="win-rate">${stats.winRate.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <label>Net Gain:</label>
                        <span class="${stats.netGain >= 0 ? 'profit' : 'loss'}">$${stats.netGain}</span>
                    </div>
                    <div class="stat-item">
                        <label>Session Duration:</label>
                        <span>${stats.sessionDuration} minutes</span>
                    </div>
                    <div class="stat-item">
                        <label>Hands per Hour:</label>
                        <span>${stats.handsPerHour}</span>
                    </div>
                    <div class="stat-item">
                        <label>Current Bank:</label>
                        <span class="${stats.bankAmount >= 1000 ? 'profit' : 'loss'}">$${stats.bankAmount}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render strategy statistics
     */
    renderStrategyStats(stats) {
        return `
            <div class="stats-section">
                <h4>Strategy Accuracy</h4>
                <div class="accuracy-overview">
                    <div class="accuracy-grade">
                        <span class="grade-label">Overall Grade:</span>
                        <span class="grade grade-${stats.grade.toLowerCase()}">${stats.grade}</span>
                    </div>
                    <div class="accuracy-percentage">
                        <span class="accuracy-label">Accuracy:</span>
                        <span class="accuracy-value">${stats.overallAccuracy}%</span>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Total Decisions:</label>
                        <span>${stats.totalDecisions}</span>
                    </div>
                    <div class="stat-item">
                        <label>Correct Decisions:</label>
                        <span>${stats.correctDecisions}</span>
                    </div>
                </div>
                
                <h5>Action Breakdown</h5>
                <div class="action-breakdown">
                    ${Object.entries(stats.actionAccuracy).map(([action, accuracy]) => `
                        <div class="action-stat">
                            <span class="action-name">${action}</span>
                            <div class="accuracy-bar">
                                <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                                <span class="accuracy-text">${accuracy.toFixed(1)}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render counting statistics
     */
    renderCountingStats(stats) {
        return `
            <div class="stats-section">
                <h4>Card Counting Performance</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Running Count:</label>
                        <span>${stats.runningCount}</span>
                    </div>
                    <div class="stat-item">
                        <label>True Count:</label>
                        <span>${stats.trueCount}</span>
                    </div>
                    <div class="stat-item">
                        <label>Count Accuracy:</label>
                        <span>${stats.countAccuracy}%</span>
                    </div>
                    <div class="stat-item">
                        <label>Betting Efficiency:</label>
                        <span>${stats.bettingCorrelation}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup stats tabs functionality
     */
    setupStatsTabs() {
        const tabs = document.querySelectorAll('.stats-tab');
        const panels = document.querySelectorAll('.stats-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active panel
                panels.forEach(p => p.classList.remove('active'));
                document.querySelector(`[data-panel="${targetPanel}"]`)?.classList.add('active');
            });
        });
    }

    /**
     * Show settings modal
     */
    showSettingsModal(currentSettings) {
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚙️ Game Settings</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-form">
                        <div class="setting-group">
                            <label for="deck-count-modal">Number of Decks:</label>
                            <select id="deck-count-modal">
                                ${[1,2,4,6,8].map(n => `<option value="${n}" ${currentSettings.deckCount === n ? 'selected' : ''}>${n} deck${n > 1 ? 's' : ''}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="hints-modal" ${currentSettings.showBasicStrategyHints ? 'checked' : ''}>
                                Show Strategy Hints
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="counting-modal" ${currentSettings.cardCountingMode ? 'checked' : ''}>
                                Card Counting Mode
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label for="game-speed-modal">Game Speed:</label>
                            <select id="game-speed-modal">
                                <option value="instant" ${currentSettings.gameSpeed === 'instant' ? 'selected' : ''}>Instant</option>
                                <option value="fast" ${currentSettings.gameSpeed === 'fast' ? 'selected' : ''}>Fast</option>
                                <option value="normal" ${currentSettings.gameSpeed === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="slow" ${currentSettings.gameSpeed === 'slow' ? 'selected' : ''}>Slow</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="sounds-modal" ${currentSettings.soundEffects ? 'checked' : ''}>
                                Sound Effects
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button id="save-settings" class="btn btn-primary">Save Settings</button>
                        <button id="reset-settings" class="btn btn-secondary">Reset to Defaults</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal('settings-modal', modalContent);
        this.setupSettingsHandlers();
    }

    /**
     * Setup settings modal handlers
     */
    setupSettingsHandlers() {
        const saveButton = document.getElementById('save-settings');
        const resetButton = document.getElementById('reset-settings');

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveSettings();
                this.hideActiveModal();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    /**
     * Save settings from modal
     */
    saveSettings() {
        const settings = {
            deckCount: parseInt(document.getElementById('deck-count-modal')?.value || 6),
            showBasicStrategyHints: document.getElementById('hints-modal')?.checked || false,
            cardCountingMode: document.getElementById('counting-modal')?.checked || false,
            gameSpeed: document.getElementById('game-speed-modal')?.value || 'normal',
            soundEffects: document.getElementById('sounds-modal')?.checked || false
        };

        // Emit custom event for settings change
        document.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        document.getElementById('deck-count-modal').value = '6';
        document.getElementById('hints-modal').checked = true;
        document.getElementById('counting-modal').checked = false;
        document.getElementById('game-speed-modal').value = 'normal';
        document.getElementById('sounds-modal').checked = false;
    }

    /**
     * Show generic modal
     */
    showModal(modalId, content) {
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId);
        }

        modal.innerHTML = content;
        modal.classList.add('show');
        this.activeModals.add(modalId);

        // Focus trap
        this.setupFocusTrap(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Create modal element if it doesn't exist
     */
    createModal(modalId) {
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Setup focus trap for accessibility
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Hide active modal
     */
    hideActiveModal() {
        this.activeModals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
            }
        });
        
        this.activeModals.clear();
        document.body.style.overflow = '';
    }

    /**
     * Check if any modal is visible
     */
    isModalVisible() {
        return this.activeModals.size > 0;
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hide');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, onConfirm, onCancel) {
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirm Action</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button id="confirm-yes" class="btn btn-primary">Yes</button>
                        <button id="confirm-no" class="btn btn-secondary">No</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal('confirmation-modal', modalContent);

        document.getElementById('confirm-yes')?.addEventListener('click', () => {
            this.hideActiveModal();
            if (onConfirm) onConfirm();
        });

        document.getElementById('confirm-no')?.addEventListener('click', () => {
            this.hideActiveModal();
            if (onCancel) onCancel();
        });
    }
}