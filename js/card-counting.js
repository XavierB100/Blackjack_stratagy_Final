/**
 * Card Counting Page JavaScript
 * Handles counting drills and interactive features
 */

import { Navigation } from './modules/Navigation.js';
import { Deck, Card } from './modules/Deck.js';

class CardCountingApp {
    constructor() {
        this.navigation = null;
        this.practiceMode = false;
        this.drillActive = false;
        this.currentCard = null;
        this.drillDeck = null;
        this.drillStats = {
            cardsRemaining: 52,
            startTime: null,
            endTime: null,
            actualCount: 0,
            userCount: 0
        };
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🧮 Initializing Card Counting App...');
            
            // Initialize navigation
            this.navigation = new Navigation();
            await this.navigation.init();
            
            // Set up drill functionality
            this.setupDrillControls();
            this.setupCountingPractice();
            this.setupKeyboardShortcuts();
            
            this.isInitialized = true;
            console.log('✅ Card Counting App initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Card Counting App:', error);
        }
    }

    setupDrillControls() {
        // Setup tab switching
        this.setupTabSwitching();
        
        // Setup speed counting drill controls
        this.setupSpeedDrillControls();
        
        // Setup true count drill controls
        this.setupTrueCountDrillControls();
        
        // Setup casino scenarios controls
        this.setupCasinoScenariosControls();
        
        // Setup betting practice controls
        this.setupBettingPracticeControls();
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const practiceSections = document.querySelectorAll('.practice-section');

        tabButtons.forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const drillType = tabBtn.getAttribute('data-drill');
                this.switchToDrill(drillType, tabBtn, tabButtons, practiceSections);
            });
        });
    }

    switchToDrill(drillType, activeBtn, allTabBtns, allSections) {
        console.log(`🎯 Switching to ${drillType} drill`);
        
        // Stop any active drill
        if (this.drillActive) {
            this.stopDrill();
        }
        
        // Update tab buttons and ARIA attributes
        allTabBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
        
        // Hide all sections
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show selected section
        const targetSectionId = `${drillType}-drill`;
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            
            // Initialize drill-specific functionality
            this.initializeDrill(drillType);
        }
    }

    initializeDrill(drillType) {
        switch(drillType) {
            case 'speed':
                this.resetDrill();
                break;
            case 'true-count':
                this.generateTrueCountScenario();
                break;
            case 'scenario':
                this.initializeCasinoScenario();
                break;
            case 'betting':
                this.generateBettingScenario();
                break;
        }
    }

    setupSpeedDrillControls() {
        const startDrillBtn = document.getElementById('start-drill');
        const nextCardBtn = document.getElementById('next-card');
        const resetDrillBtn = document.getElementById('reset-drill');
        const userCountInput = document.getElementById('user-count');

        if (startDrillBtn) {
            startDrillBtn.addEventListener('click', () => this.startDrill());
        }

        if (nextCardBtn) {
            nextCardBtn.addEventListener('click', () => this.showNextCard());
        }

        if (resetDrillBtn) {
            resetDrillBtn.addEventListener('click', () => this.resetDrill());
        }

        if (userCountInput) {
            userCountInput.addEventListener('change', (e) => {
                this.drillStats.userCount = parseInt(e.target.value) || 0;
            });

            // Allow Enter key to advance to next card
            userCountInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.drillActive) {
                    this.showNextCard();
                }
            });
        }
    }

    setupCountingPractice() {
        // Add click handlers for card value groups
        document.querySelectorAll('.card-display').forEach(card => {
            card.addEventListener('click', () => {
                this.highlightCardValue(card);
            });
        });

        // Add hover effects for educational purposes
        document.querySelectorAll('.value-group').forEach(group => {
            group.addEventListener('mouseenter', () => {
                this.showValueGroupInfo(group);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.drillActive) return;

            switch(e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    this.showNextCard();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetDrill();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.stopDrill();
                    break;
            }
        });
    }

    startDrill() {
        console.log('🎯 Starting counting drill');
        
        // Create new shuffled deck
        this.drillDeck = new Deck(1);
        this.drillDeck.shuffle();
        
        // Reset drill stats
        this.drillStats = {
            cardsRemaining: 52,
            startTime: new Date(),
            endTime: null,
            actualCount: 0,
            userCount: 0
        };
        
        this.drillActive = true;
        
        // Update UI
        this.updateDrillButtons(true);
        this.updateDrillDisplay();
        this.showNextCard();
        
        // Start timer
        this.startDrillTimer();
    }

    showNextCard() {
        if (!this.drillActive || !this.drillDeck || this.drillDeck.cards.length === 0) {
            this.completeDrill();
            return;
        }

        // Deal next card
        this.currentCard = this.drillDeck.dealCard();
        this.drillStats.cardsRemaining = this.drillDeck.cards.length;
        
        // Update actual count
        this.drillStats.actualCount += this.currentCard.getHiLoValue();
        
        // Update display
        this.displayCurrentCard();
        this.updateDrillStats();
        
        console.log(`Card: ${this.currentCard}, Count: ${this.drillStats.actualCount}`);
    }

    displayCurrentCard() {
        const currentCardElement = document.getElementById('current-card');
        if (currentCardElement && this.currentCard) {
            currentCardElement.innerHTML = `
                <div class="drill-card ${this.currentCard.color}">
                    ${this.currentCard.getDisplayValue()}${this.currentCard.suit}
                </div>
            `;
            
            // Add animation
            currentCardElement.style.animation = 'none';
            currentCardElement.offsetHeight; // Trigger reflow
            currentCardElement.style.animation = 'cardFlip 0.5s ease';
        }
    }

    updateDrillStats() {
        const cardsRemainingElement = document.getElementById('cards-remaining');
        if (cardsRemainingElement) {
            cardsRemainingElement.textContent = this.drillStats.cardsRemaining;
        }

        // Update timer
        this.updateTimer();
    }

    updateTimer() {
        const timerElement = document.getElementById('drill-time');
        if (timerElement && this.drillStats.startTime) {
            const elapsed = new Date() - this.drillStats.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    completeDrill() {
        console.log('✅ Drill completed');
        
        this.drillActive = false;
        this.drillStats.endTime = new Date();
        
        // Calculate results
        const accuracy = this.calculateAccuracy();
        const totalTime = (this.drillStats.endTime - this.drillStats.startTime) / 1000;
        
        // Update UI
        this.updateDrillButtons(false);
        this.showDrillResults(accuracy, totalTime);
        
        // Log results
        console.log(`Drill Results: Accuracy: ${accuracy}%, Time: ${totalTime}s`);
    }

    calculateAccuracy() {
        const expectedCount = 0; // Balanced deck should end at 0
        const userFinalCount = this.drillStats.userCount;
        const actualFinalCount = this.drillStats.actualCount;
        
        // Check if user's count matches the actual count
        if (userFinalCount === actualFinalCount) {
            return 100;
        }
        
        // Calculate percentage based on how close they were
        const difference = Math.abs(userFinalCount - actualFinalCount);
        const maxError = Math.max(10, Math.abs(actualFinalCount)); // Allow for some error tolerance
        
        return Math.max(0, Math.round((1 - difference / maxError) * 100));
    }

    showDrillResults(accuracy, totalTime) {
        const resultElement = document.getElementById('drill-result');
        const finalCountElement = document.getElementById('final-count');
        const accuracyElement = document.getElementById('accuracy');
        const finalTimeElement = document.getElementById('final-time');
        
        if (resultElement) {
            resultElement.style.display = 'block';
        }
        
        if (finalCountElement) {
            finalCountElement.textContent = this.drillStats.userCount;
            finalCountElement.className = this.drillStats.userCount === this.drillStats.actualCount ? 'correct' : 'incorrect';
        }
        
        if (accuracyElement) {
            accuracyElement.textContent = `${accuracy}%`;
            accuracyElement.className = accuracy >= 95 ? 'excellent' : accuracy >= 80 ? 'good' : 'needs-work';
        }
        
        if (finalTimeElement) {
            const minutes = Math.floor(totalTime / 60);
            const seconds = Math.round(totalTime % 60);
            finalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Scroll to results
        setTimeout(() => {
            resultElement?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    resetDrill() {
        console.log('🔄 Resetting drill');
        
        this.drillActive = false;
        this.currentCard = null;
        this.drillDeck = null;
        
        // Reset UI
        this.updateDrillButtons(false);
        this.resetDrillDisplay();
        this.hideDrillResults();
        
        // Reset user count input
        const userCountInput = document.getElementById('user-count');
        if (userCountInput) {
            userCountInput.value = '0';
            userCountInput.disabled = true;
        }
    }

    stopDrill() {
        if (this.drillActive) {
            this.drillActive = false;
            this.updateDrillButtons(false);
            console.log('⏹️ Drill stopped');
        }
    }

    updateDrillButtons(drillActive) {
        const startBtn = document.getElementById('start-drill');
        const nextBtn = document.getElementById('next-card');
        const userCountInput = document.getElementById('user-count');
        
        if (startBtn) {
            startBtn.disabled = drillActive;
            startBtn.textContent = drillActive ? 'Drill Active' : 'Start Drill';
        }
        
        if (nextBtn) {
            nextBtn.disabled = !drillActive;
        }
        
        if (userCountInput) {
            userCountInput.disabled = !drillActive;
        }
    }

    resetDrillDisplay() {
        const currentCardElement = document.getElementById('current-card');
        const cardsRemainingElement = document.getElementById('cards-remaining');
        const timerElement = document.getElementById('drill-time');
        
        if (currentCardElement) {
            currentCardElement.textContent = 'Click "Start Drill" to begin';
        }
        
        if (cardsRemainingElement) {
            cardsRemainingElement.textContent = '52';
        }
        
        if (timerElement) {
            timerElement.textContent = '0:00';
        }
    }

    hideDrillResults() {
        const resultElement = document.getElementById('drill-result');
        if (resultElement) {
            resultElement.style.display = 'none';
        }
    }

    startDrillTimer() {
        if (this.drillActive) {
            this.timerInterval = setInterval(() => {
                if (this.drillActive) {
                    this.updateTimer();
                } else {
                    clearInterval(this.timerInterval);
                }
            }, 1000);
        }
    }

    highlightCardValue(cardElement) {
        // Remove previous highlights
        document.querySelectorAll('.card-display').forEach(card => {
            card.classList.remove('highlighted');
        });
        
        // Highlight selected card
        cardElement.classList.add('highlighted');
        
        // Show card value info
        const cardRank = cardElement.textContent;
        const hiLoValue = this.getCardHiLoValue(cardRank);
        
        this.showCardValueInfo(cardRank, hiLoValue);
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            cardElement.classList.remove('highlighted');
        }, 2000);
    }

    getCardHiLoValue(rank) {
        // Create a temporary card to get Hi-Lo value
        const tempCard = new Card('♠', rank);
        return tempCard.getHiLoValue();
    }

    showCardValueInfo(rank, value) {
        // Could show a tooltip or info panel
        const message = `${rank}: ${value > 0 ? '+' : ''}${value} in Hi-Lo system`;
        console.log(message);
        
        // Simple visual feedback
        const infoElement = document.createElement('div');
        infoElement.className = 'card-info-tooltip';
        infoElement.textContent = message;
        infoElement.style.position = 'fixed';
        infoElement.style.top = '10px';
        infoElement.style.right = '10px';
        infoElement.style.background = 'rgba(0, 0, 0, 0.8)';
        infoElement.style.color = '#ffd700';
        infoElement.style.padding = '10px';
        infoElement.style.borderRadius = '5px';
        infoElement.style.zIndex = '1000';
        
        document.body.appendChild(infoElement);
        
        setTimeout(() => {
            if (infoElement.parentNode) {
                infoElement.parentNode.removeChild(infoElement);
            }
        }, 3000);
    }

    showValueGroupInfo(groupElement) {
        const groupType = groupElement.classList.contains('positive') ? 'positive' :
                         groupElement.classList.contains('negative') ? 'negative' : 'neutral';
        
        let message = '';
        switch(groupType) {
            case 'positive':
                message = 'Low cards (+1): More high cards remain in deck, favorable for player';
                break;
            case 'negative':
                message = 'High cards (-1): Fewer high cards remain in deck, unfavorable for player';
                break;
            case 'neutral':
                message = 'Neutral cards (0): No effect on card count';
                break;
        }
        
        console.log(message);
    }

    // Export drill statistics
    exportDrillStats() {
        if (!this.drillStats.startTime) return null;
        
        return {
            accuracy: this.calculateAccuracy(),
            totalTime: this.drillStats.endTime ? 
                (this.drillStats.endTime - this.drillStats.startTime) / 1000 : null,
            cardsProcessed: 52 - this.drillStats.cardsRemaining,
            actualFinalCount: this.drillStats.actualCount,
            userFinalCount: this.drillStats.userCount,
            date: new Date().toISOString()
        };
    }

    // Get performance metrics
    getPerformanceMetrics() {
        const stats = this.exportDrillStats();
        if (!stats) return null;
        
        return {
            ...stats,
            cardsPerSecond: stats.totalTime ? (stats.cardsProcessed / stats.totalTime).toFixed(2) : null,
            grade: this.getPerformanceGrade(stats.accuracy),
            recommendations: this.getRecommendations(stats)
        };
    }

    getPerformanceGrade(accuracy) {
        if (accuracy >= 95) return 'A';
        if (accuracy >= 90) return 'B';
        if (accuracy >= 80) return 'C';
        if (accuracy >= 70) return 'D';
        return 'F';
    }

    getRecommendations(stats) {
        const recommendations = [];
        
        if (stats.accuracy < 90) {
            recommendations.push('Focus on memorizing Hi-Lo card values');
            recommendations.push('Practice with fewer cards first');
        }
        
        if (stats.totalTime && stats.cardsPerSecond < 1) {
            recommendations.push('Work on increasing counting speed');
            recommendations.push('Practice daily to build muscle memory');
        }
        
        if (Math.abs(stats.userFinalCount - stats.actualFinalCount) > 2) {
            recommendations.push('Double-check your addition/subtraction');
            recommendations.push('Count in smaller increments to avoid errors');
        }
        
        return recommendations;
    }

    // TRUE COUNT DRILL METHODS
    setupTrueCountDrillControls() {
        const checkBtn = document.getElementById('check-true-count');
        const nextBtn = document.getElementById('next-true-count');
        const answerInput = document.getElementById('true-count-answer');

        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkTrueCountAnswer());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.generateTrueCountScenario());
        }

        if (answerInput) {
            answerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.checkTrueCountAnswer();
                }
            });
        }

        // Initialize stats
        this.trueCountStats = {
            correct: 0,
            total: 0,
            currentScenario: null
        };
    }

    generateTrueCountScenario() {
        // Generate random running count (-20 to +20)
        const runningCount = Math.floor(Math.random() * 41) - 20;
        
        // Generate random decks remaining (0.5 to 6.0)
        const decksRemaining = Math.round((Math.random() * 5.5 + 0.5) * 2) / 2;
        
        // Calculate correct true count
        const correctTrueCount = Math.round((runningCount / decksRemaining) * 2) / 2;
        
        this.trueCountStats.currentScenario = {
            runningCount,
            decksRemaining,
            correctTrueCount
        };
        
        // Update display
        const runningCountDisplay = document.getElementById('running-count-display');
        const decksRemainingDisplay = document.getElementById('decks-remaining-display');
        const answerInput = document.getElementById('true-count-answer');
        const resultDiv = document.getElementById('true-count-result');
        
        if (runningCountDisplay) {
            runningCountDisplay.textContent = runningCount > 0 ? `+${runningCount}` : runningCount.toString();
        }
        
        if (decksRemainingDisplay) {
            decksRemainingDisplay.textContent = decksRemaining.toString();
        }
        
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }
        
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
        
        console.log(`🧮 New True Count scenario: RC=${runningCount}, Decks=${decksRemaining}, Correct TC=${correctTrueCount}`);
    }

    checkTrueCountAnswer() {
        const answerInput = document.getElementById('true-count-answer');
        const resultDiv = document.getElementById('true-count-result');
        const resultText = resultDiv?.querySelector('.result-text');
        
        if (!answerInput || !this.trueCountStats.currentScenario) return;
        
        const userAnswer = parseFloat(answerInput.value);
        const correctAnswer = this.trueCountStats.currentScenario.correctTrueCount;
        
        this.trueCountStats.total++;
        
        let isCorrect = Math.abs(userAnswer - correctAnswer) < 0.1;
        
        if (isCorrect) {
            this.trueCountStats.correct++;
        }
        
        // Show result
        if (resultText) {
            if (isCorrect) {
                resultText.innerHTML = `
                    <span style="color: #22c55e;">✅ Correct!</span>
                    <br>True Count: ${correctAnswer}
                `;
            } else {
                resultText.innerHTML = `
                    <span style="color: #dc2626;">❌ Incorrect</span>
                    <br>Your answer: ${userAnswer}
                    <br>Correct answer: ${correctAnswer}
                    <br>Formula: ${this.trueCountStats.currentScenario.runningCount} ÷ ${this.trueCountStats.currentScenario.decksRemaining} = ${correctAnswer}
                `;
            }
        }
        
        if (resultDiv) {
            resultDiv.style.display = 'block';
        }
        
        this.updateTrueCountStats();
    }

    updateTrueCountStats() {
        const correctElement = document.getElementById('true-count-correct');
        const totalElement = document.getElementById('true-count-total');
        const accuracyElement = document.getElementById('true-count-accuracy');
        
        if (correctElement) {
            correctElement.textContent = this.trueCountStats.correct;
        }
        
        if (totalElement) {
            totalElement.textContent = this.trueCountStats.total;
        }
        
        if (accuracyElement) {
            const accuracy = this.trueCountStats.total > 0 ? 
                Math.round((this.trueCountStats.correct / this.trueCountStats.total) * 100) : 0;
            accuracyElement.textContent = `${accuracy}%`;
        }
    }

    // CASINO SCENARIOS DRILL METHODS
    setupCasinoScenariosControls() {
        const scenarioButtons = document.querySelectorAll('.scenario-btn');
        const startBtn = document.getElementById('start-scenario');
        const pauseBtn = document.getElementById('pause-scenario');
        const countInput = document.getElementById('scenario-count');

        scenarioButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectCasinoScenario(btn, scenarioButtons);
            });
        });

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCasinoScenario());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseCasinoScenario());
        }

        if (countInput) {
            countInput.addEventListener('change', (e) => {
                this.scenarioUserCount = parseInt(e.target.value) || 0;
            });
        }

        // Initialize scenario state
        this.scenarioState = {
            active: false,
            type: 'basic',
            deck: null,
            actualCount: 0,
            userCount: 0,
            round: 0
        };
    }

    selectCasinoScenario(activeBtn, allBtns) {
        const scenarioType = activeBtn.getAttribute('data-scenario');
        
        // Update button states
        allBtns.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
        
        this.scenarioState.type = scenarioType;
        this.updateScenarioDisplay(scenarioType);
        
        console.log(`🎰 Selected casino scenario: ${scenarioType}`);
    }

    updateScenarioDisplay(scenarioType) {
        const titleElement = document.getElementById('scenario-title');
        const descriptionElement = document.getElementById('scenario-description');
        
        const scenarios = {
            basic: {
                title: 'Basic Casino Table',
                description: 'Standard 6-deck game, moderate pace, few distractions'
            },
            crowded: {
                title: 'Crowded Table',
                description: 'Full table, 7 players, conversations and distractions'
            },
            fast: {
                title: 'Fast Dealer',
                description: 'Experienced dealer, rapid card dealing, time pressure'
            },
            shuffle: {
                title: 'Shuffle Tracking',
                description: 'Practice maintaining count through shuffle breaks'
            }
        };
        
        if (titleElement && scenarios[scenarioType]) {
            titleElement.textContent = scenarios[scenarioType].title;
        }
        
        if (descriptionElement && scenarios[scenarioType]) {
            descriptionElement.textContent = scenarios[scenarioType].description;
        }
    }

    initializeCasinoScenario() {
        // Reset to basic scenario
        this.scenarioState.type = 'basic';
        this.updateScenarioDisplay('basic');
        
        // Reset input
        const countInput = document.getElementById('scenario-count');
        if (countInput) {
            countInput.value = '0';
        }
    }

    startCasinoScenario() {
        console.log(`🎰 Starting ${this.scenarioState.type} casino scenario`);
        
        this.scenarioState.active = true;
        this.scenarioState.deck = new Deck(6); // 6-deck shoe
        this.scenarioState.deck.shuffle();
        this.scenarioState.actualCount = 0;
        this.scenarioState.userCount = 0;
        this.scenarioState.round = 0;
        
        // Update UI
        this.updateScenarioButtons(true);
        this.dealScenarioRound();
    }

    pauseCasinoScenario() {
        this.scenarioState.active = false;
        this.updateScenarioButtons(false);
        console.log('⏸️ Casino scenario paused');
    }

    dealScenarioRound() {
        if (!this.scenarioState.active || !this.scenarioState.deck) return;
        
        this.scenarioState.round++;
        
        // Simulate dealing cards to multiple players and dealer
        const numPlayers = this.scenarioState.type === 'crowded' ? 7 : 
                           this.scenarioState.type === 'basic' ? 4 : 5;
        
        let roundCards = [];
        
        // Deal 2 cards to each player and dealer
        for (let round = 0; round < 2; round++) {
            for (let player = 0; player <= numPlayers; player++) {
                if (this.scenarioState.deck.cards.length > 0) {
                    const card = this.scenarioState.deck.dealCard();
                    roundCards.push(card);
                    this.scenarioState.actualCount += card.getHiLoValue();
                }
            }
        }
        
        // Display the cards
        this.displayScenarioCards(roundCards);
        
        // Set timeout for next round based on scenario type
        const delay = this.scenarioState.type === 'fast' ? 2000 : 
                     this.scenarioState.type === 'crowded' ? 4000 : 3000;
        
        setTimeout(() => {
            if (this.scenarioState.active && this.scenarioState.deck.cards.length > 10) {
                this.dealScenarioRound();
            } else {
                this.endScenario();
            }
        }, delay);
    }

    displayScenarioCards(cards) {
        // Enhanced card display with visual representation
        const dealerArea = document.getElementById('scenario-dealer-cards');
        const playerAreas = document.getElementById('scenario-player-areas');
        
        if (dealerArea) {
            dealerArea.innerHTML = `
                <div class="scenario-round-header">Round ${this.scenarioState.round}</div>
                <div class="cards-dealt-visual">
                    ${this.createCardVisualGrid(cards)}
                </div>
                <div class="round-summary">
                    <span class="cards-count">${cards.length} cards dealt</span>
                    <span class="count-change">Running Count: ${this.scenarioState.actualCount}</span>
                </div>
            `;
        }
        
        if (playerAreas) {
            const numPlayers = this.scenarioState.type === 'crowded' ? 7 : 
                              this.scenarioState.type === 'basic' ? 4 : 5;
            playerAreas.innerHTML = this.generatePlayerPositionsHTML(numPlayers, cards);
        }
        
        // Add realistic distraction elements based on scenario type
        this.addScenarioDistractions();
        
        console.log(`🃏 Round ${this.scenarioState.round}: Dealt ${cards.length} cards, Running Count: ${this.scenarioState.actualCount}`);
    }

    createCardVisualGrid(cards) {
        return cards.map(card => `
            <div class="card-mini ${card.color}" data-value="${card.getHiLoValue()}">
                <div class="card-face">
                    ${card.getDisplayValue()}${card.suit}
                </div>
                <div class="card-value">${card.getHiLoValue() > 0 ? '+' : ''}${card.getHiLoValue()}</div>
            </div>
        `).join('');
    }

    generatePlayerPositionsHTML(numPlayers, cards) {
        let html = '<div class="table-positions">';
        
        // Distribute cards among players (simplified)
        let cardIndex = 0;
        for (let i = 1; i <= numPlayers; i++) {
            const playerCards = cards.slice(cardIndex, cardIndex + 2);
            cardIndex += 2;
            
            html += `
                <div class="player-position" data-position="${i}">
                    <div class="player-name">${i === 4 ? 'You' : `Player ${i}`}</div>
                    <div class="player-hand">
                        ${playerCards.map(card => `
                            <div class="table-card ${card.color}">
                                ${card.getDisplayValue()}${card.suit}
                            </div>
                        `).join('')}
                    </div>
                    ${i === 4 ? '<div class="your-position-marker">▼ Your Position</div>' : ''}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    addScenarioDistractions() {
        if (!this.scenarioState.active) return;
        
        const distractionContainer = document.getElementById('scenario-distractions') || this.createDistractionsContainer();
        
        switch(this.scenarioState.type) {
            case 'crowded':
                this.addCrowdedTableDistractions(distractionContainer);
                break;
            case 'fast':
                this.addFastDealerPressure(distractionContainer);
                break;
            case 'shuffle':
                this.addShuffleTrackingElements(distractionContainer);
                break;
            default:
                this.addBasicDistractions(distractionContainer);
        }
    }

    createDistractionsContainer() {
        const container = document.createElement('div');
        container.id = 'scenario-distractions';
        container.className = 'scenario-distractions';
        
        const scenarioDisplay = document.getElementById('scenario-display');
        if (scenarioDisplay) {
            scenarioDisplay.appendChild(container);
        }
        
        return container;
    }

    addCrowdedTableDistractions(container) {
        const chatMessages = [
            "What should I hit on?", "Dealer's got 20 again!", "I'm down $300 tonight",
            "Insurance anyone?", "Should I split these?", "Hit me!", "I'll stay",
            "Double down time", "This shoe is terrible", "Cocktail waitress!"
        ];
        
        // Random chatter every 3-8 seconds
        setTimeout(() => {
            if (this.scenarioState.active && this.scenarioState.type === 'crowded') {
                this.showTableChatter(container, chatMessages[Math.floor(Math.random() * chatMessages.length)]);
                this.addCrowdedTableDistractions(container); // Recursive call
            }
        }, 3000 + Math.random() * 5000);
    }

    addFastDealerPressure(container) {
        const pressureBar = document.createElement('div');
        pressureBar.className = 'counting-pressure-bar';
        pressureBar.innerHTML = `
            <div class="pressure-label">Decision Time</div>
            <div class="pressure-fill"></div>
        `;
        
        container.appendChild(pressureBar);
        
        // Animate pressure countdown
        setTimeout(() => {
            const fill = pressureBar.querySelector('.pressure-fill');
            if (fill) {
                fill.style.animation = 'pressureCountdown 2s linear';
            }
        }, 100);
    }

    addShuffleTrackingElements(container) {
        // Show cut card position and deck status
        const shuffleInfo = document.createElement('div');
        shuffleInfo.className = 'shuffle-tracking-info';
        shuffleInfo.innerHTML = `
            <div class="deck-penetration">
                <label>Deck Penetration:</label>
                <div class="penetration-bar">
                    <div class="penetration-fill" style="width: ${100 - (this.scenarioState.deck.cards.length / 312) * 100}%"></div>
                </div>
                <span class="penetration-text">${Math.round(100 - (this.scenarioState.deck.cards.length / 312) * 100)}%</span>
            </div>
            <div class="cut-card-position">Cut card at ~75% penetration</div>
        `;
        
        container.appendChild(shuffleInfo);
        
        // Trigger shuffle break when appropriate
        if (this.scenarioState.deck.cards.length < 80) { // ~75% penetration
            setTimeout(() => this.triggerShuffleBreak(), 2000);
        }
    }

    addBasicDistractions(container) {
        // Light, occasional distractions for basic scenario
        if (Math.random() < 0.1) {
            this.showTableChatter(container, "Nice hand!");
        }
    }

    showTableChatter(container, message) {
        const chatterBubble = document.createElement('div');
        chatterBubble.className = 'table-chatter-bubble';
        chatterBubble.textContent = message;
        chatterBubble.style.left = Math.random() * 60 + 20 + '%';
        chatterBubble.style.top = Math.random() * 40 + 30 + '%';
        
        container.appendChild(chatterBubble);
        
        // Remove after animation
        setTimeout(() => {
            if (chatterBubble.parentNode) {
                chatterBubble.parentNode.removeChild(chatterBubble);
            }
        }, 3000);
    }

    triggerShuffleBreak() {
        console.log('🔄 Triggering shuffle break');
        this.scenarioState.active = false;
        
        const feedbackDiv = document.getElementById('scenario-feedback');
        if (feedbackDiv) {
            feedbackDiv.querySelector('.feedback-content').innerHTML = `
                <h4>🔄 Shuffle Break</h4>
                <p><strong>Maintain your count!</strong></p>
                <p>Pre-shuffle running count: ${this.scenarioState.actualCount}</p>
                <p>Shuffling deck... Please wait while maintaining your mental count.</p>
                <div class="shuffle-animation">🃏 🔄 🃏 🔄 🃏</div>
                <button class="btn btn-primary" onclick="window.CardCountingApp.resumeAfterShuffle()">Resume After Shuffle</button>
            `;
            feedbackDiv.style.display = 'block';
        }
        
        // Reset deck and count after shuffle
        setTimeout(() => {
            this.scenarioState.deck = new Deck(6);
            this.scenarioState.deck.shuffle();
            this.scenarioState.actualCount = 0;
        }, 3000);
    }

    resumeAfterShuffle() {
        console.log('▶️ Resuming after shuffle');
        this.scenarioState.active = true;
        this.scenarioState.round = 0;
        
        const feedbackDiv = document.getElementById('scenario-feedback');
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }
        
        // Continue with new shoe
        setTimeout(() => this.dealScenarioRound(), 1000);
    }

    endScenario() {
        console.log('🏁 Casino scenario completed');
        this.scenarioState.active = false;
        this.updateScenarioButtons(false);
        
        // Show feedback
        const feedbackDiv = document.getElementById('scenario-feedback');
        if (feedbackDiv) {
            const accuracy = this.calculateScenarioAccuracy();
            feedbackDiv.querySelector('.feedback-content').innerHTML = `
                <h4>Scenario Complete!</h4>
                <p>Actual Count: ${this.scenarioState.actualCount}</p>
                <p>Your Count: ${this.scenarioState.userCount}</p>
                <p>Accuracy: ${accuracy}%</p>
            `;
            feedbackDiv.style.display = 'block';
        }
    }

    calculateScenarioAccuracy() {
        const difference = Math.abs(this.scenarioState.userCount - this.scenarioState.actualCount);
        const maxError = Math.max(10, Math.abs(this.scenarioState.actualCount));
        return Math.max(0, Math.round((1 - difference / maxError) * 100));
    }

    updateScenarioButtons(active) {
        const startBtn = document.getElementById('start-scenario');
        const pauseBtn = document.getElementById('pause-scenario');
        const countInput = document.getElementById('scenario-count');
        
        if (startBtn) {
            startBtn.disabled = active;
            startBtn.textContent = active ? 'Scenario Running...' : 'Start Scenario';
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = !active;
        }
        
        if (countInput) {
            countInput.disabled = !active;
        }
    }

    // BETTING PRACTICE DRILL METHODS
    setupBettingPracticeControls() {
        const placeBetBtn = document.getElementById('place-bet');
        const nextScenarioBtn = document.getElementById('next-bet-scenario');
        const betAmountInput = document.getElementById('bet-amount');

        if (placeBetBtn) {
            placeBetBtn.addEventListener('click', () => this.placeBet());
        }

        if (nextScenarioBtn) {
            nextScenarioBtn.addEventListener('click', () => this.generateBettingScenario());
        }

        if (betAmountInput) {
            betAmountInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.placeBet();
                }
            });
        }

        // Initialize betting stats
        this.bettingStats = {
            scenarios: 0,
            currentScenario: null,
            bankroll: 10000
        };
    }

    generateBettingScenario() {
        // Generate diverse scenario types with different complexity levels
        const scenarioTypes = [
            'basic_bet_sizing', 'high_count_opportunity', 'negative_count_preservation',
            'table_limit_constraints', 'heat_management', 'variance_recovery',
            'bankroll_pressure', 'camouflage_betting', 'wonging_decision', 'team_play'
        ];
        
        const selectedType = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];
        this.bettingStats.currentScenario = this.createScenarioByType(selectedType);
        
        // Update display with enhanced information
        this.updateBettingScenarioDisplay();
        
        console.log(`💰 New betting scenario (${selectedType}): TC=${this.bettingStats.currentScenario.trueCount}, Bankroll=$${this.bettingStats.currentScenario.bankroll}`);
    }

    createScenarioByType(type) {
        const baseScenario = {
            type: type,
            minBet: 25,
            maxBet: 500,
            tableLimits: { min: 25, max: 500 },
            sessionTime: Math.floor(Math.random() * 180) + 60, // 60-240 minutes
            previousSessions: Math.floor(Math.random() * 10), // 0-10 previous sessions
        };

        switch(type) {
            case 'basic_bet_sizing':
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 6 + 1) * 2) / 2, // +1 to +6
                    bankroll: 15000 + Math.random() * 10000, // $15K-25K
                    riskLevel: 'Low',
                    scenario: 'Basic Bet Sizing',
                    description: 'Standard positive count - convert true count to bet units',
                    difficulty: 'Beginner'
                };

            case 'high_count_opportunity':
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 4 + 6) * 2) / 2, // +6 to +10
                    bankroll: 20000 + Math.random() * 15000, // $20K-35K
                    riskLevel: 'Low',
                    scenario: 'High Count Opportunity',
                    description: 'Rare high count - maximize profit while managing heat',
                    difficulty: 'Intermediate',
                    heatFactor: Math.random() * 0.7 + 0.3 // 30-100% heat
                };

            case 'negative_count_preservation':
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 4 - 6) * 2) / 2, // -6 to -2
                    bankroll: 8000 + Math.random() * 7000, // $8K-15K
                    riskLevel: 'Medium',
                    scenario: 'Bankroll Preservation',
                    description: 'Negative count - minimize losses and preserve bankroll',
                    difficulty: 'Beginner'
                };

            case 'table_limit_constraints':
                const highMinTable = Math.random() < 0.5;
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 6 + 2) * 2) / 2, // +2 to +8
                    bankroll: 10000 + Math.random() * 10000,
                    tableLimits: highMinTable ? 
                        { min: 100, max: 1000 } : 
                        { min: 25, max: 200 },
                    minBet: highMinTable ? 100 : 25,
                    maxBet: highMinTable ? 1000 : 200,
                    riskLevel: highMinTable ? 'High' : 'Medium',
                    scenario: 'Table Limit Constraints',
                    description: `${highMinTable ? 'High-limit' : 'Low-limit'} table - adjust strategy to limits`,
                    difficulty: 'Intermediate'
                };

            case 'heat_management':
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 4 + 3) * 2) / 2, // +3 to +7
                    bankroll: 15000 + Math.random() * 10000,
                    riskLevel: 'Medium',
                    scenario: 'Heat Management',
                    description: 'Pit boss watching - balance profit with camouflage',
                    difficulty: 'Advanced',
                    heatFactor: Math.random() * 0.4 + 0.6, // 60-100% heat
                    pitBossPresent: true,
                    previousSuspicion: true
                };

            case 'variance_recovery':
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 6 + 1) * 2) / 2, // +1 to +7
                    bankroll: 3000 + Math.random() * 5000, // $3K-8K (reduced bankroll)
                    riskLevel: 'High',
                    scenario: 'Variance Recovery',
                    description: 'Depleted bankroll from bad run - conservative approach needed',
                    difficulty: 'Advanced',
                    previousLosses: 7000 + Math.random() * 5000, // Lost $7K-12K
                    sessionCount: Math.floor(Math.random() * 5) + 3 // 3-8 losing sessions
                };

            case 'bankroll_pressure':
                const lowBankroll = 2000 + Math.random() * 3000; // $2K-5K
                return {
                    ...baseScenario,
                    trueCount: Math.round((Math.random() * 4 + 2) * 2) / 2, // +2 to +6
                    bankroll: lowBankroll,
                    riskLevel: 'Critical',
                    scenario: 'Critical Bankroll',
                    description: 'Dangerously low bankroll - survival betting required',
                    difficulty: 'Expert',
                    riskOfRuin: this.calculateRiskOfRuin(lowBankroll, 25, 100)
                };

            default:
                return this.createScenarioByType('basic_bet_sizing');
        }
    }

    calculateRiskOfRuin(bankroll, minBet, maxBet) {
        // Simplified risk of ruin calculation
        const units = bankroll / minBet;
        const spread = maxBet / minBet;
        
        // Approximation formula for risk of ruin
        if (units < 100) return Math.min(95, 40 - units * 0.3);
        if (units < 200) return Math.max(5, 20 - units * 0.1);
        return Math.max(1, 10 - units * 0.02);
    }

    updateBettingScenarioDisplay() {
        const scenario = this.bettingStats.currentScenario;
        if (!scenario) return;
        
        // Update basic scenario information
        const trueCountElement = document.getElementById('betting-true-count');
        const bankrollElement = document.getElementById('current-bankroll');
        const riskLevelElement = document.getElementById('risk-level');
        const betAmountInput = document.getElementById('bet-amount');
        const feedbackDiv = document.getElementById('bet-feedback');
        
        if (trueCountElement) {
            trueCountElement.textContent = scenario.trueCount > 0 ? `+${scenario.trueCount}` : scenario.trueCount.toString();
        }
        
        if (bankrollElement) {
            bankrollElement.textContent = `$${Math.round(scenario.bankroll).toLocaleString()}`;
        }
        
        if (riskLevelElement) {
            riskLevelElement.textContent = scenario.riskLevel;
            riskLevelElement.className = `risk-${scenario.riskLevel.toLowerCase()}`;
        }
        
        // Add enhanced scenario information
        this.displayEnhancedScenarioInfo(scenario);
        
        // Update betting constraints
        if (betAmountInput) {
            betAmountInput.value = '';
            betAmountInput.min = scenario.minBet || scenario.tableLimits?.min || 25;
            betAmountInput.max = scenario.maxBet || scenario.tableLimits?.max || 500;
            betAmountInput.step = 5;
            betAmountInput.focus();
        }
        
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }
    }

    displayEnhancedScenarioInfo(scenario) {
        // Create or update enhanced scenario info panel
        let infoPanel = document.getElementById('enhanced-scenario-info');
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.id = 'enhanced-scenario-info';
            infoPanel.className = 'enhanced-scenario-info';
            
            const countSituation = document.querySelector('.count-situation');
            if (countSituation) {
                countSituation.appendChild(infoPanel);
            }
        }
        
        let enhancedInfo = `
            <div class="scenario-header">
                <h4>${scenario.scenario || 'Betting Scenario'}</h4>
                <div class="difficulty-badge difficulty-${scenario.difficulty?.toLowerCase() || 'beginner'}">
                    ${scenario.difficulty || 'Beginner'}
                </div>
            </div>
            <div class="scenario-description">
                <p>${scenario.description}</p>
            </div>
            <div class="scenario-details">
                <div class="detail-item">
                    <label>Table Limits:</label>
                    <span>$${scenario.tableLimits?.min || scenario.minBet} - $${scenario.tableLimits?.max || scenario.maxBet}</span>
                </div>
        `;
        
        // Add scenario-specific information
        if (scenario.heatFactor) {
            enhancedInfo += `
                <div class="detail-item heat-warning">
                    <label>Heat Level:</label>
                    <div class="heat-meter">
                        <div class="heat-fill" style="width: ${scenario.heatFactor * 100}%"></div>
                    </div>
                    <span>${Math.round(scenario.heatFactor * 100)}%</span>
                </div>
            `;
        }
        
        if (scenario.riskOfRuin) {
            enhancedInfo += `
                <div class="detail-item risk-warning">
                    <label>Risk of Ruin:</label>
                    <span class="risk-percentage">${Math.round(scenario.riskOfRuin)}%</span>
                </div>
            `;
        }
        
        if (scenario.previousLosses) {
            enhancedInfo += `
                <div class="detail-item loss-info">
                    <label>Previous Losses:</label>
                    <span>$${Math.round(scenario.previousLosses).toLocaleString()} over ${scenario.sessionCount} sessions</span>
                </div>
            `;
        }
        
        if (scenario.pitBossPresent) {
            enhancedInfo += `
                <div class="detail-item warning">
                    <label>⚠️ Pit Boss Present:</label>
                    <span>Extra camouflage required</span>
                </div>
            `;
        }
        
        enhancedInfo += `
            </div>
            <div class="betting-guidelines">
                <h5>Key Considerations:</h5>
                <ul>
                    ${this.generateBettingGuidelines(scenario)}
                </ul>
            </div>
        `;
        
        infoPanel.innerHTML = enhancedInfo;
    }

    generateBettingGuidelines(scenario) {
        const guidelines = [];
        
        switch(scenario.type) {
            case 'basic_bet_sizing':
                guidelines.push('Use standard TC to betting unit conversion');
                guidelines.push('Bet 1 unit per true count above +1');
                break;
                
            case 'high_count_opportunity':
                guidelines.push('Maximize profit - rare opportunity');
                guidelines.push('Consider heat management with large bets');
                guidelines.push('May justify maximum table bet');
                break;
                
            case 'negative_count_preservation':
                guidelines.push('Minimize losses with minimum bets');
                guidelines.push('Consider leaving table if count stays negative');
                guidelines.push('Preserve bankroll for positive opportunities');
                break;
                
            case 'heat_management':
                guidelines.push('Balance profit with camouflage');
                guidelines.push('Consider smaller bet spread');
                guidelines.push('Avoid obvious counting patterns');
                break;
                
            case 'variance_recovery':
                guidelines.push('Conservative betting required');
                guidelines.push('Reduce normal bet sizes by 25-50%');
                guidelines.push('Focus on bankroll preservation');
                break;
                
            case 'bankroll_pressure':
                guidelines.push('Survival mode - extreme caution');
                guidelines.push('Consider stopping play if bet would exceed 5% of bankroll');
                guidelines.push('May need to find lower limit table');
                break;
                
            default:
                guidelines.push('Apply standard betting principles');
                guidelines.push('Consider all risk factors');
        }
        
        return guidelines.map(g => `<li>${g}</li>`).join('');
    }

    placeBet() {
        const betAmountInput = document.getElementById('bet-amount');
        const scenario = this.bettingStats.currentScenario;
        
        if (!betAmountInput || !scenario) return;
        
        const userBet = parseInt(betAmountInput.value);
        const optimalBet = this.calculateOptimalBet(scenario);
        
        this.bettingStats.scenarios++;
        
        this.showBettingFeedback(userBet, optimalBet, scenario);
        this.updateBettingStats();
    }

    calculateOptimalBet(scenario) {
        const { trueCount, bankroll, minBet, maxBet } = scenario;
        
        // Simple betting strategy: bet minBet * (trueCount - 1) when TC > 1
        if (trueCount <= 1) {
            return minBet;
        }
        
        const multiplier = Math.max(1, trueCount - 1);
        const calculatedBet = minBet * multiplier;
        
        // Apply bankroll constraints (don't bet more than 2% of bankroll)
        const maxBankrollBet = Math.floor(bankroll * 0.02);
        
        return Math.min(maxBet, Math.max(minBet, Math.min(calculatedBet, maxBankrollBet)));
    }

    showBettingFeedback(userBet, optimalBet, scenario) {
        const feedbackDiv = document.getElementById('bet-feedback');
        const resultElement = feedbackDiv?.querySelector('.feedback-result');
        const optimalBetElement = document.getElementById('optimal-bet-amount');
        const explanationElement = feedbackDiv?.querySelector('.bet-explanation');
        
        if (!feedbackDiv) return;
        
        const difference = Math.abs(userBet - optimalBet);
        const isGoodBet = difference <= Math.max(25, optimalBet * 0.2);
        
        if (resultElement) {
            resultElement.innerHTML = isGoodBet ? 
                '<span style="color: #22c55e;">✅ Good bet sizing!</span>' :
                '<span style="color: #f59e0b;">⚠️ Suboptimal bet size</span>';
        }
        
        if (optimalBetElement) {
            optimalBetElement.textContent = optimalBet;
        }
        
        if (explanationElement) {
            let explanation = '';
            if (scenario.trueCount <= 1) {
                explanation = 'True count ≤ 1: Bet minimum to preserve bankroll';
            } else {
                explanation = `True count = ${scenario.trueCount}: Increase bet size proportionally`;
            }
            explanationElement.textContent = explanation;
        }
        
        feedbackDiv.style.display = 'block';
    }

    updateBettingStats() {
        const scenariosElement = document.getElementById('betting-scenarios-count');
        
        if (scenariosElement) {
            scenariosElement.textContent = this.bettingStats.scenarios;
        }
    }
}

// Add CSS for drill animations
const style = document.createElement('style');
style.textContent = `
    @keyframes cardFlip {
        0% { transform: scale(1); }
        50% { transform: scale(1.1) rotateY(180deg); }
        100% { transform: scale(1) rotateY(0deg); }
    }
    
    .drill-card {
        font-size: 2rem;
        font-weight: bold;
        padding: 20px;
        border: 2px solid #ffd700;
        border-radius: 8px;
        background: white;
        color: inherit;
        display: inline-block;
        min-width: 80px;
        text-align: center;
    }
    
    .drill-card.red {
        color: #dc2626;
    }
    
    .drill-card.black {
        color: #000;
    }
    
    .card-display.highlighted {
        background: #ffd700 !important;
        color: #000 !important;
        transform: scale(1.1);
        box-shadow: 0 0 10px #ffd700;
    }
    
    .correct {
        color: #22c55e !important;
    }
    
    .incorrect {
        color: #dc2626 !important;
    }
    
    .excellent {
        color: #22c55e !important;
    }
    
    .good {
        color: #3b82f6 !important;
    }
    
    .needs-work {
        color: #f59e0b !important;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🃏 Card Counting page loaded');
    
    window.CardCountingApp = new CardCountingApp();
    await window.CardCountingApp.init();
});

export { CardCountingApp };