document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded fired");  // Check if event listener is firing

    // Element references
    const addPlayerButton = document.getElementById('add-player-button');
    const removePlayerButton = document.getElementById('remove-player-button');
    const createTournamentButton = document.getElementById('create-tournament-button');
    const returnHomeButton = document.getElementById('return-home-button');
    const playerListDiv = document.getElementById('player-list');
    const playerListSelect = document.getElementById('remove-player-select');
    const newPlayerInput = document.getElementById('new-player-name');
    const pinDisplayElement = document.getElementById('tournament-pin-display');
    const players = [];

    // Retrieve and display the tournament pin from local storage
    const tournamentPin = localStorage.getItem('tournamentPin');
    if (pinDisplayElement && tournamentPin) {
        console.log("Retrieved tournament pin:", tournamentPin);
        pinDisplayElement.textContent = `Tournament Pin: ${tournamentPin}`;
    } else if (!pinDisplayElement) {
        console.error('Element #tournament-pin-display not found.');
    } else {
        console.error('Tournament pin not found in local storage');
        alert('Error: Tournament pin not found. Please try again.');
    }

    // Add Player Functionality
    addPlayerButton.addEventListener('click', function() {
        const newPlayerName = newPlayerInput.value.trim().toUpperCase();
        if (newPlayerName && !players.includes(newPlayerName)) {
            
            // Remove for prod
            if (newPlayerName === "Aly") {
                showToast('Hey Gorgeous ;)');
            }
            if (newPlayerName === "Boba") {
                showToast('Shut up, we\'re trying to sleep');
            }
            if (newPlayerName === "Mochi") {
                showToast('Hey honey :)');
            }
            if (newPlayerName === "Nick") {
                showToast('FATHER?!');
            } 
            // Remove for prod

            players.push(newPlayerName);
            updatePlayerList();
            newPlayerInput.value = '';
            // showToast(`${newPlayerName} added successfully!`);
        } else {
            showToast('Player already added, choose a unique name.');
        }
    });

    // Add an event listener to detect Enter key press in the input field
    newPlayerInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default Enter key action if inside a form
            addPlayerButton.click(); // Trigger the button click
        }
    });

    // Remove autocomplete
    document.querySelectorAll('input').forEach(input => {
        input.setAttribute('autocomplete', 'off');
    });    

    // Remove Player Functionality
    removePlayerButton.addEventListener('click', function() {
        const selectedPlayer = playerListSelect.value;
        if (selectedPlayer) {
            const index = players.indexOf(selectedPlayer);
            if (index > -1) {
                players.splice(index, 1);
                updatePlayerList();
                showToast(`${selectedPlayer} removed successfully!`);
            }
        } else {
            showToast('Who\'s getting cut?');
        }
    });

    // Create Tournament Functionality
    createTournamentButton.addEventListener('click', async function() {
        console.log("Create tournament button clicked");
        const tournamentName = document.getElementById('tournament-name').value.trim();
        const tournamentRules = document.getElementById('tournament-rules1').value;

        if (!tournamentName) {
            showToast('Name The Thing!');
            return;
        }

        if (players.length < 2) {
            showToast('It takes two to tango');
            return;
        }

        if (players.length % 2 != 0) {
            showToast('Who doesn\'t have a partner?');
            return;
        }

        // Prepare tournament data for admin update, formatted as required
        const tournamentData = {
            httpMethod: "POST",
            path: "/adminUpdate",
            body: {
                tournamentPin: tournamentPin,
                tournamentName: tournamentName,
                tournamentFormat: tournamentRules,
                addedPlayers: players
            }
        };

        // Send POST request to create tournament with admin update
        try {
            const response = await fetch('https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prod/adminUpdate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tournamentData)
            });
            const data = await response.json();

            if (response.ok) {
                console.log("Tournament created.");
                window.location.href = '/league.html';
            } else {
                console.error('Error creating tournament:', data);
            }
        } catch (error) {
            console.error('Error creating tournament:', error);
        }
    });

    // Return to Home Screen Functionality
    returnHomeButton.addEventListener('click', function() {
        localStorage.removeItem('tournamentPin');
        window.location.href = '/index.html';
    });

    // Update Player List in Remove Player Dropdown and Display
    function updatePlayerList() {
        playerListDiv.innerHTML = "";
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.textContent = player;
            playerListDiv.appendChild(playerItem);
        });

        playerListSelect.innerHTML = '<option value="" disabled selected class="removePlayer">Select a Player to Remove</option>';
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

        setTimeout(() => { toast.classList.add('show'); }, 100);
        setTimeout(() => {
            toast.classList.remove('show');
            document.body.removeChild(toast);
        }, 3000);
    }
});
