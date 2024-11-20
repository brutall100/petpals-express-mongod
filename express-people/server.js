const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const client = new MongoClient(mongoUri);

// GET route: Retrieve all people
app.get('/people', async (req, res) => {
    try {
        const connection = await client.connect();
        const data = await connection
            .db(dbName)
            .collection('people')
            .find()
            .toArray();
        await connection.close();
        return res.status(200).send(data);
    } catch (err) {
        console.error('Error fetching people:', err);
        res.status(500).send({ error: 'Internal Server Error', details: err.message });
    }
});

// POST route: Add a new person
app.post('/people', async (req, res) => {
    try {
        const { name, surname, age } = req.body;

        if (!name || !surname || age === undefined) {
            return res.status(400).send({ error: 'Name, surname, and age are required' });
        }

        const connection = await client.connect();
        const data = await connection
            .db(dbName)
            .collection('people')
            .insertOne({ name, surname, age: Number(age) });

        await connection.close();
        return res.status(201).send({ message: 'Person added successfully', data });
    } catch (err) {
        console.error('Error adding person:', err);
        res.status(500).send({ error: 'Internal Server Error', details: err.message });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
