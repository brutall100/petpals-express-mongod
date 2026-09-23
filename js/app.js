import { connectStore, validatePet } from './store.js';
import { startBackground } from './background.js';

const $ = (selector) => document.querySelector(selector);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const els = {
    grid: $('#pet-grid'),
    empty: $('#empty'),
    status: $('#status'),
    search: $('#search'),
    sort: $('#sort'),
    chips: document.querySelectorAll('.chip'),
    badge: $('#mode-badge'),
    reset: $('#reset-demo'),
    addBtn: $('#add-pet-btn'),
    petDialog: $('#pet-dialog'),
    petForm: $('#pet-form'),
    petTitle: $('#pet-dialog-title'),
    petSubmit: $('#pet-submit-label'),
    formError: $('#form-error'),
    deleteDialog: $('#delete-dialog'),
    deleteName: $('#delete-name'),
    deleteConfirm: $('#delete-confirm'),
    toast: $('#toast'),
    themeToggle: $('#theme-toggle'),
};

const state = {
    store: null,
    pets: [],
    types: ['dog', 'cat', 'bunny'],
    sort: 'age_asc',
    search: '',
    editingId: null,
    deletingId: null,
};

const SPECIES = { dog: 'Dog', cat: 'Cat', bunny: 'Bunny' };

// ---------- Theme ----------
function setupTheme() {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
        const active = root.dataset.theme || (media.matches ? 'dark' : 'light');
        root.dataset.activeTheme = active;
        els.themeToggle.setAttribute('aria-label', active === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    };

    els.themeToggle.addEventListener('click', () => {
        const next = root.dataset.activeTheme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try {
            localStorage.setItem('petpals-theme', next);
        } catch {
            // Not saved in private mode, still switches for this visit.
        }
        apply();
    });
    media.addEventListener('change', apply);
    apply();
}

// ---------- Small effects ----------
function addRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
    button.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

let toastTimer;
function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2600);
}

// Numbers count up from their current value to the new one.
function countTo(el, target) {
    const from = Number(el.textContent) || 0;
    if (reduceMotion.matches || from === target) {
        el.textContent = target;
        return;
    }
    const duration = 700;
    const start = performance.now();
    const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - t) ** 3;
        el.textContent = Math.round(from + (target - from) * eased);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
}

// ---------- Rendering ----------
function icon(name) {
    return `<svg aria-hidden="true"><use href="#icon-${name}"/></svg>`;
}

// Pet names come from users, so they are escaped before going into HTML.
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[ch]);
}

function petCard(pet, index) {
    const name = escapeHtml(pet.name);
    const years = pet.age === 1 ? 'year' : 'years';
    return `
        <li class="pet-card" data-type="${pet.type}" style="--i:${index}">
            <div class="pet-card__head">
                <span class="pet-card__avatar">${icon(pet.type)}</span>
                <div>
                    <h3>${name}</h3>
                    <p class="pet-card__species">${SPECIES[pet.type]}</p>
                </div>
            </div>
            <div class="pet-card__foot">
                <span class="age-pill">${pet.age} ${years}</span>
                <div class="pet-card__actions">
                    <button class="tool-btn" type="button" data-action="edit" data-id="${pet._id}" aria-label="Edit ${name}">${icon('edit')}</button>
                    <button class="tool-btn tool-btn--delete" type="button" data-action="delete" data-id="${pet._id}" aria-label="Remove ${name}">${icon('trash')}</button>
                </div>
            </div>
        </li>`;
}

function render() {
    els.grid.innerHTML = state.pets.map(petCard).join('');
    els.empty.hidden = state.pets.length > 0;
    const count = state.pets.length;
    els.status.textContent = `${count} ${count === 1 ? 'pet' : 'pets'} shown`;
}

async function refreshStats() {
    const all = await state.store.listAll();
    const counts = { all: all.length, dog: 0, cat: 0, bunny: 0 };
    all.forEach((pet) => { counts[pet.type] += 1; });
    document.querySelectorAll('[data-stat]').forEach((el) => countTo(el, counts[el.dataset.stat]));
}

async function loadPets() {
    try {
        state.pets = await state.store.list({ types: state.types, sort: state.sort, search: state.search });
        render();
    } catch (error) {
        els.status.textContent = error.message;
    }
}

async function refresh() {
    await Promise.all([loadPets(), refreshStats()]);
}

// ---------- Add / edit ----------
function openPetDialog(pet = null) {
    state.editingId = pet?._id ?? null;
    els.petForm.reset();
    els.formError.textContent = '';
    els.petTitle.textContent = pet ? `Edit ${pet.name}` : 'Add a pet';
    els.petSubmit.textContent = pet ? 'Save changes' : 'Add pet';

    if (pet) {
        els.petForm.elements.name.value = pet.name;
        els.petForm.elements.type.value = pet.type;
        els.petForm.elements.age.value = pet.age;
    }
    els.petDialog.showModal();
    els.petForm.elements.name.focus();
}

async function savePet(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(els.petForm));
    const { pet, error } = validatePet(data);
    if (error) {
        els.formError.textContent = error;
        return;
    }

    try {
        if (state.editingId) {
            await state.store.update(state.editingId, pet);
            showToast(`${pet.name} was updated.`);
        } else {
            await state.store.add(pet);
            showToast(`Welcome, ${pet.name}!`);
        }
        els.petDialog.close();
        await refresh();
    } catch (err) {
        els.formError.textContent = err.message;
    }
}

// ---------- Delete ----------
function askDelete(pet) {
    state.deletingId = pet._id;
    els.deleteName.textContent = pet.name;
    els.deleteDialog.showModal();
}

async function confirmDelete() {
    const pet = state.pets.find((p) => p._id === state.deletingId);
    try {
        await state.store.remove(state.deletingId);
        els.deleteDialog.close();
        showToast(`${pet?.name ?? 'The pet'} was removed.`);
        await refresh();
    } catch (err) {
        els.deleteDialog.close();
        showToast(err.message);
    }
}

// ---------- Events ----------
function setupEvents() {
    document.querySelectorAll('.btn, .chip').forEach((btn) => btn.addEventListener('click', addRipple));

    els.addBtn.addEventListener('click', () => openPetDialog());
    els.petForm.addEventListener('submit', savePet);
    els.deleteConfirm.addEventListener('click', confirmDelete);

    document.querySelectorAll('[data-close]').forEach((btn) => {
        btn.addEventListener('click', () => btn.closest('dialog').close());
    });
    // Clicking the dark backdrop closes a dialog.
    [els.petDialog, els.deleteDialog].forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });
    });

    els.grid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const pet = state.pets.find((p) => String(p._id) === button.dataset.id);
        if (!pet) return;
        if (button.dataset.action === 'edit') openPetDialog(pet);
        else askDelete(pet);
    });

    els.chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const on = chip.getAttribute('aria-pressed') !== 'true';
            chip.setAttribute('aria-pressed', String(on));
            state.types = [...els.chips]
                .filter((c) => c.getAttribute('aria-pressed') === 'true')
                .map((c) => c.dataset.type);
            loadPets();
        });
    });

    els.sort.addEventListener('change', () => {
        state.sort = els.sort.value;
        loadPets();
    });

    let searchTimer;
    els.search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = els.search.value;
            loadPets();
        }, 200);
    });

    els.reset.addEventListener('click', async () => {
        await state.store.reset();
        showToast('Demo data was reset.');
        await refresh();
    });
}

// ---------- Start ----------
async function init() {
    setupTheme();
    setupReveal();
    setupEvents();
    startBackground();

    state.store = await connectStore();
    const isDemo = state.store.mode === 'demo';
    els.badge.dataset.mode = state.store.mode;
    els.badge.textContent = isDemo ? 'Demo mode' : 'Live server';
    els.badge.title = isDemo
        ? 'No server found: pets are saved in this browser.'
        : 'Connected to the Express + MongoDB API.';
    els.reset.hidden = !isDemo;

    await refresh();
}

init();
