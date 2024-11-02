document.addEventListener('DOMContentLoaded', async function () {
    const tournamentPin = localStorage.getItem('tournamentPin');
    if (!tournamentPin) {
        alert('No tournament pin found. Please enter the pin on the homepage.');
        window.location.href = '/index.html';
        return;
    }

    // Display tournament pin
    const pinDisplayElement = document.getElementById('tournament-pin-display');
    if (pinDisplayElement && tournamentPin) {
        pinDisplayElement.textContent = `Tournament Pin: ${tournamentPin}`;
    }

    async function fetchTournamentDataByPin() {
        const requestBody = {
            httpMethod: 'POST',
            path: '/getTournamentData',
            body: { tournamentPin }
        };

        try {
            const response = await fetch(`https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod/getTournamentData`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('Tournament data not found');

            const data = await response.json();
            return parseDynamoDBResponse(data);
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            alert('Failed to load tournament data. Please check the pin and try again.');
        }
    }

    function parseDynamoDBResponse(data) {
        const parsedBody = JSON.parse(data.body);
        return {
            tournamentName: parsedBody.tournamentName || 'Unnamed Tournament',
            players: parsedBody.players.map(player => ({
                name: player.name,
                wins: player.wins,
                losses: player.losses,
                points: player.points,
                history: player.history || []
            })),
            matches: parsedBody.weekInfo.matches.map(match => ({
                team1: match.team1,
                team2: match.team2,
                isScoreSubmitted: match.isScoreSubmitted,
                games: match.games || []
            })),
            weekInfo: parsedBody.weekInfo || {}
        };
    }

    function sortPlayers(players) {
        players.sort((a, b) => (b.points - a.points) || (b.wins - a.wins));
        players.forEach((player, index) => {
            player.rank = `${index + 1}`;
        });
        return players;
    }

    function updateTournamentName(name) {
        const tournamentNameElement = document.querySelector('.KOB');
        if (tournamentNameElement) {
            tournamentNameElement.textContent = name;
        }
    }

    function renderPlayerList(players) {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';
    
        players.forEach(player => {
            const listItem = document.createElement('li');
            listItem.className = 'player';
            listItem.innerHTML = `
                <div class="player-header">
                    <div class="player-rank">${player.rank}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-record" style="display: none;">
                    <strong>Record:</strong> Wins: ${player.wins}, Losses: ${player.losses}, Points: ${player.points}
                </div>
            `;
    
            listItem.addEventListener('click', () => {
                document.querySelectorAll('.player-record').forEach(record => {
                    if (record !== listItem.querySelector('.player-record')) {
                        record.style.display = 'none';
                    }
                });
                const playerRecord = listItem.querySelector('.player-record');
                playerRecord.style.display = playerRecord.style.display === 'none' ? 'block' : 'none';
            });
    
            playerList.appendChild(listItem);
        });
    }

    function renderAllMatches(matches) {
        const allMatchesSection = document.getElementById('current-matches');
        allMatchesSection.innerHTML = '';
    
        matches.forEach((match, index) => {
            if (match.isScoreSubmitted) return;
    
            const matchCard = document.createElement('div');
            matchCard.classList.add('match-card');
    
            matchCard.innerHTML = `
                <div class="match-teams-container">
                    <input type="number" min="0" max="99" class="score-input team1-score" placeholder="Score" />
                    <div class="match-teams">
                        <div class="match-team-name">${match.team1}</div>
                        <div class="vs-text">vs</div>
                        <div class="match-team-name">${match.team2}</div>
                    </div>
                    <input type="number" min="0" max="99" class="score-input team2-score" placeholder="Score" />
                </div>
                <div class="score-submit-container">
                    <button class="submit-score" data-team1="${match.team1}" data-team2="${match.team2}" data-index="${index}">
                        Submit Score
                    </button>
                </div>
            `;
    
            allMatchesSection.appendChild(matchCard);
        });
    
        attachScoreSubmitEvent();
    }

    function attachScoreSubmitEvent() {
        document.querySelectorAll('.submit-score').forEach(button => {
            button.addEventListener('click', async function () {
                const team1 = button.dataset.team1;
                const team2 = button.dataset.team2;
                const index = button.dataset.index;
                const team1Score = button.closest('.match-card').querySelector('.team1-score').value;
                const team2Score = button.closest('.match-card').querySelector('.team2-score').value;

                if (!team1Score || !team2Score) {
                    alert('Please enter scores for both teams.');
                    return;
                }

                const gameData = {
                    tournamentPin,
                    gameData: {
                        team1,
                        team2,
                        score: `${team1Score}-${team2Score}`
                    }
                };

                await submitScores(gameData);
            });
        });
    }

    async function submitScores(gameData) {
        try {
            const response = await fetch('https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod/updateScores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });

            if (response.ok) {
                alert('Scores submitted successfully!');
                const updatedData = await fetchTournamentDataByPin();
                renderPlayerList(sortPlayers(updatedData.players));
                renderAllMatches(updatedData.matches);
            } else {
                console.error('Error submitting scores:', await response.json());
                alert('Error submitting scores.');
            }
        } catch (error) {
            console.error('Error submitting scores:', error);
            alert('Error submitting scores.');
        }
    }

    const tournamentData = await fetchTournamentDataByPin();
    if (tournamentData) {
        updateTournamentName(tournamentData.tournamentName);
        renderPlayerList(sortPlayers(tournamentData.players));
        renderAllMatches(tournamentData.weekInfo.matches);
    }
});
