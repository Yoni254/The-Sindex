const express = require('express')
const {response} = require("express");
const fs = require('fs');
const upload = require('./upload');
const app = express()

let data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const host = data["host"];
const port = data["port"];

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/upload', upload.single('file'), (req, res) => {
    // Handle the uploaded file
});

app.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}/index.html`);
})
