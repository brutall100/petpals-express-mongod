// Live background: paw-print trails that "walk" across the meadow,
// plus dandelion seeds drifting up on the breeze.
// Only transform and opacity are animated, so the page stays smooth.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isSmallScreen = () => window.innerWidth < 640;
const random = (min, max) => min + Math.random() * (max - min);

const SVG_NS = 'http://www.w3.org/2000/svg';

function createPaw(x, y, angle, size, delay, life) {
    const holder = document.createElement('span');
    holder.className = 'paw-print';
    holder.style.cssText = `left:${x}px;top:${y}px;--size:${size}px;--delay:${delay}s;--life:${life}s;transform:rotate(${angle + 90}deg)`;

    const svg = document.createElementNS(SVG_NS, 'svg');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#icon-paw');
    svg.append(use);
    holder.append(svg);
    return holder;
}

// One trail: a little animal walks along a gently curving path,
// left and right paws alternating.
function walkTrail(layer) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = random(18, 30);
    const step = size * 1.5;
    const steps = Math.round(random(10, 18));

    // Start near an edge and walk roughly toward the middle.
    let x = random(-40, w * 0.4);
    let y = random(h * 0.3, h + 20);
    let angle = random(-75, -15) * (Math.PI / 180);
    if (Math.random() < 0.5) {
        x = w - x;
        angle = Math.PI - angle;
    }
    const turn = random(-0.08, 0.08);
    const speed = random(0.28, 0.42); // seconds between steps
    const life = 5;
    const trail = document.createElement('div');

    for (let i = 0; i < steps; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const offset = size * 0.45 * side;
        const px = x + Math.cos(angle + Math.PI / 2) * offset;
        const py = y + Math.sin(angle + Math.PI / 2) * offset;
        trail.append(createPaw(px, py, angle * (180 / Math.PI) + random(-8, 8), size, i * speed, life));

        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        angle += turn;
    }

    layer.append(trail);
    // Clean up after the last paw has faded out.
    setTimeout(() => trail.remove(), (steps * speed + life + 0.5) * 1000);
}

function createSeeds(layer) {
    layer.replaceChildren();
    const count = isSmallScreen() ? 9 : 18;

    for (let i = 0; i < count; i++) {
        const seed = document.createElement('span');
        seed.className = 'seed';
        seed.style.cssText = [
            `left:${random(0, 100)}%`,
            `--size:${random(4, 10).toFixed(1)}px`,
            `--dur:${random(16, 30).toFixed(1)}s`,
            `--delay:${random(-30, 0).toFixed(1)}s`,
            `--sway:${random(-80, 80).toFixed(0)}px`,
            `--drift:${random(-120, 120).toFixed(0)}px`,
        ].join(';');
        layer.append(seed);
    }
}

export function startBackground() {
    const paws = document.getElementById('bg-paws');
    const seeds = document.getElementById('bg-seeds');
    if (!paws || !seeds) return;

    let timer = null;

    const tick = () => {
        // Fewer trails on phones and while the tab is hidden.
        const maxTrails = isSmallScreen() ? 1 : 2;
        if (!document.hidden && paws.childElementCount < maxTrails) walkTrail(paws);
        timer = setTimeout(tick, random(2500, 4500));
    };

    const start = () => {
        stop();
        if (reduceMotion.matches) return; // calm, static glow only
        createSeeds(seeds);
        walkTrail(paws);
        timer = setTimeout(tick, 1500);
    };

    function stop() {
        clearTimeout(timer);
        paws.replaceChildren();
        seeds.replaceChildren();
    }

    reduceMotion.addEventListener('change', start);
    start();
}
