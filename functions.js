const dbHandler = require("./dbHandler");
const util = require("./util");
const path = require("path");

/*
Main functions file for backend
here is most of the backend logic for the project
as well as most of the SQL queries
 */


/**
 * Returns all songs and their data as follows:
 * data: SID, SName, Singers, Data, Album
 */
exports.fetchAllData = async (req, res, next) => {
    let data = await dbHandler.selectData('SELECT * FROM Songs');
    const resultArray = data.rows.map(arr => {
        return {
            SID: arr[0],
            SName: arr[1],
            Singers: arr[2],
            Date: util.dateFormat(arr[3]),
            Album: arr[4]
        };
    });
    res.json({
        success: true,
        data: resultArray}
    );
}

/**
 * given a single song id as query, this returns a list of all segments the song has
 */
exports.fetchSongSegments = async (req, res, next) => {
    const query = req.query.query;
    let data = await dbHandler.selectData('SELECT Segment, SegIndex FROM SongOrder WHERE SID = :SID', { SID: query });
    const resultArray = data.rows.map(arr => {
        return {
            Segment: arr[0],
            SegIndex: arr[1]
        };
    });
    res.json({
        success: true,
        data: resultArray}
    );
}

/**
 * given SID and segment index as follows: SID-SegIndex, this returns all lines within said song segment
 */
exports.fetchSongLines = async (req, res, next) => {
    const query = req.query.query.split('-');

    let data = await dbHandler.selectData('SELECT LNumber FROM Lines WHERE SID = :SID AND SegIndex = :SegIndex',
        { SID: query[0], SegIndex: query[1] });
    const resultArray = data.rows.map(arr => {
        return {
            Line: arr[0],
        };
    });
    res.json({
        success: true,
        data: resultArray}
    );
}

/**
 * given a list of SID seperated by -, this returns all data about those songs
 * result.data is made from song data, segments data and lines data
 */
exports.getSongs = async (req, res, next) => {
    const query = req.query.query;
    const SIDList = query.split('-')

    let songArr = [], segmentArr = [], linesArr = [];

    for (let i = 0; i < SIDList.length; i++) {
        let SID = parseInt(SIDList[i]);
        SIDList[i] = SID;

        let songsData = await dbHandler.selectData("SELECT * FROM Songs WHERE SID = :sid",
            { sid: SID });
        let segmentsData = await dbHandler.selectData("SELECT * FROM SongOrder WHERE SID = :sid",
            { sid: SID });
        let Lines = await dbHandler.selectData("SELECT * FROM Lines WHERE SID = :sid",
            { sid: SID });

        songsData.rows.forEach(song => {
            songArr.push({
                SID: song[0],
                SName: song[1],
                Singers: song[2],
                Date: util.dateFormat(song[3]),
                Album: song[4]
            });
        });
        segmentsData.rows.forEach(seg => {
            segmentArr.push({SID: seg[0], SectionNumber: seg[1], Segment: seg[2], Lines: seg[3] });
        });
        Lines.rows.forEach(line => {
            linesArr.push({ SID: line[0], SectionNumber: line[1], LineNumber: line[2],  Text: line[3] });
        });
    }

    res.json({
        success: true,
        data: [songArr, segmentArr, linesArr]
    });
}

/**
 * this simply returns all groups inside the database
 */
exports.fetchAllGroups = async (req, res, next) => {
    let data = await dbHandler.selectData('SELECT * FROM Groups');

    const resultArray = data.rows.map(arr => {
        return {
            name: arr[0],
            description: arr[1]
        };
    });
    res.json({
        success: true,
        data: resultArray
    });
}

/**
 * this simply returns all phrases inside the database
 */
exports.fetchAllPhrases = async (req, res, next) => {
    let data = await dbHandler.selectData("SELECT * FROM Phrases")
    res.json({
        success: true,
        data: data.rows
    })
}

/**
 * upon file uploading, make sure it's of .txt type and that the upload was done successfully
 */
exports.upload = (req, res) => {
    const uploadedFile = req.file;
    if (uploadedFile) {
        const allowedExtensions = ['.txt'];
        const fileExtension = path.extname(uploadedFile.originalname);

        if (allowedExtensions.includes(fileExtension)) {
            const fileContent = uploadedFile.buffer.toString();

            res.send(fileContent);
        } else {
            res.status(400).send('Invalid file type. Only .txt files are allowed.');
        }
    } else {
        res.status(400).send('No file uploaded.');
    }
}


/**
 * this function processes a given song
 * data gets uniformed and inserted into the SQL database
 * while doing this function we make sure all names are in title case and that empty strings are removed
 */
exports.processSong = async (req, res, next) => {
    const data = req.body;
    // TODO: data validation

    if (data.songName && data.singer) {
        let date = new Date(data.releaseDate)

        // insert song details
        await dbHandler.insertData("INSERT INTO Songs (SName, Singers, ReleaseDate, Album) VALUES (:SName, :Singers, :Release, :Album)",
            {SName: util.toTitleCase(data.songName), Singers: util.toTitleCase(data.singer), Release: date, Album: util.toTitleCase(data.album)});

        let SID = await dbHandler.getSID(data.songName, data.singer);

        for (let i = 0; i < data.segments.length; i++) {
            let lines = data.segments[i].segmentText.split("\n")
            let token = data.segments[i].token.substring(1, data.segments[i].token.length - 1);
            lines = util.removeEmptyStrings(lines);

            // insert segment details
            await dbHandler.insertData("INSERT INTO SongOrder VALUES (:SID, :SegIndex, :Segment, :SegSize)",
                {SID: SID, SegIndex: i, Segment: token, SegSize: lines.length})

            for (let j = 0; j < lines.length; j++) {
                // insert line data
                await dbHandler.insertData("INSERT INTO Lines VALUES (:SID, :SegIndex, :LNumber, :Text)",
                    {SID: SID, SegIndex: i, LNumber: j, Text: lines[j]})
            }
        }
        res.json({
            success: true,
            message: 'Data processed successfully.'
        });
    } else {
        // Data is not valid, send an error response
        res.status(400).json({ success: false, message: 'Invalid data.' });
    }
}

/**
 * given a query and a search type as decided by the search menu
 * this simply returns the search result.
 *
 * there are 3 types of searches:
 * search by song details (data)
 * search by song lyrics (lyrics)
 * search by groups (group)
 */
exports.search = async (req, res, next) => {
    const data = req.body;
    let searchResults;

    if (data.type === 'data') {
        const dataSQL = `
                SELECT * 
                FROM Songs
                WHERE SName LIKE :data OR Singers LIKE :data OR Album LIKE :data`
        searchResults = await dbHandler.selectData(dataSQL, { data: `%${util.toTitleCase(data.query)}%` });
    }
    else if (data.type === 'lyrics') {
        const lyrics = `
                SELECT SID, SName, Singers, ReleaseDate, Album
                FROM Songs NATURAL JOIN Lines
                WHERE REGEXP_LIKE(Text, :lyrics, 'i')`
        searchResults = await dbHandler.selectData(lyrics,
            { lyrics: `^${data.query} | ${data.query} | ${data.query}$` });
    }
    else if (data.type === 'group') {
        const groupSQL = `
                SELECT SID, SName, Singers, ReleaseDate, Album
                FROM WordInGroup NATURAL JOIN Songs
                WHERE GName LIKE :gName`
        searchResults = await dbHandler.selectData(groupSQL, { gName: `%${util.toTitleCase(data.query)}%` });
    }
    else {
        res.status(400).json({ success: false, message: 'Invalid selection type' });
    }

    let resultArr = [];
    let resultSet = new Set();

    // convert the data to unique json array
    searchResults.rows.forEach(arr => {
        const transformedObject = {
            SID: arr[0],
            SName: arr[1],
            Singers: arr[2],
            Date: util.dateFormat(arr[3]),
            Album: arr[4]
        };
        // this makes sure no duplicates are pushed in
        const transformedJSON = JSON.stringify(transformedObject);
        if (!resultSet.has(transformedJSON)) {
            resultSet.add(transformedJSON);
            resultArr.push(transformedObject);
        }
    });

    res.json({
        success: true,
        data: resultArr
    });
}

/**
 * given a specific string, this searches the song lines for it and returns all occurrences
 */
exports.searchLyrics = async (req, res, next) => {
    const data = req.body;
    let searchResults;

    const lyrics = `
            SELECT SID, SegIndex, Segment, LNumber, Text
            FROM Lines NATURAL JOIN SongOrder
            WHERE REGEXP_LIKE(Text, :lyrics, 'i')`
    searchResults = await dbHandler.selectData(lyrics,
        { lyrics: `^${data.query} | ${data.query} | ${data.query}$` });
    let resultArr = [];
    let resultSet = new Set();

    // convert the data to unique json array
    searchResults.rows.forEach(arr => {
        const transformedObject = {
            SID: arr[0],
            SegIndex: arr[1],
            Segment: arr[2],
            LNumber: arr[3],
            Text: arr[4]
        };

        const transformedJSON = JSON.stringify(transformedObject);
        if (!resultSet.has(transformedJSON)) {
            resultSet.add(transformedJSON);
            resultArr.push(transformedObject);
        }
    });

    res.json({
        success: true,
        data: resultArr
    });
}

/**
 * given a specific SID and SegIndex this returns all lines in the segment
 * lines are returned seperated by </br> for easier use in html code
 */
exports.getSongSegment = async (req, res, next) => {
    const reqData = req.body;
    let result = ""

    let data = await dbHandler.selectData("SELECT Text FROM Lines WHERE SID = :SID AND SegIndex = :SegIndex",
        {SID: reqData.SID, SegIndex: reqData.SectionNumber})

    for (let i = 0 ; i < data.rows.length; i++) {
        result += `${data.rows[i][0]}  </br> `;
    }

    res.json({
        success: true,
        data: result
    })
}

/**
 * One of the most important functions,
 * given a location (SID, Segment and line) the function returns the text from the location
 * as well as line before and after
 * segment boundaries are considered and the returned data can come from multiple sections
 * if a line is missing the data for it is kept null
 */
exports.getContextRows = async (req, res, next) => {
    const requestData = req.body;
    // we give 3 lines.
    let text1, seg1, segLine1;
    let text2, seg2, segLine2, segNum2;
    let text3, seg3, segLine3;

    let SID = parseInt(requestData.SID)
    let currSegIndex = parseInt(requestData.SectionNumber);
    let currLine = parseInt(requestData.Line);

    const fetchLineSQL = `
            SELECT * 
            FROM Lines NATURAL JOIN SongOrder 
            WHERE SID = :SID AND SegIndex = :SegIndex AND LNumber = :Line`

    // getting this line
    let currentLine = await dbHandler.selectData(fetchLineSQL, {SID: SID, SegIndex: currSegIndex, Line: currLine});

    segNum2 = currentLine.rows[0][1];
    segLine2 = currentLine.rows[0][2];
    text2 = currentLine.rows[0][3];
    seg2 = currentLine.rows[0][4];
    let segSize = currentLine.rows[0][5]

    // getting previous line
    let previousLine = null;
    if (segLine2 === 0 && segNum2 === 0)    // no segment to go back to
        seg1 = segLine1 = text1 = null;
    else if (segLine2 === 0) {              // go back one segment

        let segSize = await dbHandler.selectData("SELECT SegSize FROM SongOrder WHERE SID = :SID AND SegIndex = :SegIndex",
            { SID: SID, SegIndex: currSegIndex - 1 });
        previousLine = await dbHandler.selectData(fetchLineSQL,
            { SID: SID, SegIndex: currSegIndex - 1, Line: segSize.rows[0][0] - 1});
    }
    else                                    // same segment
        previousLine = await dbHandler.selectData(fetchLineSQL, {SID: SID, SegIndex: currSegIndex, Line: currLine - 1});

    if (previousLine) {
        segLine1 = previousLine.rows[0][2];
        text1 = previousLine.rows[0][3];
        seg1 = previousLine.rows[0][4];
    }

    // getting next line
    let nextLine;
    if (segSize === segLine2 + 1) // need next segment
        nextLine = await dbHandler.selectData(fetchLineSQL, {SID: SID, SegIndex: currSegIndex + 1, Line: 0});
    else // need current segment
        nextLine = await dbHandler.selectData(fetchLineSQL, {SID: SID, SegIndex: currSegIndex, Line: currLine + 1});

    if (nextLine.rows[0]) {
        segLine3 = nextLine.rows[0][2];
        text3 = nextLine.rows[0][3];
        seg3 = nextLine.rows[0][4];
    }

    res.json({
        success: true,
        data: [
            {text: text1, segment: seg1, line: segLine1},
            {text: text2, segment: seg2, line: segLine2},
            {text: text3, segment: seg3, line: segLine3},
        ]
    });
}

/**
 * Create group based on a given name
 * if a group already exists, return false
 */
exports.groupCreation = async (req, res, next) => {
    const reqData = req.body;

    // first make sure group doesn't exist
    let data = await dbHandler.selectData("SELECT * FROM Groups WHERE GName = :GName",
        { GName: reqData.name })
    if (data.rows[0]) {
        res.status(400).json({ success: false, message: 'Group already exists' });
    }
    else {
        await dbHandler.insertData("INSERT INTO Groups VALUES (:GName, :Description)",
            { GName: util.toTitleCase(reqData.name), Description: reqData.description.toLowerCase() });
        res.json({
            success: true
        });
    }
}

/**
 * Remove group based on a given name
 */
exports.groupRemoval = async (req, res, next) => {
    const reqData = req.body;

    for (let data of reqData) {
        await dbHandler.insertData("DELETE FROM Groups WHERE GName = :GName",
            { GName: util.toTitleCase(data["name"]) });
        await dbHandler.insertData("DELETE FROM GroupMembers WHERE GName = :GName",
            { GName: util.toTitleCase(data["name"]) });
        await dbHandler.insertData("DELETE FROM WordInGroup WHERE GName = :GName",
            { GName: util.toTitleCase(data["name"]) });
    }
    res.json({
        success: true
    });
}

/**
 * add a word to a group or to multiple groups
 * after making sure the word wasn't added already, it's added and answer is returned
 * the function then keeps going in the background, going over all lines in the database and finding all location of the word
 */
exports.wordAddition = async (req, res, next) => {
    const reqData = req.body;

    for (const group of reqData.groups) {
        // first make sure word isn't in the group already
        let data = await dbHandler.selectData("SELECT * FROM GroupMembers WHERE GName = :GName AND Word = :Word",
            { GName: util.toTitleCase(group.name), Word: reqData.word.toLowerCase() })
        if (data.rows[0]) {
            res.status(400).json({ success: false, message: `Word already in group ${group.name}` });
            return;
        }
        else {
            await dbHandler.insertData("INSERT INTO GroupMembers VALUES (:GName, :Word)",
                { GName: util.toTitleCase(group.name), Word: reqData.word.toLowerCase() })
        }
    }
    res.json({
        success: true
    });

    // look for all lines that contain the word and insert into WordInGroup
    let cWord = reqData.word.charAt(0).toUpperCase() + reqData.word.substring(1);
    let data = await dbHandler.selectData("SELECT * FROM Lines WHERE Text LIKE :Word OR Text LIKE :CWord",
        { Word: `%${reqData.word}%`, CWord: `%${cWord}%`})

    for (const row of data.rows) {
        // make sure the row has the word in it
        let str = row[3];
        str = str.replace(/[^a-zA-Z0-9'()\s-]/g, '');
        str = str.replace(/\s+/g, ' ');
        str = str.toLowerCase();

        if (str.toLowerCase().split(" ").includes(reqData.word.toLowerCase())) {
            let index = row[3].toLowerCase().indexOf(reqData.word);
            for (const group of reqData.groups) {
                await dbHandler.insertData("INSERT INTO WordInGroup VALUES (:SID, :SegIndex, :LNumber, :GName, :Word, :LIndex)",
                    {SID: row[0], SegIndex: row[1], LNumber: row[2], GName: util.toTitleCase(group.name), Word: reqData.word.toLowerCase(), LIndex: index})
            }
        }
    }
}

/**
 * given one or more groups, this returns a list of all words in those groups
 */
exports.fetchGroupWords = async (req, res, next) => {
    const reqData = req.body;
    let result = [];

    for (const name of reqData) {
        let wordsRes = await dbHandler.selectData("SELECT * FROM GroupMembers WHERE GName = :gName",
            { gName: util.toTitleCase(name["name"]) });

        wordsRes.rows.forEach(song => {
            result.push({
                Word: song[1],
                GName: song[0]
            });
        });
    }
    res.json({
        success: true,
        data: result
    });
}

/**
 * given one or more word and group pairs, this function removes the word from the group
 */
exports.wordRemoval = async (req, res, next) => {
    const reqData = req.body;

    for (let data of reqData) {
        await dbHandler.insertData("DELETE FROM WordInGroup WHERE GName = :gName AND Word = :word",
            { gName: util.toTitleCase(data["gName"]), word: data["word"].toLowerCase() });
        await dbHandler.insertData("DELETE FROM GroupMembers WHERE GName = :gName AND Word = :word",
            { gName: util.toTitleCase(data["gName"]), word: data["word"].toLowerCase() });
    }
    res.json({
        success: true
    });
}

/**
 * adds a given phrase to the phrases table
 * if such phrase already exists, return success: false
 */
exports.addPhrase = async (req, res, next) => {
    const reqData = req.body;

    // first make sure word isn't in the group already
    let data = await dbHandler.selectData("SELECT * FROM Phrases WHERE Phrase = :text",
        { text: reqData.phrase });
    if (data.rows[0]) {
        res.status(400).json({ success: false, message: `Phrase ${reqData.phrase} already exists` });
        return;
    }
    else {
        await dbHandler.insertData("INSERT INTO Phrases VALUES (:text)",
            { text: reqData.phrase });
    }
    res.json({
        success: true
    });
}

/**
 * remove a given phrase from the phrases table
 */
exports.removePhrase = async (req, res, next) => {
    const reqData = req.body;

    for (let data of reqData) {
        await dbHandler.insertData("DELETE FROM Phrases WHERE Phrase = :text",
            { text: data.phrase });
    }
    res.json({
        success: true
    });
}