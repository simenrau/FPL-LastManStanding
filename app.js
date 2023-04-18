const leagueForm = document.getElementById("league-form");
const resultsDiv = document.getElementById("results");

leagueForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const leagueId = document.getElementById("league-id").value;
  const startingRound = document.getElementById("starting-round").value;

  try {
    const standings = await fetchResults(leagueId, startingRound);
    displayResults(standings, startingRound);
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching the data. Please try again.");
  }
});

async function fetchMostRecentlyCompletedRound() {
  const response = await fetch(
    "https://fpl-lastmanstanding.herokuapp.com/api/bootstrap-static/"
  );
  const data = await response.json();
  const events = data.events;

  let mostRecentlyCompletedRound = 1;

  for (const event of events) {
    if (event.finished) {
      mostRecentlyCompletedRound = event.id;
    } else {
      break;
    }
  }

  return mostRecentlyCompletedRound;
}

async function fetchResults(leagueId, startingRound) {
  // Fetch league data from the API

  const response = await fetch(
    `http://fpl-lastmanstanding.herokuapp.com/api/leagues-classic/${leagueId}/standings/`
  );
  const data = await response.json();

  const mostRecentlyCompletedRound = await fetchMostRecentlyCompletedRound();

  startingRound = parseInt(startingRound);
  let activePlayers = data.standings.results;
  let endRound = startingRound + activePlayers.length - 2;
  let standings = [];

  for (let round = startingRound; round <= endRound; round++) {
    // Fetch round scores for each player

    if (round > mostRecentlyCompletedRound) {
      break;
    }

    let roundData = [];
    for (let player of activePlayers) {
      const playerResponse = await fetch(
        `http://fpl-lastmanstanding.herokuapp.com/api/entry/${player.entry}/event/${round}/picks/`
      );
      const playerData = await playerResponse.json();
      player.round_score = playerData.entry_history.points;
      player.name = player.player_name;

      roundData.push({
        round_score: player.round_score,
        player_name: player.player_name,
      });
    }

    roundData.sort((a, b) => b.round_score - a.round_score);

    // Add the roundData to the standings-array
    standings.push(roundData);
    let lastMan = roundData[roundData.length - 1].player_name;

    // Remove the last man from the activePlayers array
    activePlayers = activePlayers.filter(
      (player) => player.player_name !== lastMan
    );
  }

  return standings;
}

function displayResults(roundStandings, startingRound) {
  resultsDiv.innerHTML = "";

  if (!roundStandings || roundStandings.length === 0) {
    resultsDiv.textContent = "No results found.";
    return;
  }

  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("buttons-container");

  const buttonsDiv = document.createElement("div");
  buttonsDiv.classList.add("buttons");

  roundStandings.forEach((standings, index) => {
    const round = Number(startingRound) + index;

    const button = document.createElement("button");
    button.textContent = `GW ${round} / Round ${index + 1}`;
    button.classList.add("round-button");
    buttonsDiv.appendChild(button);

    const roundDiv = document.createElement("div");
    roundDiv.classList.add("round");
    roundDiv.style.display = "none";

    button.addEventListener("click", () => {
      const currentVisible = document.querySelector(".round.visible");
      if (currentVisible) {
        currentVisible.style.display = "none";
        currentVisible.classList.remove("visible");
      }
      roundDiv.style.display = "block";
      roundDiv.classList.add("visible");
    });

    const roundHeader = document.createElement("h2");
    roundHeader.textContent = `GW ${round} / Round ${index + 1}`;
    roundDiv.appendChild(roundHeader);

    const table = document.createElement("table");
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
      const row = document.createElement("tr");
      row.innerHTML = `
                  <td>${index + 1}</td>
                  <td>${player.player_name}</td>
                  <td>${player.round_score}</td>
              `;

      table.appendChild(row);
    });

    roundDiv.appendChild(table);
    resultsDiv.appendChild(roundDiv);
  });

  buttonsContainer.appendChild(buttonsDiv);
  resultsDiv.appendChild(buttonsContainer);

  buttonsDiv.lastChild.click();
}
