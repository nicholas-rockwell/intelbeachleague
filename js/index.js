// Define the base URL for the API endpoints
const API_BASE_URL = 'https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod';

// Function to perform fetch with a timeout
async function fetchWithTimeout(url, options, timeout = 15000) { // 15 seconds default timeout
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the promise if it takes too long
        const timer = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeout);

        // Perform the fetch
        fetch(url, options)
            .then(response => {
                clearTimeout(timer); // Clear the timeout if fetch succeeds
                resolve(response);
            })
            .catch(err => {
                clearTimeout(timer); // Clear the timeout if fetch fails
                reject(err);
            });
    });
}

document.getElementById('enter-league').addEventListener('click', async function(event) {
    event.preventDefault();  // Prevent form submission if inside a form
    
    console.log("Join league button clicked"); // Initial log for click

    const tournamentPin = document.getElementById('tournament-pin-input').value;
    if (!tournamentPin) {
        alert("Please enter a tournament pin.");
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
        const response = await fetch(`https://mxyll1dlqi.execute-api.us-west-2.amazonaws.com/prod/checkPin`, {
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
            alert("Pin wasn't found or verification failed.");
        }
    } catch (error) {
        console.error('Error finding pin', error);
        alert('Failed to join tournament. Please try again.');
    }
});

// Creating tournament pin assignment and redirect
document.getElementById('create-new-tournament').addEventListener('click', async function() {
    // Prepare the request body for the Lambda function
    const requestBody = {
        httpMethod: 'POST',          // Explicitly include the HTTP method
        path: '/assignPin',           // Explicitly include the path
        action: 'assignPin'           // Action identifier, similar to previous working code
    };

    try {
        // Send the POST request to the Lambda function with a 15-second timeout
        const response = await fetch(`${API_BASE_URL}/assignPin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody) // Ensure that body is in the correct format
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
