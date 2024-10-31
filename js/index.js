// Creating tournament pin assignment and redirect
document.getElementById('create-new-tournament').addEventListener('click', async function() {
    try {
        const response = await fetch('/assignPin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const data = await response.json();
        const tournamentPin = data.tournamentPin;

        // Store the pin in localStorage for use on the next page
        localStorage.setItem('tournamentPin', tournamentPin);

        // Navigate to the create tournament page
        window.location.href = '/create.html';
    } catch (error) {
        console.error('Error assigning pin:', error);
        alert('Failed to create tournament pin. Please try again.');
    }
});

// Pin based tournament retrieval
document.getElementById('enter-league').addEventListener('click', function() {
    const tournamentPin = document.getElementById('tournament-pin-input').value.trim();
    if (!tournamentPin) {
        alert("Please enter a valid tournament pin.");
        return;
    }

    // Save the pin to localStorage
    localStorage.setItem('tournamentPin', tournamentPin);

    // Navigate to league.html
    window.location.href = '/league.html';
});
