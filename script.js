// JavaScript код будет добавлен позже 

// Глобальные переменные
let balance = parseInt(localStorage.getItem('gameBalance')) || 1000;
const symbols = ['🍒', '🍊', '🍇', '🍋', '🍉', '🍎', '7️⃣'];
const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// DOM элементы
const balanceElement = document.getElementById('balance');
const notification = document.getElementById('notification');
const navButtons = document.querySelectorAll('.nav-btn');
const gameContainers = document.querySelectorAll('.game-container');

// Инициализация
updateBalance();

// Навигация между играми
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const gameId = button.dataset.game;
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        gameContainers.forEach(container => {
            container.classList.add('hidden');
            if (container.id === gameId) {
                container.classList.remove('hidden');
            }
        });
    });
});

// Функции уведомлений
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateBalance() {
    balanceElement.textContent = balance;
    localStorage.setItem('gameBalance', balance);
}

// Добавляем кнопку сброса баланса
const resetButton = document.createElement('button');
resetButton.className = 'reset-btn';
resetButton.textContent = 'Сбросить прогресс';
resetButton.style.position = 'fixed';
resetButton.style.bottom = '20px';
resetButton.style.right = '20px';
resetButton.style.padding = '10px 20px';
resetButton.style.background = '#ff6b6b';
resetButton.style.border = 'none';
resetButton.style.borderRadius = '25px';
resetButton.style.color = '#fff';
resetButton.style.cursor = 'pointer';
resetButton.style.zIndex = '1000';

resetButton.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
        balance = 1000;
        updateBalance();
        showNotification('Прогресс сброшен!', 'info');
    }
});

document.body.appendChild(resetButton);

// Слоты
const slots = {
    elements: [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ],
    betInput: document.getElementById('bet-amount'),
    spinButton: document.getElementById('spin-btn'),
    isSpinning: false,

    init() {
        this.spinButton.addEventListener('click', () => this.spin());
    },

    async spin() {
        if (this.isSpinning) return;
        
        const bet = parseInt(this.betInput.value);
        if (bet > balance) {
            showNotification('Недостаточно средств!', 'error');
            return;
        }
        if (bet < 10) {
            showNotification('Минимальная ставка - 10!', 'error');
            return;
        }

        this.isSpinning = true;
        balance -= bet;
        updateBalance();

        this.elements.forEach(slot => slot.classList.add('spinning'));
        this.spinButton.disabled = true;

        const results = [];
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            results.push(symbol);
            this.elements[i].textContent = symbol;
            this.elements[i].classList.remove('spinning');
        }

        const win = this.calculateWin(results, bet);
        if (win > 0) {
            balance += win;
            updateBalance();
            showNotification(`Поздравляем! Вы выиграли ${win}!`, 'success');
        } else {
            showNotification('Попробуйте еще раз!', 'info');
        }

        this.isSpinning = false;
        this.spinButton.disabled = false;
    },

    calculateWin(results, bet) {
        if (results[0] === results[1] && results[1] === results[2]) {
            return bet * 5;
        } else if (results[0] === results[1] || results[1] === results[2]) {
            return bet * 2;
        }
        return 0;
    }
};

// Кости
const dice = {
    elements: [
        document.getElementById('dice1'),
        document.getElementById('dice2')
    ],
    betInput: document.getElementById('dice-bet'),
    rollButton: document.getElementById('roll-btn'),
    isRolling: false,

    init() {
        this.rollButton.addEventListener('click', () => this.roll());
    },

    async roll() {
        if (this.isRolling) return;

        const bet = parseInt(this.betInput.value);
        if (bet > balance) {
            showNotification('Недостаточно средств!', 'error');
            return;
        }
        if (bet < 10) {
            showNotification('Минимальная ставка - 10!', 'error');
            return;
        }

        this.isRolling = true;
        balance -= bet;
        updateBalance();

        this.elements.forEach(dice => dice.classList.add('rolling'));
        this.rollButton.disabled = true;

        const results = [];
        for (let i = 0; i < 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const face = Math.floor(Math.random() * 6) + 1;
            results.push(face);
            this.elements[i].textContent = diceFaces[face - 1];
            this.elements[i].classList.remove('rolling');
        }

        const sum = results[0] + results[1];
        let win = 0;
        if (sum === 7 || sum === 11) {
            win = bet * 2;
        } else if (sum === 2 || sum === 12) {
            win = bet * 3;
        }

        if (win > 0) {
            balance += win;
            updateBalance();
            showNotification(`Поздравляем! Вы выиграли ${win}!`, 'success');
        } else {
            showNotification('Попробуйте еще раз!', 'info');
        }

        this.isRolling = false;
        this.rollButton.disabled = false;
    }
};

// Блэкджек
const blackjack = {
    deck: [],
    playerCards: [],
    dealerCards: [],
    betInput: document.getElementById('bj-bet'),
    dealButton: document.getElementById('deal-btn'),
    hitButton: document.getElementById('hit-btn'),
    standButton: document.getElementById('stand-btn'),
    playerCardsContainer: document.querySelector('.player-cards'),
    dealerCardsContainer: document.querySelector('.dealer-cards'),
    currentBet: 0,

    init() {
        this.dealButton.addEventListener('click', () => this.deal());
        this.hitButton.addEventListener('click', () => this.hit());
        this.standButton.addEventListener('click', () => this.stand());
    },

    createDeck() {
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({ suit, value });
            }
        }
        // Перемешивание колоды
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    deal() {
        const bet = parseInt(this.betInput.value);
        if (bet > balance) {
            showNotification('Недостаточно средств!', 'error');
            return;
        }
        if (bet < 10) {
            showNotification('Минимальная ставка - 10!', 'error');
            return;
        }

        this.currentBet = bet;
        balance -= bet;
        updateBalance();

        this.createDeck();
        this.playerCards = [this.deck.pop(), this.deck.pop()];
        this.dealerCards = [this.deck.pop(), this.deck.pop()];

        this.updateDisplay();
        this.dealButton.disabled = true;
        this.hitButton.disabled = false;
        this.standButton.disabled = false;

        if (this.calculateScore(this.playerCards) === 21) {
            this.stand();
        }
    },

    hit() {
        this.playerCards.push(this.deck.pop());
        this.updateDisplay();

        if (this.calculateScore(this.playerCards) > 21) {
            this.stand();
        }
    },

    async stand() {
        this.hitButton.disabled = true;
        this.standButton.disabled = true;

        while (this.calculateScore(this.dealerCards) < 17) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.dealerCards.push(this.deck.pop());
            this.updateDisplay();
        }

        const playerScore = this.calculateScore(this.playerCards);
        const dealerScore = this.calculateScore(this.dealerCards);

        if (playerScore > 21) {
            showNotification('Перебор! Вы проиграли!', 'error');
        } else if (dealerScore > 21) {
            balance += this.currentBet * 2;
            updateBalance();
            showNotification('Дилер перебрал! Вы выиграли!', 'success');
        } else if (playerScore > dealerScore) {
            balance += this.currentBet * 2;
            updateBalance();
            showNotification('Вы выиграли!', 'success');
        } else if (playerScore < dealerScore) {
            showNotification('Дилер выиграл!', 'error');
        } else {
            balance += this.currentBet;
            updateBalance();
            showNotification('Ничья!', 'info');
        }

        this.dealButton.disabled = false;
    },

    calculateScore(cards) {
        let score = 0;
        let aces = 0;

        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }

        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    },

    updateDisplay() {
        this.playerCardsContainer.innerHTML = this.playerCards
            .map(card => `<div class="card">${card.value}${card.suit}</div>`)
            .join('');
        this.dealerCardsContainer.innerHTML = this.dealerCards
            .map(card => `<div class="card">${card.value}${card.suit}</div>`)
            .join('');
    }
};

// Мини-игры для заработка
const earnGames = {
    // Игра "Поймай монетку"
    catchCoin: {
        coin: document.getElementById('coin'),
        bucket: document.getElementById('bucket'),
        button: document.getElementById('catch-coin-btn'),
        isPlaying: false,
        score: 0,
        lastClickTime: 0,
        clickDelay: 10000, // 10 секунд в миллисекундах

        init() {
            this.button.addEventListener('click', () => this.start());
            this.coin.addEventListener('click', () => this.catch());
        },

        start() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.score = 0;
            this.lastClickTime = 0;
            this.button.textContent = 'Игра идет...';
            this.button.disabled = true;
            this.moveCoin();
        },

        moveCoin() {
            if (!this.isPlaying) return;
            const gameArea = this.coin.parentElement;
            const maxX = gameArea.clientWidth - this.coin.clientWidth;
            const maxY = gameArea.clientHeight - this.coin.clientHeight - this.bucket.clientHeight;

            this.coin.style.left = Math.random() * maxX + 'px';
            this.coin.style.top = Math.random() * maxY + 'px';

            setTimeout(() => this.moveCoin(), 2000);
        },

        catch() {
            if (!this.isPlaying) return;
            
            const currentTime = Date.now();
            const timeSinceLastClick = currentTime - this.lastClickTime;
            
            if (timeSinceLastClick < this.clickDelay) {
                const remainingTime = Math.ceil((this.clickDelay - timeSinceLastClick) / 1000);
                showNotification(`Подождите еще ${remainingTime} секунд!`, 'error');
                return;
            }

            this.lastClickTime = currentTime;
            this.score++;
            balance += 5;
            updateBalance();
            showNotification('+5 монет!', 'success');
            
            // Добавляем визуальный эффект для монетки
            this.coin.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.coin.style.transform = 'scale(1)';
            }, 200);
        },

        stop() {
            this.isPlaying = false;
            this.button.textContent = 'Играть';
            this.button.disabled = false;
            showNotification(`Игра окончена! Вы заработали ${this.score * 5} монет!`, 'info');
        }
    },

    // Игра "Память"
    memory: {
        container: document.getElementById('memory-game'),
        button: document.getElementById('memory-btn'),
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        isPlaying: false,

        symbols: ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎫', '🎪'],

        init() {
            this.button.addEventListener('click', () => this.start());
        },

        start() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.matchedPairs = 0;
            this.flippedCards = [];
            this.createCards();
            this.button.textContent = 'Игра идет...';
            this.button.disabled = true;
        },

        createCards() {
            this.container.innerHTML = '';
            this.cards = [...this.symbols, ...this.symbols]
                .sort(() => Math.random() - 0.5)
                .map((symbol, index) => {
                    const card = document.createElement('div');
                    card.className = 'memory-card';
                    card.dataset.symbol = symbol;
                    card.dataset.index = index;
                    card.addEventListener('click', () => this.flipCard(card));
                    this.container.appendChild(card);
                    return card;
                });
        },

        flipCard(card) {
            if (!this.isPlaying || this.flippedCards.length >= 2 || card.classList.contains('flipped')) return;

            card.textContent = card.dataset.symbol;
            card.classList.add('flipped');
            this.flippedCards.push(card);

            if (this.flippedCards.length === 2) {
                setTimeout(() => this.checkMatch(), 1000);
            }
        },

        checkMatch() {
            const [card1, card2] = this.flippedCards;
            if (card1.dataset.symbol === card2.dataset.symbol) {
                this.matchedPairs++;
                balance += 10;
                updateBalance();
                showNotification('+10 монет!', 'success');

                if (this.matchedPairs === this.symbols.length) {
                    this.stop();
                }
            } else {
                card1.textContent = '';
                card2.textContent = '';
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }
            this.flippedCards = [];
        },

        stop() {
            this.isPlaying = false;
            this.button.textContent = 'Начать игру';
            this.button.disabled = false;
            showNotification(`Игра окончена! Вы заработали ${this.matchedPairs * 10} монет!`, 'info');
        }
    },

    // Игра "Типограф"
    typing: {
        text: document.getElementById('typing-text'),
        input: document.getElementById('typing-input'),
        button: document.getElementById('typing-btn'),
        words: [
            'игра', 'монета', 'выигрыш', 'ставка', 'джекпот',
            'удача', 'победа', 'риск', 'шанс', 'приз',
            'слот', 'карта', 'кость', 'рулетка', 'покер'
        ],
        currentWord: '',
        score: 0,
        isPlaying: false,

        init() {
            this.button.addEventListener('click', () => this.start());
            this.input.addEventListener('input', () => this.checkInput());
        },

        start() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.score = 0;
            this.button.textContent = 'Игра идет...';
            this.button.disabled = true;
            this.input.disabled = false;
            this.input.value = '';
            this.input.focus();
            this.nextWord();
        },

        nextWord() {
            if (!this.isPlaying) return;
            this.currentWord = this.words[Math.floor(Math.random() * this.words.length)];
            this.text.textContent = this.currentWord;
            this.input.value = '';
        },

        checkInput() {
            if (!this.isPlaying) return;
            const input = this.input.value;
            const word = this.currentWord;

            if (input === word) {
                this.score++;
                balance += 1;
                updateBalance();
                showNotification('+1 монета!', 'success');
                this.nextWord();
            }
        },

        stop() {
            this.isPlaying = false;
            this.button.textContent = 'Начать печатать';
            this.button.disabled = false;
            this.input.disabled = true;
            showNotification(`Игра окончена! Вы заработали ${this.score} монет!`, 'info');
        }
    }
};

// Инициализация игр
slots.init();
dice.init();
blackjack.init();

// Инициализация мини-игр
earnGames.catchCoin.init();
earnGames.memory.init();
earnGames.typing.init(); 