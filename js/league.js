document.addEventListener('DOMContentLoaded', async function () {
    const tournamentPin = localStorage.getItem('tournamentPin');
    if (!tournamentPin) {
        alert('No tournament pin found. Please enter the pin on the homepage.');
        window.location.href = '/index.html'; // Redirect if no pin is found
        return;
    }

    // Fetch tournament data from Lambda using the tournament pin
    async function fetchTournamentDataByPin(pin) {
        try {
            const response = await fetch('/getTournamentData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tournamentPin: pin })
            });
            
            if (!response.ok) {
                throw new Error('Tournament data not found');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            alert('Failed to load tournament data. Please check the pin and try again.');
        }
    }

    // Sort players based on wins and points, and assign ranks
    function sortPlayers(players) {
        function getOrdinalSuffix(rank) {
            const j = rank % 10, k = rank % 100;
            return j == 1 && k != 11 ? `${rank}st` : j == 2 && k != 12 ? `${rank}nd` : j == 3 && k != 13 ? `${rank}rd` : `${rank}th`;
        }
    
        players.sort((a, b) => (b.points - a.points) || (b.wins - a.wins));
    
        let currentRank = 1, skipCount = 0, prevPoints = players[0].points, prevWins = players[0].wins;
        players[0].rank = players[0].points === 0 ? '-' : getOrdinalSuffix(currentRank);
    
        for (let i = 1; i < players.length; i++) {
            const player = players[i];
            if (player.points === prevPoints && player.wins === prevWins) {
                player.rank = player.points === 0 ? '-' : getOrdinalSuffix(currentRank);
                skipCount++;
            } else {
                currentRank += 1 + skipCount;
                player.rank = player.points === 0 ? '-' : getOrdinalSuffix(currentRank);
                skipCount = 0;
            }
            prevPoints = player.points;
            prevWins = player.wins;
        }
        return players;
    }

    // Get current matches for a player from weekInfo
    function getPlayerCurrentMatches(playerName, weekInfo) {
        const matches = [];
        if (weekInfo && weekInfo.matches) {
            for (const poolName in weekInfo.matches) {
                const poolMatches = weekInfo.matches[poolName];
                poolMatches.forEach(match => {
                    if (match.team1.includes(playerName) || match.team2.includes(playerName)) {
                        matches.push(match);
                    }
                });
            }
        }
        return matches;
    }

    // Render player list with details
    function renderPlayerList(players, weekInfo) {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        players.forEach((player) => {
            let rankDisplay = player.rank;
            if (player.wins === 0 && player.losses === 0 && player.points === 0) {
                rankDisplay = '-';
            }

            const listItem = document.createElement('li');
            listItem.className = 'player';
            listItem.dataset.playerName = player.name;

            listItem.innerHTML = `
                <div class="player-header">
                    <div class="player-rank">${rankDisplay}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-details" style="display: none;">
                    <h3><span class="left">Current Matches:</span> <span class="right">Pool: ${player.pool || 'Not Assigned'}</span></h3>
                    <div class="current-matches">
                        ${getPlayerCurrentMatches(player.name, weekInfo).map(match => `
                            <div class="match-item">${match.team1} vs ${match.team2}</div>`).join('')}
                    </div>
                    <div class="player-record">
                        <strong>Record:</strong> Wins: ${player.wins}, Losses: ${player.losses}, Points: ${player.points}
                    </div>
                </div>
            `;
            playerList.appendChild(listItem);
        });

        attachPlayerClickEvent();
    }

    // Render all matches for both pools and handle score submissions
    function renderAllMatches(weekInfo) {
        const allMatchesSection = document.getElementById('match-section');
        allMatchesSection.innerHTML = ''; 
    
        const title = document.createElement('h4');
        title.textContent = 'Current Matches';
        allMatchesSection.appendChild(title);
    
        const poolsContainer = document.createElement('div');
        poolsContainer.classList.add('pools-container');
    
        let matchIndex = 0;

        if (weekInfo && weekInfo.matches) {
            for (const poolName in weekInfo.matches) {
                const poolMatches = weekInfo.matches[poolName];
                const poolWrapper = document.createElement('div');
                poolWrapper.classList.add('pool-section');
    
                const poolTitle = document.createElement('h3');
                poolTitle.textContent = `Pool ${poolName}`;
                poolWrapper.appendChild(poolTitle);
    
                poolMatches.forEach((match) => {
                    if (match.isScoreSubmitted) return; 
    
                    const matchCard = document.createElement('div');
                    matchCard.classList.add('match-card');
    
                    const matchTeamsContainer = document.createElement('div');
                    matchTeamsContainer.classList.add('match-teams-container');
                    matchTeamsContainer.innerHTML = `
                        <input type="number" min="0" max="40" class="score-input team1-score-${matchIndex}" />
                        <div class="match-teams">
                            <span>${match.team1}</span> <span>vs</span> <span>${match.team2}</span>
                        </div>
                        <input type="number" min="0" max="40" class="score-input team2-score-${matchIndex}" />
                    `;
    
                    const scoreSubmitContainer = document.createElement('div');
                    scoreSubmitContainer.classList.add('score-submit-container');
                    scoreSubmitContainer.innerHTML = `
                        <button class="submit-score" data-team1="${match.team1}" data-team2="${match.team2}" data-index="${matchIndex}">Submit Score</button>
                    `;
    
                    matchCard.appendChild(matchTeamsContainer);
                    matchCard.appendChild(scoreSubmitContainer);
                    poolWrapper.appendChild(matchCard);
    
                    matchIndex++;
                });
    
                poolsContainer.appendChild(poolWrapper);
            }
    
            allMatchesSection.appendChild(poolsContainer);
            attachScoreSubmitEvent();
        }
    }
    
    // Toggle player details on click
    function attachPlayerClickEvent() {
        const players = document.querySelectorAll('.player');
        players.forEach(player => {
            player.addEventListener('click', function () {
                const details = this.querySelector('.player-details');
                details.style.display = details.style.display === 'block' ? 'none' : 'block';

                players.forEach(p => {
                    if (p !== this) {
                        p.querySelector('.player-details').style.display = 'none';
                    }
                });
            });
        });
    }

    // Handle score submission
    function attachScoreSubmitEvent() {
        const scoreButtons = document.querySelectorAll('.submit-score');
        scoreButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                const index = event.target.dataset.index;
                const matchCard = event.target.closest('.match-card');
                const team1Score = parseInt(matchCard.querySelector(`.team1-score-${index}`).value);
                const team2Score = parseInt(matchCard.querySelector(`.team2-score-${index}`).value);
                const team1 = event.target.dataset.team1;
                const team2 = event.target.dataset.team2;

                if (isNaN(team1Score) || isNaN(team2Score)) {
                    alert('Please enter valid scores for both teams.');
                    return;
                }

                const gameData = {
                    gameData: {
                        team1: { player1: team1.split('/')[0], player2: team1.split('/')[1], score: team1Score },
                        team2: { player1: team2.split('/')[0], player2: team2.split('/')[1], score: team2Score }
                    },
                    httpMethod: 'POST',
                    path: '/updateScores'
                };

                submitScores(gameData);
            });
        });
    }

    // Submit scores to Lambda and re-render
    async function submitScores(gameData) {
        try {
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/updateScores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
    
            const result = await response.json();
            if (response.ok) {
                alert('Scores submitted successfully!');
                
                const updatedData = await fetchTournamentDataByPin(tournamentPin);
                const sortedPlayers = sortPlayers(updatedData.players);
                
                renderPlayerList(sortedPlayers, updatedData.weekInfo);
                renderAllMatches(updatedData.weekInfo);
            } else {
                console.error('Error submitting scores:', result);
                alert(`Error submitting scores: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.error('Error submitting scores:', error);
            alert(`Error submitting scores: ${error.message}`);
        }
    }

    // Fetch and render tournament data
    const tournamentData = await fetchTournamentDataByPin(tournamentPin);
    if (tournamentData) {
        const sortedPlayers = sortPlayers(tournamentData.players);
        renderPlayerList(sortedPlayers, tournamentData.weekInfo);
        renderAllMatches(tournamentData.weekInfo);
    }
});
