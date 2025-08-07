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
        this.basicStrategyData = this.initializeBasicStrategyData();
    }

    async init() {
        try {
            console.log('📚 Initializing Strategy Guide...');
            
            // Initialize modules
            this.navigation = new Navigation();
            this.strategyHints = new StrategyHints();
            
            await this.navigation.init();
            await this.strategyHints.init();
            
            // Set up page-specific functionality
            this.setupChartTabs();
            this.populateStrategyCharts();
            this.setupInteractivity();
            this.setupQuickLookup();
            this.setupPracticeMode();
            
            this.isInitialized = true;
            console.log('✅ Strategy Guide initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Strategy Guide:', error);
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
        if (!this.strategyHints.isAvailable()) {
            console.warn('Strategy hints not available yet');
            return;
        }

        const charts = this.strategyHints.getAllCharts();
        
        // Populate hard totals chart
        this.populateHardChart(charts.hard);
        
        // Populate soft totals chart
        this.populateSoftChart(charts.soft);
        
        // Populate pairs chart
        this.populatePairsChart(charts.pairs);
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
                const action = hardData[total]?.[dealerCard] || 'H';
                
                cell.textContent = action;
                cell.className = `action-cell ${this.getActionClass(action)}`;
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
                cell.className = `action-cell ${this.getActionClass(action)}`;
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
                cell.className = `action-cell ${this.getActionClass(action)}`;
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
            'H': 'action-hit',
            'S': 'action-stand',
            'D': 'action-double',
            'SP': 'action-split',
            'SU': 'action-surrender'
        };
        return actionClasses[action] || 'action-hit';
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
        return this.strategyHints?.getStrategyChart(chartType);
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
                11: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'D', 11: 'D' },
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
                20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
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
                '10': { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' }
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
        let action = 'H';
        let explanation = '';

        switch (type) {
            case 'hard':
                const total = parseInt(value);
                action = this.basicStrategyData.hard[total]?.[dealerCard] || 'H';
                explanation = this.getHardExplanation(total, dealerCard, action);
                break;
            case 'soft':
                const softTotal = parseInt(value);
                action = this.basicStrategyData.soft[softTotal]?.[dealerCard] || 'H';
                explanation = this.getSoftExplanation(softTotal, dealerCard, action);
                break;
            case 'pairs':
                action = this.basicStrategyData.pairs[value]?.[dealerCard] || 'H';
                explanation = this.getPairExplanation(value, dealerCard, action);
                break;
        }

        return { action, explanation, type, value };
    }

    getHardExplanation(total, dealerCard, action) {
        const dealerText = dealerCard === 11 ? 'Ace' : dealerCard;
        const actionText = this.getActionName(action);

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
            return action === 'S' ? 
                `Stand on ${total} against dealer ${dealerText}. Dealer is likely to bust with this weak upcard.` :
                action === 'SU' ? 
                `Surrender if allowed, otherwise hit. This is a tough spot against dealer ${dealerText}.` :
                `Hit on ${total} against dealer ${dealerText}. Dealer's strong card requires you to improve.`;
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
        
        if (action === 'SP') {
            if (pairValue === 'A') {
                return `Always split Aces. Two chances at blackjack is better than one mediocre hand of 12.`;
            } else if (pairValue === '8') {
                return `Always split 8s. Playing 16 is terrible, but two hands starting with 8 have potential.`;
            } else {
                return `Split ${pairValue}s against dealer ${dealerText}. Better expected value than playing as ${parseInt(pairValue) * 2}.`;
            }
        } else if (pairValue === '5') {
            return `Never split 5s - treat as 10 and double down against dealer ${dealerText}.`;
        } else if (pairValue === '10') {
            return `Never split 10s. You have 20 - one of the best hands possible. Don't break it up.`;
        } else {
            return `Don't split ${pairValue}s against dealer ${dealerText}. Better to ${action === 'D' ? 'double' : action === 'S' ? 'stand' : 'hit'} on ${parseInt(pairValue) * 2}.`;
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
        
        // Hard totals scenarios
        for (let total = 9; total <= 16; total++) {
            for (let dealer = 2; dealer <= 11; dealer++) {
                scenarios.push({
                    type: 'hard',
                    playerHand: total,
                    dealerCard: dealer,
                    correctAction: this.basicStrategyData.hard[total][dealer]
                });
            }
        }
        
        // Soft totals scenarios
        for (let total = 13; total <= 18; total++) {
            for (let dealer = 2; dealer <= 11; dealer++) {
                scenarios.push({
                    type: 'soft',
                    playerHand: total,
                    dealerCard: dealer,
                    correctAction: this.basicStrategyData.soft[total][dealer]
                });
            }
        }
        
        // Pairs scenarios
        ['A', '2', '3', '6', '7', '8', '9'].forEach(pair => {
            for (let dealer = 2; dealer <= 11; dealer++) {
                scenarios.push({
                    type: 'pairs',
                    playerHand: pair,
                    dealerCard: dealer,
                    correctAction: this.basicStrategyData.pairs[pair][dealer]
                });
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
        const isCorrect = userActionCode === scenario.correctAction;
        
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