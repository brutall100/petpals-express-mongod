**English** · [Lietuvių](README.lt.md)

# 🐾 PetPals

A cozy pet shelter list where you can filter, sort, add, edit and remove pets. It runs on a REST API built with Express and MongoDB.

**[Live demo](https://brutall100.github.io/petpals-express-mongodb/)** · **[Source code](https://github.com/brutall100/petpals-express-mongodb)**

<img src="docs/screenshot.webp" alt="PetPals in light mode: a cream meadow with paw-print trails, the hero card, shelter stats and pet collar-tag cards" width="1280" height="1000">

<p>
  <img src="docs/screenshot-dark.webp" alt="PetPals in dark mode: the same meadow at dusk with glowing dandelion seeds" width="640" height="500" loading="lazy">
  <img src="docs/screenshot-mobile.webp" alt="PetPals on a 390px phone screen" width="200" height="433" loading="lazy">
</p>

## About

PetPals started as a Node.js backend exercise: a small API for a pet list. I rebuilt it into a complete app with full **CRUD** (create, read, update, delete), a proper frontend and a friendly "Paws in the Meadow" design.

The app has **two modes**:

| Mode | Where | Data lives in |
|---|---|---|
| 🟠 **Demo** | GitHub Pages or any static host | your browser (`localStorage`) |
| 🟢 **Live server** | `npm start` on your computer | MongoDB, through the Express API |

The page checks `api/health` at start-up. If a server answers, it uses the API. If not, it switches to the demo, so the live link always works.

## Features

- 🐶 **Full CRUD**: add, edit and remove pets, with the same validation on the client and the server
- 🔎 **Filter, search and sort**: toggle dogs, cats and bunnies, search by name, sort by age, name or arrival date
- 📊 **Live stats**: the numbers count up when the shelter changes
- 🐾 **Live background**: paw-print trails walk across the meadow while dandelion seeds drift upward
- 🌗 **Light and dark themes**: follows the system, has a toggle, remembers your choice and never flashes
- 📱 **Responsive** down to 390px phones, with no sideways scrolling
- ♿ **Accessible**: skip link, visible focus, labelled fields, WCAG AA contrast, and `prefers-reduced-motion` support
- 🔒 **Safe**: pet names are escaped (no HTML injection), secrets stay in `.env`, and the server only serves public folders

## Built with

- **Backend:** Node.js, Express 4, MongoDB Node driver 6, dotenv
- **Frontend:** HTML, CSS (custom properties, `color-mix`, `<dialog>`) and vanilla JavaScript modules, with no frameworks
- **Fonts:** [Fredoka](https://fonts.google.com/specimen/Fredoka) for headings, [Nunito](https://fonts.google.com/specimen/Nunito) for text

**Palette: "Paws in the Meadow"**

| Role | Light | Dark |
|---|---|---|
| Background | `#FFF6E9` | `#1E1712` |
| Surface | `#FFFFFF` | `#2C221B` |
| Text | `#2E2118` | `#F6E9DA` |
| Accent: orange | `#E2672F` (buttons `#C2511C`) | `#F08A4B` |
| Accent: grass green | `#4E9A4A` (chips `#3B7D38`) | `#7CC576` |

All colors live in one place: the `:root` block at the top of [`css/style.css`](css/style.css).

## What I learned

- Building a REST API with Express: routes, status codes (`201`, `204`, `400`, `404`) and one error handler for all routes
- Using MongoDB: `find` with filters, `sort`, `insertOne`, `findOneAndUpdate`, `deleteOne` and `ObjectId`
- **Route order matters.** In the old version, `/pets/:type` stood above `/pets/byoldest`, so the second route never ran
- Opening one database connection at start-up instead of one on every request
- Keeping secrets in `.env`, and why a `.env` file must never reach Git
- Escaping user input before putting it into HTML
- Making one frontend work both with a real server and without one

## Run it locally

You need **Node.js 20+** and a MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local MongoDB).

```bash
git clone https://github.com/brutall100/petpals-express-mongodb.git
cd petpals-express-mongodb/server
npm install
cp .env.example .env     # then open .env and fill it in
npm run seed             # optional: adds 8 sample pets
npm start                # open http://localhost:3000
```

What to put in `.env`:

| Variable | Meaning |
|---|---|
| `PORT` | Port for the local server, e.g. `3000` |
| `MONGO_URI` | Your MongoDB connection string (Atlas → Connect → Drivers) |
| `DB_NAME` | Database name, e.g. `petpals` |

To use only the **demo** without a server, open the project with any static server (e.g. the VS Code *Live Server* extension).

### API

| Method | Route | What it does |
|---|---|---|
| `GET` | `/api/health` | Checks that the server is running |
| `GET` | `/api/pets?type=dog,cat&sort=age_desc&search=lu` | Lists pets (filter, sort, search) |
| `GET` | `/api/pets/:id` | Gets one pet |
| `POST` | `/api/pets` | Adds a pet: `{ "name": "Luna", "type": "cat", "age": 5 }` |
| `PUT` | `/api/pets/:id` | Updates a pet |
| `DELETE` | `/api/pets/:id` | Removes a pet |

`sort` can be `age_asc`, `age_desc`, `name` or `newest`.

## Project structure

```text
petpals-express-mongodb/
├── index.html            # the page
├── favicon.svg
├── css/style.css         # all styles; the palette is at the top
├── js/
│   ├── theme-init.js     # sets the theme before paint (no flash)
│   ├── app.js            # UI: cards, filters, dialogs, stats
│   ├── store.js          # data: live API or browser demo
│   └── background.js     # paw trails and dandelion seeds
├── data/sample-pets.json # sample pets for the demo and the seed script
├── api/health            # tells GitHub Pages to use the demo
├── docs/                 # screenshots
└── server/
    ├── server.js         # Express + MongoDB API
    ├── seed.js           # adds sample pets
    ├── .env.example      # settings template
    └── package.json
```

## Credits

- Fonts: Fredoka and Nunito from [Google Fonts](https://fonts.google.com) (SIL Open Font License)
- The pet names are made up. All icons and illustrations were drawn in SVG for this project.

## License

[MIT](LICENSE) © 2026 brutall100
