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

app.get('/cars', async (req, res) => {
  try {
    const connection = await client.connect(); 
    const data = await connection.db(dbName).collection('cars').find().toArray(); 
    await connection.close(); 
    return res.status(200).send(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send({ error: 'Internal Server Error', details: err.message });
  }
});

app.post('/cars', async (req, res) => {
  try {
    const { brand, model } = req.body; 
    if (!brand || !model) {
      return res.status(400).send({ error: 'Brand and model are required' });
    }

    const connection = await client.connect(); 
    const dbRes = await connection
      .db(dbName)
      .collection('cars')
      .insertOne({ brand, model }); 
    await connection.close(); 
    return res.status(201).send({ message: 'Car added successfully', data: dbRes });
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).send({ error: 'Internal Server Error', details: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

