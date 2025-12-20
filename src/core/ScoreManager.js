export class ScoreManager {
    constructor() {
        this.highScores = [];
    }

    // Detect if running locally or on the internet
    getBaseUrl() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
        return isLocal ? '.' : 'https://maggiore-sys.com.br/game';
    }



    async loadHighScores() {
        try {
            const url = `${this.getBaseUrl()}/scores_cosmic.php?action=getTopScores`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.scores) {
                this.highScores = data.scores;
                return this.highScores;
            }
            return [];
        } catch (error) {
            console.error('Failed to load high scores:', error);
            // Return mock scores if failed (offline mode)
            return [];
        }
    }

    async saveHighScore(name, score) {
        try {
            const url = `${this.getBaseUrl()}/scores_cosmic.php?action=saveScore`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, score })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in saveHighScore:', error);
            return { success: false, error: error.message };
        }
    }

    static render(scores, listElement) {
        if (!listElement) return;
        listElement.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const entry = document.createElement('div');
            entry.className = 'score-entry';
            const rank = (i + 1).toString().padStart(2, '0');
            const data = scores[i] || { name: '---', score: 0 };

            entry.innerHTML = `
                <span>${rank} ${data.name}</span>
                <span>R$ ${data.score.toLocaleString('pt-BR')},00</span>
            `;
            listElement.appendChild(entry);
        }
    }
}
