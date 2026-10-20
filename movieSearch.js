// Global variables. API key, HTML form, elements that have JavaScript interaction,
// and regex form validation criteria.
const apiKey = '9dc42380';
const searchInputForm = document.getElementById("searchForm");
const searchOutput = document.getElementById("searchResults");
const singleYearFormat = /^([0-9]+)$/;
const yearRangeFormat = /^([0-9]+-[0-9]+)$/;

// Search for movies that meet input criteria.
const searchMovies = async () => {
    // Building the API query URL throughout the function.
    /* The initial items in 'searchQuery' (API key, Movie Title, and
    Type = Movie) will be present in all possible searches. */
    /* The API Key is pulled from the global variables, while the
    Movie Title is pulled from the form where the user has given input. */
    let searchQuery = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchInputForm.elements["mTitle"].value)}&type=movie`;
    console.log(searchQuery);
    /* Pull the user's year input and choice for number of search
    results from the same input form. */
    let searchYear = searchInputForm.elements["mYear"].value;
    let searchPages = searchInputForm.elements["mPages"].value;
    
    /* Boolean state variable checking if an input date is actually a date range.
    Part of facilitating both single date and date range inputs in the same input box. */
    let dateIsRange = false;
    // If the date input matches the year range format...
    if (searchYear.match(yearRangeFormat)) {
        /* ... it has to be a date range. (Keep in mind the inputs have already been
        validated; invalid inputs don't reach this part of the code.)*/
        dateIsRange = true;
    // If it doesn't match the year range format, and it's not empty...
    } else if (searchYear != null && searchYear != "") {
        // ...it has to be a single year (again, inputs are already validated by now).
        /* The OMDB API supports searching for a specific year. If the user just wants
        a specific year, the API can do this for us via the "y=[YEAR]" search string. */
        searchQuery += `&y=${searchYear}`;
    }
    // Make an empty array.
    let movies = [];
    // Attempt to search a number of pages depending on user input (each page = 10 results).
    for (let i = 0; i < parseInt(searchPages); i++) {
        // Run a search on that page, incrementing the page number as required.
        let movieSearch = await getMovies(searchQuery + `&page=${i+1}`);
        // If something is actually found, add it to the array above.
        if (movieSearch) {
            movies = movies.concat(movieSearch);
        }
        /* Stop searching if it comes back empty. If there's nothing on page 2, there
        definitely won't be on page 5. */
        else {
            break;
        }
    }
    // If we've actually found something...
    if (movies.length > 0) {
        if (dateIsRange) {
            // ...perform year range filtering if the user input a year range...
            let dateRange = [parseInt(searchYear.substring(0, 4)), parseInt(searchYear.substring(5))];
            displayMovies(filterMovieDates(movies, dateRange));
        } else {
            // ...go straight to displaying the search results if not.
            displayMovies(movies);
        }
    // If we found nothing at all...
    } else {
        // ...inform the user.
        searchOutput.innerHTML = `
            <div class="error-box">
                <span class="error-box-title" title="No results.">No Movies Found...</span>
            </div>`;
    }
}

// Filter movies that aren't within the date range provided by the user.
const filterMovieDates = (movies, dateRange) => {
    /* The user can input their date range either way
    around; the website compensates. */
    let upperBound, lowerBound;
    if (dateRange[0] > dateRange[1]) {
        upperBound = dateRange[0];
        lowerBound = dateRange[1];
    } else {
        upperBound = dateRange[1];
        lowerBound = dateRange[0];
    }

    // Create an empty array.
    let filteredMovies = [];
    // Go through each found movie...
    movies.forEach((movie) => {
        let releaseYear = parseInt(movie.Year);
        /* ...and add it to the above array if it's 'Year' property
        recovered from IMDB lies between the two dates provided. */
        if (releaseYear >= lowerBound && releaseYear <= upperBound) {
            filteredMovies.push(movie);
        }
    });
    /* Return the list of movies, now without movies that don't lie
    within the year range. */
    return filteredMovies;
}

/* Query the API using the search url compiled, and wait for a response.
Return the response once received. */
const getMovies = async (searchQuery) => {
    const response = await fetch(searchQuery);
    const data = await response.json();
    return data.Search;
}

/* For each movie in the list, create a HTML 'box' that displays
the movie's poster, title, and year, alongside a button that can
take the user to the Movie Details page for that movie. Each box
created is added to the grid in 'search-results' on the HTML page. */
const displayMovies = (movies) => {
    // Clear any previous search.
    searchOutput.innerHTML = "";
    movies.forEach((movie) => {
        const movieBox = `
        <div class="movie-box">
            <div class="movie-box-poster">
                <img class="movie-box-poster-img" src="${movie.Poster}" alt="Poster for ${movie.Title}.">
            </div>
            <div class="movie-box-text">
                <span class="movie-box-text-title">
                    ${movie.Title}
                </span>
                <p class ="movie-box-text-year">
                    ${movie.Year}
                </p>
            </div>
            <div class="movie-box-button">
                <button class="movie-box-details-button" data-id="${movie.imdbID}">
                    See Details
                </button>
            </div>
        </div>
        `;
        searchOutput.innerHTML += movieBox;
    });

    /* Add functionality to each button created. Each button stores the movie's
    IMDB ID in session storage, then moves the user to the Movie Details page.
    The rest is handled by an on-load function on the Movie Details page. */
    const movieButtons = document.querySelectorAll(".movie-box-details-button");
    movieButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            sessionStorage.setItem('passedId', button.getAttribute("data-id"));
            window.location.href = 'movieDetails.html';
            return false;
        })
    })
}

/* Validate the user's form inputs before running any searches. There's no
point actually performing a search if the inputs aren't going to potentially
yield any results. */
const validateForm = () => {
    /*Pull the title input from the form and make sure it's not empty.
    A title input is required. */
    let formTitle = searchInputForm.elements["mTitle"].value;
    if (formTitle == "" || formTitle == null || (formTitle.replace(/\s/g, "")).length < 4) {
        /* Inform the user that their input is wrong. The OMDB API doesn't seem to work
        with inputs of less than 3 characters, hence the restriction. */
        alert("Title search must be at least 3 non-whitespace characters in length.")
        return false;
    }

    // Get the current date to make sure the year input is valid. Future-proof.
    const date = new Date();
    // Pull the year input from the input form.
    let formYear = searchInputForm.elements["mYear"].value;
    let processedYear;
    // It's optional, so if it's completely empty, all is well.
    if (formYear == "" || formYear == null) {
        return true;
    }
    /* If it's not empty, it needs to either be an uninterrupted string of digits,
    or two such strings seperated by a hyphen.*/
    // If it's a single year input...
    else if (formYear.match(singleYearFormat)) {
        processedYear = parseInt(formYear);
        /*... make sure it lies between 1800 and the current year.
        (1800 was chosen as it was the century that 'filmmaking' became a thing. I
        could have picked out the date of the earliest surviving film, which is 1888,
        but picking 1800 provides a bit of future-proofing incase, say, some lost
        film from an earlier year is found and gets an IMDB entry.) */
        if (processedYear > date.getFullYear() || processedYear < 1800) {
            // Inform the user that their input isn't valid.
            alert("Years must be valid years between 1800 and the current year.");
            return false;
        } else {
            return true;
        }
        // If it's a year range input...
    } else if (formYear.match(yearRangeFormat)) {
        processedYear = [parseInt(formYear.substring(0, 4)), parseInt(formYear.substring(5))];
        // ... make sure it's an actual range, not the same year twice...
        if (processedYear[0] == processedYear[1]) {
            alert("A year range must contain two different years.")
            return false;
            // ... and make sure both dates lie between 1800 and the current year.
        } else if (processedYear[0] > date.getFullYear() || processedYear[0] < 1800 || processedYear[1] > date.getFullYear() || processedYear[1] < 1800) {
            alert("Years must be valid years between 1800 and the current year.");
            return false;
        } else {
            return true;
        }
        // If an input has been provided, but doesn't meet either valid format.
    } else {
        alert("Year input must be a single year (e.g. '1962'), or a range of years (e.g. '1960-1964').");
        return false;
    }
}

// If the user presses the 'Search' button, validate their input and search (if it's valid).
searchInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
    searchMovies();
    }
});

/* Citation: https://github.com/Manu577228/Vanilla-JS-Movies-Search-App/tree/master provided
some inspiration on how to use the OMDb API, and on how to process the results of OMDb API searches. */