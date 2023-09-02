const dbHandler = require("./dbHandler");

/**
 * Run this code to delete and create all tables
 */

async function songTableCreation() {
    await dbHandler.deleteAllSongTables();


    let songsSQL = `CREATE TABLE Songs (
        SID         NUMBER          GENERATED ALWAYS AS IDENTITY,
        SName       VARCHAR2(255)   NOT NULL,
        Singers     VARCHAR2(255)   NOT NULL,
        ReleaseDate DATE            NOT NULL,
        Album       VARCHAR2(255),
        PRIMARY KEY (SID)
        )`
    await dbHandler.createTable("Songs", songsSQL);


    let segmentsSQL = `CREATE TABLE SongOrder (
        SID         NUMBER,
        SegIndex    NUMBER          NOT NULL,
        Segment     VARCHAR2(255)   NOT NULL,
        SegSize     NUMBER          NOT NULL,
        PRIMARY KEY (SID, SegIndex),
        FOREIGN KEY (SID) REFERENCES Songs(SID)
        )`
    await dbHandler.createTable("SongOrder", segmentsSQL);


    let linesSQL = `CREATE TABLE Lines (
        SID         NUMBER,
        SegIndex    NUMBER,
        LNumber     NUMBER          NOT NULL,
        Text        VARCHAR2(255)   NOT NULL,
        PRIMARY KEY (LNumber, SID, SegIndex),
        FOREIGN KEY (SID, SegIndex) REFERENCES SongOrder(SID, SegIndex)
        )`
    await dbHandler.createTable("Lines", linesSQL);

}

async function groupTableCreation() {
    await dbHandler.deleteAllGroupTables();

    let groupsSQL = `CREATE TABLE Groups (
        GName       VARCHAR2(255)   NOT NULL,
        Description VARCHAR2(2000)  NOT NULL,
        PRIMARY KEY (GName)   
        )`
    await dbHandler.createTable("Groups", groupsSQL);

    let groupMembersSQL = ` CREATE TABLE GroupMembers (
        GName       VARCHAR2(255),
        Word        VARCHAR2(255)   NOT NULL,
        PRIMARY KEY (GName, Word),
        FOREIGN KEY (GName) REFERENCES Groups(GName)
    )`
    await dbHandler.createTable("GroupMembers", groupMembersSQL);

    let wordInGroupSQL = `CREATE TABLE WordInGroup (
        SID         NUMBER,
        SegIndex    NUMBER,
        LNumber     NUMBER,
        GName       VARCHAR2(255),
        Word        VARCHAR2(255),
        LIndex      NUMBER          NOT NULL,
        PRIMARY KEY (SID, SegIndex, LNumber, GName, Word),
        FOREIGN KEY (SID, SegIndex, LNumber) REFERENCES Lines(SID, SegIndex, LNumber),
        FOREIGN KEY (GName, Word) REFERENCES GroupMembers(GName, Word)  
    )`
    await dbHandler.createTable("WordInGroup", wordInGroupSQL);

}

async function phraseTableCreation() {
    // a simple table creation. this gets reset every restart
    await dbHandler.deletePhrasesTable();

    let PhrasesSQL = `CREATE TABLE Phrases (
        Phrase      VARCHAR2(255)   NOT NULL,
        PRIMARY KEY (Phrase)   
        )`
    await dbHandler.createTable("Phrases", PhrasesSQL);
}

//songTableCreation()
//groupTableCreation()
//phraseTableCreation()