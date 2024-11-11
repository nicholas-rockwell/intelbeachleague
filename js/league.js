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
            const response = await fetch(`https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prod/getTournamentData`, {
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
    
        // Initialize players with empty history arrays
        const players = parsedBody.players.map(player => ({
            name: player.name,
            wins: player.wins,
            losses: player.losses,
            points: player.points,
            history: []
        }));
    
        // Process each match and update players' history
        parsedBody.weekInfo.matches.forEach(match => {
            if (match.isScoreSubmitted) {
                // Determine the scores and the winner
                const [team1Score, team2Score] = match.score ? match.score.split('-').map(Number) : [0, 0];
                const team1Players = match.team1.split('/');
                const team2Players = match.team2.split('/');
                const winner = team1Score > team2Score ? match.team1 : match.team2;
    
                // Loop through team1 players and update their match history with partner info
                team1Players.forEach(playerName => {
                    const player = players.find(p => p.name === playerName);
                    if (player) {
                        const partner = team1Players.find(name => name !== playerName); // Identify partner
                        player.history.push({
                            opponent: match.team2,
                            score: `${team1Score}-${team2Score}`,
                            result: team1Score > team2Score ? "Win" : "Loss",
                            partner: partner
                        });
                    }
                });
    
                // Loop through team2 players and update their match history with partner info
                team2Players.forEach(playerName => {
                    const player = players.find(p => p.name === playerName);
                    if (player) {
                        const partner = team2Players.find(name => name !== playerName); // Identify partner
                        player.history.push({
                            opponent: match.team1,
                            score: `${team2Score}-${team1Score}`, // Opponent's score first for perspective
                            result: team2Score > team1Score ? "Win" : "Loss",
                            partner: partner
                        });
                    }
                });
            }
        });
    
        return {
            tournamentName: parsedBody.tournamentName || 'Unnamed Tournament',
            players,
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

            // Generate match history HTML
            const matchHistoryHtml = player.history.map(match => `
                <br>
                <li>
                    <strong>Partner:</strong> ${match.partner}<br>
                    <strong>Opponent:</strong> ${match.opponent}<br>
                    <strong>Score:</strong> ${match.score}<br>
                    <strong>Result:</strong> ${match.result}
                </li>
            `).join('');

            listItem.innerHTML = `
                <div class="player-header">
                    <div class="player-rank">${player.rank}</div>
                    <div class="player-name">${player.name}</div>
                    <div><span class="points">Score: </span><span class="player-points">${player.points}</span></div>
                </div>
                <div class="player-record" style="display: none;">
                    <br>
                    <strong>Record:</strong> 
                    <pre>  Wins: ${player.wins}</pre>
                    <pre>  Losses: ${player.losses}</pre>
                    <br>
                    <strong>Match History:</strong>
                <ul>${matchHistoryHtml || '<li><pre>  No matches played yet.</pre></li>'}</ul>
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

        // Check for "best of three" by looking for the games array
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
                            <button class="submit-score" 
                                data-team1="${match.team1}" 
                                data-team2="${match.team2}" 
                                data-index="${index}" 
                                data-gameindex="${gameIndex}">
                                Submit Game ${game.gameNumber} Score
                            </button>
                        </div>
                    `;
                }
            });
        } else {
            // Handle single match format
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

    // POSSIBLE HOME BUTTON TO ALLOW USERS TO CHECK OTHER TOURNAMENT?
    // const homeButton = document.querySelector('.home');
    // homeButton.addEventListener('click', () => {
    //     // Remove tournamentPin from local storage
    //     localStorage.removeItem('tournamentPin');
            
    //     // Redirect to index.html
    //     window.location.href = '/index.html';
    // });


    // Add Game Button
const addButton = document.querySelector('.add-game');
addButton.addEventListener('click', async () => {
    const tournamentData = await fetchTournamentDataByPin();

    if (!tournamentData) {
        alert("Could not load tournament data. Please try again.");
        return;
    }

    // Show a modal or form to select players for both teams
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Select Players for New Game</h3>
            <label>Team 1, Player 1:</label>
            <select id="team1-player1-select"></select>
            <label>Team 1, Player 2:</label>
            <select id="team1-player2-select"></select>
            <label>Team 2, Player 1:</label>
            <select id="team2-player1-select"></select>
            <label>Team 2, Player 2:</label>
            <select id="team2-player2-select"></select>
            <button class="submit-new-game">Add Game</button>
            <button class="close-modal">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Populate player selection options
    const playerSelectors = [
        document.getElementById('team1-player1-select'),
        document.getElementById('team1-player2-select'),
        document.getElementById('team2-player1-select'),
        document.getElementById('team2-player2-select')
    ];

    tournamentData.players.forEach(player => {
        playerSelectors.forEach(select => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            select.appendChild(option);
        });
    });

    // Close modal functionality
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Handle submit new game
    document.querySelector('.submit-new-game').addEventListener('click', async () => {
        const selectedPlayers = playerSelectors.map(select => select.value);
        
        // Check for duplicate players
        const uniquePlayers = new Set(selectedPlayers);
        if (uniquePlayers.size !== selectedPlayers.length) {
            alert('No duplicate players please');
            return;
        }

        const team1 = `${selectedPlayers[0]}/${selectedPlayers[1]}`;
        const team2 = `${selectedPlayers[2]}/${selectedPlayers[3]}`;

        // Send the new game data to the Lambda function
        await addNewGame(team1, team2);
        // Close the modal
        document.body.removeChild(modal);
        // Re-fetch and render updated tournament data
        const updatedTournamentData = await fetchTournamentDataByPin();
        if (updatedTournamentData) {
            renderAllMatches(updatedTournamentData.weekInfo.matches);
        }
    });
});

// Function to send new game data to Lambda
async function addNewGame(team1, team2) {
    const requestBody = {
        httpMethod: 'POST',
        path: '/addNewGame',
        body: {
            tournamentPin: localStorage.getItem('tournamentPin'),
            team1,
            team2
        }
    };

    try {
        const response = await fetch('https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prodaddNewGame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            console.log('New game added successfully.');
        } else {
            console.error('Failed to add new game:', await response.text());
        }
    } catch (error) {
        console.error('Error adding new game:', error);
    }
}


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
    
            const response = await fetch('https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prod/updateScores', {
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
