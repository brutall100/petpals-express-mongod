const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const { MongoClient, ObjectId } = require('mongodb')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const mongoUri = process.env.MONGO_URI
const dbName = process.env.DB_NAME

const client = new MongoClient(mongoUri)

app.get('/users', async (req, res) => {
	try {
		const connection = await client.connect()
		const data = await connection.db(dbName).collection('users').find().toArray()
		await connection.close()
		return res.status(200).send(data)
	} catch (err) {
		console.error('Error fetching data:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.get('/users/:id', async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).send({ error: 'ID is required' })
		}

		const connection = await client.connect()
		const data = await connection
			.db(dbName)
			.collection('users')
			.findOne({ _id: ObjectId.createFromHexString(id) })
		await connection.close()
		return res.status(200).send(data)
	} catch (err) {
		console.error('Error fetching user:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.post('/users', async (req, res) => {
	try {
		const { name, surname, age, email } = req.body
		if (!name || !email) {
			return res.status(400).send({ error: 'Name and email are required' })
		}

		const connection = await client.connect()
		const dbRes = await connection.db(dbName).collection('users').insertOne({ name, surname, age, email })
		await connection.close()
		return res.status(201).send({ message: 'User added successfully', data: dbRes })
	} catch (err) {
		console.error('Error adding user:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.delete('/users/:id', async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).send({ error: 'ID is required' })
		}

		const connection = await client.connect()
		const dbRes = await connection
			.db(dbName)
			.collection('users')
			.deleteOne({ _id: ObjectId.createFromHexString(id) })
		await connection.close()
		return res.status(200).send({ message: 'User deleted successfully', data: dbRes })
	} catch (err) {
		console.error('Error deleting user:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.put('/users/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { name, surname, age, email } = req.body
		if (!id) {
			return res.status(400).send({ error: 'ID is required' })
		}

		const connection = await client.connect()
		const dbRes = await connection
			.db(dbName)
			.collection('users')
			.updateOne({ _id: ObjectId.createFromHexString(id) }, { $set: { name, surname, age, email } })
		await connection.close()
		return res.status(200).send({ message: 'User updated successfully', data: dbRes })
	} catch (err) {
		console.error('Error updating user:', err)
		res.status(500).send({ error: 'Internal Server Error', details: err.message })
	}
})

app.patch('/users/:id/:field/:value', async (req, res) => {
	try {
		const { id, field, value } = req.params

		if (!id) {
			return res.status(400).send({ error: 'ID is required' })
		}

		const validFields = ['name', 'surname', 'age', 'email']
		if (!validFields.includes(field)) {
			return res.status(400).send({ error: `Field "${field}" is not valid` })
		}

		const updateObject = { [field]: field === 'age' ? parseInt(value, 10) : value }

		const connection = await client.connect()
		const dbRes = await connection
			.db(dbName)
			.collection('users')
			.updateOne({ _id: ObjectId.createFromHexString(id) }, { $set: updateObject })
		await connection.close()

		return res.status(200).send({
			message: 'User updated successfully',
			data: dbRes,
		})
	} catch (err) {
		console.error('Error updating user:', err)
		res.status(500).send({
			error: 'Internal Server Error',
			details: err.message,
		})
	}
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
