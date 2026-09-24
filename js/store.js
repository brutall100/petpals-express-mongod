// Data layer with two modes:
//  - server: talks to the Express + MongoDB API (when you run it locally)
//  - demo:   keeps pets in localStorage (GitHub Pages has no server)

const API = 'api';
const DEMO_KEY = 'petpals-demo-pets';
const TYPES = ['dog', 'cat', 'bunny'];

// ---------- Shared rules (the server checks the same things) ----------
export function validatePet({ name, type, age }) {
    const cleanName = String(name ?? '').trim();
    const cleanAge = Number(age);

    if (cleanName.length < 1 || cleanName.length > 30) return { error: 'Name must be 1–30 characters long.' };
    if (!TYPES.includes(type)) return { error: 'Please choose a species.' };
    if (age === '' || !Number.isInteger(cleanAge) || cleanAge < 0 || cleanAge > 30) {
        return { error: 'Age must be a whole number from 0 to 30.' };
    }
    return { pet: { name: cleanName, type, age: cleanAge } };
}

const sorters = {
    age_asc: (a, b) => a.age - b.age || a.name.localeCompare(b.name),
    age_desc: (a, b) => b.age - a.age || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
    newest: (a, b) => b.createdAt - a.createdAt,
};

// ---------- Server mode ----------
async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The server did not answer.');
    return data;
}

const serverStore = {
    mode: 'server',
    list({ types, sort, search }) {
        const params = new URLSearchParams({ type: types.join(','), sort, search });
        return request(`/pets?${params}`);
    },
    // Stats need every pet, not only the filtered ones.
    listAll() {
        return request('/pets');
    },
    add(pet) {
        return request('/pets', { method: 'POST', body: JSON.stringify(pet) });
    },
    update(id, pet) {
        return request(`/pets/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(pet) });
    },
    remove(id) {
        return request(`/pets/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
};

// ---------- Demo mode ----------
let memory = null; // used when localStorage is blocked

function readDemo() {
    try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        if (memory) return memory;
    }
    return null;
}

function writeDemo(pets) {
    memory = pets;
    try {
        localStorage.setItem(DEMO_KEY, JSON.stringify(pets));
    } catch {
        // Private mode: the data lives until the tab is closed.
    }
}

async function loadSamples() {
    const response = await fetch('data/sample-pets.json');
    const samples = await response.json();
    return samples.map((pet, i) => ({ ...pet, _id: crypto.randomUUID(), createdAt: i }));
}

async function demoPets() {
    const saved = readDemo();
    if (saved) return saved;
    const samples = await loadSamples();
    writeDemo(samples);
    return samples;
}

// Small pause so the demo feels like a real network request.
const pause = () => new Promise((resolve) => setTimeout(resolve, 120));

const demoStore = {
    mode: 'demo',
    async list({ types, sort, search }) {
        await pause();
        const term = search.trim().toLowerCase();
        return (await demoPets())
            .filter((pet) => types.includes(pet.type))
            .filter((pet) => pet.name.toLowerCase().includes(term))
            .sort(sorters[sort] ?? sorters.age_asc);
    },
    listAll() {
        return demoPets();
    },
    async add(input) {
        const { pet, error } = validatePet(input);
        if (error) throw new Error(error);
        const pets = await demoPets();
        const created = { ...pet, _id: crypto.randomUUID(), createdAt: Date.now() };
        writeDemo([...pets, created]);
        return created;
    },
    async update(id, input) {
        const { pet, error } = validatePet(input);
        if (error) throw new Error(error);
        const pets = await demoPets();
        if (!pets.some((p) => p._id === id)) throw new Error('Pet not found.');
        writeDemo(pets.map((p) => (p._id === id ? { ...p, ...pet } : p)));
    },
    async remove(id) {
        writeDemo((await demoPets()).filter((p) => p._id !== id));
    },
    async reset() {
        writeDemo(await loadSamples());
    },
};

// Uses the server when /api/health says ok. On GitHub Pages the static file
// api/health answers { ok: false }, so the demo starts without a 404 error.
export async function connectStore() {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${API}/health`, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        const data = await response.json();
        if (response.ok && data.ok) return serverStore;
    } catch {
        // No server here (GitHub Pages or file://): fall through to the demo.
    }
    return demoStore;
}
