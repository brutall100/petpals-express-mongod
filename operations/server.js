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

// GET /users/ - Fetch all users
app.get('/users', async (req, res) => {
	try {
		await client.connect()
		const db = client.db(dbName)
		const users = await db.collection('users').find().toArray()
		res.status(200).json(users)
	} catch (error) {
		res.status(500).json({ message: 'Failed to fetch users', error: error.message || error })
	}
})

// POST /users/ - Add a new user
app.post('/users', async (req, res) => {
	const { name, email } = req.body

	if (!name || !email) {
		return res.status(400).json({ message: 'Name and email are required' })
	}

	try {
		await client.connect()
		const db = client.db(dbName)
		const newUser = { name, email }
		const result = await db.collection('users').insertOne(newUser)

		res.status(201).json({
			message: 'User created',
			user: { id: result.insertedId, name, email },
		})
	} catch (error) {
		res.status(500).json({ message: 'Failed to create user', error: error.message || error })
	}
})

// GET /comments/ - Fetch all comments and their associated user names
app.get('/comments', async (req, res) => {
	try {
		await client.connect()
		const db = client.db(dbName)
		const comments = await db
			.collection('comments')
			.aggregate([
				{
					$lookup: {
						from: 'users',
						localField: 'user_id',
						foreignField: '_id',
						as: 'user',
					},
				},
				{ $unwind: '$user' },
				{
					$project: {
						date: 1,
						comment: 1,
						userName: '$user.name',
					},
				},
			])
			.toArray()

		res.status(200).json(comments)
	} catch (error) {
		res.status(500).json({ message: 'Failed to fetch comments', error: error.message || error })
	}
})

// POST /comments/ - Add a new comment
app.post('/comments', async (req, res) => {
	const { user_id, comment } = req.body

	if (!user_id || !comment) {
		return res.status(400).json({ message: 'User and comment are required' })
	}

	try {
		await client.connect()
		const db = client.db(dbName)

		const newComment = {
			user_id: ObjectId.createFromTime(user_id),
			comment,
			date: new Date(),
		}

		const result = await db.collection('comments').insertOne(newComment)

		res.status(201).json({
			message: 'Comment created',
			comment: {
				id: result.insertedId,
				user_id,
				comment,
				date: newComment.date,
			},
		})
	} catch (error) {
		res.status(500).json({ message: 'Failed to create comment', error: error.message || error })
	}
})

// DELETE /comments/:id - Delete a comment by its ID
app.delete('/comments/:id', async (req, res) => {
	const { id } = req.params
	const { user_id } = req.body

	if (!user_id) {
		return res.status(400).json({ message: 'User ID is required to delete the comment' })
	}

	try {
		await client.connect()
		const db = client.db(dbName)

		const comment = await db.collection('comments').findOne({ _id: new ObjectId(id) })

		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		if (comment.user_id.toString() !== user_id) {
			return res.status(403).json({ message: 'You are not authorized to delete this comment' })
		}

		const result = await db.collection('comments').deleteOne({ _id: new ObjectId(id) })

		res.status(200).json({ message: 'Comment deleted' })
	} catch (error) {
		res.status(500).json({ message: 'Failed to delete comment', error: error.message || error })
	}
})

const port = process.env.PORT || 3000
app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
