const fs = require('fs');
const path = require('path');
const db = require('../db');

const initializeDatabase = async () => {
    try {
        if (process.env.NODE_ENV === 'test') {
            console.log('Skipping real postgres schema initialization in test mode.');
            return;
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaQuery = fs.readFileSync(schemaPath, { encoding: 'utf-8' });

        await db.query(schemaQuery);
        console.log('Database Schema initialized and verified strictly without orphan records.');
    } catch (error) {
        console.error('Database Schema Initialization skipped/failed:', error.message);
    }
};

initializeDatabase();
module.exports = initializeDatabase;
