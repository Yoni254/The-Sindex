const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs');
const errorHandler = require("./errorHandler")
const functionRoutes = require('./functionRouter');
const path = require("path");



const app = express()
let data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const host = data["host"];
const port = data["port"];

app.use(express.static('public'));
app.use(bodyParser.json());

// log incoming requests before redirecting
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});




app.use('/', functionRoutes);
app.use(errorHandler);

// express.js - works on startup of server
app.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}/main.html`);
})
