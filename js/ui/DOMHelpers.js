/**
 * DOMHelpers - Utility functions for DOM manipulation and element management
 * Extracted from UIController.js to improve modularity
 */

export class DOMHelpers {
    constructor() {
        this.cachedElements = new Map();
        this.observers = new Map();
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        const elementMap = {
            // Game areas
            dealerCards: 'dealer-cards',
            playerCards: 'player-cards',
            gameArea: 'game-area',
            
            // Totals
            dealerTotal: 'dealer-total',
            playerTotal: 'player-total',
            
            // Statistics
            handsPlayed: 'hands-played',
            wins: 'wins',
            winRate: 'win-rate',
            bank: 'bank-amount',
            currentBet: 'current-bet',
            
            // Strategy stats
            strategyAccuracy: 'strategy-accuracy',
            strategyGrade: 'strategy-grade',
            totalDecisions: 'total-decisions',
            
            // Card counting
            runningCount: 'running-count',
            trueCount: 'true-count',
            decksRemaining: 'decks-remaining',
            
            // Controls
            betAmount: 'bet-amount',
            gameMessages: 'game-messages',
            gamePhase: 'game-phase',
            
            // Modals
            strategyHintModal: 'strategy-hint-modal',
            statsModal: 'stats-modal',
            settingsModal: 'settings-modal'
        };

        // Cache all elements
        Object.entries(elementMap).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (element) {
                this.cachedElements.set(key, element);
            } else {
                console.warn(`⚠️ Element not found: ${id}`);
            }
        });

        // Cache button groups
        this.cachedElements.set('actionButtons', document.querySelectorAll('.action-btn'));
        this.cachedElements.set('chipButtons', document.querySelectorAll('.chip-btn'));
        this.cachedElements.set('gameButtons', document.querySelectorAll('.game-btn'));

        console.log(`✅ Cached ${this.cachedElements.size} DOM elements`);
    }

    /**
     * Get cached element by key
     */
    getElement(key) {
        return this.cachedElements.get(key);
    }

    /**
     * Get element by ID (with caching)
     */
    getElementById(id) {
        if (!this.cachedElements.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cachedElements.set(id, element);
            }
        }
        return this.cachedElements.get(id);
    }

    /**
     * Clear specific container
     */
    clearContainer(containerId) {
        const container = this.getElement(containerId) || this.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            container.className = container.className.split(' ')[0]; // Keep base class
        }
    }

    /**
     * Clear all game areas
     */
    clearGameArea() {
        this.clearContainer('dealerCards');
        this.clearContainer('playerCards');
        
        // Reset totals
        this.updateText('dealerTotal', '');
        this.updateText('playerTotal', '');
        
        // Clear split hands
        document.querySelectorAll('.split-hand').forEach(hand => {
            hand.remove();
        });
    }

    /**
     * Update text content of element
     */
    updateText(elementKey, text) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Update HTML content of element
     */
    updateHTML(elementKey, html) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.innerHTML = html;
        }
    }

    /**
     * Set element style
     */
    setStyle(elementKey, property, value) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.style[property] = value;
        }
    }

    /**
     * Add CSS class to element
     */
    addClass(elementKey, className) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from element
     */
    removeClass(elementKey, className) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggle CSS class on element
     */
    toggleClass(elementKey, className) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.classList.toggle(className);
        }
    }

    /**
     * Set element visibility
     */
    setVisible(elementKey, visible) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.style.display = visible ? '' : 'none';
        }
    }

    /**
     * Create element with attributes
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className' || key === 'class') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Set content
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }

    /**
     * Append element to container
     */
    appendTo(element, containerId) {
        const container = this.getElement(containerId) || this.getElementById(containerId);
        if (container && element) {
            container.appendChild(element);
            return element;
        }
        return null;
    }

    /**
     * Create and append element
     */
    createAndAppend(tag, containerId, attributes = {}, content = '') {
        const element = this.createElement(tag, attributes, content);
        return this.appendTo(element, containerId);
    }

    /**
     * Find elements by selector
     */
    findElements(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    /**
     * Find single element by selector
     */
    findElement(selector, context = document) {
        return context.querySelector(selector);
    }

    /**
     * Set button state (enabled/disabled)
     */
    setButtonState(buttonId, enabled) {
        const button = this.getElementById(buttonId);
        if (button) {
            button.disabled = !enabled;
            button.style.opacity = enabled ? '1' : '0.5';
            
            if (enabled) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, loading) {
        const button = this.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            
            // Add loading spinner if not exists
            if (!button.querySelector('.loading-spinner')) {
                const spinner = this.createElement('span', {
                    className: 'loading-spinner'
                }, '⏳');
                button.appendChild(spinner);
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            
            // Remove loading spinner
            const spinner = button.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * Disable all buttons in a group
     */
    disableButtonGroup(groupSelector) {
        const buttons = this.findElements(groupSelector);
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }

    /**
     * Enable all buttons in a group
     */
    enableButtonGroup(groupSelector) {
        const buttons = this.findElements(groupSelector);
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
    }

    /**
     * Create split hand container
     */
    createSplitHandContainer(handIndex) {
        const container = this.createElement('div', {
            id: `player-hand-${handIndex}`,
            className: 'player-hand split-hand'
        });

        const cardsDiv = this.createElement('div', {
            className: 'hand-cards'
        });

        const totalDiv = this.createElement('div', {
            id: `player-total-${handIndex}`,
            className: 'hand-total'
        });

        container.appendChild(cardsDiv);
        container.appendChild(totalDiv);

        return container;
    }

    /**
     * Update player total display (supports split hands)
     */
    updatePlayerTotal(total, isBusted, handIndex = 0) {
        const totalElement = handIndex === 0 ? 
            this.getElement('playerTotal') : 
            this.getElementById(`player-total-${handIndex}`);
            
        if (totalElement) {
            totalElement.textContent = isBusted ? `${total} - BUST!` : total;
            totalElement.className = `player-total ${isBusted ? 'busted' : ''}`;
        }
    }

    /**
     * Update dealer total display
     */
    updateDealerTotal(total, isBusted) {
        const element = this.getElement('dealerTotal');
        if (element) {
            if (total === '' || total === null || total === undefined) {
                element.textContent = '';
                element.className = 'dealer-total';
            } else {
                element.textContent = isBusted ? `${total} - BUST!` : total;
                element.className = `dealer-total ${isBusted ? 'busted' : ''}`;
            }
        }
    }

    /**
     * Show split hands layout
     */
    showSplitHands(playerHands) {
        const playerArea = this.getElement('playerCards');
        if (!playerArea) return;

        // Clear existing layout
        playerArea.innerHTML = '';
        playerArea.classList.add('split-layout');

        // Create container for each hand
        playerHands.forEach((hand, index) => {
            const handContainer = this.createSplitHandContainer(index);
            playerArea.appendChild(handContainer);
        });
    }

    /**
     * Highlight current active hand
     */
    highlightCurrentHand(handIndex) {
        // Remove existing highlights
        this.findElements('.player-hand').forEach(hand => {
            hand.classList.remove('active-hand');
        });

        // Add highlight to current hand
        const currentHand = this.getElementById(`player-hand-${handIndex}`) || 
                           this.getElement('playerCards');
        if (currentHand) {
            currentHand.classList.add('active-hand');
        }
    }

    /**
     * Show hand result
     */
    showHandResult(handIndex, result, message) {
        const handElement = this.getElementById(`player-hand-${handIndex}`) ||
                           this.getElement('playerCards');
        if (handElement) {
            const resultElement = this.createElement('div', {
                className: `hand-result result-${result}`
            }, message);
            
            handElement.appendChild(resultElement);
            
            // Auto-remove after animation
            setTimeout(() => {
                if (resultElement.parentNode) {
                    resultElement.parentNode.removeChild(resultElement);
                }
            }, 3000);
        }
    }

    /**
     * Update game phase display
     */
    updateGamePhase(phase, message) {
        const phaseElement = this.getElement('gamePhase');
        if (phaseElement) {
            phaseElement.textContent = message || phase;
            phaseElement.className = `game-phase phase-${phase}`;
        }
    }

    /**
     * Set up mutation observer for dynamic content
     */
    observeElement(elementKey, callback) {
        const element = this.getElement(elementKey);
        if (element && !this.observers.has(elementKey)) {
            const observer = new MutationObserver(callback);
            observer.observe(element, {
                childList: true,
                subtree: true,
                attributes: true
            });
            this.observers.set(elementKey, observer);
        }
    }

    /**
     * Stop observing element
     */
    stopObserving(elementKey) {
        const observer = this.observers.get(elementKey);
        if (observer) {
            observer.disconnect();
            this.observers.delete(elementKey);
        }
    }

    /**
     * Batch DOM updates for performance
     */
    batchUpdate(updates) {
        // Use document fragment for multiple insertions
        const fragment = document.createDocumentFragment();
        let hasFragmentUpdates = false;

        updates.forEach(update => {
            switch (update.type) {
                case 'text':
                    this.updateText(update.element, update.value);
                    break;
                case 'html':
                    this.updateHTML(update.element, update.value);
                    break;
                case 'style':
                    this.setStyle(update.element, update.property, update.value);
                    break;
                case 'class':
                    if (update.add) {
                        this.addClass(update.element, update.className);
                    } else {
                        this.removeClass(update.element, update.className);
                    }
                    break;
                case 'append':
                    if (update.element && update.container) {
                        fragment.appendChild(update.element);
                        hasFragmentUpdates = true;
                    }
                    break;
            }
        });

        // Append fragment if there are elements to add
        if (hasFragmentUpdates && updates.some(u => u.type === 'append')) {
            const container = this.getElement(updates.find(u => u.type === 'append').container);
            if (container) {
                container.appendChild(fragment);
            }
        }
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(elementKey, behavior = 'smooth') {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        if (element) {
            element.scrollIntoView({ behavior, block: 'center' });
        }
    }

    /**
     * Get element dimensions and position
     */
    getElementRect(elementKey) {
        const element = this.getElement(elementKey) || this.getElementById(elementKey);
        return element ? element.getBoundingClientRect() : null;
    }

    /**
     * Check if element is visible in viewport
     */
    isElementVisible(elementKey) {
        const rect = this.getElementRect(elementKey);
        if (!rect) return false;
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear cached elements
        this.cachedElements.clear();
        
        console.log('🧹 DOMHelpers cleaned up');
    }
}