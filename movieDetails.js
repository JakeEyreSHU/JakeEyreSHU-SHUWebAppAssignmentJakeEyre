// Global variables. API key, HTML form, elements that have JavaScript interaction.
const apiKey = '9dc42380';
const detailsSearchForm = document.getElementById("detailsSearchForm");
const detailsSearchResults = document.getElementById("detailsResults");

// Search for the details of a movie, based on it's IMDB ID.
const searchDetails = async () => {
    // Search query here is simpler than in "movieSearch.js". Only one input variable, plus the API key.
    let searchQuery = `https://www.omdbapi.com/?apikey=${apiKey}&i=${detailsSearchForm.elements["mId"].value.toLowerCase()}&plot=full`;
    // Run a search for the provided IMDB ID.
    const movieDetails = await getMovie(searchQuery);
    // If the search returns movie details...
    if (movieDetails.Response != 'False') {
        // ... display the results.
        displayDetails(movieDetails);
    } else {
        // Otherwise, inform the user that nothing was found (the IMDB ID doesn't exist).
        detailsSearchResults.innerHTML = `
            <div class="error-box">
                <span class="error-box-title" title="No results.">Invalid IMDB ID...</span>
            </div>`;
    }
}

/* Query the API using the search url above, and wait for a response.
Return the response once received. */
const getMovie = async (searchQuery) => {
    const response = await fetch(searchQuery);
    const data = await response.json();
    return data;
}

// Create multiple boxes to display the different details of a given movie.
const displayDetails = (movieDetails) => {
    // Create an empty map.
    const detailMap = new Map();
    // Each box has two elements; the title of the box, and the inner details.
    // Inner details can be either one item (plot summary), or multiple items with sub-titles. 
    detailMap.set("General Information", [["Year", movieDetails.Year], ["Genre(s)", movieDetails.Genre], ["Age Rating", movieDetails.Rated], ["Runtime", movieDetails.Runtime], ["Language(s)", movieDetails.Language]]);
    detailMap.set("People", [["Main Actors", movieDetails.Actors], ["Director", movieDetails.Director], ["Writer(s)", movieDetails.Writer]]);
    detailMap.set("Plot", movieDetails.Plot);
    detailMap.set("Accomplishments", [["Awards", movieDetails.Awards], ["Box Office Revenue", movieDetails.BoxOffice]]);
    detailMap.set("Reception", [["Metascore", movieDetails.Metascore], ["IMDB Rating", movieDetails.imdbRating], ["IMDB Votes", movieDetails.imdbVotes]]);

    // The box for the movie poster is a little different, and is handled seperately.
    detailsSearchResults.innerHTML = "";
    detailsSearchResults.innerHTML += `<div class="title-bar" id="titleBar" title="Movie Title">${movieDetails.Title}</div>`
    detailsSearchResults.innerHTML += `
        <div class="detail-box poster-box">
        <img src="${movieDetails.Poster}" title="Poster for ${movieDetails.Title}" alt="Poster for ${movieDetails.Title}">
        </div>`;

    // For each item in the map, create a detail box.
    detailMap.forEach( function(value, key) {
    detailsSearchResults.innerHTML += createDetailBox(key, value);
    })
}

const createDetailBox = (boxName, boxDetails) => {
    // Process the content for the detail box.
    const innerDetails = processInnerDetails(boxDetails);
    // Detail boxes consist of a title and content.
    const detailBox = `
        <div class="detail-box">
        <span class="detail-box-title" title="${boxName}">${boxName}</span>
        ${innerDetails}
        </div>`;
    // Return the HTML for the created detail box.
    return detailBox;
}

const processInnerDetails = (boxDetails) => {
    let processedDetails = "";
    // If the inner details is an array, create a sub-title and content for each...
    if (Array.isArray(boxDetails)) {
        boxDetails.forEach(element => {
            processedDetails += `<p class="detail-title">${element[0]}</p>`;
            processedDetails += `<p class="detail-content">${element[1]}</p>`;
        })
    } else {
        // ... otherwise, just create the content (the box title is the title for the content also).
        processedDetails += `<p class="detail-content-solo">${boxDetails}</p>`;
    }
    // Return the processed inner details.
    return processedDetails;
}

// When the page is loaded, run this function.
const onLoadFunction = () => {
    // Get 'passedId' and check if it exists...
    let passedId = sessionStorage.getItem('passedId');
    if (passedId !== null) {
        // if it does, clear it from session storage, fill it into the search field, and then
        // run a search using it as the IMDB ID. This is how the 'See Details' buttons in the
        // "Movie Search" page link to a detail search.
        sessionStorage.removeItem('passedId');
        detailsSearchForm.elements["mId"].value = passedId;
        // No need to validate the ID; it's been pulled directly from IMDB. No user input here.
        searchDetails();
    }
    // Do nothing if you navigated here normally.
}

/* Validate the user's form input before running any searches. There's no
point actually performing a search if the input isn't going to potentially
yield any results. */
const validateForm = () => {
    // Get the user's input and convert it to lower case.
    let formInput = detailsSearchForm.elements["mId"].value.toLowerCase();
    // All IMDB IDs start with 'tt'. If the input doesn't, it won't be valid.
    if (formInput.substring(0,2) != "tt") {
        // Inform the user of their mistake.
        alert("Input doesn't start with 'tt'. IMDB IDs for film titles start with 'tt'.");
        return false;
    // IMDB IDs consist of at least 7 digits after the 'tt'. If the input is too short, it won't be valid.
    } else if (formInput.length < 9) {
        alert("Input is too short. IMDB IDs consist of the letters 'tt' followed by at least 7 digits.")
        return false;
    // If there's anything except digits after the 'tt', it won't be valid.
    } else if (isNaN(parseInt(formInput.substring(2)))) {
        alert("After 'tt', IMDB IDs for film titles contain only digits (at least 7).");
        return false;
    }
    // This could've been done with regex like in movieSearch.js, but doing it this way
    // lets me give the user specific feedback if part of the ID is right (e.g. 'tt555').
    return true;
}

// If the user presses the 'Search' button, validate their input and search (if it's valid).
detailsSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
        searchDetails();
    }
});