

function closeLightbox(id) {
    try {
        document.getElementById(id).style.display = 'none';
        document.getElementById(id).querySelectorAll('.openable').forEach(element => {
            element.style.display = 'none';
        })
        document.getElementById(id).querySelectorAll('.closeable').forEach(element => {
            element.style.display = 'block';
        })

    }
    catch (err) {
        console.log("Error closing lightbox", err);
    }
}

function openAndClose(open, close) {
    document.getElementById(open).style.display = 'block';
    document.getElementById(close).style.display = 'none';
}

async function openGroupManage() {
    await updateGroupTable('groupTable')
    groupManageLightbox.style.display = 'flex';
}

async function openWordAdd() {
    if (selectedWord) {
        document.getElementById('wordAdditionSelectedWordDisplay').innerHTML = `<u>${selectedWord}</u>`;
        await updateGroupTable('groupWordAddTable')
        groupWordAddLightbox.style.display = 'flex';
    }
    else {
        alert("No word is selected. use the words menu ")
    }

}

async function openWordRemove() {
    await updateGroupTable('groupWordRemoveTable1')
    groupWordRemoveLightbox.style.display = 'flex';
}

function openPhraseRemove() {
    displayPhrases('phraseRemoveTable')
    phraseRemoveLightbox.style.display = 'flex';
}

function openSearchOption() {
    document.getElementById('searchByWordDiv').style.display = 'none';
    document.getElementById('searchByLocationDiv').style.display = 'none';
    searchOptionsLightbox.style.display = 'flex';
}

function openPhraseSearch() {
    displayPhrases('phraseSearchTable')
    document.getElementById('phraseSearchLightbox').style.display = 'flex';
    document.getElementById('searchOptionsLightbox').style.display = 'none';
}

function previousWord() {
    if (!selectedWordLocationList[selectedIndex - 1]) {
        alert("Couldn't find any previous locations")
        return; // should never happen but just a fail-safe
    }
    selectedIndex -= 1;
    wordContextFetch();
}

function nextWord() {
    if (!selectedWordLocationList[selectedIndex + 1]) {
        alert("Couldn't find any more locations")
        return; // should never happen but just a fail-safe
    }
    selectedIndex += 1;
    wordContextFetch();
}

function wordSelected(row) {
    selectedWord = row.cells[1].textContent;
    selectedWordLocationList = uniqueWords[selectedWord]
    selectedIndex = 0;
    markFlag = true;
    wordContextFetch();
}

async function groupWordRemoveContinue() {
    await updateGroupWordsTable();
    document.getElementById('removalGroupSelection').style.display = 'none';
    document.getElementById('removalWordSelection').style.display = 'block';
}


async function wordSearchButton() {
    let searchQuery = document.getElementById('searchInput').value;
    if (searchQuery === "") {
        alert("Missing search query");
        return;
    }
    await wordSearch(searchQuery);
}