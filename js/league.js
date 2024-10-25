document.addEventListener('DOMContentLoaded', async function () {
    const s3Url = 'https://intelbeachleague.s3.amazonaws.com/players.json';

    // Fetch player data directly from S3
    async function fetchPlayerData(cacheBuster = false) {
        try {
            let url = s3Url;
            
            // Append cache-busting query parameter if required
            if (cacheBuster) {
                url += `?t=${new Date().getTime()}`; // Cache-busting query to prevent loading from cache
            }
    
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching player data:', error);
        }
    }

    // Sort players based on wins and points, and alphabetically for those with 0 stats
    function sortPlayers(players) {
        // Helper function to determine the ordinal suffix
        function getOrdinalSuffix(rank) {
            const j = rank % 10;
            const k = rank % 100;
            if (j === 1 && k !== 11) {
                return `${rank}st`;
            }
            if (j === 2 && k !== 12) {
                return `${rank}nd`;
            }
            if (j === 3 && k !== 13) {
                return `${rank}rd`;
            }
            return `${rank}th`;
        }
    
        // Sort by points first, then wins as a tiebreaker, with special handling for 0 points
        players.sort((a, b) => {
            if (a.points === 0 && b.points !== 0) return 1;  // a comes after b
            if (b.points === 0 && a.points !== 0) return -1; // b comes after a
    
            if (b.points === a.points && b.wins === a.wins) {
                return 0; // Players are equal in rank
            }
            return (b.points - a.points) || (b.wins - a.wins); // Sort by points, then wins
        });
    
        let currentRank = 1; // Start with rank 1
        let skipCount = 0; // To account for skipped ranks
        let prevPoints = players[0].points;
        let prevWins = players[0].wins;
    
        // Assign rank to the first player
        players[0].rank = players[0].points === 0 ? '-' : getOrdinalSuffix(currentRank); // Players with 0 points get rank '-'
    
        for (let i = 1; i < players.length; i++) {
            const player = players[i];
    
            // Check if current player has the same points and wins as the previous one
            if (player.points === prevPoints && player.wins === prevWins) {
                // Same rank as the previous player
                player.rank = player.points === 0 ? '-' : getOrdinalSuffix(currentRank);
                skipCount++;
            } else {
                // Increment the rank by the skip count + 1
                currentRank += 1 + skipCount;
                player.rank = player.points === 0 ? '-' : getOrdinalSuffix(currentRank);
                skipCount = 0; // Reset skip count
            }
    
            // Update previous player's points and wins
            prevPoints = player.points;
            prevWins = player.wins;
        }
    
        return players;
    }
    
       
    

    // Function to get current matches for a player from weekInfo
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

// Render player list (focuses on player details only)
function renderPlayerList(players, weekInfo) {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';

    players.forEach((player) => {
        let rankDisplay = player.rank;
        if (player.wins === 0 && player.losses === 0 && player.points === 0) {
            rankDisplay = '-'; // Display rank as '-' for players with no wins/losses/points
        }

        const listItem = document.createElement('li');
        listItem.className = 'player';
        listItem.dataset.playerName = player.name;

        // Generate player details with updated layout and flexbox styling
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
        allMatchesSection.innerHTML = ''; // Clear any previous content
    
        const title = document.createElement('h4');
        title.textContent = 'Current Matches';
        allMatchesSection.appendChild(title);
    
        const poolsContainer = document.createElement('div');
        poolsContainer.classList.add('pools-container');
    
        let matchIndex = 0; // Start a global match index that spans across all pools
    
        if (weekInfo && weekInfo.matches) {
            for (const poolName in weekInfo.matches) {
                const poolMatches = weekInfo.matches[poolName];
                const poolWrapper = document.createElement('div');
                poolWrapper.classList.add('pool-section');
    
                const poolTitle = document.createElement('h3');
                poolTitle.textContent = `Pool ${poolName}`;
                poolWrapper.appendChild(poolTitle);
    
                poolMatches.forEach((match) => {
                    // Check if the score has been submitted before displaying the match
                    if (match.isScoreSubmitted) {
                        return; // Skip this match if the score has already been submitted
                    }
    
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
    
                    matchIndex++; // Increment the global match index
                });
    
                poolsContainer.appendChild(poolWrapper);
            }
    
            allMatchesSection.appendChild(poolsContainer);
            // Attach event listeners for the newly added submit buttons
            attachScoreSubmitEvent();
        }
    }
    
    
    
    
    
    

    // Function to get current matches for a player from weekInfo
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

    // Player Click Event (Toggling player details)
    function attachPlayerClickEvent() {
        const players = document.querySelectorAll('.player');
        players.forEach(player => {
            player.addEventListener('click', function () {
                const details = this.querySelector('.player-details');

                // If details are already open, close them
                if (details.style.display === 'block') {
                    details.style.display = 'none';
                } else {
                    // Close all other player details
                    players.forEach(p => {
                        if (p !== this) {
                            p.querySelector('.player-details').style.display = 'none';
                        }
                    });

                    // Open current player's details
                    details.style.display = 'block';
                }
            });
        });
    }

    // Handle score submission (refined to handle the "this" context issue)
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

                // Determine winning team
                const winningTeam = team1Score > team2Score ? team1 : team2;
                const matchTeamsElement = matchCard.querySelector('.match-teams');

                // Add animation to the winning team
                matchTeamsElement.classList.add('winning-team');

                // Format the data exactly like the Lambda function expects
                const gameData = {
                    gameData: {
                        team1: {
                            player1: team1.split('/')[0],
                            player2: team1.split('/')[1],
                            score: team1Score
                        },
                        team2: {
                            player1: team2.split('/')[0],
                            player2: team2.split('/')[1],
                            score: team2Score
                        }
                    },
                    httpMethod: 'POST',
                    path: '/updateScores'
                };

                // Send the POST request
                submitScores(gameData);
            });
        });
    }

    async function submitScores(gameData) {
        try {
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/updateScores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData)
            });
    
            const result = await response.json();
            if (response.ok) {
                alert('Scores submitted successfully!');
                
                // Force re-fetch the player data to ensure updated scores
                const players = await fetchPlayerData(true);  // Pass true to force cache busting
                const sortedPlayers = sortPlayers(players.players);
                
                // Re-render the player list and current matches
                renderPlayerList(sortedPlayers, players.weekInfo);
                renderAllMatches(players.weekInfo);
            } else {
                console.error('Error submitting scores:', result);
                alert(`Error submitting scores: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.error('Error submitting scores:', error);
            alert(`Error submitting scores: ${error.message}`);
        }
    }

    // Fetch and render sorted player data
    const data = await fetchPlayerData();
    const sortedPlayers = sortPlayers(data.players);
    renderPlayerList(sortedPlayers, data.weekInfo); // Pass weekInfo for current matches
    renderAllMatches(data.weekInfo); // Call renderAllMatches to display the matches on page load
});