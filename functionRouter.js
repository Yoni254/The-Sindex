const express = require('express');
const router = express.Router();
const functions = require('./functions');
const errorHandler = require('./errorHandler');
const multer = require('multer');
const upload = multer();

/*
Routing of the different requests to functions
all is going through the error handler in case there's an unexpected error
 */

router.get('/fetchAllData', errorHandler(functions.fetchAllData));
router.get('/fetchSongSegments', errorHandler(functions.fetchSongSegments))
router.get('/fetchSongLines', errorHandler(functions.fetchSongLines))
router.get('/getSongs', errorHandler(functions.getSongs));
router.get('/fetchAllGroups', errorHandler(functions.fetchAllGroups))
router.get('/fetchAllPhrases', errorHandler(functions.fetchAllPhrases))

router.post('/upload', upload.single('file'), errorHandler(functions.upload))
router.post('/processSong', errorHandler(functions.processSong))
router.post('/search', errorHandler(functions.search))
router.post('/searchLyrics', errorHandler(functions.searchLyrics))
router.post('/getSongSegment', errorHandler(functions.getSongSegment))
router.post('/getContextRows', errorHandler(functions.getContextRows))
router.post('/groupCreation', errorHandler(functions.groupCreation))
router.post('/groupRemoval', errorHandler(functions.groupRemoval))
router.post('/wordAddition', errorHandler(functions.wordAddition))
router.post('/fetchGroupWords', errorHandler(functions.fetchGroupWords))
router.post('/wordRemoval', errorHandler(functions.wordRemoval))
router.post('/addPhrase', errorHandler(functions.addPhrase))
router.post('/removePhrase', errorHandler(functions.removePhrase))

module.exports = router;