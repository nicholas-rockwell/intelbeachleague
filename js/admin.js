document.addEventListener('DOMContentLoaded', async function () {
    const playersUrl = 'https://intelbeachleague.s3.amazonaws.com/players.json';
    const adminPassword = "dolby100"; // Replace with the actual password
    
    async function fetchPlayersData() {
        try {
            const response = await fetch(playersUrl);
            const data = await response.json();
            return data.players;
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }

    const adminButton = document.getElementById('admin-button');
    adminButton.addEventListener('click', function () {
        window.location.href = '/League.html'; 
    });

    // Function to render player list with dropdowns for pool selection
    function renderPoolAssignment(players) {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = ''; // Clear any previous content

        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-pool';

            const label = document.createElement('label');
            label.textContent = player.name;

            const select = document.createElement('select');
            select.className = 'pool-select';  // Add the correct class for selection
            select.setAttribute('data-player', player.name);  // Set data-player attribute

            select.innerHTML = `
                <option value="" disabled selected>Select Pool</option>
                <option value="A">Pool A</option>
                <option value="B">Pool B</option>
            `;
            select.id = `pool-${player.name}`;

            playerDiv.appendChild(label);
            playerDiv.appendChild(select);
            playerList.appendChild(playerDiv);
        });
    }

    // Function to render player dropdown for removal
    function renderPlayerRemoval(players) {
        const removeSelect = document.getElementById('remove-player-select');
        removeSelect.innerHTML = `<option value="" disabled selected>Select a Player to Remove</option>`; // Clear and set default

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            removeSelect.appendChild(option);
        });
    }

    // Submit pools button click event
    document.getElementById('submit-pools').addEventListener('click', async function (event) {
        event.preventDefault();

        // Collect pool assignments from the dropdowns
        const pools = {};
        document.querySelectorAll('.pool-select').forEach(select => {
            const playerName = select.dataset.player.trim();  // Get the player name from data-player
            const pool = select.value.trim();  // Get the pool value
            if (pool) {
                pools[playerName] = pool;  // Only add to the object if a pool is selected
            }
        });

        console.log(Object.keys(pools));

        // Ensure every player has been assigned a pool
        if (Object.keys(pools).length !== players.length) {
            alert('Please assign all players to a pool before submitting.');
            return;
        }

        // Prepare the request body for the Lambda function
        const poolData = {
            httpMethod: 'POST',  // Explicitly include the HTTP method
            path: '/adminUpdate',  // Explicitly include the path
            action: 'updatePools',
            updatedPools: Object.entries(pools).map(([player, pool]) => ({ player, pool }))
        };

        try {
            // Send the POST request to the Lambda function
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/adminUpdate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(poolData) // Ensure that body is in correct format
            });

            const result = await response.json();

            if (response.ok) {
                alert('Pools updated successfully!');
            } else {
                alert(`Error updating pools: ${result}`);
            }
        } catch (error) {
            console.error('Error submitting pools:', error);
            alert('An error occurred while submitting pool data.');
        }
    });

    // Add player button click event
    document.getElementById('add-player-button').addEventListener('click', async function (event) {
        event.preventDefault();

        const newPlayerName = document.getElementById('new-player-name').value.trim();
        if (!newPlayerName) {
            alert('Please enter a player name.');
            return;
        }

        const addPlayerData = {
            httpMethod: 'POST',
            path: '/adminUpdate',
            action: 'addPlayer',
            addedPlayers: [newPlayerName]
        };

        try {
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/adminUpdate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addPlayerData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Player added successfully!');
                const players = await fetchPlayersData(); // Re-fetch player list to reflect changes
                renderPoolAssignment(players);
                renderPlayerRemoval(players);
            } else {
                alert(`Error adding player: ${result}`);
            }
        } catch (error) {
            console.error('Error adding player:', error);
            alert('An error occurred while adding the player.');
        }
    });

    // Remove player button click event
    document.getElementById('remove-player-button').addEventListener('click', async function (event) {
        event.preventDefault();

        const selectedPlayer = document.getElementById('remove-player-select').value.trim();
        if (!selectedPlayer) {
            alert('Please select a player to remove.');
            return;
        }

        const removePlayerData = {
            httpMethod: 'POST',
            path: '/adminUpdate',
            action: 'removePlayer',
            removedPlayers: [selectedPlayer]
        };

        try {
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/adminUpdate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(removePlayerData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Player removed successfully!');
                const players = await fetchPlayersData(); // Re-fetch player list to reflect changes
                renderPoolAssignment(players);
                renderPlayerRemoval(players);
            } else {
                alert(`Error removing player: ${result}`);
            }
        } catch (error) {
            console.error('Error removing player:', error);
            alert('An error occurred while removing the player.');
        }
    });

    // Fetch and render player list
    const players = await fetchPlayersData();
    if (players) {
        renderPoolAssignment(players);
        renderPlayerRemoval(players);
    }





    //TEMPORARY UNTIL PROD
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset All Player Data';
    resetButton.id = 'reset-button';
    document.body.appendChild(resetButton);

    // Add event listener to the reset button
    resetButton.addEventListener('click', function () {
        const userPassword = prompt("Enter Admin Password:");
        if (userPassword === adminPassword) {
            // Call the reset function if password matches
            resetAllPlayerData();
        } else {
            alert("Incorrect password!");
        }
    });

    async function resetAllPlayerData() {
        try {
            const response = await fetch('https://j6yll5u3v7.execute-api.us-west-2.amazonaws.com/prod/deleteAllPlayerData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deleteAllPlayerData',
                    httpMethod: 'POST',
                    path: '/deleteAllPlayerData',
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert('All player data has been reset successfully.');
            } else {
                console.error('Error resetting player data:', result);
                alert(`Error resetting player data: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.error('Error resetting player data:', error);
            alert(`Error resetting player data: ${error.message}`);
        }
    }
});
