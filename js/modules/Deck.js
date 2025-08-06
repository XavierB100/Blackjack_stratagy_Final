/**
 * Deck Class - Manages cards and shuffling
 */

export class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.calculateValue();
        this.color = (suit === '♠' || suit === '♣') ? 'black' : 'red';
    }

    calculateValue() {
        if (this.rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(this.rank)) return 10;
        return parseInt(this.rank);
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }

    getDisplayValue() {
        return this.rank;
    }

    isAce() {
        return this.rank === 'A';
    }

    isFaceCard() {
        return ['J', 'Q', 'K'].includes(this.rank);
    }

    isTenValue() {
        return this.value === 10;
    }

    // For card counting
    getHiLoValue() {
        if (['2', '3', '4', '5', '6'].includes(this.rank)) return 1;
        if (['7', '8', '9'].includes(this.rank)) return 0;
        if (['10', 'J', 'Q', 'K', 'A'].includes(this.rank)) return -1;
        return 0;
    }
}

export class Deck {
    constructor(numDecks = 6) {
        this.numDecks = numDecks;
        this.cards = [];
        this.discardPile = [];
        this.shufflePoint = Math.floor(52 * numDecks * 0.25); // Shuffle at 75% penetration
        
        this.createDeck();
        this.shuffle();
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.cards = [];
        
        for (let deck = 0; deck < this.numDecks; deck++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    this.cards.push(new Card(suit, rank));
                }
            }
        }
        
        console.log(`🎴 Created deck with ${this.cards.length} cards (${this.numDecks} deck${this.numDecks > 1 ? 's' : ''})`);
    }

    shuffle() {
        // Add discarded cards back to deck
        this.cards = [...this.cards, ...this.discardPile];
        this.discardPile = [];
        
        // If no cards, recreate deck
        if (this.cards.length === 0) {
            this.createDeck();
        }
        
        // Fisher-Yates shuffle algorithm with multiple passes for better randomization
        for (let pass = 0; pass < 3; pass++) {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }
        
        console.log(`🔀 Deck shuffled: ${this.cards.length} cards`);
    }

    dealCard() {
        if (this.cards.length === 0) {
            console.warn('⚠️ No cards left in deck!');
            this.shuffle();
            if (this.cards.length === 0) {
                throw new Error('Cannot deal card: deck is empty after shuffle');
            }
        }
        
        const card = this.cards.pop();
        
        // Only add to discard pile if not reshuffling immediately
        if (!this.needsReshuffle()) {
            this.discardPile.push(card);
        }
        
        return card;
    }

    needsReshuffle() {
        return this.cards.length <= this.shufflePoint;
    }
    
    /**
     * Force a reshuffle of all cards
     */
    forceReshuffle() {
        this.shuffle();
        console.log('🔄 Forced deck reshuffle');
    }

    getCardsRemaining() {
        return this.cards.length;
    }

    getDecksRemaining() {
        return Math.ceil(this.cards.length / 52);
    }

    getPenetration() {
        const totalCards = 52 * this.numDecks;
        return ((totalCards - this.cards.length) / totalCards) * 100;
    }

    /**
     * Peek at next card without dealing it (for testing)
     */
    peek() {
        return this.cards[this.cards.length - 1];
    }
    
    /**
     * Get cards remaining as percentage
     */
    getCardsRemainingPercentage() {
        const totalCards = 52 * this.numDecks;
        return (this.cards.length / totalCards) * 100;
    }

    // Get specific cards (for testing)
    getCards(cardStrings) {
        return cardStrings.map(cardStr => {
            const suit = cardStr.slice(-1);
            const rank = cardStr.slice(0, -1);
            return new Card(suit, rank);
        });
    }

    // Set specific order (for testing)
    setOrder(cardStrings) {
        this.cards = this.getCards(cardStrings);
    }

    reset() {
        this.discardPile = [];
        this.createDeck();
        this.shuffle();
    }
}