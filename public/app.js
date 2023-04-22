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

const includeGoalsScoredCheckbox = document.getElementById("include-goals-scored");
includeGoalsScoredCheckbox.addEventListener("change", () => {
  displayResults(standings, startingRound);
});


async function fetchMostRecentlyCompletedRound() {
  const response = await fetch(
    "https://lastmanstanding.herokuapp.com/api/bootstrap-static/"
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

  if (events[mostRecentlyCompletedRound].is_current == true){
    mostRecentlyCompletedRound++;
  }

  return mostRecentlyCompletedRound;
}

async function fetchResults(leagueId, startingRound) {
  // Fetch league data from the API

  const spinner = document.getElementById("spinner");
  spinner.style.display = "block";

  const response = await fetch(
    `https://lastmanstanding.herokuapp.com/api/leagues-classic/${leagueId}/standings/`
  );
  const data = await response.json();

  const mostRecentlyCompletedRound = await fetchMostRecentlyCompletedRound();
  const bootstrap = await fetch(
    `https://lastmanstanding.herokuapp.com/api/bootstrap-static/`
  );
  const bootstrapData = await bootstrap.json();

  startingRound = parseInt(startingRound);
  let activePlayers = data.standings.results;
  let endRound = startingRound + activePlayers.length - 2;
  let standings = [];
  
  const fetchedPickData = {};
  for (let round = startingRound; round <= endRound; round++) {
    // Fetch round scores for each player

    if (round > mostRecentlyCompletedRound) {
      break;
    }

    let roundData = [];
    for (let player of activePlayers) {
      const playerResponse = await fetch(
        `https://lastmanstanding.herokuapp.com/api/entry/${player.entry}/event/${round}/picks/`
      );
      const playerData = await playerResponse.json();
      player.round_score = playerData.entry_history.points;
      player.name = player.player_name;
      player.goals = 0;
      
      if (includeGoalsScoredCheckbox.checked) {
        for (let pick of playerData.picks) {
          let pickData;
  
          if (fetchedPickData[pick.element]) {
            // If pick data is already fetched, use it from the fetchedPickData object
            pickData = fetchedPickData[pick.element];
          } else {
            // If pick data is not yet fetched, fetch it and store it in the fetchedPickData object
            const pickResponse = await fetch(
              `https://lastmanstanding.herokuapp.com/api/element-summary/${pick.element}/`
            );
            pickData = await pickResponse.json();
            fetchedPickData[pick.element] = pickData;
          }
          
          try {
            goals = fetchedPickData[pick.element].history.find(item => item.round === round);
            player.goals += goals.goals_scored;
          }
          catch {
            continue;
          }
        }
      }

      roundData.push({
        round_score: player.round_score,
        player_name: player.player_name,
        goals_scored: player.goals,
      });
    }

    roundData.sort((a, b) => {
      // Sort primarily by round_score, and secondarily by goals_scored
      if (b.round_score !== a.round_score) {
        return b.round_score - a.round_score;
      } else {
        return b.goals_scored - a.goals_scored;
      }
    });
    // Add the roundData to the standings-array
    standings.push(roundData);
    let lastMan = roundData[roundData.length - 1].player_name;

    // Remove the last man from the activePlayers array
    activePlayers = activePlayers.filter(
      (player) => player.player_name !== lastMan
    );
  }

  spinner.style.display = "none";
  return standings;
}

function displayResults(roundStandings, startingRound) {
  resultsDiv.innerHTML = "";

  if (!roundStandings || roundStandings.length === 0) {
    resultsDiv.textContent = "No results found.";
    return;
  }

  const includeGoalsScoredCheckbox = document.getElementById("include-goals-scored");
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
                  <th style="text-align:center">Rank</th>
                  <th>Player</th>
                  <th style="text-align:center">Score</th>
                  ${includeGoalsScoredCheckbox.checked ? '<th style="text-align:center">Goals Scored</th>' : ''}
              </tr>
          `;

    standings.forEach((player, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                  <td style="text-align:center">${index + 1}</td>
                  <td>${player.player_name}</td>
                  <td style="text-align:center">${player.round_score}</td>
              `;
      if (includeGoalsScoredCheckbox.checked) {
        row.innerHTML += `<td style="text-align:center">${player.goals_scored}</td>`;
      }
          

      table.appendChild(row);
    });

    roundDiv.appendChild(table);
    resultsDiv.appendChild(roundDiv);
  });

  buttonsContainer.appendChild(buttonsDiv);
  resultsDiv.appendChild(buttonsContainer);

  buttonsDiv.lastChild.click();
}

