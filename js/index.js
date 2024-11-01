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
