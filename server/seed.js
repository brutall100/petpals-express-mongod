// Fills an empty "pets" collection with sample pets: npm run seed

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';

const { MONGO_URI, DB_NAME = 'petpals' } = process.env;

if (!MONGO_URI) {
    console.error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
    process.exit(1);
}

const samples = JSON.parse(await readFile(new URL('../data/sample-pets.json', import.meta.url), 'utf8'));
const client = new MongoClient(MONGO_URI);

try {
    const pets = client.db(DB_NAME).collection('pets');
    if (await pets.countDocuments() > 0) {
        console.log('The pets collection already has data. Nothing was added.');
    } else {
        const { insertedCount } = await pets.insertMany(samples);
        console.log(`Added ${insertedCount} sample pets.`);
    }
} finally {
    await client.close();
}
