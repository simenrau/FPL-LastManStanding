const leagueForm = document.getElementById('league-form');
const resultsDiv = document.getElementById('results');

leagueForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const leagueId = document.getElementById('league-id').value;
    const startingRound = document.getElementById('starting-round').value;

    try {
        const standings = await fetchResults(leagueId, startingRound);
        displayResults(standings, startingRound);
    } catch (error) {
        console.error(error);
        alert('An error occurred while fetching the data. Please try again.');
    }
});

async function fetchResults(leagueId, startingRound) {
    // Fetch league data from the API
    const response = await fetch(`http://localhost:3000/api/leagues-classic/${leagueId}/standings/`);
    const data = await response.json();
    
    
    let activePlayers = data.standings.results;
    let roundStandings = [];
    
    let startingPlayers = activePlayers.length
    
    startingRound = parseInt(startingRound, 10); // Convert startingRound to a number
    

    for (let round = startingRound; round <= (startingRound + startingPlayers - 2); round++) {
        console.log(round);
        // Fetch round scores for each player
        for (let player of activePlayers) {
            console.log(player);
            const playerResponse = await fetch(`http://localhost:3000/api/entry/${player.entry}/event/${round}/picks/`);
            const playerData = await playerResponse.json();
            console.log(player.entry);
            player.round_score = playerData.entry_history.points;
        }

        roundStandings.push([...activePlayers]);

        // Eliminate the player with the lowest score
        activePlayers.sort((a, b) => a.round_score - b.round_score);
        activePlayers.pop();
    }

    return roundStandings;
}


function displayResults(roundStandings, startingRound) {
    resultsDiv.innerHTML = '';

    if (!roundStandings || roundStandings.length === 0) {
        resultsDiv.textContent = 'No results found.';
        return;
    }

    roundStandings.forEach((standings, index) => {
        const round = Number(startingRound) + index;
        const roundHeader = document.createElement('h2');
        roundHeader.textContent = `Round ${round}`;
        resultsDiv.appendChild(roundHeader);

        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Round Score</th>
            </tr>
        `;

        standings.sort((a, b) => b.round_score - a.round_score);
        const lowestScore = standings[standings.length - 1].round_score;
        
        standings.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.player_name}</td>
                <td>${player.round_score}</td>
            `;

            if (player.round_score === lowestScore) {
                row.style.color = 'red';
            }

            table.appendChild(row);
        });

        resultsDiv.appendChild(table);
    });
}
