require('dotenv').config();
const { Pool } = require('pg');

class SQLHandler {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString: connectionString
        });
        this.#createTable();
    }

    async #createTable() {
        let client;
        try {
            client = await this.pool.connect();
            await client.query(`
                CREATE TABLE IF NOT EXISTS patients (
                    id SERIAL PRIMARY KEY, 
                    name VARCHAR(100) NOT NULL, 
                    dateOfBirth DATE NOT NULL
                );
            `);
            console.log(' Table created successfully (or already exists)');
        } catch (error) {
            console.error('Error creating table:', error);
            return null;
        } finally {
            client.end();
        }
    }

    async sendSQLQuery(query) {
        let client;
        try {
            client = await this.pool.connect();
            const result = await client.query(query);
            return result;
        } catch (error) {
            console.error('Error sending query:', error);
            return null;
        } finally {
            client.end();
        }
    }
}

module.exports = SQLHandler;
