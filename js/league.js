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
            const rank = index + 1;
            const suffix = getOrdinalSuffix(rank);
            player.rank = `${rank}<sup>${suffix}</sup>`;
        });
    
        return players;
    }
    
    // Helper function to determine the ordinal suffix
    function getOrdinalSuffix(rank) {
        if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
        if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
        if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
        return 'th';
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
                    <div><span class="points">Score: </span><span class="player-points">${player.points}</span></div>
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

            // If match.games exist, it's a best-of-three format
            if (match.games && match.games.length) {
                match.games.forEach((game, gameIndex) => {
                    if (!game.isScoreSubmitted) {
                        matchCard.innerHTML += `
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
                                <button class="submit-score" data-team1="${match.team1}" data-team2="${match.team2}" data-index="${index}" data-gameindex="${gameIndex}">
                                    Submit Game ${game.gameNumber} Score
                                </button>
                            </div>
                        `;
                    }
                });
            } else {
                // Default to one-per-partner format
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
                            Submit Match Score
                        </button>
                    </div>
                `;
            }

            allMatchesSection.appendChild(matchCard);
        });

        attachScoreSubmitEvent();
    }

    const homeButton = document.querySelector('.home');
    homeButton.addEventListener('click', () => {
        // Remove tournamentPin from local storage
        localStorage.removeItem('tournamentPin');
            
        // Redirect to index.html
        window.location.href = '/index.html';
    });

    function attachScoreSubmitEvent() {
        document.querySelectorAll('.submit-score').forEach(button => {
            button.addEventListener('click', async function () {
                const team1 = button.dataset.team1;
                const team2 = button.dataset.team2;
                const index = button.dataset.index;
                const gameIndex = button.dataset.gameindex; // For best-of-three matches

                const matchCard = button.closest('.match-card');
                const team1Score = matchCard.querySelector('.team1-score').value;
                const team2Score = matchCard.querySelector('.team2-score').value;

                if (!team1Score || !team2Score) {
                    alert('Please enter scores for both teams.');
                    return;
                }

                const gameData = {
                    tournamentPin,
                    gameData: {
                        team1,
                        team2,
                        score: `${team1Score}-${team2Score}`,
                        ...(gameIndex !== undefined && { gameIndex: parseInt(gameIndex, 10) }) // Add gameIndex for best-of-three matches
                    }
                };

                await submitScores(gameData);
            });
        });
    }

    async function submitScores(gameData) {
        try {
            const requestBody = {
                httpMethod: 'POST',
                path: '/updateScores',
                body: gameData
            };
    
            const response = await fetch('https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod/updateScores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)  // Ensure entire object is stringified here
            });
    
            if (response.ok) {
                alert('Scores submitted successfully!');
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
