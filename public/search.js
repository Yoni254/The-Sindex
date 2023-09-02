const hoverButton = document.getElementById('nameSearch');
const explanation = document.getElementById('explanation');
const searchInput = document.getElementById('searchInput');
const resultsTable = document.getElementById('resultsTable').querySelector('tbody');
const nextButton = document.getElementById('nextButton');

let searchMode;
const searchModes = ["data", "lyrics", "group"];
const searchModeText = [
    "Please enter song data: ",
    "Please enter lyrics: ",
    "Please enter group name: ",
];

// when hovering over the song data options this shows more information
hoverButton.addEventListener('mouseover', () => {
    explanation.style.display = 'block';
});

hoverButton.addEventListener('mouseout', () => {
    explanation.style.display = 'none';
});

function changeSearchMode(i) {
    searchMode = i;
    document.getElementById('searchInputDiv').style.display = 'block';
    document.getElementById('searchResultsDiv').style.display = 'none'
    document.getElementById('searchText').textContent = searchModeText[i];
}

function nameSearch() { changeSearchMode(0) }
function lyricsSearch() { changeSearchMode(1) }
function groupSearch() { changeSearchMode(2) }

/**
 * display results in a nice looking table
 * @param data
 */
function displayRes(data) {
    document.getElementById('searchInputDiv').style.display = 'none';
    document.getElementById('searchResultsDiv').style.display = 'block';
    resultsTable.innerHTML = '';

    // Populate the table with new rows based on data
    data.forEach(result => {
        const row = document.createElement('tr');
        const checkboxCell = document.createElement('td');
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';

        checkboxCell.appendChild(checkboxInput);
        row.appendChild(checkboxCell);

        for (const key in result) {
            const cell = document.createElement('td');
            if (result[key] != null)
                cell.textContent = result[key];
            else
                cell.textContent = "";
            if (key === 'SID') {
                cell.style.display = 'none';
            }
            row.appendChild(cell);
        }

        // Add a click event listener to the row to handle selection
        row.addEventListener('click', () => {
            checkboxInput.checked = !checkboxInput.checked;
            row.classList.toggle('selected-row', checkboxInput.checked);
            nextButton.classList.add('enabled');
        });

        resultsTable.appendChild(row);
    });
}

/**
 * get all songs
 */
function allData() {
    fetch(`/fetchAllData`)
        .then(response => response.json())
        .then(result => {
            if (result.success)
                displayRes(result.data);
            else
                alert(`Error: ${result.msg}`);
        })
        .catch(error => console.error('Error fetching search results:', error));
}

/**
 * when search button is click, get the mode and query
 * then send to the server to get results back
 */
async function searchClick() {
    const requestData = {
        type: searchModes[searchMode],
        query: searchInput.value
    };

    fetch(`/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success)
                displayRes(result.data);
            else
                alert(`Error: ${result.msg}`);
        })
        .catch(error => console.error('Error fetching search results:', error));
}

/**
 * after search is done, this gathers all SID selected and sends to the viewer page
 */
function searchDone() {
    const selectedRows = Array.from(resultsTable.querySelectorAll('tr.selected-row'));
    if (selectedRows.length > 0) {
        const selectedSIDs = selectedRows.map(row => row.querySelector('td:nth-child(2)').textContent);
        const selectedSIDsQuery = encodeURIComponent(selectedSIDs.join('-'));
        // Redirect to the new page with selected SIDs in the query parameter
        window.location.href = `/viewer.html?SID=${selectedSIDsQuery}`;
    } else {
        alert('Please select one or more rows.');
    }
}