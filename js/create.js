document.addEventListener('DOMContentLoaded', function() {
    const addPlayerButton = document.getElementById('add-player-button');
    const removePlayerButton = document.getElementById('remove-player-button');
    const createTournamentButton = document.getElementById('create-tournament-button');
    const returnHomeButton = document.getElementById('return-home-button');
    const playerListDiv = document.getElementById('player-list');
    const playerListSelect = document.getElementById('remove-player-select');
    const newPlayerInput = document.getElementById('new-player-name');
    const players = [];

    // Add Player Functionality
    addPlayerButton.addEventListener('click', function() {
        const newPlayerName = newPlayerInput.value.trim();
        if (newPlayerName && !players.includes(newPlayerName)) {
            players.push(newPlayerName);
            updatePlayerList();
            newPlayerInput.value = '';
            showToast(`Player ${newPlayerName} added successfully!`);
        } else {
            showToast('Please enter a unique player name.');
        }
    });

    // Remove Player Functionality
    removePlayerButton.addEventListener('click', function() {
        const selectedPlayer = playerListSelect.value;
        if (selectedPlayer) {
            const index = players.indexOf(selectedPlayer);
            if (index > -1) {
                players.splice(index, 1);
                updatePlayerList();
                showToast(`Player ${selectedPlayer} removed successfully!`);
            }
        } else {
            showToast('Please select a player to remove.');
        }
    });

    // Create Tournament Functionality
    createTournamentButton.addEventListener('click', function() {
        const tournamentName = document.getElementById('tournament-name').value.trim();
        const tournamentRules = document.getElementById('tournament-rules').value;

        if (!tournamentName) {
            showToast('Please enter a tournament name.');
            return;
        }

        if (players.length < 2) {
            showToast('Please add at least two players to create a tournament.');
            return;
        }

        const tournamentData = {
            name: tournamentName,
            rules: tournamentRules,
            players: players
        };

        // Send POST request to save tournament data
        fetch('/createTournament', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tournamentData)
        })
        .then(response => response.json())
        .then(data => {
            showToast('Tournament created successfully!');
        })
        .catch(error => {
            console.error('Error creating tournament:', error);
            showToast('An error occurred while creating the tournament.');
        });
    });

    // Return to Home Screen Functionality
    returnHomeButton.addEventListener('click', function() {
        window.location.href = '/index.html';
    });

    // Update Player List in Remove Player Dropdown and Display
    function updatePlayerList() {
        // Update player list in the UI
        playerListDiv.innerHTML = "";
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.textContent = player;
            playerListDiv.appendChild(playerItem);
        });

        // Update remove player dropdown
        playerListSelect.innerHTML = '<option value="" disabled selected>Select a Player to Remove</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerListSelect.appendChild(option);
        });
    }

    // Show Toast Notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            document.body.removeChild(toast);
        }, 3000);
    }
});
