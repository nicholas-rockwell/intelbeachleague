document.addEventListener('DOMContentLoaded', async function () {
    const tournamentPin = localStorage.getItem('tournamentPin');
    if (!tournamentPin) {
        alert('No tournament pin found. Please enter the pin on the homepage.');
        window.location.href = '/index.html';
        return;
    }

    // Fetch tournament data from Lambda using the tournament pin
    async function fetchTournamentDataByPin() {
        const tournamentPin = localStorage.getItem('tournamentPin');
    
        const requestBody = {
            httpMethod: 'POST',
            path: '/getTournamentData',
            tournamentPin: tournamentPin
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
            console.log("Fetched tournament data:", data);
            return parseDynamoDBResponse(data);
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            alert('Failed to load tournament data. Please check the pin and try again.');
        }
    }
    
    
    // Parse DynamoDB JSON format into a usable format
    function parseDynamoDBResponse(data) {
        const tournamentData = {
            tournamentName: data.tournamentName?.S || 'Unnamed Tournament',
            players: data.players?.L.map(player => ({
                name: player.M.name.S,
                wins: parseInt(player.M.wins.N, 10),
                losses: parseInt(player.M.losses.N, 10),
                points: parseInt(player.M.points.N, 10),
                history: player.M.history?.L.map(match => match.S)
            })) || [],
            matches: data.matches?.L.map(match => ({
                team1: match.M.team1.S,
                team2: match.M.team2.S,
                isScoreSubmitted: match.M.isScoreSubmitted?.BOOL || false,
                games: match.M.games?.L.map(game => ({
                    gameNumber: parseInt(game.M.gameNumber.N, 10),
                    score: game.M.score?.S || "",
                    isScoreSubmitted: game.M.isScoreSubmitted?.BOOL || false
                }))
            })) || [],
            weekInfo: data.weekInfo?.M || {}
        };

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
                <div class="match-teams">
                    ${match.team1} vs ${match.team2}
                </div>
                <div class="score-inputs">
                    <input type="number" min="0" max="40" class="team1-score" placeholder="Score for ${match.team1}" />
                    <input type="number" min="0" max="40" class="team2-score" placeholder="Score for ${match.team2}" />
                </div>
                <button class="submit-score" data-team1="${match.team1}" data-team2="${match.team2}" data-index="${index}">Submit Score</button>
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
                const updatedData = await fetchTournamentDataByPin(tournamentPin);
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
    const tournamentData = await fetchTournamentDataByPin(tournamentPin);
    if (tournamentData) {
        updateTournamentName(tournamentData.tournamentName);
        renderPlayerList(sortPlayers(tournamentData.players));
        renderAllMatches(tournamentData.matches);
    }
});
