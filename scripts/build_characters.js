#!/usr/bin/env node
// Builds the drawn neighbors (chubby riso stickers) as SVG strings for the app:
// src/components/characters/xml.ts. Run: node scripts/build_characters.js
//
// Each neighbor has a few moods (hello, snack, happy, sleepy), so a story shows a
// different drawing on each slide. Moods with open eyes also get an eyes-shut frame,
// for blinking. Little birds stand full-body; bigger animals are close-up "selfies".
// Everything is drawn on a 400×400 canvas.

const fs = require('fs');
const path = require('path');

const C = { ink: '#1A1A2E', pink: '#FF6B9A', pinkT: '#FFE3EC', blueT: '#DDE6FF', yellowT: '#FFF4C7' };
const OL = `stroke="${C.ink}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`;
const shape = (el, fill) => `<g fill="${fill}" ${OL}>${el}</g>`;
const shadow = (els) => `<g transform="translate(9,9)" fill="${C.ink}" stroke="${C.ink}" stroke-width="10">${els.join('')}</g>`;
const blush = (pts) => pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="13" fill="${C.pink}"/>`).join('');

/**
 * An eye. `eyes` is 'open' (big and shiny), 'shut' (a sleepy curve, for blinks and naps)
 * or 'happy' (an upside-down curve, smiling). `lid` is the face color around the eye;
 * `ring` an iris ring (pigeons); `dark` a white rim on a dark mask (raccoons).
 */
const eye = (eyes, x, y, r, { ring, dark, lid } = {}) => {
  if (eyes === 'open') {
    return `${dark ? `<circle cx="${x}" cy="${y}" r="${r + 7}" fill="#fff"/>` : ''}${ring ? `<circle cx="${x}" cy="${y}" r="${r + 9}" fill="${ring}" stroke="${C.ink}" stroke-width="6"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.34}" fill="#fff"/><circle cx="${x + r * 0.38}" cy="${y + r * 0.35}" r="${r * 0.16}" fill="#fff"/>`;
  }
  const bend = eyes === 'happy' ? -r * 0.9 : r * 0.7;
  return `<circle cx="${x}" cy="${y}" r="${r + (ring ? 10 : dark ? 8 : 1)}" fill="${dark ? C.ink : lid}"/><path d="M${x - r} ${y + 2} Q${x} ${y + 2 + bend} ${x + r} ${y + 2}" fill="none" stroke="${dark ? '#fff' : C.ink}" stroke-width="${Math.max(6, r * 0.32)}" stroke-linecap="round"/>`;
};

const heart = (x, y, s) =>
  `<path d="M${x} ${y + s * 0.3} C${x} ${y} ${x - s * 0.5} ${y} ${x - s * 0.5} ${y + s * 0.3} C${x - s * 0.5} ${y + s * 0.6} ${x} ${y + s * 0.8} ${x} ${y + s} C${x} ${y + s * 0.8} ${x + s * 0.5} ${y + s * 0.6} ${x + s * 0.5} ${y + s * 0.3} C${x + s * 0.5} ${y} ${x} ${y} ${x} ${y + s * 0.3} Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
const zee = (x, y, s) => `<path d="M${x} ${y} H${x + s} L${x} ${y + s} H${x + s}" fill="none" stroke="${C.ink}" stroke-width="${Math.max(6, s * 0.22)}" stroke-linecap="round" stroke-linejoin="round"/>`;

// The moods, in the order a story shows them.
const MOODS = [
  { name: 'hello', eyes: 'open', wave: true },
  { name: 'snack', eyes: 'open', snack: true },
  { name: 'happy', eyes: 'happy', hearts: true },
  { name: 'sleepy', eyes: 'shut', zees: true },
];

const ART = {
  pigeon: {
    tint: C.blueT,
    tilt: -6,
    svg: (m) => {
      const body = '<path d="M30 430 C50 320 125 288 200 288 C275 288 350 320 370 430 Z"/>';
      const head = '<ellipse cx="200" cy="185" rx="138" ry="126"/>';
      const wing = '<path d="M236 410 C232 340 264 290 314 276 C340 316 340 372 324 410 Z"/>';
      const look = { ring: '#FF8A3D', lid: '#8F8EA8' };
      return `${shadow([body, head])}
        ${shape(body, '#BDBCD0')}
        <path d="M78 336 C130 296 270 296 322 336 C300 372 100 372 78 336 Z" fill="${C.pink}" ${OL}/>
        <path d="M96 330 C150 304 250 304 304 330" fill="none" stroke="#36B39A" stroke-width="16" stroke-linecap="round"/>
        ${shape(head, '#8F8EA8')}
        ${eye(m.eyes, 138, 178, 24, look)}${eye(m.eyes, 262, 178, 24, look)}
        ${blush([[100, 236], [300, 236]])}
        ${m.snack ? `<g transform="rotate(-10 200 290)"><rect x="164" y="258" width="72" height="44" rx="13" fill="#C98A4B" stroke="${C.ink}" stroke-width="8"/><rect x="174" y="266" width="52" height="28" rx="8" fill="#FBE3B5"/></g>` : ''}
        <g fill="#fff" stroke="${C.ink}" stroke-width="6"><ellipse cx="188" cy="214" rx="15" ry="10"/><ellipse cx="212" cy="214" rx="15" ry="10"/></g>
        <path d="M178 224 Q200 218 222 224 L200 262 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
        ${m.wave ? `${shape(wing, '#A3A2BC')}<path d="M270 324 C286 314 304 310 322 312 M264 356 C282 346 304 342 328 344" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>` : ''}
        ${m.hearts ? heart(334, 54, 44) + heart(70, 84, 32) : ''}
        ${m.zees ? zee(240, 70, 30) + zee(280, 44, 22) : ''}`;
    },
  },
  sparrow: {
    // Full body, three-quarter pose: plump, standing tall on a twig, facing left.
    tint: C.yellowT,
    tilt: 0,
    svg: (m) => {
      const tail = '<path d="M300 262 L390 292 L382 322 L294 302 Z"/>';
      const outline = 'M96 236 C96 166 166 134 238 142 C320 152 352 222 332 282 C312 334 232 348 172 334 C120 322 96 284 96 236 Z';
      const body = `<path d="${outline}"/>`;
      const head = '<circle cx="152" cy="150" r="88"/>';
      const legs = 'M196 326 L186 364 M252 322 L264 364 M170 368 L186 360 L200 370 M248 368 L264 360 L278 370';
      return `<path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/>
        <path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="#9A6A44" stroke-width="12" stroke-linecap="round"/>
        <g transform="translate(40 30) scale(0.8)">
        <path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${legs}" fill="none" stroke="#E7A27A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        ${shadow([tail, body, head])}
        ${shape(tail, '#6E4A2E')}
        <path d="M318 280 L376 298" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
        ${shape(body, '#E6E1DC')}
        <clipPath id="spbody"><path d="${outline}"/></clipPath>
        <g clip-path="url(#spbody)">
          <path d="M206 150 C290 140 352 196 350 262 C334 306 290 318 236 306 C214 272 198 214 206 150 Z" fill="#A86B3E"/>
          <path d="M236 186 l22 22 M266 180 l24 24 M296 196 l22 22 M250 226 l22 22 M282 230 l22 20" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
          <path d="M226 262 C262 278 300 280 336 270" fill="none" stroke="#FAF7F2" stroke-width="11" stroke-linecap="round"/>
          <path d="M206 150 C198 214 214 272 236 306" fill="none" stroke="${C.ink}" stroke-width="7"/>
        </g>
        <path d="${outline}" fill="none" ${OL}/>
        ${shape(head, '#F4F0EA')}
        <clipPath id="sphead"><circle cx="152" cy="150" r="88"/></clipPath>
        <g clip-path="url(#sphead)">
          <path d="M60 60 H250 V122 C210 104 160 98 100 112 L60 120 Z" fill="#8F8D9C"/>
          <path d="M136 114 C180 100 226 108 250 140 L250 230 C232 206 212 186 186 176 C196 156 176 128 136 128 Z" fill="#A9653A"/>
          <path d="M96 140 C110 134 130 132 146 134" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>
        </g>
        <circle cx="152" cy="150" r="88" fill="none" ${OL}/>
        <path d="M84 168 C100 162 132 168 148 184 C162 222 154 262 128 282 C104 266 88 226 84 168 Z" fill="${C.ink}"/>
        <path d="M108 206 q8 6 16 0 M118 232 q8 6 16 0 M104 252 q8 6 16 0" fill="none" stroke="#6E6C80" stroke-width="5" stroke-linecap="round"/>
        ${eye(m.eyes, 130, 140, 23, { lid: '#F4F0EA' })}
        <ellipse cx="160" cy="186" rx="20" ry="12" fill="${C.pink}"/>
        <path d="M94 132 C88 126 70 136 50 152 C70 160 88 166 96 164 Z" fill="#6E6C80" stroke="${C.ink}" stroke-width="9" stroke-linejoin="round"/>
        ${m.snack ? `<ellipse cx="50" cy="156" rx="16" ry="10" transform="rotate(-24 50 156)" fill="#E8C27A" stroke="${C.ink}" stroke-width="7"/>` : ''}
        ${m.hearts ? heart(290, 40, 50) + heart(350, 110, 34) : ''}
        ${m.zees ? zee(270, 50, 40) + zee(326, 10, 28) : ''}
        </g>`;
    },
  },
  raccoon: {
    tint: C.pinkT,
    tilt: -4,
    svg: (m) => {
      const body = '<path d="M30 430 C50 330 125 300 200 300 C275 300 350 330 370 430 Z"/>';
      const ears = '<circle cx="88" cy="88" r="46"/><circle cx="312" cy="88" r="46"/>';
      const head = '<ellipse cx="200" cy="200" rx="168" ry="140"/>';
      const paw = '<path d="M238 410 C234 360 250 322 282 312 C314 302 338 324 334 356 L328 410 Z"/>';
      return `${shadow([body, ears, head])}
        ${shape(body, '#9C98A8')}
        ${shape(ears, '#8C889C')}
        <g fill="#F1EEF4"><circle cx="88" cy="92" r="24"/><circle cx="312" cy="92" r="24"/></g>
        ${shape(head, '#A7A3B3')}
        <ellipse cx="200" cy="246" rx="112" ry="76" fill="#F1EEF4"/>
        <path d="M110 140 C130 124 160 124 178 136 M222 136 C240 124 270 124 290 140" fill="none" stroke="#F1EEF4" stroke-width="16" stroke-linecap="round"/>
        <path d="M54 178 C96 136 166 150 200 182 C234 150 304 136 346 178 C352 220 304 246 262 238 C236 234 216 220 200 220 C184 220 164 234 138 238 C96 246 48 220 54 178 Z" fill="${C.ink}"/>
        ${eye(m.eyes, 134, 190, 22, { dark: true })}${eye(m.eyes, 266, 190, 22, { dark: true })}
        ${blush([[112, 272], [288, 272]])}
        <ellipse cx="200" cy="252" rx="22" ry="14" fill="${C.ink}"/><circle cx="193" cy="247" r="5" fill="#fff"/>
        <path d="M200 266 V 278 M180 284 Q200 300 220 284" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
        <path d="M60 260 L110 266 M58 284 L108 280 M340 260 L290 266 M342 284 L292 280" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        ${m.snack ? `<path d="M280 266 C282 242 294 228 312 222" fill="none" stroke="#3E8E4E" stroke-width="7" stroke-linecap="round"/><circle cx="280" cy="284" r="26" fill="#E5484D" stroke="${C.ink}" stroke-width="8"/><circle cx="271" cy="275" r="7" fill="#fff"/>` : ''}
        ${m.wave || m.snack ? `${shape(paw, '#8C889C')}<g fill="${C.ink}"><circle cx="270" cy="328" r="9"/><circle cx="294" cy="318" r="9"/><circle cx="318" cy="328" r="9"/><ellipse cx="296" cy="356" rx="20" ry="15"/></g>` : ''}
        ${m.hearts ? heart(52, 300, 36) + heart(350, 286, 30) : ''}
        ${m.zees ? zee(210, 92, 30) + zee(250, 66, 22) : ''}`;
    },
  },
};

// Species id → drawing.
const SPECIES = { 'rock-pigeon': 'pigeon', 'house-sparrow': 'sparrow', raccoon: 'raccoon' };

const draw = (a, m) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${a.tint}"/><g transform="rotate(${a.tilt} 200 220)">${a.svg(m)}</g></svg>`.replace(/\s+/g, ' ');

const characters = {};
for (const [id, key] of Object.entries(SPECIES)) {
  characters[id] = MOODS.map((m) => ({
    mood: m.name,
    open: draw(ART[key], m),
    // A blink frame for moods with open eyes.
    ...(m.eyes === 'open' ? { shut: draw(ART[key], { ...m, eyes: 'shut' }) } : {}),
  }));
}

module.exports = { characters };

if (require.main === module) {
  const file = path.join(__dirname, '..', 'src', 'components', 'characters', 'xml.ts');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `// Generated by scripts/build_characters.js. Do not edit by hand.\n\n` +
      `export type CharacterFrame = { mood: string; open: string; shut?: string };\n\n` +
      `export const characterXml: Record<string, CharacterFrame[]> = ${JSON.stringify(characters, null, 2)};\n`,
  );
  console.log(`wrote ${Object.keys(characters).length} neighbors × ${MOODS.length} moods`);
}
