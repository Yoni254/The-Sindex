const oracledb = require('oracledb');

let connection;
// Connection information
const dbConfig = {
    user: 'sindexMain',
    password: 'password',
    connectString: 'localhost:1521/orclpdb' // Example: 'localhost:1521/ORCL'
};

async function openConnection() {

    try {
        // Establish a connection to the Oracle database
        connection = await oracledb.getConnection(dbConfig);
        return connection
    } catch (error) {
        console.error('Error creating table:', error);
    }

}

async function closeConnection() {
    if (connection) {
        try {
            // Release the connection back to the connection pool
            await connection.close();
        } catch (error) {
            console.error('Error closing connection:', error);
        }
    }
}


module.exports = {
    openConnection,
    closeConnection
}