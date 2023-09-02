const con = require("./dbConnection");


async function deleteAllSongTables() {
    try {
        let connection = await con.openConnection();
        try {
            await connection.execute(`DROP TABLE Lines`);
        } catch (err) {
            console.log("Error dropping table Lines " + err)
        }

        try {
            await connection.execute(`DROP TABLE SongOrder`);
        } catch (err) {
            console.log("Error dropping table SongOrder " + err)
        }

        try {
            await connection.execute(`DROP TABLE Songs`);
        } catch (err) {
            console.log("Error dropping table Songs " + err)
        }
    }
    catch (err) {}
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}


async function deleteAllGroupTables() {
    try {
        let connection = await con.openConnection();
        try {
            await connection.execute(`DROP TABLE WordInGroup`);
        } catch (err) {
            console.log("Error dropping table WordInGroup " + err)
        }

        try {
            await connection.execute(`DROP TABLE GroupMembers`);
        } catch (err) {
            console.log("Error dropping table GroupMembers " + err)
        }

        try {
            await connection.execute(`DROP TABLE Groups`);
        } catch (err) {
            console.log("Error dropping table Groups " + err)
        }
    }
    catch (err) {}
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

async function deletePhrasesTable() {
    try {
        let connection = await con.openConnection();
        try {
            await connection.execute(`DROP TABLE Phrases`);
        } catch (err) {
            console.log("Error dropping table Phrases " + err)
        }
    }
    catch (err) {}
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

async function createTable(tName, sql) {
    try {
        let connection = await con.openConnection();
        await connection.execute(sql);
        console.log(`Table ${tName} created successfully.`);
    }
    catch (err) {
        console.error(`Error creating ${tName} table `, err);
    }
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

async function insertData(SQL, data) {
    try {
        let connection = await con.openConnection();
        await connection.execute(SQL, data);
        connection.commit();
    }
    catch (err) {
        console.error("Error inserting data ", err);
    }
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

async function getSID(sName, Singers) {
    try {
        let connection = await con.openConnection();

        const query = `
          SELECT SID
          FROM Songs
          WHERE SName = :name AND Singers = :singers
        `;
        const result = await connection.execute(query, { name: sName, singers: Singers });
        return result.rows.length > 0 ? result.rows[0][0] : null;
    }
    catch (err) {
        console.error("Error inserting data ", err);
    }
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

async function selectData(SQL, data = null) {
    try {
        let connection = await con.openConnection();
        if (data)
            return await connection.execute(SQL, data);
        else
            return await connection.execute(SQL);
    }
    catch (err) {
        console.error("Error selecting data ", err);
    }
    finally {
        try {
            await con.closeConnection();
        }
        catch (err) {
            console.error("Error closing connection", err);
        }
    }
}

module.exports = {
    createTable,
    deleteAllSongTables,
    deleteAllGroupTables,
    deletePhrasesTable,
    insertData,
    selectData,
    getSID
}
