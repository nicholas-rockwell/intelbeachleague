document.addEventListener('DOMContentLoaded', function() {
    const addPlayerButton = document.getElementById('add-player-button');
    const removePlayerButton = document.getElementById('remove-player-button');
    const createTournamentButton = document.getElementById('create-tournament-button');
    const returnHomeButton = document.getElementById('return-home-button');
    const playerListDiv = document.getElementById('player-list');
    const playerListSelect = document.getElementById('remove-player-select');
    const newPlayerInput = document.getElementById('new-player-name');
    const players = [];

    // Retrieve newly created pin to display
    document.addEventListener('DOMContentLoaded', function() {
        const tournamentPin = localStorage.getItem('tournamentPin');
        if (tournamentPin) {
            // Display the pin on the page, for example, at the top of the form
            document.getElementById('tournament-pin-display').textContent = `Tournament Pin: ${tournamentPin}`;
        } else {
            console.error('Tournament pin not found');
            alert('Error: Tournament pin not found. Please try again.');
        }
    });    

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

    // Assign Pin for New Tournament
    async function assignPin() {
        try {
            const response = await fetch('/assignPin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            const data = await response.json();
            return data.tournamentPin;  // Returns the assigned tournament pin
        } catch (error) {
            console.error('Error assigning pin:', error);
            showToast('Error assigning pin.');
        }
    }

    // Create Tournament Functionality
    createTournamentButton.addEventListener('click', async function() {
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

        // Assign a new tournament pin
        const tournamentPin = await assignPin();
        if (!tournamentPin) return;

        // Prepare tournament data for admin update
        const tournamentData = {
            tournamentPin: tournamentPin,
            tournamentName: tournamentName,
            tournamentFormat: tournamentRules,
            addedPlayers: players
        };

        // Send POST request to create tournament with admin update
        fetch('/adminUpdate', {
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
