function removeEmptyStrings(array) {
    // Create a new array to store non-empty strings
    const newArray = [];

    // Loop through the original array
    for (let i = 0; i < array.length; i++) {
        // Trim the current string to remove leading and trailing white spaces
        const trimmedString = array[i].trim();

        if (trimmedString !== "") {
            newArray.push(trimmedString);
        }
    }
    return newArray;
}

function dateFormat(date) {
    let m = date.getMonth() + 1;
    let d = date.getDate();
    let y = date.getFullYear()
    return [(d>9 ? '' : '0') + d, (m>9 ? '' : '0') + m, y].join('.');
}

function toTitleCase(str) {
    if (str === null)
        return null;
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}



module.exports = {
    removeEmptyStrings,
    dateFormat,
    toTitleCase
}