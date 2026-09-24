// PetPals API: Express + MongoDB.
// Also serves the frontend from the project root, so http://localhost:3000 runs the full app.

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const { MONGO_URI, DB_NAME = 'petpals', PORT = 3000 } = process.env;

if (!MONGO_URI) {
    console.error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
    process.exit(1);
}

const TYPES = ['dog', 'cat', 'bunny'];
const SORTS = {
    age_asc: { age: 1, name: 1 },
    age_desc: { age: -1, name: 1 },
    name: { name: 1 },
    newest: { _id: -1 },
};

// One client for the whole app: connecting on every request is slow.
const client = new MongoClient(MONGO_URI);
const pets = () => client.db(DB_NAME).collection('pets');

const app = express();
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.use(express.json({ limit: '10kb' }));

// Only the frontend folders are public, never the server code or .env.
for (const dir of ['css', 'js', 'data']) {
    app.use(`/${dir}`, express.static(path.join(rootDir, dir)));
}
app.get(['/', '/index.html', '/favicon.svg'], (req, res) => {
    res.sendFile(path.join(rootDir, req.path === '/favicon.svg' ? 'favicon.svg' : 'index.html'));
});

// Checks and cleans the body of POST / PUT. Returns { pet } or { error }.
function validatePet(body = {}) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = body.type;
    const age = Number(body.age);

    if (name.length < 1 || name.length > 30) return { error: 'Name must be 1–30 characters long.' };
    if (!TYPES.includes(type)) return { error: `Type must be one of: ${TYPES.join(', ')}.` };
    if (!Number.isInteger(age) || age < 0 || age > 30) return { error: 'Age must be a whole number from 0 to 30.' };

    return { pet: { name, type, age } };
}

function toObjectId(id) {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wraps async routes so every thrown error ends up in the error handler below.
const route = (handler) => (req, res, next) => handler(req, res).catch(next);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, mode: 'server' });
});

// GET /api/pets?type=dog,cat&sort=age_desc&search=ri
app.get('/api/pets', route(async (req, res) => {
    const { type, sort = 'age_asc', search } = req.query;
    const query = {};

    if (typeof type === 'string') {
        query.type = { $in: type.split(',').filter((t) => TYPES.includes(t)) };
    }
    if (typeof search === 'string' && search.trim()) {
        query.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const data = await pets().find(query).sort(SORTS[sort] ?? SORTS.age_asc).toArray();
    res.json(data);
}));

app.get('/api/pets/:id', route(async (req, res) => {
    const _id = toObjectId(req.params.id);
    const pet = _id && await pets().findOne({ _id });
    if (!pet) return res.status(404).json({ error: 'Pet not found.' });
    res.json(pet);
}));

app.post('/api/pets', route(async (req, res) => {
    const { pet, error } = validatePet(req.body);
    if (error) return res.status(400).json({ error });

    const { insertedId } = await pets().insertOne(pet);
    res.status(201).json({ _id: insertedId, ...pet });
}));

app.put('/api/pets/:id', route(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ error: 'Pet not found.' });

    const { pet, error } = validatePet(req.body);
    if (error) return res.status(400).json({ error });

    const updated = await pets().findOneAndUpdate({ _id }, { $set: pet }, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ error: 'Pet not found.' });
    res.json(updated);
}));

app.delete('/api/pets/:id', route(async (req, res) => {
    const _id = toObjectId(req.params.id);
    const { deletedCount } = _id ? await pets().deleteOne({ _id }) : { deletedCount: 0 };
    if (!deletedCount) return res.status(404).json({ error: 'Pet not found.' });
    res.status(204).end();
}));

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Hides database details from visitors; the full error goes to the console.
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
});

await client.connect();
app.listen(PORT, () => {
    console.log(`PetPals is running on http://localhost:${PORT}`);
});
