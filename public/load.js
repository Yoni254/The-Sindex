const recognizedTokens = ['[Intro]', '[Pre-Chorus]', '[Chorus]', '[Post-Chorus]', '[Bridge]', '[Outro]'];
const uploadContainer = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const selectedFileName = document.getElementById('selectedFileName');
const submitButton = document.getElementById('submitButton');


// Prevent default behavior of dragging over the container
uploadContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadContainer.classList.add('drag-over');
});

// Handle dropping files into the container
uploadContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadContainer.classList.remove('drag-over');

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
        fileInput.files = droppedFiles;
        updateSelectedFile();
    }
});

fileInput.addEventListener('change', () => {
    updateSelectedFile();
});

/**
 * when file is updated for any reason, this updates the text and enables the button
 */
function updateSelectedFile() {
    if (fileInput.files.length > 0) {
        submitButton.classList.add('enabled');
        selectedFileName.textContent = "Selected file name: " + fileInput.files[0].name;
    } else {
        submitButton.classList.remove('enabled');
        selectedFileName.textContent = 'No Selected File';
    }
}

/**
 *
 */
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        await formData.append('file', file);
        console.log(formData.entries())
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });



        const result = await response.text();

        const textArea = document.getElementById('fileContent');
        textArea.value = result;

        document.getElementById('uploadMsg').style.display = 'none'
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('formatData').style.display = 'block';
        document.getElementById('textContentArea').style.display = 'block';
    }
}

function saveChanges() {
    let passFlag = true;
    const textArea = document.getElementById('fileContent');
    const text = textArea.value;

    const lines = text.split('\n');
    const tokenLineIndexes = [];

    lines.forEach((line, index) => {
        if (recognizedTokens.some(token => line.includes(token))) {
            tokenLineIndexes.push(index);
        } else if (line.match(/\[Verse \d+]/)) {
            tokenLineIndexes.push(index);
        } else if (line.startsWith('[')) {
            alert('Unrecognized token: ' + line);
            passFlag = false;
        }
    });

    if (tokenLineIndexes.length > 0) {

        // Display recognized segments
        const segmentList = document.getElementById('segmentList');
        segmentList.innerHTML = '';

        for (let i = 0; i < tokenLineIndexes.length; i++) {
            const tokenIndex = tokenLineIndexes[i];
            const nextTokenIndex = tokenLineIndexes[i + 1];

            let segmentText = '';

            if (nextTokenIndex !== undefined) {
                segmentText = lines.slice(tokenIndex + 1, nextTokenIndex).join('\n');
            } else {
                segmentText = lines.slice(tokenIndex + 1).join('\n');
            }

            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                        <td class="token">${lines[tokenIndex]}</td>
                        <td><textarea rows="5" style="resize: none;">${segmentText}</textarea></td>`;

            segmentList.appendChild(tableRow);
        }
    } else {
        // Stay on the editing page
        alert('No recognized tokens found. Please add tokens like [Intro], [Chorus], [Verse n], etc.');
        passFlag = false;
    }

    // todo: add content validation for the format

    if (passFlag) {
        document.getElementById('textContentArea').style.display = 'none';
        document.getElementById('formatData').style.display = 'none';
        document.getElementById('detailsForm').style.display = 'block';
        document.getElementById('detailsData').style.display = 'block';
    }

}

function discardChanges() {
    location.reload()
}

async function saveDetails() {
    const songName = document.getElementById('songName').value;
    const singer = document.getElementById('singer').value;
    const releaseDate = document.getElementById('releaseDate').value;
    const album = document.getElementById('album').value;

    const segmentRows = document.querySelectorAll('.segment-table tbody tr');
    const segments = [];

    segmentRows.forEach(row => {
        const token = row.querySelector('.token').textContent;
        const segmentText = row.querySelector('textarea').value;

        segments.push({
            token: token,
            segmentText: segmentText
        });
    });

    // data validation - make sure the information was filled
    if (songName === "") { alert("Please fill out song name"); return; }
    if (singer === "") { alert("Please fill out the singer(s)"); return; }
    if (releaseDate === "") { alert("Please fill out release date"); return; }


    const requestData = {
        songName: songName,
        singer: singer,
        releaseDate: releaseDate,
        album: album,
        segments: segments
    };

    console.log(requestData)

    // Send the details to the server for saving
    try {
        const response = await fetch('/processSong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        if (result.success) {
            if (confirm('File Uploaded Successfully. Click OK to continue.')) {
                window.location.href = 'main.html';
            }
        } else {
            console.error('Error:', result.message);
            alert('Error happened, please try again.')
        }

    } catch (err) {
        console.error('Error:', err);
    }
}