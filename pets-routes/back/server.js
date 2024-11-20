const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const { MongoClient } = require('mongodb')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const mongoUri = process.env.MONGO_URI
const dbName = process.env.DB_NAME

const client = new MongoClient(mongoUri)

app.get('/pets', async (req, res) => {
    try {
        const connection = await client.connect();
        const { type, sortBy } = req.query;

        const query = type ? { type: { $in: type.split(',') } } : {};
        const sortOptions = sortBy === 'age_asc' ? { age: 1 } : sortBy === 'age_dsc' ? { age: -1 } : {};

        const data = await connection
            .db(dbName)
            .collection('pets')
            .find(query)
            .sort(sortOptions)
            .toArray();

        await connection.close();
        return res.status(200).send(data);
    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).send({ error: 'Internal Server Error', details: err.message });
    }
});


app.post('/pets', async (req, res) => {
	try {
		const connection = await client.connect()
		const data = await connection
                                .db(dbName)
                                .collection('pets')
                                .insertOne(req.body)
                                await connection.close()
		return res.status(201).send(data)
	} catch (err) {
		console.error('Error adding data:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.get('/pets/:type', async (req, res) => {
	try {
		const { type } = req.params
		const connection = await client.connect()
		const data = await connection
                                .db(dbName)
                                .collection('pets')
                                .find({ type })
                                .toArray()
                                await connection.close()
		if (data.length === 0) {
			return res.status(404).send({ error: `No pets found of type: ${type}` })
		}
		return res.status(200).send(data)
	} catch (err) {
		console.error('Error fetching pets by type:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.get('/pets/byoldest', async (req, res) => {
	try {
		const connection = await client.connect()
		const data = await connection
                                .db(dbName)
                                .collection('pets')
                                .find()
                                .sort({ age: -1 })
                                .toArray()
                                await connection.close()
		return res.status(200).send(data)
	} catch (err) {
		console.error('Error fetching pets by age:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

const port = process.env.PORT || 3001
app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
