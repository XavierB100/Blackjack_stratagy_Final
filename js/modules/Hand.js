/**
 * Hand Class - Manages a hand of cards
 */

export class Hand {
    constructor() {
        this.cards = [];
        this.isStanding = false;
        this.isDoubled = false;
        this.isSplit = false;
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard() {
        return this.cards.pop();
    }

    getValue() {
        let value = 0;
        let aces = 0;

        // Calculate base value and count aces
        for (const card of this.cards) {
            if (card.isAce()) {
                aces++;
                value += 11;
            } else {
                value += card.value;
            }
        }

        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10; // Convert ace from 11 to 1
            aces--;
        }

        return value;
    }

    isBusted() {
        return this.getValue() > 21;
    }

    isBlackjack() {
        return this.cards.length === 2 && this.getValue() === 21;
    }

    isSoft() {
        // A hand is soft if it contains an ace counted as 11
        if (!this.hasAce()) return false;
        
        let value = 0;
        let aces = 0;
        
        // Count non-ace cards first
        for (const card of this.cards) {
            if (card.isAce()) {
                aces++;
            } else {
                value += card.value;
            }
        }
        
        // Try to use one ace as 11, rest as 1
        if (aces > 0 && value + 11 + (aces - 1) <= 21) {
            return true;
        }
        
        return false;
    }

    isPair() {
        return this.cards.length === 2 && this.cards[0].rank === this.cards[1].rank;
    }

    canSplit() {
        return this.isPair() && this.cards.length === 2;
    }

    canDoubleDown() {
        return this.cards.length === 2 && !this.isDoubled;
    }

    getDisplayValue() {
        const value = this.getValue();
        if (this.isSoft() && value !== 21) {
            const lowValue = value - 10;
            return `${lowValue}/${value}`;
        }
        return value.toString();
    }

    getBasicStrategyKey() {
        // Returns a key for basic strategy lookup
        if (this.isPair()) {
            return `pair_${this.cards[0].rank}`;
        }
        
        if (this.isSoft()) {
            // For soft hands, use the non-ace card value
            const nonAceValue = this.cards.find(card => !card.isAce())?.value || 0;
            return `soft_${nonAceValue}`;
        }
        
        // Hard hand
        return `hard_${this.getValue()}`;
    }

    toString() {
        return this.cards.map(card => card.toString()).join(' ');
    }

    getCards() {
        return [...this.cards];
    }

    getCardCount() {
        return this.cards.length;
    }

    clear() {
        this.cards = [];
        this.isStanding = false;
        this.isDoubled = false;
        this.isSplit = false;
    }

    clone() {
        const newHand = new Hand();
        newHand.cards = [...this.cards];
        newHand.isStanding = this.isStanding;
        newHand.isDoubled = this.isDoubled;
        newHand.isSplit = this.isSplit;
        return newHand;
    }
    
    /**
     * Check if hand can be hit (not standing, not doubled, not busted)
     */
    canHit() {
        return !this.isStanding && !this.isDoubled && !this.isBusted();
    }
    
    /**
     * Get the best possible value without busting
     */
    getBestValue() {
        const currentValue = this.getValue();
        if (currentValue <= 21) return currentValue;
        
        // If busted, return the lowest possible value
        let value = 0;
        for (const card of this.cards) {
            if (card.isAce()) {
                value += 1;
            } else {
                value += card.value;
            }
        }
        return value;
    }

    // Statistical methods
    hasAce() {
        return this.cards.some(card => card.isAce());
    }

    getAceCount() {
        return this.cards.filter(card => card.isAce()).length;
    }

    getTenCount() {
        return this.cards.filter(card => card.isTenValue()).length;
    }

    getHighestCard() {
        return Math.max(...this.cards.map(card => card.value));
    }

    getLowestCard() {
        return Math.min(...this.cards.map(card => 
            card.isAce() ? 1 : card.value
        ));
    }
}