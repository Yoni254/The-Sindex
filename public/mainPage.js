

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

function goHome() {
    let red = window.location.toString().substring(0, getPosition(window.location.toString(), "/", 3))
    window.location.href = `${red}/index.html`
}

function loadSong() {
    let red = window.location.toString().substring(0, getPosition(window.location.toString(), "/", 3))
    window.location.href = `${red}/load.html`
}
function searchSong() {
    let red = window.location.toString().substring(0, getPosition(window.location.toString(), "/", 3))
    window.location.href = `${red}/search.html`
}
function showData() {
    let red = window.location.toString().substring(0, getPosition(window.location.toString(), "/", 3))
    window.location.href = `${red}/showData.html`
}