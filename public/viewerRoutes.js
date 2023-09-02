/*
This file has all the functions that communicate with the server from viewer page
 */

async function postMethod(route, body) {
    try {
        console.log("Sending POST to ", route)
        let response = await fetch(route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        return await response.json();
    }
    catch (error) {
        console.error('Error in POST method:', error);
        return {success: false, msg: "couldn't connect to server"};
    }
}

async function getMethod(route, query=null) {
    try {
        console.log("Sending GET to ", route)
        let response;
        if (query)
            response = await fetch(`${route}?query=${encodeURIComponent(query)}`)
        else
            response = await fetch(route)
        return await response.json();
    }
    catch (error) {
        console.error('Error in GET method:', error);
        return {success: false, msg: "couldn't connect to server"};
    }
}