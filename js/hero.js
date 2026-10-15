// Hero: decorative background layers, mouse parallax and the rotating word.
// Layout that depends on screen size (gear scale, CAD cube placement, the code panel) lives in home.css.
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MONO = "'JetBrains Mono',ui-monospace,monospace";
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // A toothed gear drawn as one path plus hub rings and five spokes; it spins around its own center.
  const gear = (cx, cy, teeth, ro, ri, dur, reverse, stroke, sw) => {
    const step = 2 * Math.PI / teeth;
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      [[ri, a], [ro, a + step * 0.18], [ro, a + step * 0.42], [ri, a + step * 0.6]].forEach(([r, t], j) => {
        d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1) + ' ';
      });
    }
    d += 'Z';
    const line = `fill:none;stroke:${stroke};stroke-width:${sw}`;
    const spokes = [0, 1, 2, 3, 4].map(n => {
      const t = n * 2 * Math.PI / 5;
      return `<circle cx="${cx + ri * 0.52 * Math.cos(t)}" cy="${cy + ri * 0.52 * Math.sin(t)}" r="${ri * 0.15}" style="${line}"/>`;
    }).join('');
    return `<g style="transform-box:fill-box;transform-origin:center;animation:spin ${dur}s linear infinite${reverse ? ' reverse' : ''}">`
      + `<circle cx="${cx}" cy="${cy}" r="${ro + 1}" style="fill:none;stroke:none"/>`
      + `<path d="${d}" style="${line}"/>`
      + `<circle cx="${cx}" cy="${cy}" r="${ri * 0.84}" style="${line}"/>`
      + `<circle cx="${cx}" cy="${cy}" r="${ri * 0.2}" style="${line}"/>${spokes}</g>`;
  };

  // Two nested wireframe cubes (CSS 3D) beside a dimensioned CAD sketch.
  const face = (size, transform) => `<div style="position:absolute;inset:0;transform:${transform} translateZ(${size / 2}px);border:1px solid var(--color-accent-2);background:color-mix(in srgb,var(--color-accent-2) 6%,transparent)"></div>`;
  const cube = (size, animation) => `<div style="position:absolute;left:${130 - size / 2}px;top:${130 - size / 2}px;width:${size}px;height:${size}px;transform-style:preserve-3d;animation:${animation}">`
    + ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'].map(t => face(size, t)).join('') + '</div>';
  const text = `font-family:${MONO};font-size:11px;fill:var(--color-neutral-400)`;
  const dim = 'stroke:var(--color-neutral-500);stroke-width:1;fill:none';
  const cad = `<div class="hero-cad">`
    + `<div style="position:absolute;inset:0;perspective:700px"><div style="position:absolute;inset:0;transform-style:preserve-3d">${cube(120, 'cad 24s linear infinite')}${cube(52, 'cad2 14s linear infinite')}</div></div>`
    + `<svg class="hero-svg" width="260" height="260">`
    + `<line x1="130" y1="0" x2="130" y2="260" style="${dim};stroke-dasharray:4 6;opacity:.6"/>`
    + `<line x1="0" y1="130" x2="260" y2="130" style="${dim};stroke-dasharray:4 6;opacity:.6"/>`
    + `<path d="M40 246 H220 M40 240 V252 M220 240 V252" style="${dim}"/>`
    + `<text x="130" y="240" text-anchor="middle" style="${text}">180.00 mm</text>`
    + `<path d="M248 40 V220 M242 40 H254 M242 220 H254" style="${dim}"/>`
    + `<text x="256" y="134" style="${text}">180.00</text>`
    + `<text x="0" y="10" style="${text};fill:var(--color-accent-300)">CHASIS_v3.step</text>`
    + `<text x="0" y="26" style="${text}">ISO · 1:4 · PLA</text>`
    + `</svg></div>`;

  // Scrolling firmware listing (wide screens only, hidden by CSS below 1100px).
  const code = ['// arbi_bot · WRO 2026', '#include <Arbi.h>', '', 'PID pid(1.2, 0.01, 0.4);', 'Motor L(PORT_A), R(PORT_B);', '', 'void setup() {', '  cam.begin(320, 240);', '  gyro.calibrate();', '}', '', 'void loop() {', '  float err = line.read() - 0.5;', '  float u = pid.update(err);', '  L.speed(BASE + u);', '  R.speed(BASE - u);', '  if (cam.sees(RED)) turn(90);', '  if (dist.cm() < 8) grab();', '}', '', '// misión: 5º → 1º', ''];
  const codeColor = t => t.trim().startsWith('//') ? 'var(--color-accent-2-300)' : t.startsWith('#') ? 'var(--color-accent-400)' : 'var(--color-neutral-500)';
  const codeRow = (t, i) => `<div style="display:flex;gap:14px;white-space:pre"><span style="color:var(--color-neutral-700);width:18px;text-align:right">${i % code.length + 1}</span><span style="color:${codeColor(t)}">${esc(t)}</span></div>`;

  // Circuit board: signal pulses run along six traces toward the ARB-01 chip.
  const traces = ['M800 830 V780 L830 750 H980 L1010 720 H1060', 'M870 830 V800 H1030 L1046 784 V744 H1060', 'M1140 716 H1180 L1210 686 V600 L1240 570 H1290', 'M1140 740 H1200 L1230 770 H1290', 'M1100 700 V640 L1120 620 H1170', 'M1080 756 V800 L1100 830'];
  const board = traces.map((d, i) =>
    `<path d="${d}" style="fill:none;stroke:var(--color-neutral-700);stroke-width:2;stroke-linejoin:round"/>`
    + `<path d="${d}" pathLength="100" style="fill:none;stroke:var(--color-accent-2);stroke-width:2;stroke-linecap:round;stroke-dasharray:7 93;animation:trace ${(2.4 + i * 0.4).toFixed(1)}s linear infinite;animation-delay:${(-i * 0.7).toFixed(1)}s;filter:drop-shadow(0 0 4px var(--color-accent-2))"/>`
  ).join('')
    + [[720, 1060], [744, 1060], [716, 1140], [740, 1140]].map(([y, x]) => `<circle cx="${x}" cy="${y}" r="3" style="fill:var(--color-neutral-600)"/>`).join('')
    + `<circle cx="1170" cy="620" r="6" style="fill:none;stroke:var(--color-accent);stroke-width:2;animation:padpulse 1.6s ease-in-out infinite"/>`
    + `<rect x="1060" y="700" width="80" height="56" rx="4" style="fill:var(--color-surface);stroke:var(--color-neutral-600);stroke-width:1.5"/>`
    + `<text x="1100" y="733" text-anchor="middle" style="font-family:${MONO};font-size:11px;fill:var(--color-neutral-400)">ARB-01</text>`
    + `<circle cx="1126" cy="712" r="2.5" style="fill:var(--color-accent);animation:blink 1s steps(1) infinite"/>`;

  // depth = how far (px) the layer drifts against the pointer
  const layers = [
    { name: 'grid', depth: 6, html: '<div class="hero-grid"></div><div class="hero-scan"></div>' },
    { name: 'gears', depth: 22, html:
      `<div class="hero-gears"><svg class="hero-svg" width="420" height="400">`
      + gear(70, 90, 24, 180, 160, 40, false, 'var(--color-neutral-600)', 1.5)
      + gear(262, 282, 12, 92, 74, 20, true, 'var(--color-accent)', 1.25)
      + gear(360, 140, 8, 34, 26, 10, false, 'var(--color-neutral-700)', 1.25)
      + `</svg></div><div class="hero-gears hero-gears--right"><svg class="hero-svg" width="200" height="300">`
      + gear(230, 150, 18, 130, 114, 32, true, 'var(--color-neutral-600)', 1.5)
      + `</svg></div>` },
    { name: 'cad', depth: 30, html: cad },
    { name: 'code', depth: 14, html: `<div class="hero-code"><div style="animation:scrollUp 22s linear infinite">${[...code, ...code].map(codeRow).join('')}</div></div>` },
    { name: 'board', depth: 18, html: `<div class="hero-board"><svg class="hero-svg" width="520" height="270"><g transform="translate(-780,-560)">${board}</g></svg></div>` },
  ];

  const layerEls = layers.map(({ name, depth, html }) => {
    const el = document.createElement('div');
    el.className = `hero-layer hero-layer--${name}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = html;
    el._depth = depth;
    return el;
  });
  hero.prepend(...layerEls);

  if (reduceMotion) return;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    layerEls.forEach(l => { l.style.transform = `translate(${-x * l._depth}px,${-y * l._depth}px)`; });
  });
  hero.addEventListener('mouseleave', () => layerEls.forEach(l => { l.style.transform = ''; }));

  // Rotating word. Each word is a fresh node so its entrance animation replays.
  const words = ['programar', 'crear IA física', 'soldar', 'diseñar en CAD', 'competir', 'ganar'];
  let wordEl = hero.querySelector('[data-hero-word]');
  let index = 0;
  if (wordEl) {
    setInterval(() => {
      index = (index + 1) % words.length;
      const next = wordEl.cloneNode(false);
      const cursor = document.createElement('span');
      cursor.className = 'hero-cursor';
      cursor.textContent = '_';
      next.append(words[index], cursor);
      wordEl.replaceWith(next);
      wordEl = next;
    }, 2000);
  }
})();
