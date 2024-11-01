document.addEventListener('DOMContentLoaded', async function () {
    const tournamentPin = localStorage.getItem('tournamentPin');
    if (!tournamentPin) {
        alert('No tournament pin found. Please enter the pin on the homepage.');
        window.location.href = '/index.html';
        return;
    }

    // Handle pin display
    const pinDisplayElement = document.getElementById('tournament-pin-display');
    if (pinDisplayElement && tournamentPin) {
        console.log("Retrieved tournament pin:", tournamentPin);
        pinDisplayElement.textContent = `Tournament Pin: ${tournamentPin}`;
    } else if (!pinDisplayElement) {
        console.error('Element #tournament-pin-display not found.');
    } else {
        console.error('Tournament pin not found in local storage');
        alert('Error: Tournament pin not found. Please try again.');
    }

    // Fetch tournament data from Lambda using the tournament pin
    async function fetchTournamentDataByPin() {
        const requestBody = {
            httpMethod: 'POST',
            path: '/getTournamentData',
            body: {
                tournamentPin: tournamentPin
            }
        };

        try {
            const response = await fetch(`https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod/getTournamentData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                throw new Error('Tournament data not found');
            }

            const data = await response.json();
            console.log("Fetched tournament data:", data);  // For debugging
            return parseDynamoDBResponse(data);
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            alert('Failed to load tournament data. Please check the pin and try again.');
        }
    }

    // Parse DynamoDB JSON format into a usable format
    function parseDynamoDBResponse(data) {
        // Parse the stringified body if needed
        const parsedBody = JSON.parse(data.body);

        const tournamentData = {
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

        console.log("Parsed tournament data:", tournamentData);  // For debugging
        return tournamentData;
    }

    // Sort players based on wins and points, and assign ranks
    function sortPlayers(players) {
        players.sort((a, b) => (b.points - a.points) || (b.wins - a.wins));
        players.forEach((player, index) => {
            player.rank = `${index + 1}`;
        });
        return players;
    }

    // Update tournament name in HTML
    function updateTournamentName(name) {
        const tournamentNameElement = document.querySelector('.KOB');
        if (tournamentNameElement) {
            tournamentNameElement.textContent = name;
        }
    }

    // Render player list
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
                <div class="player-record">
                    <strong>Record:</strong> Wins: ${player.wins}, Losses: ${player.losses}, Points: ${player.points}
                </div>
            `;
            playerList.appendChild(listItem);
        });
    }

    // Render all matches and handle score submissions
    function renderAllMatches(matches) {
        const allMatchesSection = document.getElementById('current-matches');
        allMatchesSection.innerHTML = '';
    
        matches.forEach((match, index) => {
            if (match.isScoreSubmitted) return;
    
            const matchCard = document.createElement('div');
            matchCard.classList.add('match-card');
    
            matchCard.innerHTML = `
                <div class="match-teams-container">
                    <div class="team">
                        <span class="match-team-name">${match.team1}</span>
                        <input type="number" min="0" max="40" class="score-input team1-score" placeholder="Score" />
                    </div>
                    <div class="match-teams">
                        <span>vs</span>
                    </div>
                    <div class="team">
                        <span class="match-team-name">${match.team2}</span>
                        <input type="number" min="0" max="40" class="score-input team2-score" placeholder="Score" />
                    </div>
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
    

    // Handle score submission
    function attachScoreSubmitEvent() {
        document.querySelectorAll('.submit-score').forEach(button => {
            button.addEventListener('click', async function () {
                const team1 = button.dataset.team1;
                const team2 = button.dataset.team2;
                const index = button.dataset.index;
                const team1Score = button.previousElementSibling.querySelector('.team1-score').value;
                const team2Score = button.previousElementSibling.querySelector('.team2-score').value;

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

    // Submit scores to Lambda and re-render
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

    // Fetch and render tournament data
    const tournamentData = await fetchTournamentDataByPin();
    if (tournamentData) {
        updateTournamentName(tournamentData.tournamentName);
        renderPlayerList(sortPlayers(tournamentData.players));
        renderAllMatches(tournamentData.weekInfo.matches);
    }
});
