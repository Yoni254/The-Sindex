const args = window.location.search.split('=')[1];
const missingLineSTR = "~~~~~~~~~~~~~~~~~~~~~~~";
// text displaying elements
const fullTextDisplay = document.getElementById('fullTextDisplay')
const contextTextArea = document.getElementById('contextTextArea');

// filters
const groupFilter = document.getElementById('groupFilter');
const segmentFilter = document.getElementById('segmentFilter');
const songFilter = document.getElementById('songFilter');

// main screen - words list
const wordMenu = document.getElementById('words-table');
const wordMenuBody = wordMenu.querySelector('tbody');

// lightboxes
const segmentLightbox = document.getElementById('segmentLightbox');
const groupManageLightbox = document.getElementById('groupManageLightbox');
const groupWordAddLightbox = document.getElementById('groupWordAddLightbox');
const groupWordRemoveLightbox = document.getElementById('groupWordRemoveLightbox');
const phraseAddLightbox = document.getElementById('phraseAddLightbox');
const phraseRemoveLightbox = document.getElementById('phraseRemoveLightbox');
const searchOptionsLightbox = document.getElementById('searchOptionsLightbox');

// arrow buttons
const nextButton = document.getElementById('nextButton');
const previousButton = document.getElementById('previousButton');

// selection stuff
let uniqueWords = {};
let selectedRow;
let selectedWord;
let markFlag = true;
let selectedWordLocationList = [];
let selectedIndex;
let phraseSelection;

// SID list of selected songs
const SIDList = args.split('-');


fetch(`/getSongs?query=${encodeURIComponent(args)}`)
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displayData(result.data)
        }
    })
    .catch(error => console.error('Error fetching search results:', error));


/**
 * whenever user changes any of the filter, this function goes over them all and filters the table
 */
async function filterUpdate() {
    let groupOption = groupFilter.value;
    let segmentOption = segmentFilter.value;
    let songOption = songFilter.value;

    let wordsInGroup = [];
    if (groupOption !== "-1") {
        const result = await postMethod('/fetchGroupWords', [{ name: groupOption }]);
        if (result.success) {
            result.data.forEach(result => {
                wordsInGroup.push(result.Word);
            });
        } else {
            alert(`Server returned error: ${result.message}`)
        }
    }

    for (let i = 0; i < wordMenuBody.rows.length; i++) {
        // for every word get the SID word and segment
        let rowWord = wordMenuBody.rows[i].cells[1].textContent

        let matchFlag = false;
        // check the word matches the group filter before anything else
        if (wordsInGroup.includes(rowWord) || groupOption === "-1") {
            // for every time the word shows up check if at least one is matching the SID and or Segment filter
            for (let data of uniqueWords[rowWord]) {
                if ((data[0].toString() === songOption || songOption === "-1") &&
                    (data[2] === segmentOption || segmentOption === "-1"))
                    matchFlag = true;
            }
        }
        wordMenuBody.rows[i].style.display = (matchFlag) ? '' : 'none';
    }
}

/**
 * create song filter based on fetched data
 */
function addSongFilter(data) {
    for (const song of data) {
        let option1 = document.createElement('option');
        option1.text = song.SName;
        option1.value = song.SID;
        songFilter.appendChild(option1);
        let option2 = document.createElement('option');
        option2.text = song.SName;
        option2.value = song.SID;
        document.getElementById('searchLocationSong').appendChild(option2);
    }
}

/**
 * create segments filter based on fetched data
 */
function addSegmentFilter(data) {
    let uniqueSegments = [];
    for (let segment of data) {
        if (uniqueSegments.includes(segment.Segment)) {
            continue;
        }
        uniqueSegments.push(segment.Segment);
        let option = document.createElement('option');
        option.text = segment.Segment;
        option.value = segment.Segment;
        segmentFilter.appendChild(option);
    }
}

/**
 * fetch all groups and add them to the group filter
 */
async function addGroupFilter() {
    const result = await getMethod('/fetchAllGroups');

    if (result.success) {
        result.data.forEach(group => {
            let option = document.createElement('option');
            option.text = group.name;
            option.value = group.name;
            groupFilter.appendChild(option);
        });
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * helpful util function that removes commas periods and exclamation marks
 */
function removeTrail(str) {
    return str.replace(/[.,!]*$/, '');
}

/**
 * update the corner display segment box with value of the current segment
 * if the context window contains more than one segment, adds * to notify the user
 * @param msg - msg to add * to
 * @param data - the context data
 * @returns {string} - updated msg
 */
function updateCornerBox(msg, data) {
    let segmentExpander = document.getElementById('segmentExpander');
    segmentExpander.disabled = false;
    if (data[0].text && data[0].segment !== data[1].segment) {
        msg = "*" + msg;
        segmentExpander.textContent = `View ${data[1].segment}*`;
    } else if (data[data.length - 1].text && data[data.length - 1].segment !== data[1].segment) {
        msg = msg + "*";
        segmentExpander.textContent = `View ${data[1].segment}*`;
    } else {
        segmentExpander.textContent = `View ${data[1].segment}`;
    }
    return msg;
}

/**
 * upon clicking the small button at the corner of the context viewer,
 * this function gets all lines from the segment and displays them
 */
async function viewSegment() {
    const query = {
        SID: selectedWordLocationList[selectedIndex][0],
        SectionNumber: selectedWordLocationList[selectedIndex][1],
    };

    const result = await postMethod('/getSongSegment', query);
    if (result.success) {
        document.getElementById('segmentLightboxH1').textContent = `Currently viewing: ${selectedWordLocationList[selectedIndex][2]}`;
        if (selectedWord)
            document.getElementById('segmentLightboxH2').textContent = `Selected word is "${selectedWord}"`;

        let tempArr = result.data.split(' ');
        for (let i = 0; i < tempArr.length; i++) {
            if (selectedWord && markFlag && removeTrail(tempArr[i].toLowerCase()) === selectedWord.toLowerCase())
                tempArr[i] = `<mark>${tempArr[i]}</mark>`
        }
        document.getElementById('segmentLightboxText').innerHTML = `${tempArr.join(' ')}`;
        segmentLightbox.style.display = 'flex';
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * when opening the phrase add box, this function gets the current selection
 * this can be a word of an actual selection by the user
 * selections only count within the context or the full text viewers
 */
function openPhraseAdd() {
    const hint = "If you wish to select a phrase just use your mouse by clicking and dragging inside the context view or the full text display*";
    let selection = window.getSelection();
    let fullTextDiv = document.getElementById('SelectionCheck')
    let textHint = document.getElementById('phraseAddSelectionGuide')
    textHint.innerText = "";

    // only allow selection from inside context or full window menus
    if ((fullTextDiv.contains(selection.anchorNode) && fullTextDiv.contains(selection.focusNode)) ||
        (contextTextArea.contains(selection.anchorNode) && contextTextArea.contains(selection.focusNode))) {
        document.getElementById('phraseAdditionSelectedDisplay').innerHTML = `<u>${selection.toString().toLowerCase()}</u>`;
        phraseSelection = selection.toString().toLowerCase();
        phraseAddLightbox.style.display = 'flex';
    } else if (selectedWord) {
        document.getElementById('phraseAdditionSelectedDisplay').innerHTML = `<u>${selectedWord}</u>`;
        phraseSelection = selectedWord;
        textHint.innerText = hint;
        phraseAddLightbox.style.display = 'flex';
    } else {
        alert(`Nothing is selected! ${hint}`)
    }
}

/**
 * given word context as result, this displays the data from it
 */
function displayWordContext(data) {
    let msg = ""
    let tempArr;
    previousButton.disabled = !selectedWordLocationList[selectedIndex - 1];
    nextButton.disabled = !selectedWordLocationList[selectedIndex + 1];
    document.getElementById('groupWordAddOpenButton').disabled = false;
    document.getElementById('phraseAddOpenButton').disabled = false;

    // insert all received data into the screen
    // top line - one before the selected word
    msg += (data[0].text) ?
        `<i>${data[0].segment} - L.${data[0].line}:</i> ${data[0].text} </br> ` : missingLineSTR + " </br> ";


    // middle line - the line with the selected word
    if (data[1].text) {
        tempArr = data[1].text.split(' ');
        if (selectedWord && markFlag && removeTrail(tempArr[selectedWordLocationList[selectedIndex][4]]).toLowerCase() === selectedWord) {
            tempArr[selectedWordLocationList[selectedIndex][4]] = `<mark>${tempArr[selectedWordLocationList[selectedIndex][4]]}</mark>`;
            msg += `<i>${data[1].segment} - L.${data[1].line}:</i> ${tempArr.join(' ')} </br> `;
        } else if (selectedWord && !markFlag) {
            // mark a sentence
            msg += `<i>${data[1].segment} - L.${data[1].line}:</i> ${data[1].text.replace(new RegExp(selectedWord, 'i'), `<mark>${selectedWord}</mark>`)} </br> `;
        } else {
            msg += `<i>${data[1].segment} - L.${data[1].line}:</i> ${data[1].text} </br> `;
        }

    }
    msg = updateCornerBox(msg, data);

    // bottom line - the line after the selected word
    msg += (data[2].text) ?
        `<i>${data[2].segment} - L.${data[2].line}:</i> ${data[2].text} </br> ` : missingLineSTR + " </br> ";

    tempArr = msg.split(' ');
    for (let i = 0; i < tempArr.length; i++) {
        if (selectedWord && markFlag && removeTrail(tempArr[i].toLowerCase()) === selectedWord.toLowerCase())
            tempArr[i] = `<span class="highlight">${tempArr[i]}</span>`
    }
    contextTextArea.innerHTML = tempArr.join(' ');
}

/**
 * fetch the context of the currently selected word
 */
async function wordContextFetch() {
    const query = {
        SID: selectedWordLocationList[selectedIndex][0],
        SectionNumber: selectedWordLocationList[selectedIndex][1],
        Line: selectedWordLocationList[selectedIndex][3]
    }

    const result = await postMethod('/getContextRows', query);
    if (result.success) {
        displayWordContext(result.data);
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * creates the word table based on a given data
 */
function createWordTable(data, segments) {
    for (let line of data) {
        // play around with the string, removing duplicate white spacing and most non alphanumeric values
        let str = line.Text;
        str = str.replace(/[^a-zA-Z0-9'()\s-]/g, '');
        str = str.replace(/\s+/g, ' ');
        str = str.toLowerCase();
        let words = str.split(" ");

        // loop over all words
        for (let i = 0; i < words.length; i++) {
            let segment = segments.filter(seg => seg.SID === line.SID && seg.SectionNumber === line.SectionNumber)[0]
            let wordEntry = [parseInt(line.SID), line.SectionNumber, segment.Segment, parseInt(line.LineNumber), i]
            // to avoid duplicate words in the list we keep them in a dictionary and if there's already an entry just skip
            if (uniqueWords[words[i]]) {
                uniqueWords[words[i]].push(wordEntry);
                continue;
            }
            uniqueWords[words[i]] = [wordEntry];

            const row = document.createElement('tr');
            let rowEntry = {
                SID: line.SID,
                Word: words[i],
                Segment: segment.Segment,
                Line: line.LineNumber,
                Index: i.toString()
            }

            // insert all cells based on rowEntry
            for (let key in rowEntry) {
                let cell = document.createElement('td')
                cell.textContent = rowEntry[key];
                if (key === "SID")
                    cell.style.display = 'none';
                if (key === "Word" || key === "Segment") {
                    cell.classList.add('stretch')
                }
                row.appendChild(cell)
            }

            // add on click event listener so we can select the rows
            row.addEventListener('click', () => {
                if (selectedRow)
                    selectedRow.classList.toggle('selected-row');
                row.classList.toggle('selected-row');
                selectedRow = row;
                wordSelected(row);
            });

            wordMenuBody.appendChild(row);
        }
    }
}

/**
 * display data upon page startup
 * this creates the filters and adds the text to fullTextDisplay
 */
function displayData(data) {
    try {
        let songDetails = data[0];
        if (songDetails.length > 1) {
            // multiple songs so add them to song filter
            addSongFilter(songDetails);
        } else if (songDetails.length === 1) {
            // one song so display song details
            songFilter.disabled = true;
        } else {
            return;
        }

        // add filters for the different segments
        addSegmentFilter(data[1]);
        addGroupFilter();

        // add all song words to the mini display area
        let fullText = "";
        for (const line of data[2]) {
            fullText += line["Text"] + "\n";
        }
        fullTextDisplay.textContent = fullText;

        // create the word table
        createWordTable(data[2], data[1]);

    } catch (err) {
        console.error("Error in page setup: ", err);
    }
}

/**
 * Creates a table row
 * @param result - data to build the row out of
 * @param tbody - body of the table, where the rows go to
 * @param selection - true if there's need for a selection checkbox
 */
async function buildRow(result, tbody, selection=false) {
    const row = document.createElement('tr');
    let checkboxCell, checkboxInput;

    if (selection) {
        checkboxCell = document.createElement('td');
        checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxCell.appendChild(checkboxInput);
        row.appendChild(checkboxCell);
    }

    for (const key in result) {
        const cell = document.createElement('td');
        if (result[key] != null)
            cell.textContent = result[key];
        else
            cell.textContent = "";
        row.appendChild(cell);
    }

    // Add a click event listener to the row to handle selection
    row.addEventListener('click', () => {
        console.log(selection)
        if (selection) {
            checkboxInput.checked = !checkboxInput.checked;
            row.classList.toggle('selected-row', checkboxInput.checked);
        }
        else {
            row.classList.toggle('selected-row');
        }
    });
    tbody.appendChild(row);
}

/**
 * whenever we reach the group words table, this fetches the selected groups
 * then gets all words from said groups from the server and displays the data
 */
async function updateGroupWordsTable() {
    let resultTable = document.getElementById('groupWordRemoveTable2').querySelector('tbody');
    const selectedRows = Array.from(document.getElementById('groupWordRemoveTable1')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedGroups = selectedRows.map(row => {
        return { name: row.querySelector('td:nth-child(1)').textContent };
    });
    resultTable.innerHTML = '';

    const result = await postMethod('/fetchGroupWords', selectedGroups);
    if (result.success) {
        result.data.forEach(result => {
            buildRow(result, resultTable);
        });
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * Creating a new group
 * this takes the data from the form and sends it to server
 */
async function groupAdd() {
    let name = document.getElementById('gName').value;
    let description = document.getElementById('gDescription').value;

    if (name === "")
        return alert("Please fill out group name");
    if (description === "")
        return alert("Please fill out group description");

    const requestData = {
        name: name,
        description: description
    }

    const result = await postMethod('/groupCreation', requestData);
    if (result.success) {
        await updateGroupTable('groupTable');
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * This tells the server to remove all groups from it
 */
async function groupRemove() {
    const selectedRows = Array.from(document.getElementById('groupTable')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedGroups = selectedRows.map(row => {
        return {
            name: row.querySelector('td:nth-child(1)').textContent
        };
    });

    if (selectedGroups.length === 0)
        return alert("No groups selected");

    const result = await postMethod('/groupRemoval', selectedGroups);
    if (result.success) {
        await updateGroupTable('groupTable');
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * this adds the selectedWord to all selected groups
 */
async function addWord() {
    const selectedRows = Array.from(document.getElementById('groupWordAddTable')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedGroups = selectedRows.map(row => {
        return { name: row.querySelector('td:nth-child(1)').textContent };
    });

    if (selectedGroups.length === 0)
        return alert("No groups selected");

    const requestData = {
        groups: selectedGroups,
        word: selectedWord
    }
    const result = await postMethod('/wordAddition', requestData);
    if (result.success) {
        alert("Word added successfully")
        closeLightbox('groupWordAddLightbox')
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * this functions gets all selected pairs of word and group
 * and removes the word from the group for each pair
 */
async function removeWord() {
    const selectedRows = Array.from(document.getElementById('groupWordRemoveTable2')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedPairs = selectedRows.map(row => {
        return {
            word: row.querySelector('td:nth-child(1)').textContent,
            gName: row.querySelector('td:nth-child(2)').textContent
        };
    });

    if (selectedPairs.length === 0)
        return alert("No words selected")

    const result = await postMethod('/wordRemoval', selectedPairs);
    if (result.success) {
        alert("Words remove successfully");
        closeLightbox('groupWordRemoveLightbox');
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * remove all previous options from a selector that aren't the default -1 options
 */
function clearSelector(selector) {
    for (let i = selector.options.length - 1; i >= 0; i--) {
        let option = selector.options[i];
        if (option.value !== '-1') {
            option.remove();
        }
    }
}

/**
 * whenever the song search dropdown is changed, this fetches all song segments and places in the selector
 */
async function songSearchChange() {
    let selector = document.getElementById('searchLocationSegment');
    let sid = document.getElementById('searchLocationSong').value;

    if (sid !== "-1") {
        const result = await getMethod('/fetchSongSegments', sid);
        if (result.success) {
            clearSelector(selector)
            // add all options fetched from server
            for (let seg of result.data) {
                let option = document.createElement('option');
                option.text = seg.Segment;
                option.value = seg.SegIndex;
                selector.appendChild(option);
            }
            selector.disabled = false;
        } else {
            alert(`Server returned error: ${result.message}`)
        }
    }
}

/**
 * whenever the segment search dropdown is changed, this fetches numbers of lines in the song segment and places in selector
 */
async function segmentSearchChange() {
    let selector = document.getElementById('searchLocationLine');
    let sid = document.getElementById('searchLocationSong').value;
    let segment = document.getElementById('searchLocationSegment').value;

    if (segment !== "-1") {
        const result = await getMethod('/fetchSongLines', `${sid}-${segment}`);

        if (result.success) {
            clearSelector(selector)
            // add all options fetched from server
            for (let seg of result.data) {
                let option = document.createElement('option');
                option.text = seg.Line;
                option.value = seg.Line;
                selector.appendChild(option);
            }
            selector.disabled = false;
        } else {
            alert(`Server returned error: ${result.message}`)
        }
    }
}

/**
 * similar to displayWordContext but for location data
 * this turns off the arrow buttons and changes the marking to mark the entire line if no valid index is given
 */
function displayLocationSearch(data, index) {
    let msg = "", tempArr;
    previousButton.disabled = true;
    nextButton.disabled = true;
    document.getElementById('groupWordAddOpenButton').disabled = false;
    document.getElementById('phraseAddOpenButton').disabled = false;

    // insert all received data into the screen
    // top line - one before the selected word
    msg += (data[0].text) ?
        `<i>${data[0].segment} - L.${data[0].line}:</i> ${data[0].text} </br> ` : missingLineSTR + " </br> ";
    // middle line - the line with the selected word
    if (data[1].text) {
        tempArr = data[1].text.split(' ');
        if (index !== "" && parseInt(index) < tempArr.length && parseInt(index) > -1) {
            // if we found a single match it's good!
            selectedWord = tempArr[index];
            tempArr[index] = `<mark>${tempArr[index]}</mark>`;
            msg += `<i>${data[1].segment} - L.${data[1].line}:</i> ${tempArr.join(' ')} </br> `;
        } else {
            msg += `<i>${data[1].segment} - L.${data[1].line}:</i> <mark> ${tempArr.join(' ')} </mark> </br> `;
        }
    }
    // updating corner box adds * here or at the start of msg
    msg = updateCornerBox(msg, data);
    // bottom line - the line after the selected word
    msg += (data[2].text) ?
        `<i>${data[2].segment} - L.${data[2].line}:</i> ${data[2].text} </br> ` : missingLineSTR + " </br> ";

    contextTextArea.innerHTML = msg;
}

/**
 * searching by location.
 * because location search can't return multiple result so no need to ask the server,
 * this function inserts the data and fetches context for the given location
 */
async function locationSearch() {
    let sid = document.getElementById('searchLocationSong').value;
    let segSearch = document.getElementById('searchLocationSegment');
    let segIndex = segSearch.value;
    let segment = segSearch.options[segSearch.selectedIndex].text;
    let line = document.getElementById('searchLocationLine').value;
    let index = document.getElementById('searchLineInput').value;

    if (sid === "-1" || segment === "-1" || line === "-1")
        return alert("You must select song segment and line in order to search by location");

    selectedWordLocationList = [[parseInt(sid), parseInt(segIndex), segment, parseInt(line), parseInt(index)]];
    selectedIndex = 0;
    selectedWord = null;
    markFlag = true;

    const query = {
        SID: sid,
        SectionNumber: segIndex,
        Line: line
    };

    const result = await postMethod('/getContextRows', query);
    if (result.success) {
        displayLocationSearch(result.data, index);
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * given a search query representing some word of sentence,
 * the function fetches all occurrences of query and fills selectedWordLocationList with them
 */
async function wordSearch(query) {
    const result = await postMethod('/searchLyrics', { query: query });

    if (result.success) {
        selectedWordLocationList = []
        selectedIndex = 0;
        selectedWord = query;
        // if it's a sentence we turn a mark flag because of how marking is done, sentence marking is a bit different
        markFlag = (!query.includes(" "));

        for (let data of result.data) {
            // if it's a single word split the text by space and get all occurrences of the word
            if (!query.includes(" ")) {
                let argArr = data.Text.split(" ")

                for (let i = 0; i < argArr.length; i++) {
                    if (removeTrail(argArr[i].toLowerCase()) === selectedWord) {
                        let entry = [parseInt(data.SID), parseInt(data.SegIndex), data.Segment, parseInt(data.LNumber), i]
                        console.log(entry);
                        selectedWordLocationList.push(entry);
                    }
                }
            // if it's a phrase simply insert the data (we can't detect a repeating phrase in a line
            } else {
                let entry = [parseInt(data.SID), parseInt(data.SegIndex), data.Segment, parseInt(data.LNumber), -1]
                selectedWordLocationList.push(entry);
            }
        }
        // if we got at least one result, continue with context fetching
        if (result.data[0])
            await wordContextFetch();
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * Whenever we need a table with all phrases, this function fetches the phrases from the server
 * and later builds the table with the returned results
 */
async function displayPhrases(tableId) {
    const resultTable = document.getElementById(tableId).querySelector('tbody');
    resultTable.innerHTML = '';

    const result = await getMethod('/fetchAllPhrases');
    if (result.success) {
        result.data.forEach(result => {
            buildRow(result, resultTable, true);
        });
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * Whenever the submit button in create new phrase is clicked, this grabs the current selection and tries to add it as a phrase
 */
async function phraseAdd() {
    const result = await postMethod('/addPhrase', { phrase: phraseSelection });
    if (result.success) {
        alert("Phrase added successfully")
        closeLightbox('phraseAddLightbox');
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * when the confirm button inside the phrase removal is pressed
 * this selects all selected phrases and tells the server to remove them
 */
async function phraseRemove() {
    const selectedRows = Array.from(document.getElementById('phraseRemoveTable')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedPhrases = selectedRows.map(row => {
        return { phrase: row.querySelector('td:nth-child(2)').textContent };
    });

    if (selectedPhrases.length === 0)
        return alert("No phrases selected")


    const result = await postMethod('/removePhrase', selectedPhrases);
    if (result.success) {
        alert("Phrase removed successfully")
        closeLightbox('phraseRemoveLightbox');
    } else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * whenever we need to open or update group table this function is called
 * it sends a get request to the server and inserts the result into a given table
 */
async function updateGroupTable(tableId) {
    let resultTable = document.getElementById(tableId).querySelector('tbody');
    resultTable.innerHTML = '';

    const result = await getMethod('/fetchAllGroups');
    if (result.success) {
        result.data.forEach(entry => {
            buildRow(entry, resultTable);
        });
    }
    else {
        alert(`Server returned error: ${result.message}`)
    }
}

/**
 * within phrase search this is the search button
 * the function makes sure exactly one phrase is selected before sending it to words search
 */
async function phraseSearch() {
    const selectedRows = Array.from(document.getElementById('phraseSearchTable')
        .querySelector('tbody').querySelectorAll('tr.selected-row'));
    const selectedPhrases = selectedRows.map(row => {
        return { phrase: row.querySelector('td:nth-child(2)').textContent };
    });

    // make sure exactly one phrase is selected
    if (selectedPhrases.length === 0)
        return alert("No phrases selected");
    if (selectedPhrases.length > 1)
        return alert("You can only search one phrase at a time");

    await wordSearch(selectedPhrases[0].phrase);
    closeLightbox('phraseSearchLightbox')
}
