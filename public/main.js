

function goHome() {
    let red = window.location.toString().split("/", 3).join("/");
    window.location.href = `/index.html`
}

function loadSong() {
    let red = window.location.toString().split("/", 3).join("/");
    window.location.href = `/load.html`
}
function searchSong() {
    let red =window.location.toString().split("/", 3).join("/");
    window.location.href = `/search.html`
}