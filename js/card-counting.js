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