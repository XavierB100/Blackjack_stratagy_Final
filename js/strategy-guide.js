/**
 * Strategy Guide Page JavaScript
 * Handles interactive strategy charts and tabs
 */

import { StrategyHints } from './modules/StrategyHints.js';
import { Navigation } from './modules/Navigation.js';

class StrategyGuideApp {
    constructor() {
        this.strategyHints = null;
        this.navigation = null;
        this.currentChart = 'hard';
        this.isInitialized = false;
        this.practiceMode = {
            active: false,
            scenarios: [],
            currentScenario: null,
            stats: { correct: 0, total: 0 },
            timer: null,
            startTime: null
        };
        this.surrenderFallbacks = this.initializeSurrenderFallbacks();
    }

    async init() {
        try {
            console.log('📚 Initializing Strategy Guide...');
            
            // Initialize modules
            this.navigation = new Navigation();
            this.strategyHints = new StrategyHints();
            
            await this.navigation.init();
            await this.strategyHints.init();
            
            // Validate that we have working strategy data
            const testData = this.getBasicStrategyData();
            if (!testData) {
                throw new Error('Unable to load strategy data');
            }
            
            // Set up page-specific functionality
            this.setupChartTabs();
            this.populateStrategyCharts();
            this.setupInteractivity();
            this.setupQuickLookup();
            this.setupPracticeMode();
            
            this.isInitialized = true;
            console.log('✅ Strategy Guide initialized with validated data');
            
        } catch (error) {
            console.error('❌ Failed to initialize Strategy Guide:', error);
            // Try to provide basic functionality even if full initialization fails
            this.handleInitializationError(error);
        }
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        try {
            console.warn('🔧 Attempting graceful degradation...');
            
            // Try to set up basic functionality with fallback data
            this.setupChartTabs();
            this.populateStrategyCharts(); // Will use fallback data
            this.setupInteractivity();
            this.setupQuickLookup();
            
            // Show user-friendly error message
            this.showInitializationError();
            
            console.log('⚠️ Strategy Guide initialized with limited functionality');
        } catch (fallbackError) {
            console.error('❌ Complete initialization failure:', fallbackError);
            this.showCriticalError();
        }
    }

    /**
     * Show user-friendly initialization error
     */
    showInitializationError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'initialization-warning';
        errorDiv.style.cssText = `
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            color: #856404; 
            padding: 1rem; 
            margin: 1rem 0; 
            border-radius: 4px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <strong>⚠️ Notice:</strong> Some advanced features may not be available. 
            Basic strategy charts are still functional using backup data.
        `;
        
        const container = document.querySelector('.content-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    /**
     * Show critical error message
     */
    showCriticalError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'critical-error';
        errorDiv.style.cssText = `
            background: #f8d7da; 
            border: 1px solid #f5c6cb; 
            color: #721c24; 
            padding: 2rem; 
            margin: 2rem 0; 
            border-radius: 4px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>❌ Strategy Guide Unavailable</h3>
            <p>We're experiencing technical difficulties loading the strategy guide. Please refresh the page or try again later.</p>
            <p><small>Error details have been logged for our development team.</small></p>
        `;
        
        const container = document.querySelector('.content-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(errorDiv);
        }
    }

    setupChartTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const charts = document.querySelectorAll('.strategy-chart');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chartType = button.dataset.chart;
                this.switchChart(chartType);
                
                // Update tab appearance
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update chart visibility
                charts.forEach(chart => chart.classList.remove('active'));
                document.getElementById(`${chartType}-chart`).classList.add('active');
                
                this.currentChart = chartType;
            });
        });
    }

    switchChart(chartType) {
        console.log(`Switching to ${chartType} chart`);
        
        // Add any specific logic for chart switching
        this.highlightChartFeatures(chartType);
    }

    populateStrategyCharts() {
        try {
            const charts = this.getBasicStrategyData();
            
            if (!charts) {
                throw new Error('No strategy data available');
            }
            
            // Populate hard totals chart
            if (charts.hard) {
                this.populateHardChart(charts.hard);
            } else {
                console.error('Hard totals data missing');
            }
            
            // Populate soft totals chart
            if (charts.soft) {
                this.populateSoftChart(charts.soft);
            } else {
                console.error('Soft totals data missing');
            }
            
            // Populate pairs chart
            if (charts.pairs) {
                this.populatePairsChart(charts.pairs);
            } else {
                console.error('Pairs data missing');
            }
        } catch (error) {
            console.error('Error populating strategy charts:', error);
            this.showChartError();
        }
    }

    /**
     * Show chart population error
     */
    showChartError() {
        const chartContainers = document.querySelectorAll('.strategy-chart tbody');
        chartContainers.forEach(tbody => {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; padding: 2rem; color: #dc3545;">
                            ⚠️ Unable to load strategy chart data
                        </td>
                    </tr>
                `;
            }
        });
    }

    getActionWithSurrenderRule(chartType, handValue, dealerCard, originalAction) {
        // Check if surrender is allowed
        const surrenderAllowed = document.getElementById('surrender-allowed')?.checked ?? true;
        
        // If surrender is allowed or the action isn't surrender, return original action
        if (surrenderAllowed || originalAction !== 'SU') {
            return originalAction;
        }
        
        // If surrender is not allowed and original action is surrender, return fallback
        if (chartType === 'hard' && this.surrenderFallbacks.hard[handValue]?.[dealerCard]) {
            return this.surrenderFallbacks.hard[handValue][dealerCard];
        }
        
        // Default fallback is Hit
        return 'H';
    }

    populateHardChart(hardData) {
        const tbody = document.querySelector('#hard-chart tbody');
        if (!tbody || !hardData) return;
        
        tbody.innerHTML = '';
        
        // Create rows for hard totals 5-21
        for (let total = 5; total <= 21; total++) {
            const row = document.createElement('tr');
            
            // Hand total cell
            const handCell = document.createElement('td');
            handCell.textContent = total;
            handCell.className = 'hand-total';
            row.appendChild(handCell);
            
            // Dealer upcard cells (2-11, where 11 represents Ace)
            for (let dealerCard = 2; dealerCard <= 11; dealerCard++) {
                const cell = document.createElement('td');
                const originalAction = hardData[total]?.[dealerCard] || 'H';
                const action = this.getActionWithSurrenderRule('hard', total, dealerCard, originalAction);
                
                cell.textContent = action;
                cell.className = `chart-cell ${this.getActionClass(action)}`;
                cell.title = `${total} vs ${dealerCard === 11 ? 'A' : dealerCard}: ${this.getActionName(action)}`;
                
                // Add click handler for detailed explanation
                cell.addEventListener('click', () => {
                    this.showActionExplanation('hard', total, dealerCard, action);
                });
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
    }

    populateSoftChart(softData) {
        const tbody = document.querySelector('#soft-chart tbody');
        if (!tbody || !softData) return;
        
        tbody.innerHTML = '';
        
        // Create rows for soft totals 13-21 (A,2 through A,10)
        for (let total = 13; total <= 21; total++) {
            const row = document.createElement('tr');
            
            // Hand description cell
            const handCell = document.createElement('td');
            const nonAceValue = total - 11;
            handCell.innerHTML = `A,${nonAceValue}<br><small>(${total})</small>`;
            handCell.className = 'hand-total';
            row.appendChild(handCell);
            
            // Dealer upcard cells
            for (let dealerCard = 2; dealerCard <= 11; dealerCard++) {
                const cell = document.createElement('td');
                const action = softData[total]?.[dealerCard] || 'H';
                
                cell.textContent = action;
                cell.className = `chart-cell ${this.getActionClass(action)}`;
                cell.title = `Soft ${total} vs ${dealerCard === 11 ? 'A' : dealerCard}: ${this.getActionName(action)}`;
                
                cell.addEventListener('click', () => {
                    this.showActionExplanation('soft', total, dealerCard, action);
                });
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
    }

    populatePairsChart(pairsData) {
        const tbody = document.querySelector('#pairs-chart tbody');
        if (!tbody || !pairsData) return;
        
        tbody.innerHTML = '';
        
        // Pairs in order: A, 2-10, J, Q, K
        const pairs = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        pairs.forEach(pair => {
            const row = document.createElement('tr');
            
            // Pair description cell
            const handCell = document.createElement('td');
            handCell.innerHTML = `${pair},${pair}`;
            handCell.className = 'hand-total';
            row.appendChild(handCell);
            
            // Dealer upcard cells
            for (let dealerCard = 2; dealerCard <= 11; dealerCard++) {
                const cell = document.createElement('td');
                const action = pairsData[pair]?.[dealerCard] || 'H';
                
                cell.textContent = action;
                cell.className = `chart-cell ${this.getActionClass(action)}`;
                cell.title = `${pair} pair vs ${dealerCard === 11 ? 'A' : dealerCard}: ${this.getActionName(action)}`;
                
                cell.addEventListener('click', () => {
                    this.showActionExplanation('pairs', pair, dealerCard, action);
                });
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        });
    }

    getActionClass(action) {
        const actionClasses = {
            'H': 'hit',
            'S': 'stand',
            'D': 'double',
            'SP': 'split',
            'SU': 'surrender'
        };
        return actionClasses[action] || 'hit';
    }

    getActionName(action) {
        const actionNames = {
            'H': 'Hit',
            'S': 'Stand',
            'D': 'Double Down',
            'SP': 'Split',
            'SU': 'Surrender'
        };
        return actionNames[action] || 'Hit';
    }

    showActionExplanation(chartType, hand, dealerCard, action) {
        // Create a modal or tooltip with detailed explanation
        const explanation = this.getDetailedExplanation(chartType, hand, dealerCard, action);
        
        // Simple alert for now - could be enhanced with a modal
        alert(`${this.getActionName(action)} Explanation:\n\n${explanation}`);
    }

    getDetailedExplanation(chartType, hand, dealerCard, action) {
        const dealerText = dealerCard === 11 ? 'Ace' : dealerCard;
        const actionText = this.getActionName(action);
        
        switch (chartType) {
            case 'hard':
                return `With a hard ${hand} against dealer ${dealerText}, you should ${actionText.toLowerCase()}. This is the mathematically optimal play based on the expected value calculation.`;
            
            case 'soft':
                const aceCard = hand - 11;
                return `With A,${aceCard} (soft ${hand}) against dealer ${dealerText}, you should ${actionText.toLowerCase()}. Soft hands have lower bust risk since the Ace can be counted as 1.`;
            
            case 'pairs':
                if (action === 'SP') {
                    return `Always split ${hand} pairs against dealer ${dealerText}. This gives you better expected value than playing the hand as a ${hand === 'A' ? 12 : parseInt(hand) * 2}.`;
                } else {
                    return `Don't split ${hand} pairs against dealer ${dealerText}. Instead, ${actionText.toLowerCase()} the hand for better expected value.`;
                }
            
            default:
                return `${actionText} is the recommended action in this situation.`;
        }
    }

    setupInteractivity() {
        // Add hover effects to cells
        document.querySelectorAll('.action-cell').forEach(cell => {
            cell.addEventListener('mouseenter', () => {
                cell.style.transform = 'scale(1.1)';
                cell.style.zIndex = '10';
                cell.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            });
            
            cell.addEventListener('mouseleave', () => {
                cell.style.transform = '';
                cell.style.zIndex = '';
                cell.style.boxShadow = '';
            });
        });

        // Add keyboard navigation
        this.setupKeyboardNavigation();
        
        // Add print functionality
        this.setupPrintFunction();
        
        // Setup surrender toggles
        this.setupSurrenderToggles();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '3') {
                const tabIndex = parseInt(e.key) - 1;
                const tabs = ['hard', 'soft', 'pairs'];
                if (tabs[tabIndex]) {
                    document.querySelector(`[data-chart="${tabs[tabIndex]}"]`).click();
                }
            }
        });
    }

    setupPrintFunction() {
        // Add print button functionality if needed
        const printButton = document.querySelector('.print-chart-btn');
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }
    }

    setupSurrenderToggles() {
        // Chart surrender toggle
        const chartSurrenderToggle = document.getElementById('surrender-allowed');
        if (chartSurrenderToggle) {
            chartSurrenderToggle.addEventListener('change', (e) => {
                this.handleChartSurrenderToggle(e.target.checked);
            });
        }

        // Initialize surrender button visibility based on main toggle
        this.handlePracticeSurrenderToggle(chartSurrenderToggle?.checked ?? true);
    }

    handleChartSurrenderToggle(surrenderAllowed) {
        // Re-populate charts with updated surrender settings
        this.populateStrategyCharts();
        // Also update practice mode surrender button visibility
        this.handlePracticeSurrenderToggle(surrenderAllowed);
        console.log(`Surrender toggle: ${surrenderAllowed ? 'enabled' : 'disabled'}`);
    }

    handlePracticeSurrenderToggle(surrenderAllowed) {
        // Update surrender button visibility in practice mode
        const surrenderBtn = document.getElementById('surrender-btn');
        if (surrenderBtn) {
            surrenderBtn.style.display = surrenderAllowed ? 'inline-block' : 'none';
        }
        console.log(`Practice surrender toggle: ${surrenderAllowed ? 'enabled' : 'disabled'}`);
    }

    highlightChartFeatures(chartType) {
        // Add any special highlighting for different chart types
        setTimeout(() => {
            const activeChart = document.getElementById(`${chartType}-chart`);
            if (activeChart) {
                activeChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    // Method to get chart data for external use
    getChartData(chartType) {
        const basicStrategyData = this.getBasicStrategyData();
        return basicStrategyData[chartType];
    }

    // Method to export chart as text
    exportChart(chartType) {
        const chartData = this.getChartData(chartType);
        if (!chartData) return '';
        
        let output = `${chartType.toUpperCase()} TOTALS BASIC STRATEGY CHART\n\n`;
        output += 'Player\\Dealer\t2\t3\t4\t5\t6\t7\t8\t9\t10\tA\n';
        
        Object.keys(chartData).forEach(playerHand => {
            output += `${playerHand}\t\t`;
            for (let dealer = 2; dealer <= 11; dealer++) {
                output += `${chartData[playerHand][dealer] || 'H'}\t`;
            }
            output += '\n';
        });
        
        return output;
    }

    initializeSurrenderFallbacks() {
        // Fallback actions when surrender is not allowed
        return {
            hard: {
                15: { 10: 'H' }, // Hard 15 vs 10: Surrender → Hit
                16: { 9: 'H', 10: 'H', 11: 'H' } // Hard 16 vs 9/10/A: Surrender → Hit
            }
        };
    }

    /**
     * Get authoritative basic strategy data from StrategyHints module
     */
    getBasicStrategyData() {
        try {
            if (!this.strategyHints?.isAvailable()) {
                console.warn('StrategyHints not available, using fallback data');
                return this.getFallbackStrategyData();
            }
            
            const charts = this.strategyHints.getAllCharts();
            
            // Validate the data structure
            if (!this.validateStrategyData(charts)) {
                console.warn('Strategy data validation failed, using fallback data');
                return this.getFallbackStrategyData();
            }
            
            return charts;
        } catch (error) {
            console.error('Error getting strategy data:', error);
            return this.getFallbackStrategyData();
        }
    }

    /**
     * Validate strategy data structure and completeness
     */
    validateStrategyData(data) {
        try {
            // Check main structure
            if (!data || typeof data !== 'object') return false;
            if (!data.hard || !data.soft || !data.pairs) return false;

            // Validate hard totals (5-21)
            for (let total = 5; total <= 21; total++) {
                if (!data.hard[total]) {
                    console.warn(`Missing hard total: ${total}`);
                    return false;
                }
                for (let dealer = 2; dealer <= 11; dealer++) {
                    if (!data.hard[total][dealer]) {
                        console.warn(`Missing hard ${total} vs dealer ${dealer}`);
                        return false;
                    }
                }
            }

            // Validate soft totals (13-21)
            for (let total = 13; total <= 21; total++) {
                if (!data.soft[total]) {
                    console.warn(`Missing soft total: ${total}`);
                    return false;
                }
                for (let dealer = 2; dealer <= 11; dealer++) {
                    if (!data.soft[total][dealer]) {
                        console.warn(`Missing soft ${total} vs dealer ${dealer}`);
                        return false;
                    }
                }
            }

            // Validate pairs
            const requiredPairs = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            for (const pair of requiredPairs) {
                if (!data.pairs[pair]) {
                    console.warn(`Missing pair: ${pair}`);
                    return false;
                }
                for (let dealer = 2; dealer <= 11; dealer++) {
                    if (!data.pairs[pair][dealer]) {
                        console.warn(`Missing pair ${pair} vs dealer ${dealer}`);
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating strategy data:', error);
            return false;
        }
    }

    /**
     * Fallback strategy data (should only be used if StrategyHints fails)
     */
    getFallbackStrategyData() {
        // This is a backup in case StrategyHints fails to load
        // Using the complete data we just added above
        return {
            hard: {
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
            },
            soft: {
                13: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                14: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                15: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                16: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                17: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                18: { 2: 'S', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'S', 8: 'S', 9: 'H', 10: 'H', 11: 'H' },
                19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
            },
            pairs: {
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
            }
        };
    }

    initializeBasicStrategyData() {
        // Complete basic strategy data for all scenarios
        return {
            hard: {
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
                15: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'SU', 11: 'H' },
                16: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'SU', 10: 'SU', 11: 'SU' },
                17: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                18: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
            },
            soft: {
                13: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                14: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                15: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                16: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                17: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
                18: { 2: 'S', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'S', 8: 'S', 9: 'H', 10: 'H', 11: 'H' },
                19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
                21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
            },
            pairs: {
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
            }
        };
    }

    setupQuickLookup() {
        const getStrategyBtn = document.getElementById('get-strategy');
        const playerHandSelect = document.getElementById('player-hand');
        const dealerCardSelect = document.getElementById('dealer-card');
        const strategyResult = document.getElementById('strategy-result');

        if (getStrategyBtn) {
            getStrategyBtn.addEventListener('click', () => {
                this.performQuickLookup();
            });
        }

        // Auto-lookup on selection change
        [playerHandSelect, dealerCardSelect].forEach(select => {
            if (select) {
                select.addEventListener('change', () => {
                    if (playerHandSelect.value && dealerCardSelect.value) {
                        this.performQuickLookup();
                    }
                });
            }
        });
    }

    performQuickLookup() {
        const playerHandSelect = document.getElementById('player-hand');
        const dealerCardSelect = document.getElementById('dealer-card');
        const strategyResult = document.getElementById('strategy-result');

        if (!playerHandSelect || !dealerCardSelect || !strategyResult) return;

        const playerHand = playerHandSelect.value;
        const dealerCard = parseInt(dealerCardSelect.value);

        if (!playerHand || !dealerCard) {
            strategyResult.style.display = 'none';
            return;
        }

        const strategy = this.getStrategyForSituation(playerHand, dealerCard);
        this.displayStrategyResult(strategy, playerHand, dealerCard);
    }

    getStrategyForSituation(playerHand, dealerCard) {
        const [type, value] = playerHand.split('-');
        let originalAction = 'H';
        let explanation = '';
        const basicStrategyData = this.getBasicStrategyData();

        switch (type) {
            case 'hard':
                const total = parseInt(value);
                originalAction = basicStrategyData.hard[total]?.[dealerCard] || 'H';
                break;
            case 'soft':
                const softTotal = parseInt(value);
                originalAction = basicStrategyData.soft[softTotal]?.[dealerCard] || 'H';
                break;
            case 'pairs':
                originalAction = basicStrategyData.pairs[value]?.[dealerCard] || 'H';
                break;
        }

        // Apply surrender rule
        const handValue = type === 'pairs' ? value : parseInt(value);
        const action = this.getActionWithSurrenderRule(type, handValue, dealerCard, originalAction);
        
        // Get explanation for the final action
        switch (type) {
            case 'hard':
                explanation = this.getHardExplanation(parseInt(value), dealerCard, action);
                break;
            case 'soft':
                explanation = this.getSoftExplanation(parseInt(value), dealerCard, action);
                break;
            case 'pairs':
                explanation = this.getPairExplanation(value, dealerCard, action);
                break;
        }

        return { action, explanation, type, value };
    }

    getHardExplanation(total, dealerCard, action) {
        const dealerText = dealerCard === 11 ? 'Ace' : dealerCard;
        const actionText = this.getActionName(action);
        
        // Check if this was a surrender scenario that was converted to a fallback
        const basicStrategyData = this.getBasicStrategyData();
        const originalAction = basicStrategyData.hard[total]?.[dealerCard] || 'H';
        const surrenderNotAllowed = originalAction === 'SU' && action !== 'SU';

        if (total <= 8) {
            return `With a hard ${total}, you should always hit regardless of dealer card. Your hand is too weak to stand.`;
        } else if (total === 9) {
            return action === 'D' ? 
                `Double down against dealer ${dealerText} to maximize value when you're likely to improve to a strong hand.` :
                `Hit against dealer ${dealerText} as doubling isn't favorable here.`;
        } else if (total === 10 || total === 11) {
            return action === 'D' ? 
                `Double down on ${total} against dealer ${dealerText} - excellent opportunity for a strong total.` :
                `Hit against dealer ${dealerText}. While ${total} is strong, doubling isn't optimal here.`;
        } else if (total === 12) {
            return action === 'S' ? 
                `Stand against dealer ${dealerText}. Dealer has high bust probability, so avoid risking your own bust.` :
                `Hit against dealer ${dealerText}. Despite bust risk, dealer's strong card requires improvement.`;
        } else if (total >= 13 && total <= 16) {
            if (action === 'S') {
                return `Stand on ${total} against dealer ${dealerText}. Dealer is likely to bust with this weak upcard.`;
            } else if (action === 'SU') {
                return `Surrender if allowed, otherwise hit. This is a tough spot against dealer ${dealerText}.`;
            } else if (surrenderNotAllowed) {
                return `Hit on ${total} against dealer ${dealerText}. (Note: Optimal play is surrender, but since it's not allowed, hit is the best alternative.)`;
            } else {
                return `Hit on ${total} against dealer ${dealerText}. Dealer's strong card requires you to improve.`;
            }
        } else {
            return `Always stand on ${total} - you have a strong hand that wins most of the time.`;
        }
    }

    getSoftExplanation(total, dealerCard, action) {
        const dealerText = dealerCard === 11 ? 'Ace' : dealerCard;
        const nonAceCard = total - 11;
        
        if (action === 'D') {
            return `Double down on A,${nonAceCard} against dealer ${dealerText}. Soft hands give you flexibility with low bust risk.`;
        } else if (action === 'S') {
            return `Stand on A,${nonAceCard} against dealer ${dealerText}. You have a strong total and dealer is likely to make a worse hand.`;
        } else {
            return `Hit on A,${nonAceCard} against dealer ${dealerText}. You need to improve this soft total, and you can't bust.`;
        }
    }

    getPairExplanation(pairValue, dealerCard, action) {
        const dealerText = dealerCard === 11 ? 'Ace' : dealerCard;
        
        // Get the numeric value for pairs
        const getPairTotal = (pairValue) => {
            if (pairValue === 'A') return 12; // A-A can be 12 or 2
            if (['J', 'Q', 'K'].includes(pairValue)) return 20;
            return parseInt(pairValue) * 2;
        };
        
        if (action === 'SP') {
            if (pairValue === 'A') {
                return `Always split Aces. Two chances at blackjack is better than one mediocre hand of 12.`;
            } else if (pairValue === '8') {
                return `Always split 8s. Playing 16 is terrible, but two hands starting with 8 have potential.`;
            } else {
                return `Split ${pairValue}s against dealer ${dealerText}. Better expected value than playing as ${getPairTotal(pairValue)}.`;
            }
        } else if (pairValue === '5') {
            return `Never split 5s - treat as 10 and double down against dealer ${dealerText}.`;
        } else if (['10', 'J', 'Q', 'K'].includes(pairValue)) {
            return `Never split ${pairValue}s. You have 20 - one of the best hands possible. Don't break it up.`;
        } else {
            return `Don't split ${pairValue}s against dealer ${dealerText}. Better to ${action === 'D' ? 'double' : action === 'S' ? 'stand' : 'hit'} on ${getPairTotal(pairValue)}.`;
        }
    }

    displayStrategyResult(strategy, playerHand, dealerCard) {
        const strategyResult = document.getElementById('strategy-result');
        const actionText = document.querySelector('.action-text');
        const explanationText = document.querySelector('.explanation-text');

        if (!strategyResult || !actionText || !explanationText) return;

        actionText.textContent = this.getActionName(strategy.action);
        actionText.className = `action-text ${this.getActionClass(strategy.action)}`;
        explanationText.textContent = strategy.explanation;

        strategyResult.style.display = 'block';
        strategyResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setupPracticeMode() {
        const startBtn = document.getElementById('start-practice');
        const nextBtn = document.getElementById('next-scenario');
        const resetBtn = document.getElementById('reset-practice');
        const showHintsCheckbox = document.getElementById('show-hints');
        const timedCheckbox = document.getElementById('timed-practice');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startPractice());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPracticeScenario());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetPractice());
        }

        // Set up action button listeners
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.practiceMode.active && this.practiceMode.currentScenario) {
                    this.handlePracticeAnswer(e.target.dataset.action);
                }
            });
        });

        if (timedCheckbox) {
            timedCheckbox.addEventListener('change', (e) => {
                if (e.target.checked && this.practiceMode.active) {
                    this.startPracticeTimer();
                } else {
                    this.stopPracticeTimer();
                }
            });
        }
    }

    startPractice() {
        this.practiceMode.active = true;
        this.practiceMode.stats = { correct: 0, total: 0 };
        this.practiceMode.scenarios = this.generatePracticeScenarios();
        
        document.getElementById('practice-scenario').style.display = 'block';
        document.getElementById('start-practice').disabled = true;
        document.getElementById('next-scenario').disabled = false;
        
        if (document.getElementById('timed-practice').checked) {
            this.startPracticeTimer();
        }
        
        this.nextPracticeScenario();
    }

    generatePracticeScenarios() {
        const scenarios = [];
        const surrenderAllowed = document.getElementById('surrender-allowed')?.checked ?? true;
        const basicStrategyData = this.getBasicStrategyData();
        
        // Hard totals scenarios
        for (let total = 9; total <= 16; total++) {
            for (let dealer = 2; dealer <= 11; dealer++) {
                const originalAction = basicStrategyData.hard[total]?.[dealer];
                if (originalAction) {
                    const correctAction = this.getActionWithSurrenderRule('hard', total, dealer, originalAction);
                    
                    scenarios.push({
                        type: 'hard',
                        playerHand: total,
                        dealerCard: dealer,
                        correctAction: correctAction,
                        surrenderAllowed: surrenderAllowed
                    });
                }
            }
        }
        
        // Soft totals scenarios
        for (let total = 13; total <= 21; total++) {
            for (let dealer = 2; dealer <= 11; dealer++) {
                const originalAction = basicStrategyData.soft[total]?.[dealer];
                if (originalAction) {
                    const correctAction = this.getActionWithSurrenderRule('soft', total, dealer, originalAction);
                    
                    scenarios.push({
                        type: 'soft',
                        playerHand: total,
                        dealerCard: dealer,
                        correctAction: correctAction,
                        surrenderAllowed: surrenderAllowed
                    });
                }
            }
        }
        
        // Pairs scenarios
        ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach(pair => {
            for (let dealer = 2; dealer <= 11; dealer++) {
                const originalAction = basicStrategyData.pairs[pair]?.[dealer];
                if (originalAction) {
                    const correctAction = this.getActionWithSurrenderRule('pairs', pair, dealer, originalAction);
                    
                    scenarios.push({
                        type: 'pairs',
                        playerHand: pair,
                        dealerCard: dealer,
                        correctAction: correctAction,
                        surrenderAllowed: surrenderAllowed
                    });
                }
            }
        });
        
        // Shuffle scenarios
        return scenarios.sort(() => Math.random() - 0.5);
    }

    nextPracticeScenario() {
        if (this.practiceMode.scenarios.length === 0) {
            this.endPractice();
            return;
        }
        
        this.practiceMode.currentScenario = this.practiceMode.scenarios.shift();
        this.displayPracticeScenario();
        document.getElementById('practice-feedback').style.display = 'none';
        
        // Re-enable action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }

    displayPracticeScenario() {
        const scenario = this.practiceMode.currentScenario;
        const playerHandDiv = document.getElementById('practice-player-hand');
        const dealerHandDiv = document.getElementById('practice-dealer-hand');
        
        if (scenario.type === 'hard') {
            playerHandDiv.innerHTML = `<div class=\"practice-card\">${scenario.playerHand}</div>`;
        } else if (scenario.type === 'soft') {
            const nonAce = scenario.playerHand - 11;
            playerHandDiv.innerHTML = `<div class=\"practice-card red\">A</div><div class=\"practice-card\">${nonAce}</div>`;
        } else if (scenario.type === 'pairs') {
            const card = scenario.playerHand;
            const color = (card === 'A' || card === '2' || card === '3') ? 'red' : '';
            playerHandDiv.innerHTML = `<div class=\"practice-card ${color}\">${card}</div><div class=\"practice-card ${color}\">${card}</div>`;
        }
        
        const dealerCard = scenario.dealerCard === 11 ? 'A' : scenario.dealerCard;
        const dealerColor = (dealerCard === 'A' || parseInt(dealerCard) % 2 === 0) ? 'red' : '';
        dealerHandDiv.innerHTML = `<div class=\"practice-card ${dealerColor}\">${dealerCard}</div>`;
    }

    convertActionToCode(userAction) {
        const actionMapping = {
            'hit': 'H',
            'stand': 'S', 
            'double': 'D',
            'split': 'SP',
            'surrender': 'SU'
        };
        return actionMapping[userAction] || 'H';
    }

    handlePracticeAnswer(userAction) {
        const scenario = this.practiceMode.currentScenario;
        const userActionCode = this.convertActionToCode(userAction);
        const surrenderAllowed = document.getElementById('surrender-allowed')?.checked ?? true;
        
        // Validate the action considering surrender availability
        let isCorrect = userActionCode === scenario.correctAction;
        
        // Special handling for surrender scenarios
        if (!surrenderAllowed && userAction === 'surrender') {
            // User clicked surrender but it's not allowed - this is always wrong
            isCorrect = false;
        }
        
        this.practiceMode.stats.total++;
        if (isCorrect) {
            this.practiceMode.stats.correct++;
        }
        
        this.showPracticeFeedback(userAction, scenario.correctAction, isCorrect);
        this.updatePracticeStats();
        
        // Disable action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.action === userAction) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
            if (this.convertActionToCode(btn.dataset.action) === scenario.correctAction && !isCorrect) {
                btn.classList.add('correct');
            }
        });
        
        // Enable next button
        document.getElementById('next-scenario').disabled = false;
    }

    showPracticeFeedback(userAction, correctAction, isCorrect) {
        const feedbackDiv = document.getElementById('practice-feedback');
        const resultDiv = feedbackDiv.querySelector('.feedback-result');
        const explanationDiv = feedbackDiv.querySelector('.feedback-explanation');
        
        resultDiv.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';
        resultDiv.className = `feedback-result ${isCorrect ? 'correct' : 'incorrect'}`;
        
        if (!isCorrect) {
            explanationDiv.textContent = `Correct answer: ${this.getActionName(correctAction)}. ${this.getScenarioExplanation()}`;
        } else {
            explanationDiv.textContent = `Well done! ${this.getScenarioExplanation()}`;
        }
        
        feedbackDiv.style.display = 'block';
    }

    getScenarioExplanation() {
        const scenario = this.practiceMode.currentScenario;
        if (scenario.type === 'hard') {
            return this.getHardExplanation(scenario.playerHand, scenario.dealerCard, scenario.correctAction);
        } else if (scenario.type === 'soft') {
            return this.getSoftExplanation(scenario.playerHand, scenario.dealerCard, scenario.correctAction);
        } else {
            return this.getPairExplanation(scenario.playerHand, scenario.dealerCard, scenario.correctAction);
        }
    }

    updatePracticeStats() {
        document.getElementById('correct-count').textContent = this.practiceMode.stats.correct;
        document.getElementById('total-count').textContent = this.practiceMode.stats.total;
        
        const accuracy = this.practiceMode.stats.total > 0 ? 
            Math.round((this.practiceMode.stats.correct / this.practiceMode.stats.total) * 100) : 0;
        document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
    }

    startPracticeTimer() {
        this.practiceMode.startTime = new Date();
        document.getElementById('timer-stat').style.display = 'block';
        
        this.practiceMode.timer = setInterval(() => {
            const elapsed = new Date() - this.practiceMode.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('practice-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopPracticeTimer() {
        if (this.practiceMode.timer) {
            clearInterval(this.practiceMode.timer);
            this.practiceMode.timer = null;
        }
    }

    resetPractice() {
        this.practiceMode.active = false;
        this.practiceMode.currentScenario = null;
        this.practiceMode.scenarios = [];
        this.practiceMode.stats = { correct: 0, total: 0 };
        
        this.stopPracticeTimer();
        
        document.getElementById('practice-scenario').style.display = 'none';
        document.getElementById('start-practice').disabled = false;
        document.getElementById('next-scenario').disabled = true;
        document.getElementById('timer-stat').style.display = 'none';
        
        this.updatePracticeStats();
    }

    endPractice() {
        this.practiceMode.active = false;
        this.stopPracticeTimer();
        
        const accuracy = Math.round((this.practiceMode.stats.correct / this.practiceMode.stats.total) * 100);
        alert(`Practice complete!\\n\\nAccuracy: ${accuracy}%\\nCorrect: ${this.practiceMode.stats.correct}/${this.practiceMode.stats.total}`);
        
        this.resetPractice();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📖 Strategy Guide page loaded');
    
    window.StrategyGuideApp = new StrategyGuideApp();
    await window.StrategyGuideApp.init();
});

export { StrategyGuideApp };