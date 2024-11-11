document.getElementById('enter-league').addEventListener('click', async function(event) {
    event.preventDefault();  // Prevent form submission if inside a form
    
    console.log("Join league button clicked"); // Initial log for click

    const tournamentPin = document.getElementById('tournament-pin-input').value;
    if (!tournamentPin) {
        alert("Enter a pin first");
        return;
    }

    console.log("Attempting to verify pin:", tournamentPin);  // Log before fetch
    
    const requestBody = {
        httpMethod: 'POST',
        path: '/checkPin',
        action: 'checkPin',
        tournamentPin: tournamentPin
    };

    try {
        const response = await fetch(`https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prod/checkPin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Fetch completed with status:", response.status);  // Log after fetch

        if (response.ok) {
            const result = await response.json();
            console.log("Pin verified:", result);
            localStorage.setItem('tournamentPin', tournamentPin);
            window.location.href = '/league.html';
        } else {
            console.error("Failed to verify pin:", response.status);
            alert("Are you sure that was the pin?");
        }
    } catch (error) {
        console.error('Error finding pin', error);
        alert('Error, try again but consider asking Nick');
    }
});

// Creating tournament pin assignment and redirect
document.getElementById('create-new-tournament').addEventListener('click', async function() {
    
    // Prepare the request body for the Lambda function
    const requestBody = {
        httpMethod: 'POST',         
        path: '/assignPin',           
        action: 'assignPin'           
    };

    try {
        // POST request to lambda
        const response = await fetch(`https://5n1op4gak6.execute-api.us-west-2.amazonaws.com/prod/assignPin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
    
        const result = await response.json();
        
        // Since body is double-encoded, parse it again
        const tournamentData = JSON.parse(result.body);
        
        if (response.ok) {
            const tournamentPin = tournamentData.tournamentPin;
            if (tournamentPin) {

                // Store the pin in localStorage for use on the next page
                localStorage.setItem('tournamentPin', tournamentPin);
    
                // Navigate to create.html
                window.location.href = '/create.html';
            } else {
                alert('Error: Failed to receive a tournament pin.');
            }
        } else {
            alert(`Error assigning pin: ${result}`);
        }
    } catch (error) {
        console.error('Error assigning pin:', error);
        alert('Failed to create tournament pin. Please try again.');
    }
});
