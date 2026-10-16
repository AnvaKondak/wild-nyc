#!/usr/bin/env node
// Builds the drawn neighbors (chubby riso stickers) as SVG strings for the app:
// src/components/characters/xml.ts. Run: node scripts/build_characters.js
//
// Each neighbor has a few everyday moods (hello, snack, happy, sleepy), so a story shows a
// different drawing on each slide, plus a few the words can call for (surprised, curious,
// singing, chilly). Moods with open eyes also get an eyes-shut frame,
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
  // Surprised: big round eyes under raised brows. Curious: one brow up, eyes glancing up.
  if (eyes === 'wide' || eyes === 'curious') {
    const brow = dark ? '#fff' : C.ink;
    const big = eyes === 'wide' ? r * 1.18 : r;
    const lift = eyes === 'wide' ? r * 0.75 : r * 0.45;
    const arch = `<path d="M${x - r * 0.85} ${y - big - r * 0.55} Q${x} ${y - big - r * 0.55 - lift} ${x + r * 0.85} ${y - big - r * 0.55 + (eyes === 'curious' ? r * 0.3 : 0)}" fill="none" stroke="${brow}" stroke-width="${Math.max(5, r * 0.28)}" stroke-linecap="round"/>`;
    const look = eyes === 'curious' ? -r * 0.18 : 0;
    return `${dark ? `<circle cx="${x}" cy="${y}" r="${big + 7}" fill="#fff"/>` : ''}${ring ? `<circle cx="${x}" cy="${y}" r="${big + 9}" fill="${ring}" stroke="${C.ink}" stroke-width="6"/>` : ''}<circle cx="${x}" cy="${y}" r="${big}" fill="${C.ink}"/><circle cx="${x - r * 0.3 + look}" cy="${y - r * 0.42 + look}" r="${r * (eyes === 'wide' ? 0.42 : 0.34)}" fill="#fff"/><circle cx="${x + r * 0.4}" cy="${y + r * 0.38}" r="${r * 0.18}" fill="#fff"/>${arch}`;
  }
  if (eyes === 'open') {
    return `${dark ? `<circle cx="${x}" cy="${y}" r="${r + 7}" fill="#fff"/>` : ''}${ring ? `<circle cx="${x}" cy="${y}" r="${r + 9}" fill="${ring}" stroke="${C.ink}" stroke-width="6"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.34}" fill="#fff"/><circle cx="${x + r * 0.38}" cy="${y + r * 0.35}" r="${r * 0.16}" fill="#fff"/>`;
  }
  const bend = eyes === 'happy' ? -r * 0.9 : r * 0.7;
  return `<circle cx="${x}" cy="${y}" r="${r + (ring ? 10 : dark ? 8 : 1)}" fill="${dark ? C.ink : lid}"/><path d="M${x - r} ${y + 2} Q${x} ${y + 2 + bend} ${x + r} ${y + 2}" fill="none" stroke="${dark ? '#fff' : C.ink}" stroke-width="${Math.max(6, r * 0.32)}" stroke-linecap="round"/>`;
};

const heart = (x, y, s) =>
  `<path d="M${x} ${y + s * 0.3} C${x} ${y} ${x - s * 0.5} ${y} ${x - s * 0.5} ${y + s * 0.3} C${x - s * 0.5} ${y + s * 0.6} ${x} ${y + s * 0.8} ${x} ${y + s} C${x} ${y + s * 0.8} ${x + s * 0.5} ${y + s * 0.6} ${x + s * 0.5} ${y + s * 0.3} C${x + s * 0.5} ${y} ${x} ${y} ${x} ${y + s * 0.3} Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
const zee = (x, y, s) => `<path d="M${x} ${y} H${x + s} L${x} ${y + s} H${x + s}" fill="none" stroke="${C.ink}" stroke-width="${Math.max(6, s * 0.22)}" stroke-linecap="round" stroke-linejoin="round"/>`;
// A music note: a pink head on an ink stem with a little flag.
const note = (x, y, s) => `<path d="M${x + s * 0.32} ${y + s * 0.85} V${y} q${s * 0.3} ${s * 0.12} ${s * 0.5} ${s * 0.38}" fill="none" stroke="${C.ink}" stroke-width="${Math.max(5, s * 0.16)}" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${x + s * 0.1}" cy="${y + s * 0.88}" rx="${s * 0.26}" ry="${s * 0.2}" transform="rotate(-20 ${x + s * 0.1} ${y + s * 0.88})" fill="${C.pink}" stroke="${C.ink}" stroke-width="5"/>`;
// A snowflake for a chilly day: six white arms, outlined.
const flake = (x, y, s) => {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const arms = [0, 60, 120].map((a) => {
    const dx = (Math.cos((a * Math.PI) / 180) * s) / 2;
    const dy = (Math.sin((a * Math.PI) / 180) * s) / 2;
    return `M${cx - dx} ${cy - dy} L${cx + dx} ${cy + dy}`;
  }).join(' ');
  return `<path d="${arms}" stroke="${C.ink}" stroke-width="${Math.max(9, s * 0.3)}" stroke-linecap="round"/><path d="${arms}" stroke="#FFFFFF" stroke-width="${Math.max(4, s * 0.15)}" stroke-linecap="round"/>`;
};
/** What floats by their head, at the two spots the sleepy zees use: zees, notes or snowflakes. */
const deco = (m, x1, y1, s1, x2, y2, s2) => {
  if (m.zees) return zee(x1, y1, s1) + zee(x2, y2, s2);
  if (m.notes) return note(x1 - s1 * 0.3, y1 - s1 * 0.7, s1 * 1.7) + note(x2 + s2 * 0.4, y2 - s2 * 1.2, s2 * 1.6);
  if (m.chilly) return flake(x1 - s1 * 0.4, y1 - s1 * 0.8, s1 * 1.5) + flake(x2 + s2 * 0.5, y2 - s2 * 1.1, s2 * 1.4);
  return '';
};
// Snacks never show another animal: fish-eaters and bug-catchers get a sparkle of
// water instead (a sip, a splash after a dive).
const droplet = (x, y, s = 1) => `<path d="M${x} ${y - 16 * s} C${x + 12 * s} ${y} ${x + 12 * s} ${y + 10 * s} ${x} ${y + 12 * s} C${x - 12 * s} ${y + 10 * s} ${x - 12 * s} ${y} ${x} ${y - 16 * s} Z" fill="#9DD0F5" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/><circle cx="${x - 4 * s}" cy="${y + 2 * s}" r="${3 * s}" fill="#fff"/>`;
/** A little cluster of red berries on a stem, with a leaf: unmistakably a berry. */
const berries = (x, y) => `<path d="M${x + 14} ${y - 22} C${x + 8} ${y - 10} ${x + 2} ${y - 4} ${x - 4} ${y}" fill="none" stroke="#5E7A3A" stroke-width="4" stroke-linecap="round"/><path d="M${x + 14} ${y - 22} C${x + 28} ${y - 30} ${x + 36} ${y - 20} ${x + 30} ${y - 12} C${x + 22} ${y - 10} ${x + 16} ${y - 14} ${x + 14} ${y - 22} Z" fill="#7FBF5A" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>${[[-8, 6], [12, 8], [2, 24]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="13" fill="#E5384D" stroke="${C.ink}" stroke-width="5"/><circle cx="${x + dx - 4}" cy="${y + dy - 4}" r="3.5" fill="#fff"/>`).join('')}`;

// The moods, in the order a story shows them.
const MOODS = [
  { name: 'hello', eyes: 'open', wave: true },
  { name: 'snack', eyes: 'open', snack: true },
  { name: 'happy', eyes: 'happy', hearts: true },
  { name: 'sleepy', eyes: 'shut', zees: true },
  // Picked only when the words call for them (see src/lib/mood.ts), never by turns.
  // Surprised is all in the face too: big round eyes under raised brows.
  { name: 'surprised', eyes: 'wide' },
  // Curious is all in the face: one brow up, eyes glancing up. Nothing floating by.
  { name: 'curious', eyes: 'curious' },
  { name: 'singing', eyes: 'happy', notes: true },
  { name: 'chilly', eyes: 'open', chilly: true },
];
// Moods with eyes open blink.
const BLINKS = ['open', 'wide', 'curious'];

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
        ${deco(m, 240, 70, 30, 280, 44, 22)}`;
    },
  },
  sparrow: {
    shoulder: [(40 + 0.8 * (152 + 88 * 0.92)) / 400, (30 + 0.8 * (150 + 88 * 0.62)) / 400],
    // Full body, three-quarter pose: plump, standing tall on a twig, facing left.
    tint: C.yellowT,
    tilt: 0,
    svg: (m) => {
      const tail = '<path d="M300 262 L390 292 L382 322 L294 302 Z"/>';
      const outline = 'M96 236 C96 166 166 134 238 142 C320 152 352 222 332 282 C312 334 232 348 172 334 C120 322 96 284 96 236 Z';
      const body = `<path d="${outline}"/>`;
      const head = '<circle cx="152" cy="150" r="88"/>';
      const legs = 'M196 326 L186 364 M252 322 L264 364 M170 368 L186 360 L200 370 M248 368 L264 360 L278 370';
      return `${m.cut ? '' : `<path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/>
        <path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="#9A6A44" stroke-width="12" stroke-linecap="round"/>`}
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
        <path d="M92 166 C112 158 146 166 164 186 C176 212 172 240 150 254 C126 264 102 250 96 228 C90 208 90 186 92 166 Z" fill="${C.ink}"/>
        <path d="M114 214 q8 5 16 0 M128 236 q8 5 16 0" fill="none" stroke="#55546A" stroke-width="4" stroke-linecap="round"/>
        ${eye(m.eyes, 130, 140, 23, { lid: '#F4F0EA' })}
        <ellipse cx="160" cy="186" rx="20" ry="12" fill="${C.pink}"/>
        <path d="M94 132 C88 126 70 136 50 152 C70 160 88 166 96 164 Z" fill="#6E6C80" stroke="${C.ink}" stroke-width="9" stroke-linejoin="round"/>
        ${m.snack ? `<ellipse cx="50" cy="156" rx="16" ry="10" transform="rotate(-24 50 156)" fill="#E8C27A" stroke="${C.ink}" stroke-width="7"/>` : ''}
        ${m.hearts ? heart(290, 40, 50) + heart(350, 110, 34) : ''}
        ${deco(m, 270, 50, 40, 326, 10, 28)}
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
        ${deco(m, 210, 92, 30, 250, 66, 22)}`;
    },
  },
};

// ── Little birds: one perched, three-quarter pose (the sparrow's), each with their
// own colors, markings, beak and snack. Coordinates match the sparrow above.
const PERCH_BODY = 'M96 236 C96 166 166 134 238 142 C320 152 352 222 332 282 C312 334 232 348 172 334 C120 322 96 284 96 236 Z';
const PERCH_WING = 'M206 150 C290 140 352 196 350 262 C334 306 290 318 236 306 C214 272 198 214 206 150 Z';
const dots = (pts, r, fill) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const perched = (p) => ({
  tint: p.tint,
  tilt: 0,
  // Where the back of the head meets the back, on the 400 canvas (as fractions): the
  // drawing sits at translate(40 30) scale(0.8), so map the head through that.
  shoulder: (() => {
    const [hx, hy, hr] = p.headAt ?? [152, 150, 88];
    return [(40 + 0.8 * (hx + hr * 0.92)) / 400, (30 + 0.8 * (hy + hr * 0.62)) / 400];
  })(),
  svg: (m) => {
    const tail = p.tailShape ?? '<path d="M300 262 L390 292 L382 322 L294 302 Z"/>';
    const bodyPath = p.bodyPath ?? PERCH_BODY;
    const body = `<path d="${bodyPath}"/>`;
    // Head size and place, and the eye on it: doves are small-headed, crows big-beaked.
    const [hx, hy, hr] = p.headAt ?? [152, 150, 88];
    const [ex, ey, er] = p.eyeAt ?? [130, 140, 23];
    const head = `<circle cx="${hx}" cy="${hy}" r="${hr}"/>`;
    const legs = 'M196 326 L186 364 M252 322 L264 364 M170 368 L186 360 L200 370 M248 368 L264 360 L278 370';
    const [bx, by] = p.blushAt ?? [160, 186];
    const perch = p.rail
      ? `<path d="M-10 344 H410" stroke="${C.ink}" stroke-width="44"/><path d="M-10 344 H410" stroke="#C9B48E" stroke-width="26"/><path d="M40 338 H120 M200 350 H300" stroke="#9E8B6E" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/><path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="#9A6A44" stroke-width="12" stroke-linecap="round"/>`;
    return `${m.cut ? '' : perch}
      <g transform="translate(40 30) scale(0.8)">
      <path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${legs}" fill="none" stroke="${p.legs}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      ${shadow([tail, body, head, p.crest ?? ''])}
      ${shape(tail, p.tail)}
      ${p.tailMarks ?? ''}
      ${shape(body, p.back)}
      <clipPath id="${p.id}-body"><path d="${bodyPath}"/></clipPath>
      <g clip-path="url(#${p.id}-body)">
        ${p.breast ? `<path d="M60 150 C140 150 196 210 200 360 L60 360 Z" fill="${p.breast}"/>` : ''}
        ${p.underside ?? ''}
        <path d="${p.wingPath ?? PERCH_WING}" fill="${p.wing}"/>
        ${p.wingMarks ?? ''}
        <path d="${p.wingSeam ?? 'M206 150 C198 214 214 272 236 306'}" fill="none" stroke="${C.ink}" stroke-width="7"/>
      </g>
      <path d="${bodyPath}" fill="none" ${OL}/>
      ${p.over ?? ''}
      ${p.crest ? shape(p.crest, p.head) : ''}
      ${shape(head, p.head)}
      <clipPath id="${p.id}-head">${head}</clipPath>
      <g clip-path="url(#${p.id}-head)">${p.headMarks ?? ''}</g>
      <circle cx="${hx}" cy="${hy}" r="${hr}" fill="none" ${OL}/>
      ${p.face ?? ''}
      ${eye(m.eyes, ex, ey, er, { lid: p.lid ?? p.head, dark: p.darkEye, ring: p.eyeRing })}
      <ellipse cx="${bx}" cy="${by}" rx="20" ry="12" fill="${C.pink}"/>
      <path d="${p.beakShape ?? 'M94 132 C88 126 70 136 50 152 C70 160 88 166 96 164 Z'}" fill="${p.beak}" stroke="${C.ink}" stroke-width="9" stroke-linejoin="round"/>
      ${p.beakMarks ?? ''}
      ${m.snack ? p.snack : ''}
      ${m.hearts ? heart(290, 40, 50) + heart(350, 110, 34) : ''}
      ${deco(m, 270, 50, 40, 326, 10, 28)}
      </g>`;
  },
});

ART.robin = perched({
  id: 'robin', tint: C.yellowT,
  back: '#6E6A72', breast: '#F07A3A', wing: '#625E68', tail: '#3E3D4F', head: '#3E3D4F', darkEye: true,
  underside: '<ellipse cx="190" cy="350" rx="80" ry="34" fill="#F4F0EA"/>',
  wingMarks: `<path d="M236 190 C270 200 300 220 320 250 M250 230 C280 240 304 256 320 280" fill="none" stroke="#4E4A56" stroke-width="8" stroke-linecap="round"/>`,
  face: '<path d="M96 192 l8 16 M114 196 l6 16" stroke="#F4F0EA" stroke-width="6" stroke-linecap="round"/>',
  beak: '#F2B53A', legs: '#B9876A',
  snack: berries(40, 160),
});

ART.cardinal = perched({
  id: 'cardinal', tint: C.blueT,
  back: '#E5383B', wing: '#B8262A', tail: '#B8262A', head: '#E5383B', darkEye: true,
  crest: '<path d="M108 88 C102 40 128 6 186 0 C166 26 176 48 204 74 Z"/>',
  wingMarks: `<path d="M236 190 l22 20 M266 184 l24 22 M296 200 l22 20 M252 232 l22 20 M284 236 l20 18" stroke="#8E1C22" stroke-width="9" stroke-linecap="round"/>`,
  headMarks: `<path d="M56 116 C92 108 134 116 156 140 C160 172 144 200 112 214 L56 214 Z" fill="${C.ink}"/>`,
  face: `<path d="M84 170 C100 164 126 172 138 188 C144 208 134 224 116 230 C98 220 88 198 84 170 Z" fill="${C.ink}"/>`,
  beakShape: 'M100 126 C90 116 64 130 40 152 C64 168 90 174 102 168 Z', beak: '#F2804A', legs: '#C98A7A',
  snack: `<g transform="rotate(-30 36 166)"><ellipse cx="36" cy="166" rx="26" ry="14" fill="#2E2E44" stroke="${C.ink}" stroke-width="7"/><path d="M16 166 H56 M20 159 H52 M20 173 H52" stroke="#F4F0EA" stroke-width="3.5"/></g>`,
});

ART.dove = perched({
  id: 'dove', tint: C.pinkT,
  bodyPath: 'M90 252 C90 182 170 148 248 156 C332 166 362 232 342 288 C320 338 236 352 172 338 C116 326 90 294 90 252 Z',
  wingPath: 'M204 172 C292 160 358 208 356 270 C338 312 294 322 238 312 C212 278 198 224 204 172 Z',
  wingSeam: 'M204 172 C198 224 212 278 238 312',
  headAt: [148, 168, 64], eyeAt: [130, 160, 18], eyeRing: '#8FB3E8',
  back: '#D9BFA0', breast: '#E8C6B2', wing: '#BCA88C', tail: '#9E8B74', head: '#CDB5A0',
  tailShape: '<path d="M312 256 L414 334 L400 352 L296 302 Z"/>',
  tailMarks: '<path d="M334 286 L404 340" stroke="#FAF7F2" stroke-width="7" stroke-linecap="round"/>',
  wingMarks: dots([[256, 216], [288, 208], [274, 246], [306, 240], [300, 274]], 10, C.ink),
  face: `<ellipse cx="200" cy="222" rx="26" ry="15" transform="rotate(-24 200 222)" fill="#C9A3D9"/><ellipse cx="146" cy="190" rx="7" ry="6" fill="${C.ink}"/>`,
  blushAt: [172, 196],
  beakShape: 'M88 164 C80 160 66 166 50 172 C66 176 80 178 88 176 Z', beak: '#3B3A50', legs: '#E58A8A',
  snack: `<ellipse cx="44" cy="176" rx="13" ry="8" transform="rotate(-20 44 176)" fill="#E8C27A" stroke="${C.ink}" stroke-width="6"/>`,
});

const SPECKLES = [[110, 230], [140, 252], [120, 282], [158, 300], [196, 318], [178, 270], [150, 214], [96, 262], [228, 328], [262, 322]];
ART.starling = perched({
  id: 'starling', tint: C.yellowT,
  headAt: [156, 156, 80], eyeAt: [136, 146, 20], darkEye: true,
  back: '#24413A', wing: '#2B2A33', tail: '#2B2A33', head: '#3B2F5E',
  tailShape: '<path d="M306 268 L364 280 L360 312 L300 302 Z"/>',
  underside: `<path d="M80 180 C150 170 210 230 210 360 L80 360 Z" fill="#2E2545"/>${dots(SPECKLES, 5, '#F4E7C8')}`,
  wingMarks: `<path d="M232 200 q12 12 24 0 M262 196 q12 12 24 0 M292 206 q12 12 24 0 M244 236 q12 12 24 0 M276 236 q12 12 24 0 M306 246 q12 12 24 0 M258 272 q12 12 24 0 M290 276 q12 12 24 0" fill="none" stroke="#C9A66B" stroke-width="6" stroke-linecap="round"/>`,
  headMarks: `<path d="M96 104 C134 84 188 88 222 116" fill="none" stroke="#6E5BB0" stroke-width="12" stroke-linecap="round"/><path d="M190 190 C210 200 228 214 236 232" fill="none" stroke="#2F8F7A" stroke-width="12" stroke-linecap="round"/>${dots([[186, 176], [168, 204], [200, 214]], 4.5, '#F4E7C8')}`,
  beakShape: 'M98 136 C80 132 44 142 6 156 C44 162 80 166 98 166 Z', beak: '#F2C94C', legs: '#D9776A',
  snack: `<circle cx="10" cy="164" r="15" fill="#7B4BB5" stroke="${C.ink}" stroke-width="6"/><circle cx="5" cy="159" r="4" fill="#fff"/>`,
});

ART.crow = perched({
  // A big, thick, curved black beak is what makes a crow a crow.
  id: 'crow', tint: C.blueT,
  headAt: [150, 150, 84], eyeAt: [134, 138, 20], darkEye: true,
  back: '#2A2A3E', wing: '#232338', tail: '#232338', head: '#2E2E44',
  tailShape: '<path d="M298 250 L402 288 L398 332 L290 306 Z"/>',
  tailMarks: `<path d="M318 272 L392 300 M314 290 L390 316" stroke="#3B3A50" stroke-width="5" stroke-linecap="round"/>`,
  wingMarks: `<path d="M228 186 C270 194 310 220 334 256" fill="none" stroke="#4B5A9E" stroke-width="10" stroke-linecap="round"/><path d="M244 236 L296 252 M252 262 L304 280 M262 288 L310 302" stroke="#3B3A50" stroke-width="6" stroke-linecap="round"/>`,
  headMarks: `<path d="M98 96 C130 76 180 76 214 100" fill="none" stroke="#4B5A9E" stroke-width="12" stroke-linecap="round"/>`,
  face: `<path d="M98 196 L86 228 L106 216 L104 244 L122 226 L134 248 L144 222 Z" fill="#2E2E44" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`,
  blushAt: [166, 182],
  beakShape: 'M102 114 C66 104 20 118 -20 152 C22 170 66 176 104 172 Z', beak: '#1A1A2E',
  beakMarks: `<path d="M92 124 C64 118 28 128 -2 148" fill="none" stroke="#55546A" stroke-width="6" stroke-linecap="round"/><path d="M90 132 l-16 -6 M90 140 l-18 -2" stroke="#3B3A50" stroke-width="5" stroke-linecap="round"/>`,
  legs: '#3B3A50',
  snack: `<g transform="translate(-196 -122)"><path d="M176 290 C176 276 196 274 200 286 C204 274 224 276 224 290 C224 306 204 308 200 298 C196 308 176 306 176 290 Z" fill="#E2B878" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/></g>`,
});

ART.jay = perched({
  id: 'jay', tint: C.yellowT,
  back: '#4A7FD6', breast: '#E9EAF0', wing: '#3E6FC6', tail: '#3E6FC6', head: '#4A7FD6', darkEye: true,
  crest: '<path d="M108 92 C100 44 126 10 182 6 C164 30 172 50 200 76 Z"/>',
  tailMarks: `<path d="M330 276 l-6 22 M352 284 l-6 22 M374 292 l-6 22" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
  wingMarks: `<path d="M240 200 l-8 26 M266 196 l-8 28 M292 204 l-8 28 M316 216 l-8 28 M256 246 l-6 24 M284 252 l-6 24 M310 262 l-6 22" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>${dots([[262, 286], [290, 290], [316, 286]], 8, '#F4F2F0')}`,
  headMarks: `<path d="M56 130 C100 120 140 140 152 172 C152 212 122 244 56 244 Z" fill="#F4F2F0"/><path d="M96 128 C110 132 120 138 126 146" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>`,
  face: `<path d="M80 226 C118 252 172 246 210 214" fill="none" stroke="${C.ink}" stroke-width="13" stroke-linecap="round"/>`,
  beak: '#2E2E44', legs: '#5E6378',
  snack: `<path d="M24 162 C24 150 40 148 44 158 C48 148 64 150 64 162 C64 176 48 178 44 170 C40 178 24 176 24 162 Z" fill="#E2B878" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`,
});

ART.gull = perched({
  id: 'gull', tint: C.blueT, rail: true,
  headAt: [150, 150, 80], eyeAt: [132, 140, 17], eyeRing: '#F2E28C', lid: '#F7F5F2',
  back: '#F7F5F2', wing: '#B4B8C6', tail: '#F7F5F2', head: '#F7F5F2',
  wingMarks: `<path d="M296 236 L366 300 L336 322 L278 292 Z" fill="${C.ink}"/>${dots([[318, 276], [338, 296]], 7, '#F7F5F2')}<path d="M228 196 C266 204 300 222 322 248" fill="none" stroke="#9A9EAE" stroke-width="7" stroke-linecap="round"/>`,
  beakShape: 'M98 130 C84 126 54 132 26 146 C24 154 30 160 38 162 C62 164 86 166 98 164 Z', beak: '#F2C94C',
  beakMarks: '<circle cx="46" cy="158" r="6" fill="#E5484D"/>',
  legs: '#F2A0A0',
  snack: droplet(34, 172),
});

ART.junco = perched({
  id: 'junco', tint: C.pinkT,
  back: '#5E6378', wing: '#535869', tail: '#4B5062', head: '#5E6378', darkEye: true,
  underside: '<path d="M110 268 C170 256 262 276 306 330 L110 370 Z" fill="#F4F2F0"/>',
  tailMarks: '<path d="M310 298 L380 316" stroke="#F4F2F0" stroke-width="8" stroke-linecap="round"/>',
  wingMarks: `<path d="M236 196 C270 206 300 226 320 256 M250 238 C280 248 304 264 318 288" fill="none" stroke="#454A5A" stroke-width="8" stroke-linecap="round"/>`,
  beakShape: 'M96 132 C88 122 68 132 52 150 C68 162 88 168 98 162 Z', beak: '#F2B8C6', legs: '#C9A08E',
  snack: `<ellipse cx="50" cy="160" rx="12" ry="8" transform="rotate(-20 50 160)" fill="#E8C27A" stroke="${C.ink}" stroke-width="6"/>`,
});

ART.whitethroat = perched({
  id: 'whitethroat', tint: C.yellowT,
  back: '#B88A5E', breast: '#C9C7D0', wing: '#A86B3E', tail: '#7A5236', head: '#A8A6B2',
  wingMarks: `<path d="M236 186 l22 22 M266 180 l24 24 M296 196 l22 22 M250 226 l22 22 M282 230 l22 20" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/><path d="M226 262 C262 278 300 280 336 270" fill="none" stroke="#FAF7F2" stroke-width="10" stroke-linecap="round"/>`,
  headMarks: `<path d="M50 50 H260 V104 C200 92 140 92 60 112 Z" fill="${C.ink}"/><path d="M92 80 C140 66 200 68 250 86" fill="none" stroke="#F7F5F2" stroke-width="13" stroke-linecap="round"/><path d="M88 120 C122 108 172 108 226 122" fill="none" stroke="#F7F5F2" stroke-width="12" stroke-linecap="round"/><path d="M150 152 C180 154 206 162 230 176" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`,
  face: `<ellipse cx="100" cy="124" rx="11" ry="8" fill="#F2C94C"/><path d="M84 174 C100 168 128 172 140 186 C142 206 128 218 108 218 C92 210 84 194 84 174 Z" fill="#F7F5F2" stroke="${C.ink}" stroke-width="5"/>`,
  blushAt: [166, 196], darkEye: false,
  beak: '#8F8D9C', legs: '#E0A68A',
  snack: `<ellipse cx="50" cy="156" rx="13" ry="8" transform="rotate(-20 50 156)" fill="#E8C27A" stroke="${C.ink}" stroke-width="6"/>`,
});

// Small snacks at the beak tip.
const seed = (x = 50, y = 158) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="8" transform="rotate(-20 ${x} ${y})" fill="#E8C27A" stroke="${C.ink}" stroke-width="6"/>`;
const berry = (color, x = 40, y = 160) => `<circle cx="${x}" cy="${y}" r="15" fill="${color}" stroke="${C.ink}" stroke-width="6"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff"/>`;

ART.songsparrow = perched({
  id: 'songsparrow', tint: C.pinkT,
  back: '#B88A5E', breast: '#F1ECE4', wing: '#9A6440', tail: '#7A5236', head: '#C9BFB4',
  underside: `<path d="M110 220 l10 22 M136 230 l8 22 M120 262 l10 22 M150 270 l8 20 M170 240 l8 22 M100 290 l10 20 M140 300 l8 18" stroke="#7A4E2A" stroke-width="8" stroke-linecap="round"/><circle cx="150" cy="254" r="13" fill="#7A4E2A"/>`,
  wingMarks: `<path d="M236 186 l22 22 M266 180 l24 24 M296 196 l22 22 M250 226 l22 22 M282 230 l22 20" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`,
  headMarks: `<path d="M50 50 H260 V108 C200 94 140 94 60 114 Z" fill="#8A5A3A"/><path d="M100 82 C150 70 200 72 250 90" fill="none" stroke="#C9BFB4" stroke-width="12" stroke-linecap="round"/><path d="M150 150 C180 152 206 160 230 174" fill="none" stroke="#8A5A3A" stroke-width="10" stroke-linecap="round"/>`,
  face: `<path d="M100 178 C112 192 126 200 140 204" fill="none" stroke="#7A4E2A" stroke-width="9" stroke-linecap="round"/>`,
  blushAt: [168, 192],
  beak: '#A89A90', legs: '#E0A68A', snack: seed(),
});

ART.mockingbird = perched({
  id: 'mockingbird', tint: C.blueT,
  back: '#A9A9B4', breast: '#ECECEF', wing: '#5E5E6E', tail: '#4E4E5E', head: '#A9A9B4', eyeRing: '#F2E28C',
  tailShape: '<path d="M300 256 L404 282 L400 316 L294 302 Z"/>',
  tailMarks: '<path d="M318 292 L396 310" stroke="#F4F2F0" stroke-width="8" stroke-linecap="round"/>',
  wingMarks: `<path d="M262 232 C286 226 306 238 314 256 C298 268 276 266 262 256 Z" fill="#F4F2F0"/><path d="M230 200 C262 206 292 220 314 240 M236 284 C266 292 300 292 330 282" fill="none" stroke="#F4F2F0" stroke-width="7" stroke-linecap="round"/>`,
  face: `<path d="M98 134 C120 132 140 138 160 148" fill="none" stroke="#5E5E6E" stroke-width="8" stroke-linecap="round"/>`,
  beakShape: 'M96 136 C86 132 64 140 40 152 C64 158 86 162 96 160 Z', beak: '#2E2E44', legs: '#3B3A50',
  snack: berry('#E5484D', 34, 162),
});

ART.catbird = perched({
  id: 'catbird', tint: C.yellowT,
  back: '#7E8296', wing: '#6E7286', tail: '#2E2E44', head: '#7E8296', darkEye: true,
  // The rusty patch under the tail.
  over: `<path d="M286 304 C310 300 334 306 348 320 C328 336 302 336 282 326 Z" fill="#A9472F" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`,
  wingMarks: `<path d="M236 196 C270 206 300 226 320 256 M250 238 C280 248 304 264 318 288" fill="none" stroke="#5E6276" stroke-width="8" stroke-linecap="round"/>`,
  headMarks: `<path d="M50 50 H260 V112 C200 96 140 96 60 116 Z" fill="${C.ink}"/>`,
  beakShape: 'M96 136 C86 132 64 140 42 152 C64 158 86 162 96 160 Z', beak: '#2E2E44', legs: '#3B3A50',
  snack: berry('#5B3E8E', 36, 162),
});

ART.redwing = perched({
  id: 'redwing', tint: C.blueT,
  back: '#232338', wing: '#1F1F33', tail: '#1F1F33', head: '#2A2A3E', darkEye: true,
  wingMarks: `<path d="M210 166 C246 156 274 168 280 196 C264 216 236 216 210 206 Z" fill="#E5383B"/><path d="M214 208 C240 220 266 220 284 206" fill="none" stroke="#F2C94C" stroke-width="10" stroke-linecap="round"/><path d="M244 250 L300 266 M252 276 L306 292" stroke="#3B3A50" stroke-width="6" stroke-linecap="round"/>`,
  headMarks: `<path d="M98 96 C130 78 180 78 214 100" fill="none" stroke="#4B5A9E" stroke-width="10" stroke-linecap="round"/>`,
  beakShape: 'M96 130 C84 126 60 136 34 152 C60 160 84 164 96 162 Z', beak: '#1A1A2E', legs: '#3B3A50',
  snack: seed(38, 162),
});

ART.grackle = perched({
  // Iridescent purple-blue head, bronze body, pale yellow eye, long keel tail.
  id: 'grackle', tint: C.pinkT,
  back: '#3A3326', wing: '#2E2A26', tail: '#2B2A3A', head: '#3B3870', eyeRing: '#F2E28C', lid: '#3B3870',
  tailShape: '<path d="M298 252 L404 278 L398 332 L290 306 Z"/>',
  tailMarks: '<path d="M318 276 L392 296" stroke="#5B4B9E" stroke-width="6" stroke-linecap="round"/>',
  wingMarks: `<path d="M226 186 C270 196 310 222 332 256" fill="none" stroke="#8C6E3A" stroke-width="9" stroke-linecap="round"/><path d="M244 240 L296 256 M252 268 L304 284" stroke="#4A4236" stroke-width="6" stroke-linecap="round"/>`,
  headMarks: `<path d="M94 100 C130 80 184 82 218 108" fill="none" stroke="#6E8BE0" stroke-width="12" stroke-linecap="round"/><path d="M180 200 C200 212 216 226 222 244" fill="none" stroke="#7B4BB5" stroke-width="12" stroke-linecap="round"/>`,
  beakShape: 'M100 126 C78 120 44 130 10 150 C44 160 78 166 100 164 Z', beak: '#1A1A2E', legs: '#3B3A50',
  snack: seed(26, 166),
});

ART.titmouse = perched({
  id: 'titmouse', tint: C.yellowT,
  back: '#A7A9B8', breast: '#F4F2F0', wing: '#9496A6', tail: '#868898', head: '#A7A9B8',
  crest: '<path d="M110 90 C104 46 130 14 184 8 C166 32 174 52 200 78 Z"/>',
  underside: '<path d="M150 250 C190 260 220 300 230 360 L150 360 Z" fill="#E8B48E"/>',
  wingMarks: `<path d="M236 196 C270 206 300 226 320 256 M250 238 C280 248 304 264 318 288" fill="none" stroke="#7E8090" stroke-width="8" stroke-linecap="round"/>`,
  face: `<ellipse cx="104" cy="112" rx="19" ry="14" fill="${C.ink}"/>`,
  beak: '#7E8090', legs: '#7E8090', snack: seed(),
});

ART.thrush = perched({
  id: 'thrush', tint: C.pinkT,
  back: '#9C8466', breast: '#F1ECE4', wing: '#8A7356', tail: '#B5643A', head: '#9C8466', eyeRing: '#F7F5F2',
  underside: dots([[112, 226], [138, 216], [126, 250], [154, 244], [140, 276], [168, 270], [110, 280], [176, 232]], 7, '#5E4A3A'),
  wingMarks: `<path d="M236 196 C270 206 300 226 320 256 M250 238 C280 248 304 264 318 288" fill="none" stroke="#6E5A44" stroke-width="8" stroke-linecap="round"/>`,
  face: '<path d="M102 182 C112 194 124 200 136 202" fill="none" stroke="#6E5A44" stroke-width="7" stroke-linecap="round"/>',
  blushAt: [168, 192],
  beakShape: 'M96 136 C86 132 66 140 46 152 C66 158 86 162 96 160 Z', beak: '#6E6C80', beakMarks: '<path d="M90 156 L70 156" stroke="#E8C27A" stroke-width="6" stroke-linecap="round"/>',
  legs: '#E0A68A', snack: berry('#5B3E8E', 38, 162),
});

ART.warbler = perched({
  // Yellow-rumped warbler: the yellow patches on the rump, sides and crown.
  id: 'warbler', tint: C.blueT,
  back: '#7E8AA0', breast: '#F4F2F0', wing: '#5E6A80', tail: '#4E5A70', head: '#7E8AA0',
  underside: `<path d="M110 230 l8 18 M134 240 l8 18 M118 266 l8 18 M146 268 l6 16" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
  wingMarks: `<path d="M240 190 l20 18 M270 186 l22 20 M296 200 l20 18" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M230 250 C262 262 296 264 326 256 M236 278 C266 288 300 288 330 280" fill="none" stroke="#F4F2F0" stroke-width="7" stroke-linecap="round"/>`,
  over: `<path d="M176 230 C196 220 214 232 214 252 C200 264 180 260 176 230 Z" fill="#F2D23C" stroke="${C.ink}" stroke-width="6"/><path d="M290 286 C306 278 324 284 330 298 C316 310 298 306 290 286 Z" fill="#F2D23C" stroke="${C.ink}" stroke-width="6"/>`,
  headMarks: '<ellipse cx="170" cy="70" rx="22" ry="12" fill="#F2D23C"/>',
  face: `<path d="M112 120 C124 114 138 116 146 124 M112 160 C124 166 138 166 146 158" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/><path d="M92 178 C104 172 126 174 138 186 C136 200 120 208 104 204 C96 196 92 188 92 178 Z" fill="#F7F5F2"/>`,
  blushAt: [168, 186],
  beakShape: 'M96 138 C86 134 68 142 50 152 C68 158 86 160 96 158 Z', beak: '#2E2E44', legs: '#3B3A50',
  snack: berry('#9FB3D9', 38, 160),
});

ART.ringbill = perched({
  id: 'ringbill', tint: C.yellowT, rail: true,
  headAt: [150, 150, 80], eyeAt: [132, 140, 17], eyeRing: '#F2E28C', lid: '#F7F5F2',
  back: '#F7F5F2', wing: '#C3C7D3', tail: '#F7F5F2', head: '#F7F5F2',
  wingMarks: `<path d="M296 236 L366 300 L336 322 L278 292 Z" fill="${C.ink}"/>${dots([[320, 278]], 7, '#F7F5F2')}`,
  beakShape: 'M98 132 C84 128 56 134 32 146 C30 152 34 158 40 160 C62 162 86 164 98 162 Z', beak: '#F2C94C',
  beakMarks: `<path d="M56 136 L60 162" stroke="${C.ink}" stroke-width="9"/>`,
  legs: '#F2C94C',
  snack: droplet(34, 172),
});

// Woodpeckers: clinging upright to a trunk, stiff tail braced against the bark.
const woodpecker = (p) => ({
  tint: p.tint,
  tilt: 0,
  svg: (m) => {
    const bodyPath = 'M150 230 C140 160 176 118 220 124 C268 132 290 190 282 262 C276 318 246 350 210 344 C176 338 156 300 150 230 Z';
    const body = `<path d="${bodyPath}"/>`;
    const head = '<circle cx="176" cy="126" r="70"/>';
    const tail = '<path d="M238 320 L276 392 L252 400 L214 330 Z"/>';
    return `${m.cut ? '' : `<rect x="276" y="-10" width="140" height="420" fill="#9A6A44"/><path d="M276 -10 V410" stroke="${C.ink}" stroke-width="10"/>
      <path d="M320 40 C316 90 326 130 318 180 M360 200 C354 250 366 290 356 350 M338 300 V380" fill="none" stroke="#7A4E2A" stroke-width="8" stroke-linecap="round"/>`}
      ${shadow([tail, body, head])}
      ${shape(tail, C.ink)}
      ${shape(body, p.back)}
      <clipPath id="${p.id}-body"><path d="${bodyPath}"/></clipPath>
      <g clip-path="url(#${p.id}-body)">
        <path d="M120 150 C180 160 210 240 200 360 L120 360 Z" fill="${p.breast}"/>
        ${p.backMarks}
      </g>
      <path d="${bodyPath}" fill="none" ${OL}/>
      <path d="M262 222 l22 -8 M262 222 l20 10 M258 272 l24 -6 M258 272 l20 12" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      ${shape(head, p.head)}
      <clipPath id="${p.id}-head">${head}</clipPath>
      <g clip-path="url(#${p.id}-head)">${p.headMarks}</g>
      <circle cx="176" cy="126" r="70" fill="none" ${OL}/>
      ${eye(m.eyes, 154, 118, 18, { lid: p.lid })}
      <ellipse cx="178" cy="160" rx="16" ry="9" fill="${C.pink}"/>
      <path d="M112 118 L64 130 L112 142 Z" fill="#6E6C80" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${m.snack ? `<ellipse cx="58" cy="152" rx="14" ry="16" fill="#D9954F" stroke="${C.ink}" stroke-width="6"/><path d="M42 146 Q58 128 74 146 Q58 152 42 146 Z" fill="#7A4E2A" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` : ''}
      ${m.hearts ? heart(60, 56, 40) + heart(108, 26, 28) : ''}
      ${deco(m, 48, 62, 32, 92, 34, 22)}`;
  },
});

ART.downy = woodpecker({
  id: 'downy', tint: C.yellowT,
  back: C.ink, breast: '#F4F2F0', head: '#F4F2F0', lid: '#F4F2F0',
  backMarks: `<path d="M236 130 C250 190 254 250 248 330" fill="none" stroke="#F4F2F0" stroke-width="22" stroke-linecap="round"/>${dots([[214, 210], [222, 244], [270, 214], [276, 250], [218, 280], [270, 290]], 7, '#F4F2F0')}`,
  headMarks: `<path d="M100 40 H260 V96 C220 82 170 80 110 92 Z" fill="${C.ink}"/><path d="M172 130 C200 130 226 122 250 110 L250 150 C222 158 196 158 172 148 Z" fill="${C.ink}"/><path d="M226 72 C240 76 250 88 252 102 L222 104 Z" fill="#E5383B"/><path d="M120 166 C144 174 168 176 192 172" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>`,
});

ART.redbelly = woodpecker({
  id: 'redbelly', tint: C.pinkT,
  back: '#F4F2F0', breast: '#EADFD2', head: '#EADFD2', lid: '#EADFD2',
  backMarks: `<path d="M210 150 H300 M206 176 H300 M206 202 H300 M206 228 H300 M208 254 H300 M212 280 H300 M218 306 H300" stroke="${C.ink}" stroke-width="12"/><path d="M150 300 C170 320 196 330 220 330" fill="none" stroke="#F2A0A0" stroke-width="16" stroke-linecap="round"/>`,
  headMarks: `<path d="M106 96 C120 60 170 40 220 50 C246 60 256 90 252 130 C230 110 200 96 160 96 C140 96 120 100 106 106 Z" fill="#E5383B"/>`,
});

// Chimney swift: a little "cigar with wings", always flying.
ART.swift = {
  tint: C.blueT,
  tilt: -6,
  svg: (m) => {
    const wingUp = '<path d="M214 186 C276 116 340 74 404 62 C352 108 300 160 248 214 Z"/>';
    const wingDown = '<path d="M176 230 C120 290 62 324 -4 336 C46 292 104 250 150 210 Z"/>';
    const body = '<path d="M70 214 C70 176 120 160 200 166 C270 172 322 190 336 212 C322 236 270 252 200 256 C120 260 70 250 70 214 Z"/>';
    const tail = '<path d="M326 204 L366 192 L354 214 L366 236 L326 224 Z"/>';
    return `${shadow([wingUp, wingDown, tail, body])}
      ${shape(wingDown, '#3E3A44')}
      ${shape(tail, '#3E3A44')}
      ${shape(body, '#4E4A54')}
      ${shape(wingUp, '#3E3A44')}
      <path d="M240 196 C290 140 340 104 384 86" fill="none" stroke="#5E5A66" stroke-width="7" stroke-linecap="round"/>
      <path d="M80 222 C92 240 112 246 132 244" fill="none" stroke="#8A8690" stroke-width="12" stroke-linecap="round"/>
      ${eye(m.eyes, 112, 204, 20, { dark: true })}
      <ellipse cx="146" cy="226" rx="15" ry="9" fill="${C.pink}"/>
      <path d="M74 206 L56 214 L74 222 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      ${m.snack ? droplet(36, 210, 0.8) : ''}
      ${m.hearts ? heart(70, 70, 42) + heart(130, 40, 28) : ''}
      ${deco(m, 80, 80, 34, 124, 50, 22)}`;
  },
};

// Hawks and falcons: hooked beak with a yellow base. Their snack is a feather for the
// nest, never prey.
const HOOK = 'M98 126 C84 118 60 126 50 146 C48 160 58 168 66 162 C66 152 76 150 98 162 Z';
const CERE = '<path d="M98 128 C92 126 86 130 84 140 C88 150 94 156 98 158 Z" fill="#F2C94C" stroke="#1A1A2E" stroke-width="6"/>';
const feather = (x = 44, y = 168) => `<g transform="rotate(-30 ${x} ${y})"><path d="M${x - 30} ${y} C${x - 10} ${y - 14} ${x + 14} ${y - 12} ${x + 30} ${y} C${x + 14} ${y + 12} ${x - 10} ${y + 14} ${x - 30} ${y} Z" fill="#F4F2F0" stroke="#1A1A2E" stroke-width="6"/><path d="M${x - 34} ${y} H${x + 30}" stroke="#1A1A2E" stroke-width="4"/></g>`;

ART.kestrel = perched({
  id: 'kestrel', tint: C.pinkT,
  back: '#C76A3A', breast: '#F2D3B5', wing: '#8FA0C0', tail: '#C76A3A', head: '#F4EDE4',
  underside: dots([[112, 236], [134, 258], [118, 280], [150, 286], [170, 246], [96, 262]], 6, C.ink),
  wingMarks: dots([[246, 210], [276, 206], [262, 244], [296, 240], [284, 276]], 7, C.ink),
  tailMarks: `<path d="M352 280 l-6 30" stroke="${C.ink}" stroke-width="12"/>`,
  headMarks: '<path d="M50 50 H260 V110 C210 92 160 88 60 104 Z" fill="#8FA0C0"/><circle cx="196" cy="80" r="14" fill="#C76A3A"/>',
  face: `<path d="M124 162 L118 202 M190 148 L186 194" stroke="${C.ink}" stroke-width="11" stroke-linecap="round"/>`,
  blushAt: [156, 192],
  beakShape: HOOK, beak: '#5E6A80', beakMarks: CERE, legs: '#F2C94C',
  snack: feather(),
});

ART.tern = perched({
  id: 'tern', tint: C.blueT, rail: true,
  headAt: [150, 150, 78], eyeAt: [134, 136, 18], darkEye: true,
  back: '#F7F5F2', wing: '#C3C7D3', tail: '#F7F5F2', head: '#F7F5F2',
  tailShape: '<path d="M300 262 L408 266 L364 292 L408 314 L294 306 Z"/>',
  wingMarks: `<path d="M300 250 L366 300" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>`,
  headMarks: `<path d="M40 40 H260 V150 C210 124 160 116 60 132 Z" fill="${C.ink}"/>`,
  beakShape: 'M98 134 C82 130 52 140 16 154 C52 160 82 164 98 162 Z', beak: '#E8603C',
  beakMarks: `<path d="M34 148 L16 154 L34 158 Z" fill="${C.ink}"/>`,
  legs: '#E5484D', snack: droplet(26, 172),
});

ART.nightheron = perched({
  // Stocky, hunched, black cap and back, big red eye, white plumes.
  id: 'nightheron', tint: C.blueT,
  headAt: [146, 152, 92], eyeAt: [126, 142, 20], eyeRing: '#E5484D',
  back: '#2E3448', wing: '#A9ACB8', tail: '#8A8E9C', head: '#F4F2F0', breast: '#F4F2F0',
  headMarks: '<path d="M40 40 H260 V124 C210 104 160 100 60 118 Z" fill="#2E3448"/>',
  face: `<path d="M216 112 C266 132 296 172 306 222" fill="none" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/><path d="M216 112 C266 132 296 172 306 222" fill="none" stroke="#F4F2F0" stroke-width="6" stroke-linecap="round"/>`,
  blushAt: [158, 192],
  beakShape: 'M94 128 C78 122 48 132 18 150 C48 160 78 166 96 162 Z', beak: C.ink, legs: '#E8C86A',
  snack: droplet(24, 170),
});

// ── Water birds with their own poses.
ART.goose = {
  shoulder: [0.5, 0.48],
  // Standing on the grass: plump brown body, long black neck, white chin strap.
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M120 262 C120 202 200 178 280 188 C350 198 386 242 372 288 C358 328 290 342 220 336 C160 330 120 306 120 262 Z"/>';
    const tail = '<path d="M352 230 L392 214 L396 250 L366 262 Z"/>';
    const neck = '<path d="M126 256 C108 204 102 150 112 108 L166 110 C156 150 160 200 180 238 Z"/>';
    const head = '<ellipse cx="128" cy="96" rx="54" ry="44"/>';
    return `${m.cut ? '' : `<rect x="-10" y="336" width="420" height="80" fill="#8BC27A"/><path d="M-10 336 H410" stroke="${C.ink}" stroke-width="10"/>`}
      <path d="M206 330 L200 366 M262 330 L268 366" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
      <path d="M176 372 L200 360 L216 374 Z M248 374 L268 360 L290 372 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${shadow([tail, body, neck, head])}
      ${shape(tail, '#2E2E44')}
      ${shape(body, '#8A6E58')}
      <clipPath id="goose-body"><path d="M120 262 C120 202 200 178 280 188 C350 198 386 242 372 288 C358 328 290 342 220 336 C160 330 120 306 120 262 Z"/></clipPath>
      <g clip-path="url(#goose-body)">
        <path d="M100 230 C160 240 190 300 200 360 L100 360 Z" fill="#D9CBB8"/>
        <path d="M212 210 C290 200 360 236 366 286 C330 316 270 316 228 300 C210 270 204 240 212 210 Z" fill="#6E5644"/>
        <path d="M240 236 q14 10 28 0 M276 232 q14 10 28 0 M312 242 q14 10 28 0 M252 268 q14 10 28 0 M290 270 q14 10 28 0" fill="none" stroke="#B9A48E" stroke-width="6" stroke-linecap="round"/>
        <path d="M300 330 C330 320 356 304 372 288 L372 340 Z" fill="#F4F2F0"/>
      </g>
      <path d="M120 262 C120 202 200 178 280 188 C350 198 386 242 372 288 C358 328 290 342 220 336 C160 330 120 306 120 262 Z" fill="none" ${OL}/>
      ${shape(neck, '#2E2E44')}
      ${shape(head, '#2E2E44')}
      <path d="M118 98 C136 86 166 94 176 116 C168 134 142 140 124 130 C116 122 114 108 118 98 Z" fill="#F7F5F2"/>
      ${eye(m.eyes, 108, 82, 14, { dark: true })}
      <ellipse cx="152" cy="124" rx="16" ry="9" fill="${C.pink}"/>
      ${m.snack ? `<path d="M50 112 C40 126 34 142 36 160 M60 112 C58 128 60 144 66 156" fill="none" stroke="#3E8E4E" stroke-width="7" stroke-linecap="round"/>` : ''}
      <path d="M80 88 C66 86 48 94 34 106 C48 112 68 112 82 108 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${m.hearts ? heart(300, 50, 46) + heart(352, 112, 30) : ''}
      ${deco(m, 250, 64, 34, 292, 34, 22)}`;
  },
};

ART.mallard = {
  // Floating: green head, yellow bill, white neck ring, chestnut breast, curly tail.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const bodyPath = 'M86 252 C86 200 170 186 250 192 C330 198 382 226 374 264 C366 304 300 316 220 314 C150 312 86 300 86 252 Z';
    const body = `<path d="${bodyPath}"/>`;
    const head = '<ellipse cx="126" cy="146" rx="58" ry="52"/>';
    return `${shadow([body, head])}
      ${shape(body, '#C9CCD6')}
      <clipPath id="mallard-body"><path d="${bodyPath}"/></clipPath>
      <g clip-path="url(#mallard-body)">
        <path d="M70 180 C140 186 180 240 176 330 L70 330 Z" fill="#8E4A3A"/>
        <path d="M330 190 L400 190 L400 330 L320 330 C340 290 344 240 330 190 Z" fill="#2E2E44"/>
        <path d="M210 214 C270 206 330 220 350 246 C320 270 260 272 220 262 Z" fill="#A9ACB8"/>
        <path d="M254 244 C274 238 304 238 330 246" fill="none" stroke="#F7F5F2" stroke-width="14" stroke-linecap="round"/><path d="M254 244 C274 238 304 238 330 246" fill="none" stroke="#5B4FC8" stroke-width="8" stroke-linecap="round"/>
      </g>
      <path d="${bodyPath}" fill="none" ${OL}/>
      <path d="M346 206 C350 186 372 182 372 198 C372 210 358 210 358 200" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      ${shape(head, '#1F8A5A')}
      <path d="M88 116 C110 100 150 98 172 112" fill="none" stroke="#5FC48E" stroke-width="10" stroke-linecap="round"/>
      <path d="M96 192 C118 204 152 204 172 192" fill="none" stroke="#F7F5F2" stroke-width="10" stroke-linecap="round"/>
      ${eye(m.eyes, 112, 136, 15, { dark: true })}
      <ellipse cx="140" cy="170" rx="16" ry="9" fill="${C.pink}"/>
      <path d="M74 146 C58 144 36 152 26 164 C40 174 62 174 78 166 Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="34" cy="163" r="4" fill="${C.ink}"/>
      ${m.snack ? `<path d="M34 170 C30 186 40 196 34 212 M44 172 C46 188 56 194 54 210" fill="none" stroke="#3E8E4E" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${m.cut ? '' : `<path d="M-10 296 Q40 282 90 296 T190 296 T290 296 T390 296 T490 296 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/>
      <path d="M40 330 q20 -10 40 0 M180 346 q20 -10 40 0 M300 328 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>`}
      ${m.hearts ? heart(300, 50, 46) + heart(352, 112, 30) : ''}
      ${deco(m, 250, 64, 34, 292, 34, 22)}`;
  },
};

// ── Bigger neighbors: close-up selfies, waving.
ART.squirrel = {
  tint: C.yellowT,
  tilt: 5,
  svg: (m) => {
    const tail = '<path d="M248 420 C410 410 430 220 376 128 C334 58 248 66 240 128 C234 180 294 192 314 232 C336 282 304 344 252 362 Z"/>';
    const body = '<path d="M30 430 C50 330 125 300 200 300 C275 300 350 330 370 430 Z"/>';
    const ears = '<ellipse cx="102" cy="88" rx="40" ry="58" transform="rotate(-22 102 88)"/><ellipse cx="298" cy="88" rx="40" ry="58" transform="rotate(22 298 88)"/>';
    const head = '<ellipse cx="200" cy="200" rx="150" ry="134"/>';
    const paw = '<path d="M238 410 C234 360 250 322 282 312 C314 302 338 324 334 356 L328 410 Z"/>';
    return `${shadow([tail, body, ears, head])}
      ${shape(tail, '#8C889C')}
      <path d="M300 110 C350 140 380 200 372 260 M268 150 C300 170 316 200 314 232" fill="none" stroke="#6E6A80" stroke-width="12" stroke-linecap="round"/>
      ${shape(body, '#A6A2B6')}
      <ellipse cx="200" cy="400" rx="80" ry="60" fill="#EDE8F2"/>
      ${shape(ears, '#A6A2B6')}
      <ellipse cx="104" cy="94" rx="18" ry="32" transform="rotate(-22 104 94)" fill="${C.pink}"/><ellipse cx="296" cy="94" rx="18" ry="32" transform="rotate(22 296 94)" fill="${C.pink}"/>
      ${shape(head, '#A6A2B6')}
      <ellipse cx="200" cy="262" rx="100" ry="68" fill="#EDE8F2"/>
      ${eye(m.eyes, 140, 196, 24, { lid: '#A6A2B6' })}${eye(m.eyes, 260, 196, 24, { lid: '#A6A2B6' })}
      ${blush([[96, 252], [304, 252]])}
      <path d="M180 236 Q200 226 220 236 Q208 258 200 258 Q192 258 180 236 Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M200 258 V 268" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      <rect x="185" y="268" width="30" height="26" rx="5" fill="#fff" stroke="${C.ink}" stroke-width="7"/><path d="M200 268 V 294" stroke="${C.ink}" stroke-width="5"/>
      ${m.snack ? `<ellipse cx="282" cy="292" rx="26" ry="30" fill="#D9954F" stroke="${C.ink}" stroke-width="8"/><path d="M252 282 Q282 246 312 282 Q282 292 252 282 Z" fill="#7A4E2A" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/><path d="M282 262 V 248" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` : ''}
      ${m.wave || m.snack ? `${shape(paw, '#A6A2B6')}<path d="M262 330 V 350 M286 320 V 342 M310 330 V 350" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` : ''}
      ${m.hearts ? heart(52, 300, 36) + heart(336, 300, 30) : ''}
      ${deco(m, 184, 96, 28, 222, 70, 20)}`;
  },
};

// ── More water birds.
const WATER = `<path d="M-10 296 Q40 282 90 296 T190 296 T290 296 T390 296 T490 296 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/><path d="M40 330 q20 -10 40 0 M180 346 q20 -10 40 0 M300 328 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>`;
const UP_RIGHT = (m) => `${m.hearts ? heart(300, 50, 46) + heart(352, 112, 30) : ''}${deco(m, 250, 64, 34, 292, 34, 22)}`;

// Small ducks and geese afloat (the mallard's pose).
const floater = (p) => ({
  tint: p.tint,
  tilt: 0,
  svg: (m) => {
    const bodyPath = 'M86 252 C86 200 170 186 250 192 C330 198 382 226 374 264 C366 304 300 316 220 314 C150 312 86 300 86 252 Z';
    const [hx, hy, rx, ry] = p.headAt ?? [126, 146, 58, 52];
    const head = `<ellipse cx="${hx}" cy="${hy}" rx="${rx}" ry="${ry}"/>`;
    return `${shadow([`<path d="${bodyPath}"/>`, head])}
      ${shape(`<path d="${bodyPath}"/>`, p.side)}
      <clipPath id="${p.id}-body"><path d="${bodyPath}"/></clipPath>
      <g clip-path="url(#${p.id}-body)">
        <path d="M70 180 C140 186 180 240 176 330 L70 330 Z" fill="${p.breast}"/>
        <path d="M330 190 L400 190 L400 330 L320 330 C340 290 344 240 330 190 Z" fill="${p.rear}"/>
        ${p.bodyMarks ?? ''}
      </g>
      <path d="${bodyPath}" fill="none" ${OL}/>
      ${shape(head, p.head)}
      <clipPath id="${p.id}-head">${head}</clipPath>
      <g clip-path="url(#${p.id}-head)">${p.headMarks ?? ''}</g>
      <ellipse cx="${hx}" cy="${hy}" rx="${rx}" ry="${ry}" fill="none" ${OL}/>
      ${p.neck ?? ''}
      ${eye(m.eyes, hx - 14, hy - 10, 15, { dark: true })}
      <ellipse cx="${hx + 14}" cy="${hy + 24}" rx="15" ry="9" fill="${C.pink}"/>
      <path d="${p.bill}" fill="${p.billColor}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${m.snack ? `<path d="M36 170 C32 186 42 196 36 212 M46 172 C48 188 58 194 56 210" fill="none" stroke="#3E8E4E" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${m.cut ? '' : WATER}
      ${UP_RIGHT(m)}`;
  },
});

ART.brant = floater({
  // A small sea goose: black head, neck and breast, a little white necklace.
  id: 'brant', tint: C.blueT,
  headAt: [122, 150, 50, 46],
  side: '#6E6A72', breast: '#2E2E44', rear: '#F4F2F0', head: '#2E2E44',
  bodyMarks: `<path d="M200 232 q14 10 28 0 M240 230 q14 10 28 0 M280 236 q14 10 28 0 M220 262 q14 10 28 0 M262 264 q14 10 28 0" fill="none" stroke="#A9A6AE" stroke-width="6" stroke-linecap="round"/>`,
  neck: '<path d="M150 190 C160 186 170 190 174 198 M146 200 C156 198 166 202 168 208" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>',
  bill: 'M76 150 C64 148 48 154 40 164 C52 170 66 170 80 166 Z', billColor: C.ink,
});

ART.bufflehead = floater({
  // Tiny duck with a big puffy head and a white patch behind the eye.
  id: 'bufflehead', tint: C.pinkT,
  headAt: [128, 142, 66, 60],
  side: '#F7F5F2', breast: '#F7F5F2', rear: '#2A2A3E', head: '#2A2A3E',
  bodyMarks: '<path d="M200 192 C260 190 330 196 360 214 L360 226 C320 216 260 214 200 214 Z" fill="#2A2A3E"/>',
  headMarks: '<path d="M134 104 C170 86 206 104 210 146 C200 180 176 188 154 170 C152 148 146 126 134 104 Z" fill="#F7F5F2"/><path d="M76 120 C90 96 118 86 140 90" fill="none" stroke="#7B4BB5" stroke-width="10" stroke-linecap="round"/><path d="M70 160 C76 178 90 190 104 196" fill="none" stroke="#2F8F7A" stroke-width="10" stroke-linecap="round"/>',
  bill: 'M66 150 C56 148 44 154 38 162 C48 168 60 168 70 164 Z', billColor: '#8FA0C0',
});

ART.swan = {
  // Afloat, wings arched over the back, long S neck, orange bill with a black knob.
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M110 262 C110 214 176 194 252 198 C340 204 386 240 378 276 C368 312 300 322 222 320 C154 318 110 306 110 262 Z"/>';
    const wing = '<path d="M176 226 C214 140 326 136 368 232 C320 246 236 246 176 226 Z"/>';
    const neckLine = 'M150 262 C114 214 158 170 152 128 C148 100 130 88 112 92';
    const head = '<ellipse cx="102" cy="94" rx="36" ry="27"/>';
    return `${shadow([body, wing, head, `<path d="${neckLine}" fill="none" stroke-width="40"/>`])}
      ${'' /* The neck's outline behind the body and its white fill on top: no seam where they meet. */}
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="42" stroke-linecap="round"/>
      ${shape(body, '#F7F5F2')}
      <path d="${neckLine}" fill="none" stroke="#F7F5F2" stroke-width="24" stroke-linecap="round"/>
      ${shape(wing, '#F7F5F2')}
      <path d="M220 214 C250 186 296 180 330 200 M238 230 C266 210 300 206 330 220" fill="none" stroke="#C9CCD6" stroke-width="7" stroke-linecap="round"/>
      ${shape(head, '#F7F5F2')}
      <path d="M78 84 L98 92 L80 102 Z" fill="${C.ink}"/>
      ${eye(m.eyes, 106, 88, 11, { lid: '#F7F5F2' })}
      <ellipse cx="118" cy="108" rx="12" ry="7" fill="${C.pink}"/>
      <path d="M74 92 C60 94 44 102 36 112 C48 118 64 116 78 110 Z" fill="#F2804A" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      <ellipse cx="80" cy="86" rx="10" ry="8" fill="${C.ink}"/>
      ${m.snack ? `<path d="M40 118 C36 134 46 144 40 160 M50 118 C52 134 62 140 60 156" fill="none" stroke="#3E8E4E" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${m.cut ? '' : WATER}
      ${UP_RIGHT(m)}`;
  },
};

ART.cormorantSpread = {
  // Standing on a post, wings spread out to dry.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    // Wings spread to dry: a curved leading edge and long feather tips along the trailing edge.
    const wingL = '<path d="M168 212 C132 170 74 150 22 166 L32 182 L16 194 L36 204 L24 220 L46 226 L38 244 L62 248 L60 268 L86 262 L94 282 L118 266 L172 254 Z"/>';
    const wingR = '<path d="M 232 212 C 268 170 326 150 378 166 L 368 182 L 384 194 L 364 204 L 376 220 L 354 226 L 362 244 L 338 248 L 340 268 L 314 262 L 306 282 L 282 266 L 228 254 Z"/>';
    const body = '<ellipse cx="200" cy="250" rx="58" ry="88"/>';
    const head = '<ellipse cx="170" cy="100" rx="40" ry="32"/>';
    const neckLine = 'M200 186 C196 156 186 132 176 112';
    return `${m.cut ? '' : `<rect x="168" y="322" width="64" height="100" fill="#9A6A44" stroke="${C.ink}" stroke-width="9"/><ellipse cx="200" cy="322" rx="32" ry="10" fill="#B9875E" stroke="${C.ink}" stroke-width="8"/>`}
      ${shadow([wingL, wingR, body, head])}
      ${shape(wingL, '#25253A')}${shape(wingR, '#25253A')}
      <path d="M40 200 q14 12 28 0 M80 190 q14 12 28 0 M120 196 q14 12 28 0 M60 236 q14 12 28 0 M100 232 q14 12 28 0 M252 196 q14 12 28 0 M292 190 q14 12 28 0 M332 200 q14 12 28 0 M272 232 q14 12 28 0 M312 236 q14 12 28 0" fill="none" stroke="#7A6A4A" stroke-width="5" stroke-linecap="round"/>
      ${shape(body, '#2A2A3E')}
      <path d="M186 330 L176 344 M214 330 L224 344" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="40" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="#2A2A3E" stroke-width="24" stroke-linecap="round"/>
      ${shape(head, '#2A2A3E')}
      <path d="M134 108 C140 122 152 128 164 124 C162 114 156 106 146 104 Z" fill="#F2994A"/>
      ${eye(m.eyes, 168, 92, 13, { ring: '#3BC4B4', lid: '#2A2A3E' })}
      <ellipse cx="190" cy="114" rx="11" ry="7" fill="${C.pink}"/>
      <path d="M140 90 C120 86 92 92 70 100 C66 110 72 116 80 112 C92 106 120 104 142 104 Z" fill="#6E6C80" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${m.snack ? droplet(62, 124) : ''}
      ${m.hearts ? heart(252, 26, 36) + heart(296, 64, 24) : ''}
      ${deco(m, 222, 44, 30, 258, 22, 20)}`;
  },
};

ART.cormorant = {
  shoulder: [0.5, 0.46],
  // Standing tall on a post, wings folded: long neck, hooked beak, orange face, a long stiff tail.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M172 166 C212 156 252 186 262 236 C270 282 250 312 214 316 C180 318 160 284 158 234 C156 198 160 174 172 166 Z"/>';
    const tail = '<path d="M238 298 L284 362 L264 370 L224 312 Z"/>';
    const wing = 'M196 180 C236 178 262 216 266 262 C268 288 254 306 234 312 C212 282 200 234 196 180 Z';
    const head = '<ellipse cx="160" cy="96" rx="34" ry="28"/>';
    const neckLine = 'M184 180 C168 150 192 126 168 104';
    return `${m.cut ? '' : `<rect x="168" y="322" width="64" height="100" fill="#9A6A44" stroke="${C.ink}" stroke-width="9"/><ellipse cx="200" cy="322" rx="32" ry="10" fill="#B9875E" stroke="${C.ink}" stroke-width="8"/>`}
      <path d="M200 312 L196 324 M220 312 L224 324" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
      ${shadow([tail, body, head])}
      ${shape(tail, '#25253A')}
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="40" stroke-linecap="round"/>
      ${shape(body, '#2A2A3E')}
      <path d="${wing}" fill="#3E3646" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M214 214 q12 8 24 0 M220 240 q12 8 24 0 M226 266 q12 8 24 0 M230 290 q10 6 20 0" fill="none" stroke="#8A7A5A" stroke-width="5" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="#2A2A3E" stroke-width="24" stroke-linecap="round"/>
      ${shape(head, '#2A2A3E')}
      <path d="M128 100 C134 116 148 122 160 118 C158 108 150 100 140 98 Z" fill="#F2994A"/>
      ${eye(m.eyes, 160, 90, 12, { ring: '#3BC4B4', lid: '#2A2A3E' })}
      <ellipse cx="180" cy="112" rx="10" ry="6" fill="${C.pink}"/>
      <path d="M134 88 C112 84 84 88 62 96 C58 104 64 110 72 106 C92 100 116 100 136 102 Z" fill="#6E6C80" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${m.snack ? droplet(56, 116) : ''}
      ${m.hearts ? heart(252, 26, 36) + heart(296, 64, 24) : ''}
      ${deco(m, 222, 44, 30, 258, 22, 20)}`;
  },
};

ART.heron = {
  shoulder: [0.5, 0.52],
  // Tall in the shallows: blue-gray, S neck, black head stripe and plume, dagger bill.
  tint: C.pinkT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M150 222 C150 182 210 162 270 168 C330 174 362 208 352 242 C342 272 292 286 232 282 C182 278 150 256 150 222 Z"/>';
    const tail = '<path d="M336 226 L386 252 L344 262 Z"/>';
    const head = '<ellipse cx="128" cy="92" rx="40" ry="30"/>';
    const neckLine = 'M176 210 C138 176 172 136 152 108';
    // Drawn a little smaller and to the right, so the long beak stays inside the circle.
    return `<g transform="translate(44 38) scale(0.84)">
      <path d="M222 276 L214 346 M252 278 L258 346" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
      <path d="M222 276 L214 346 M252 278 L258 346" stroke="#8A7356" stroke-width="7" stroke-linecap="round"/>
      ${shadow([tail, body, head])}
      ${shape(tail, '#5E6E8E')}
      ${'' /* The neck's outline goes behind the body, and its fill on top, so there's no line where they meet. */}
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="38" stroke-linecap="round"/>
      ${shape(body, '#7D8FAE')}
      <path d="M210 196 C256 182 312 190 340 222 C306 246 252 248 214 236 Z" fill="#5E6E8E"/>
      <path d="M170 236 C176 252 186 262 200 268 M184 232 C190 248 200 258 214 264" fill="none" stroke="#C9D3E3" stroke-width="7" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="#B8C3D6" stroke-width="22" stroke-linecap="round"/>
      <path d="M160 196 C148 180 150 160 156 144" fill="none" stroke="#5E4A3A" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 8"/>
      ${shape(head, '#F4F2F0')}
      <path d="M108 74 C130 66 160 70 168 82 C150 82 130 82 112 86 Z" fill="${C.ink}"/>
      <path d="M160 80 C186 78 210 86 228 100" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      ${eye(m.eyes, 118, 92, 12, { ring: '#F2E28C', lid: '#F4F2F0' })}
      <ellipse cx="140" cy="108" rx="12" ry="7" fill="${C.pink}"/>
      <path d="M96 88 C80 86 46 92 8 102 C46 108 80 108 98 102 Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${m.snack ? droplet(26, 118) : ''}
      </g>
      ${m.cut ? '' : `<path d="M-10 330 Q40 318 90 330 T190 330 T290 330 T390 330 T490 330 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/>
      <path d="M60 360 q20 -10 40 0 M260 366 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>`}
      ${UP_RIGHT(m)}`;
  },
};

// ── More mammals, and a turtle.
const SHOULDERS = '<path d="M30 430 C50 330 125 300 200 300 C275 300 350 330 370 430 Z"/>';

ART.opossum = {
  tint: C.pinkT,
  tilt: 5,
  svg: (m) => {
    const ears = '<circle cx="94" cy="96" r="44"/><circle cx="306" cy="96" r="44"/>';
    const head = '<ellipse cx="200" cy="196" rx="140" ry="120"/>';
    const hand = '<path d="M244 410 C238 364 252 330 282 322 C312 314 336 334 332 364 L326 410 Z"/>';
    return `${shadow([SHOULDERS, ears, head])}
      ${shape(SHOULDERS, '#A9A6AE')}
      <path d="M90 360 l10 -20 M130 340 l8 -18 M270 340 l8 -18 M310 356 l10 -20" stroke="#E8E6EA" stroke-width="6" stroke-linecap="round"/>
      ${shape(ears, '#2E2E44')}
      <g fill="#F4EDE4"><circle cx="80" cy="72" r="12"/><circle cx="320" cy="72" r="12"/></g>
      ${shape(head, '#F4F2F0')}
      <path d="M140 84 C170 70 230 70 260 84 C240 110 220 140 200 170 C180 140 160 110 140 84 Z" fill="#C9C6CE"/>
      <g fill="#DAD7DE"><ellipse cx="140" cy="196" rx="36" ry="30"/><ellipse cx="260" cy="196" rx="36" ry="30"/></g>
      <path d="M146 224 C150 270 176 312 200 326 C224 312 250 270 254 224" fill="#F7F5F2" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${eye(m.eyes, 140, 196, 22, { lid: '#DAD7DE' })}${eye(m.eyes, 260, 196, 22, { lid: '#DAD7DE' })}
      ${blush([[100, 250], [300, 250]])}
      <ellipse cx="200" cy="318" rx="22" ry="15" fill="#F2A0B0" stroke="${C.ink}" stroke-width="7"/><circle cx="193" cy="313" r="4" fill="#fff"/>
      <path d="M168 290 L118 280 M172 304 L122 306 M232 290 L282 280 M228 304 L278 306" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
      ${m.snack ? `<g fill="#7B4BB5" stroke="${C.ink}" stroke-width="6"><circle cx="270" cy="290" r="14"/><circle cx="294" cy="290" r="14"/><circle cx="282" cy="310" r="14"/></g><path d="M282 276 C284 264 292 256 302 252" fill="none" stroke="#3E8E4E" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${m.wave || m.snack ? `${shape(hand, '#F2B8C6')}<path d="M262 334 V316 M282 326 V306 M302 328 V308 M320 338 V320" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>` : ''}
      ${m.hearts ? heart(52, 300, 36) + heart(342, 292, 30) : ''}
      ${deco(m, 184, 100, 28, 222, 74, 20)}`;
  },
};

ART.deer = {
  tint: C.yellowT,
  tilt: -4,
  svg: (m) => {
    const ears = '<ellipse cx="76" cy="142" rx="62" ry="30" transform="rotate(-24 76 142)"/><ellipse cx="324" cy="142" rx="62" ry="30" transform="rotate(24 324 142)"/>';
    const head = '<path d="M200 56 C280 56 314 120 306 190 C298 250 256 296 236 330 C224 346 176 346 164 330 C144 296 102 250 94 190 C86 120 120 56 200 56 Z"/>';
    return `${shadow([SHOULDERS, ears, head])}
      ${shape(SHOULDERS, '#A9784E')}
      <path d="M150 312 C170 340 230 340 250 312 L240 300 L160 300 Z" fill="#F4EDE4"/>
      ${shape(ears, '#B9875E')}
      <ellipse cx="80" cy="144" rx="40" ry="16" transform="rotate(-24 80 144)" fill="#F4EDE4"/><ellipse cx="320" cy="144" rx="40" ry="16" transform="rotate(24 320 144)" fill="#F4EDE4"/>
      ${shape(head, '#B9875E')}
      <path d="M150 80 C180 70 220 70 250 80 C236 120 218 150 200 170 C182 150 164 120 150 80 Z" fill="#9A6E48"/>
      <path d="M150 256 C150 300 170 334 200 338 C230 334 250 300 250 256 C232 246 168 246 150 256 Z" fill="#E8D2B8"/>
      ${eye(m.eyes, 138, 178, 22, { ring: '#F4EDE4', lid: '#B9875E' })}${eye(m.eyes, 262, 178, 22, { ring: '#F4EDE4', lid: '#B9875E' })}
      <path d="M108 156 l-10 -10 M116 150 l-6 -12 M292 156 l10 -10 M284 150 l6 -12" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${blush([[118, 232], [282, 232]])}
      <ellipse cx="200" cy="300" rx="26" ry="18" fill="${C.ink}"/><circle cx="191" cy="294" r="6" fill="#fff"/>
      <path d="M200 318 V326 M186 330 Q200 338 214 330" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      ${m.snack ? `<path d="M212 330 C238 316 270 318 286 336 C264 350 234 348 212 330 Z" fill="#7FBF5A" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M216 332 C242 328 264 330 282 336" fill="none" stroke="#3E8E4E" stroke-width="4"/>` : ''}
      ${m.hearts ? heart(52, 300, 36) + heart(340, 292, 30) : ''}
      ${deco(m, 184, 100, 28, 222, 74, 20)}`;
  },
};

ART.groundhog = {
  tint: C.blueT,
  tilt: 4,
  svg: (m) => {
    const ears = '<circle cx="104" cy="110" r="30"/><circle cx="296" cy="110" r="30"/>';
    const head = '<ellipse cx="200" cy="206" rx="148" ry="128"/>';
    const paw = '<path d="M244 410 C238 364 252 330 282 322 C312 314 336 334 332 364 L326 410 Z"/>';
    return `${shadow([SHOULDERS, ears, head])}
      ${shape(SHOULDERS, '#8A5E40')}
      <ellipse cx="200" cy="400" rx="84" ry="60" fill="#C9A884"/>
      ${shape(ears, '#7A5236')}
      <g fill="#C9A884"><circle cx="104" cy="114" r="14"/><circle cx="296" cy="114" r="14"/></g>
      ${shape(head, '#9A6E48')}
      <path d="M100 120 C140 90 260 90 300 120 C270 130 230 132 200 132 C170 132 130 130 100 120 Z" fill="#6E4A30"/>
      <ellipse cx="200" cy="268" rx="104" ry="68" fill="#D9C2A6"/>
      ${eye(m.eyes, 142, 196, 22, { lid: '#9A6E48' })}${eye(m.eyes, 258, 196, 22, { lid: '#9A6E48' })}
      ${blush([[94, 254], [306, 254]])}
      <ellipse cx="200" cy="240" rx="22" ry="15" fill="${C.ink}"/><circle cx="193" cy="235" r="5" fill="#fff"/>
      <path d="M200 255 V266" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <rect x="183" y="266" width="34" height="30" rx="6" fill="#F7F0E0" stroke="${C.ink}" stroke-width="7"/><path d="M200 266 V296" stroke="${C.ink}" stroke-width="5"/>
      ${m.snack ? `<path d="M282 330 V262" stroke="#3E8E4E" stroke-width="7" stroke-linecap="round"/><g fill="#F2D23C" stroke="${C.ink}" stroke-width="5">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${282 + 14 * Math.cos((a * Math.PI) / 180)}" cy="${250 + 14 * Math.sin((a * Math.PI) / 180)}" rx="11" ry="7" transform="rotate(${a} ${282 + 14 * Math.cos((a * Math.PI) / 180)} ${250 + 14 * Math.sin((a * Math.PI) / 180)})"/>`).join('')}</g><circle cx="282" cy="250" r="9" fill="#E8A23C" stroke="${C.ink}" stroke-width="5"/>` : ''}
      ${m.wave || m.snack ? `${shape(paw, '#6E4A30')}<path d="M262 330 l-4 -14 M282 322 l0 -16 M302 324 l4 -14" stroke="#F4EDE4" stroke-width="6" stroke-linecap="round"/>` : ''}
      ${m.hearts ? heart(52, 300, 36) + heart(342, 292, 30) : ''}
      ${deco(m, 184, 104, 28, 222, 78, 20)}`;
  },
};

ART.turtle = {
  // A red-eared pond slider sunning on a log.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const shell = '<path d="M108 292 C108 200 176 160 246 160 C316 160 368 208 368 292 Z"/>';
    const head = '<ellipse cx="80" cy="236" rx="46" ry="34"/>';
    const neck = '<path d="M96 262 C110 270 128 280 140 290 L150 260 C134 250 118 240 104 234 Z"/>';
    return `${m.cut ? '' : `<path d="M-10 336 Q40 324 90 336 T190 336 T290 336 T390 336 T490 336 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/>
      <rect x="-20" y="288" width="440" height="52" rx="26" fill="#9A6A44" stroke="${C.ink}" stroke-width="9"/>
      <path d="M40 304 H140 M220 320 H330" stroke="#7A4E2A" stroke-width="6" stroke-linecap="round"/>`}
      ${shadow([shell, head, neck])}
      <g fill="#7A8E52" stroke="${C.ink}" stroke-width="9" stroke-linejoin="round"><ellipse cx="146" cy="294" rx="26" ry="16"/><ellipse cx="330" cy="294" rx="26" ry="16"/><path d="M364 284 L392 296 L362 300 Z"/></g>
      ${shape(neck, '#7A8E52')}
      ${shape(shell, '#6E8E4A')}
      <path d="M176 292 C170 236 190 196 246 190 C302 196 322 236 316 292 M246 190 V292 M176 240 H316" fill="none" stroke="#4E6E3A" stroke-width="7"/>
      <path d="M118 286 C180 280 300 280 360 286" fill="none" stroke="#E8D26A" stroke-width="9" stroke-linecap="round"/>
      ${shape(head, '#7A8E52')}
      <path d="M92 222 C108 220 120 226 126 236" fill="none" stroke="#E5484D" stroke-width="12" stroke-linecap="round"/>
      <path d="M50 252 C70 260 96 262 118 256 M104 270 C118 276 132 282 142 288" fill="none" stroke="#E8D26A" stroke-width="6" stroke-linecap="round"/>
      ${eye(m.eyes, 66, 228, 13, { ring: '#E8D26A', lid: '#7A8E52' })}
      <ellipse cx="78" cy="252" rx="11" ry="6" fill="${C.pink}"/>
      <path d="M40 250 Q52 258 64 254" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${m.snack ? `<path d="M30 254 C20 268 24 284 38 288 C48 276 46 262 30 254 Z" fill="#7FBF5A" stroke="${C.ink}" stroke-width="5"/>` : ''}
      ${UP_RIGHT(m)}`;
  },
};

// ── Bugs: big eyes, little feelers.
const feelers = (paths, ball = true) => `<path d="${paths.join(' ')}" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>${ball ? paths.map((d) => { const pts = d.trim().split(/[ ,]+/); return `<circle cx="${pts[pts.length - 2]}" cy="${pts[pts.length - 1]}" r="7" fill="${C.ink}"/>`; }).join('') : ''}`;
const nectar = (x, y) => `<path d="M${x} ${y - 16} C${x + 12} ${y} ${x + 12} ${y + 10} ${x} ${y + 12} C${x - 12} ${y + 10} ${x - 12} ${y} ${x} ${y - 16} Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="5"/>`;
const FLOWER = `<g stroke="${C.ink}" stroke-width="7">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${200 + 46 * Math.cos((a * Math.PI) / 180)}" cy="${352 + 30 * Math.sin((a * Math.PI) / 180)}" rx="42" ry="24" fill="#FF8FB0" transform="rotate(${a} ${200 + 46 * Math.cos((a * Math.PI) / 180)} ${352 + 30 * Math.sin((a * Math.PI) / 180)})"/>`).join('')}<circle cx="200" cy="352" r="28" fill="#F2C94C"/></g>`;

const bee = (p) => ({
  tint: p.tint,
  tilt: 0,
  svg: (m) => {
    const abd = `<ellipse cx="270" cy="226" rx="${p.abd[0]}" ry="${p.abd[1]}"/>`;
    const thorax = '<circle cx="186" cy="204" r="52"/>';
    const head = '<circle cx="116" cy="200" r="54"/>';
    const wings = '<ellipse cx="206" cy="122" rx="52" ry="30" transform="rotate(-32 206 122)"/><ellipse cx="252" cy="140" rx="44" ry="26" transform="rotate(-12 252 140)"/>';
    return `${m.cut ? '' : FLOWER}
      <path d="M168 252 L158 300 M196 256 L198 302 M224 252 L240 296" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
      ${shadow([abd, thorax, head])}
      ${shape(abd, p.abdColor)}
      <clipPath id="${p.id}-abd">${abd}</clipPath>
      <g clip-path="url(#${p.id}-abd)">${p.abdMarks}</g>
      ${abd.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(thorax, p.thorax)}
      <path d="M156 176 l-6 -10 M176 166 l0 -12 M200 166 l4 -12 M222 178 l8 -8" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      <g fill="#EAF2FF" stroke="${C.ink}" stroke-width="6">${wings}</g>
      ${shape(head, p.head)}
      ${feelers(['M98 152 C88 114 70 100 54 96', 'M128 148 C128 108 118 88 104 78'])}
      ${eye(m.eyes, 96, 194, 17, { dark: true })}${eye(m.eyes, 140, 190, 17, { dark: true })}
      <ellipse cx="116" cy="230" rx="13" ry="8" fill="${C.pink}"/>
      ${m.snack ? nectar(70, 236) : ''}
      ${UP_RIGHT(m)}`;
  },
});

ART.bumblebee = bee({
  id: 'bumblebee', tint: C.blueT, abd: [88, 76],
  abdColor: '#F2D23C', thorax: '#F2D23C', head: C.ink,
  abdMarks: `<rect x="236" y="140" width="34" height="180" fill="${C.ink}"/><rect x="306" y="140" width="80" height="180" fill="${C.ink}"/>`,
});
ART.honeybee = bee({
  id: 'honeybee', tint: C.yellowT, abd: [86, 54],
  abdColor: '#E8A23C', thorax: '#9A6A44', head: '#4A3422',
  abdMarks: '<rect x="226" y="160" width="20" height="140" fill="#4A3422"/><rect x="268" y="160" width="20" height="140" fill="#4A3422"/><rect x="310" y="160" width="20" height="140" fill="#4A3422"/><rect x="346" y="160" width="40" height="140" fill="#4A3422"/>',
});
ART.carpenterbee = bee({
  id: 'carpenterbee', tint: C.pinkT, abd: [90, 66],
  abdColor: '#2A2A3E', thorax: '#F2D23C', head: C.ink,
  abdMarks: '<path d="M226 190 C260 172 300 172 330 186" fill="none" stroke="#6E8BE0" stroke-width="12" stroke-linecap="round"/>',
});

ART.monarch = {
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const upL = '<path d="M194 196 C150 116 70 84 38 126 C18 166 58 218 194 224 Z"/>';
    const upR = '<path d="M206 196 C250 116 330 84 362 126 C382 166 342 218 206 224 Z"/>';
    const loL = '<path d="M194 230 C120 232 68 262 78 302 C94 342 160 332 194 262 Z"/>';
    const loR = '<path d="M206 230 C280 232 332 262 322 302 C306 342 240 332 206 262 Z"/>';
    const wings = [upL, upR, loL, loR];
    return `${m.cut ? '' : `<g fill="#F2A0C8" stroke="${C.ink}" stroke-width="6">${[[170, 360], [200, 350], [230, 360], [185, 380], [215, 380], [200, 372]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14"/>`).join('')}</g>`}
      ${shadow(wings)}
      <g fill="${C.ink}" stroke="${C.ink}" stroke-width="16" stroke-linejoin="round">${wings.join('')}</g>
      <g fill="#F28C28">${wings.join('')}</g>
      <path d="M190 210 L64 132 M190 214 L84 200 M190 238 L102 292 M190 246 L150 320 M210 210 L336 132 M210 214 L316 200 M210 238 L298 292 M210 246 L250 320" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${dots([[50, 140], [44, 168], [62, 198], [86, 302], [104, 324], [134, 330], [350, 140], [356, 168], [338, 198], [314, 302], [296, 324], [266, 330]], 5, '#F7F5F2')}
      <ellipse cx="200" cy="246" rx="16" ry="68" fill="${C.ink}"/>${dots([[200, 214], [200, 240], [200, 266]], 4, '#F7F5F2')}
      ${shape('<circle cx="200" cy="152" r="40"/>', C.ink)}
      ${feelers(['M188 116 C178 82 166 66 146 60', 'M212 116 C222 82 234 66 254 60'])}
      ${eye(m.eyes, 184, 150, 14, { dark: true })}${eye(m.eyes, 216, 150, 14, { dark: true })}
      <ellipse cx="176" cy="174" rx="9" ry="6" fill="${C.pink}"/><ellipse cx="224" cy="174" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? nectar(200, 206) : ''}
      ${m.hearts ? heart(296, 46, 28) + heart(84, 60, 22) : ''}
      ${deco(m, 236, 70, 24, 262, 50, 16)}`;
  },
};

ART.moth = {
  // A fluffy pink-and-yellow moth (like the rosy maple moth) with feathery feelers.
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const upL = '<path d="M194 186 C140 126 60 126 44 186 C40 236 120 246 194 232 Z"/>';
    const upR = '<path d="M206 186 C260 126 340 126 356 186 C360 236 280 246 206 232 Z"/>';
    const loL = '<path d="M194 238 C140 248 80 278 96 318 C120 348 170 318 194 278 Z"/>';
    const loR = '<path d="M206 238 C260 248 320 278 304 318 C280 348 230 318 206 278 Z"/>';
    const feather = (d, flip) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>${[0, 1, 2, 3].map((i) => { const x = flip ? 214 + i * 12 : 186 - i * 12; const y = 118 - i * 12; return `<path d="M${x} ${y} l${flip ? 10 : -10} -2 M${x} ${y} l${flip ? 4 : -4} -10" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`; }).join('')}`;
    return `${m.cut ? '' : `<circle cx="330" cy="70" r="34" fill="#FFF4C7" stroke="${C.ink}" stroke-width="7"/>`}
      ${shadow([upL, upR, loL, loR])}
      ${shape(loL + loR, '#F7D55A')}
      ${shape(upL + upR, '#F2A0B8')}
      <path d="M70 190 C110 178 160 186 190 206 M330 190 C290 178 240 186 210 206" fill="none" stroke="#F7D55A" stroke-width="16" stroke-linecap="round"/>
      ${shape('<ellipse cx="200" cy="252" rx="26" ry="72"/>', '#F7D55A')}
      <path d="M184 220 q16 8 32 0 M184 250 q16 8 32 0 M184 280 q16 8 32 0" fill="none" stroke="#E0B83A" stroke-width="5" stroke-linecap="round"/>
      ${feather('M188 126 C170 92 150 76 128 72', false)}${feather('M212 126 C230 92 250 76 272 72', true)}
      ${shape('<circle cx="200" cy="162" r="44"/>', '#F7D55A')}
      <path d="M160 190 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0" fill="#F7F5F2" stroke="${C.ink}" stroke-width="5"/>
      ${eye(m.eyes, 182, 158, 15, { lid: '#F7D55A' })}${eye(m.eyes, 218, 158, 15, { lid: '#F7D55A' })}
      <ellipse cx="172" cy="180" rx="9" ry="6" fill="${C.pink}"/><ellipse cx="228" cy="180" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? nectar(200, 222) : ''}
      ${m.hearts ? heart(84, 64, 26) + heart(120, 40, 18) : ''}
      ${deco(m, 84, 62, 24, 114, 42, 16)}`;
  },
};

ART.firefly = {
  tint: C.blueT,
  tilt: -6,
  svg: (m) => {
    const abd = '<ellipse cx="250" cy="240" rx="92" ry="40"/>';
    const head = '<circle cx="108" cy="228" r="34"/>';
    const shield = '<ellipse cx="152" cy="214" rx="40" ry="34"/>';
    return `<circle cx="320" cy="250" r="78" fill="#FFF4A8"/><circle cx="320" cy="250" r="52" fill="#FFE97A"/>
      <path d="M180 270 L170 300 M220 276 L216 306 M260 276 L266 306" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      ${shadow([abd, head, shield])}
      ${shape(abd, '#2E2E44')}
      <clipPath id="firefly-abd">${abd}</clipPath>
      <g clip-path="url(#firefly-abd)"><rect x="294" y="190" width="60" height="100" fill="#FFE45C"/></g>
      ${abd.replace('/>', ` fill="none" ${OL}/>`)}
      <path d="M150 208 C200 186 282 192 322 218 C282 236 200 240 150 230 Z" fill="#3B3A50" stroke="#E8D26A" stroke-width="6" stroke-linejoin="round"/>
      ${shape(head, C.ink)}
      ${shape(shield, '#E8603C')}
      <ellipse cx="156" cy="212" rx="14" ry="11" fill="${C.ink}"/><ellipse cx="140" cy="204" rx="6" ry="4" fill="#F2C94C"/>
      ${feelers(['M96 200 C78 168 58 158 38 156', 'M112 196 C104 158 90 144 72 138'], false)}
      ${eye(m.eyes, 94, 228, 12, { dark: true })}${eye(m.eyes, 120, 224, 12, { dark: true })}
      <ellipse cx="108" cy="250" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? `<path d="M64 250 C70 262 70 270 64 274 C58 270 58 262 64 250 Z" fill="#B4D6F2" stroke="${C.ink}" stroke-width="4"/>` : ''}
      ${m.hearts ? heart(80, 70, 34) + heart(124, 44, 22) : ''}
      ${deco(m, 76, 76, 28, 112, 50, 18)}`;
  },
};

ART.dasher = {
  // Blue dasher dragonfly, from above: huge green eyes, powder-blue tail.
  tint: C.yellowT,
  tilt: -8,
  svg: (m) => {
    const wings = '<ellipse cx="110" cy="146" rx="96" ry="20" transform="rotate(-6 110 146)"/><ellipse cx="290" cy="146" rx="96" ry="20" transform="rotate(6 290 146)"/><ellipse cx="114" cy="182" rx="90" ry="20" transform="rotate(8 114 182)"/><ellipse cx="286" cy="182" rx="90" ry="20" transform="rotate(-8 286 182)"/>';
    const abd = '<rect x="188" y="170" width="24" height="206" rx="12"/>';
    return `<g fill="#EAF2FF" stroke="${C.ink}" stroke-width="6">${wings}</g>
      <path d="M30 148 H190 M210 148 H370 M40 184 H190 M210 184 H360" stroke="#B4C3D6" stroke-width="3"/>
      <g fill="${C.ink}"><ellipse cx="22" cy="140" rx="8" ry="5"/><ellipse cx="378" cy="140" rx="8" ry="5"/><ellipse cx="30" cy="192" rx="8" ry="5"/><ellipse cx="370" cy="192" rx="8" ry="5"/></g>
      ${shadow([abd, '<ellipse cx="200" cy="150" rx="28" ry="32"/>', '<circle cx="200" cy="96" r="44"/>'])}
      ${shape(abd, '#7FB0E0')}
      <path d="M190 220 H210 M190 250 H210 M190 280 H210 M190 310 H210" stroke="#5E8EC0" stroke-width="4"/>
      <rect x="188" y="340" width="24" height="36" rx="12" fill="${C.ink}"/>
      ${shape('<ellipse cx="200" cy="150" rx="28" ry="32"/>', '#5E7A5A')}
      <path d="M186 136 L214 136 M184 156 L216 156" stroke="#E8D26A" stroke-width="6" stroke-linecap="round"/>
      ${shape('<circle cx="200" cy="96" r="44"/>', '#E8D26A')}
      ${eye(m.eyes, 176, 84, 18, { ring: '#3BB58A', lid: '#3BB58A' })}${eye(m.eyes, 224, 84, 18, { ring: '#3BB58A', lid: '#3BB58A' })}
      <ellipse cx="182" cy="118" rx="8" ry="5" fill="${C.pink}"/><ellipse cx="218" cy="118" rx="8" ry="5" fill="${C.pink}"/>
      <path d="M192 122 Q200 128 208 122" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
      ${m.snack ? droplet(252, 116, 0.8) : ''}
      ${m.hearts ? heart(300, 40, 36) + heart(344, 92, 24) : ''}
      ${deco(m, 260, 60, 26, 292, 40, 16)}`;
  },
};

ART.milkweedbug = {
  tint: C.pinkT,
  tilt: 8,
  svg: (m) => {
    const body = '<ellipse cx="200" cy="246" rx="80" ry="108"/>';
    return `${m.cut ? '' : `<path d="M60 420 C40 300 120 140 240 120 C340 110 400 200 380 420 Z" fill="#7FBF5A" stroke="${C.ink}" stroke-width="8"/><path d="M110 400 C150 300 220 200 320 150" fill="none" stroke="#3E8E4E" stroke-width="6"/>`}
      <path d="M130 200 L80 180 M126 250 L70 254 M134 300 L86 330 M270 200 L320 180 M274 250 L330 254 M266 300 L314 330" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
      ${shadow([body, '<circle cx="200" cy="112" r="40"/>'])}
      ${shape(body, '#F28C28')}
      <clipPath id="mwb-body">${body}</clipPath>
      <g clip-path="url(#mwb-body)"><path d="M110 210 L200 250 L290 210 L290 236 L200 290 L110 236 Z" fill="${C.ink}"/><path d="M110 310 L200 330 L290 310 L290 380 L110 380 Z" fill="${C.ink}"/><path d="M200 160 V250" stroke="${C.ink}" stroke-width="5"/></g>
      ${body.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape('<ellipse cx="200" cy="156" rx="56" ry="26"/>', '#F28C28')}
      <g fill="${C.ink}"><ellipse cx="180" cy="156" rx="12" ry="9"/><ellipse cx="220" cy="156" rx="12" ry="9"/></g>
      ${shape('<circle cx="200" cy="112" r="40"/>', C.ink)}
      ${feelers(['M188 78 C176 46 160 30 136 22', 'M212 78 C224 46 240 30 264 22'], false)}
      ${eye(m.eyes, 184, 108, 13, { dark: true })}${eye(m.eyes, 216, 108, 13, { dark: true })}
      <ellipse cx="200" cy="132" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? `<path d="M120 100 C110 110 112 126 122 128 C132 126 134 110 120 100 Z" fill="#8A5A3A" stroke="${C.ink}" stroke-width="5"/><path d="M120 100 C112 84 100 76 90 74 M120 100 C120 84 116 70 110 62 M120 100 C128 86 134 74 142 68" fill="none" stroke="#F7F5F2" stroke-width="4" stroke-linecap="round"/>` : ''}
      ${m.hearts ? heart(300, 50, 36) + heart(340, 104, 24) : ''}
      ${deco(m, 262, 62, 26, 294, 42, 16)}`;
  },
};

ART.orbweaver = {
  // A friendly round spider at the middle of her web.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const abd = '<circle cx="200" cy="250" r="78"/>';
    const ceph = '<circle cx="200" cy="152" r="42"/>';
    const legs = 'M170 150 C120 110 90 100 60 60 M164 166 C110 150 70 150 30 130 M164 184 C110 200 74 220 40 260 M172 200 C130 240 110 270 90 320 M230 150 C280 110 310 100 340 60 M236 166 C290 150 330 150 370 130 M236 184 C290 200 326 220 360 260 M228 200 C270 240 290 270 310 320';
    return `${m.cut ? '' : `<g fill="none" stroke="#C9C1B4" stroke-width="3">${[0, 30, 60, 90, 120, 150].map((a) => `<path d="M${200 - 260 * Math.cos((a * Math.PI) / 180)} ${200 - 260 * Math.sin((a * Math.PI) / 180)} L${200 + 260 * Math.cos((a * Math.PI) / 180)} ${200 + 260 * Math.sin((a * Math.PI) / 180)}"/>`).join('')}${[50, 90, 130, 170].map((r) => `<circle cx="200" cy="200" r="${r}"/>`).join('')}</g>
      <path d="M200 -10 V110" stroke="#C9C1B4" stroke-width="3"/>`}
      <path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${legs}" fill="none" stroke="#B88A5E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="14 8"/>
      ${shadow([abd, ceph])}
      ${shape(abd, '#C9A06A')}
      <path d="M200 192 C240 220 240 290 200 316 C160 290 160 220 200 192 Z" fill="#8A6A44"/>
      ${dots([[200, 210], [178, 246], [222, 246], [190, 286], [210, 286]], 6, '#F7F5F2')}
      ${shape(ceph, '#B88A5E')}
      ${dots([[188, 122], [200, 118], [212, 122]], 4, C.ink)}
      ${eye(m.eyes, 184, 150, 13, { lid: '#B88A5E' })}${eye(m.eyes, 216, 150, 13, { lid: '#B88A5E' })}
      <ellipse cx="200" cy="176" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? droplet(200, 214) : ''}
      ${m.hearts ? heart(290, 52, 32) + heart(80, 60, 26) : ''}
      ${deco(m, 256, 56, 26, 288, 36, 16)}`;
  },
};

// ── Hawks up close: a big hooked beak and a heavy brow make the stare.
const raptorSelfie = (p) => ({
  tint: p.tint,
  tilt: p.tilt ?? -4,
  svg: (m) => {
    const head = '<ellipse cx="200" cy="182" rx="142" ry="132"/>';
    const look = { ring: p.eyeRing, lid: p.head };
    return `${shadow([SHOULDERS, head])}
      ${shape(SHOULDERS, p.chest)}
      <clipPath id="${p.id}-chest">${SHOULDERS}</clipPath>
      <g clip-path="url(#${p.id}-chest)">${p.chestMarks ?? ''}</g>
      ${SHOULDERS.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(head, p.head)}
      <clipPath id="${p.id}-face">${head}</clipPath>
      <g clip-path="url(#${p.id}-face)">${p.headMarks ?? ''}</g>
      <ellipse cx="200" cy="182" rx="142" ry="132" fill="none" ${OL}/>
      ${eye(m.eyes, 140, 186, 24, look)}${eye(m.eyes, 260, 186, 24, look)}
      <path d="M84 150 L180 170 L176 186 L90 168 Z M316 150 L220 170 L224 186 L310 168 Z" fill="${p.brow}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      ${blush([[104, 240], [296, 240]])}
      <path d="M168 204 Q200 190 232 204 L228 222 Q200 212 172 222 Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M172 220 Q200 210 228 220 C230 256 216 284 200 300 C190 290 182 276 178 262 C174 248 170 234 172 220 Z" fill="${p.beak}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M190 228 C190 250 194 266 200 280" fill="none" stroke="#8A8A9A" stroke-width="5" stroke-linecap="round"/>
      ${m.snack ? feather(250, 290) : ''}
      ${m.hearts ? heart(334, 54, 40) + heart(68, 84, 28) : ''}
      ${deco(m, 240, 70, 28, 278, 46, 20)}`;
  },
});

ART.redtail = raptorSelfie({
  id: 'redtail', tint: C.yellowT,
  head: '#8A5E40', chest: '#F4EDE4', brow: '#5E3E28', beak: '#4E4E5E',
  chestMarks: dots([[110, 380], [140, 392], [170, 398], [230, 398], [260, 392], [290, 380], [126, 410], [274, 410]], 9, '#6A4630'),
  headMarks: '<ellipse cx="200" cy="296" rx="70" ry="46" fill="#F4EDE4"/><path d="M80 120 C120 96 280 96 320 120" fill="none" stroke="#B9946E" stroke-width="10" stroke-linecap="round"/>',
});

ART.coopers = raptorSelfie({
  id: 'coopers', tint: C.blueT, eyeRing: '#E5484D',
  head: '#C9B8AE', chest: '#F4EDE4', brow: '#3B4256', beak: '#3B3A50',
  chestMarks: `<path d="M60 360 H340 M50 384 H350 M44 408 H356" stroke="#D9774A" stroke-width="10" stroke-linecap="round"/>`,
  headMarks: '<path d="M40 40 H360 V150 C300 132 250 128 200 128 C150 128 100 132 40 150 Z" fill="#3B4256"/>',
});

ART.peregrine = raptorSelfie({
  id: 'peregrine', tint: C.yellowT, eyeRing: '#F2C94C',
  head: '#F4F2F0', chest: '#F4F2F0', brow: C.ink, beak: '#3B3A50',
  chestMarks: `<path d="M70 380 H330 M60 404 H340" stroke="#3B4256" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 10"/>`,
  headMarks: `<path d="M40 40 H360 V150 C300 138 250 146 200 146 C150 146 100 138 40 150 Z" fill="${C.ink}"/><path d="M40 150 C62 172 72 204 78 250 L40 250 Z M360 150 C338 172 328 204 322 250 L360 250 Z" fill="${C.ink}"/><path d="M112 212 C112 240 116 266 110 296 L148 288 C152 262 152 236 146 212 Z M288 212 C288 240 284 266 290 296 L252 288 C248 262 248 236 254 212 Z" fill="${C.ink}"/>`,
  tilt: 4,
});

// Perched hawks, for close-up scenes (their stickers are face close-ups).
// Hawks perched for close-up scenes: tall and upright, a small flat-topped head with a
// heavy brow (the glare), a hooked beak, a barred chest, a long banded tail hanging
// below the perch, and strong yellow legs gripping it. Feet at y = 330.
const hawkPerched = (p) => ({
  tint: 'none',
  tilt: 0,
  shoulder: [0.56, 0.34],
  svg: (m) => {
    const tail = '<path d="M206 286 L258 284 L262 398 L216 398 Z"/>';
    const bodyPath = 'M150 156 C150 112 192 94 232 102 C278 112 294 164 290 228 C286 274 262 300 222 304 C184 306 158 282 152 240 Z';
    const body = `<path d="${bodyPath}"/>`;
    const wing = '<path d="M236 112 C282 122 300 174 296 240 C292 280 272 300 252 308 C236 270 230 200 236 112 Z"/>';
    const headPath = 'M106 98 C106 66 140 50 174 54 C204 58 218 80 214 106 C210 134 186 148 158 148 C128 148 106 128 106 98 Z';
    const head = `<path d="${headPath}"/>`;
    const legs = 'M202 290 L198 330 M234 292 L240 330';
    const talons = 'M182 336 Q190 324 198 330 Q206 324 214 336 M226 336 Q234 324 240 330 Q248 324 256 336';
    return `${shadow([tail, body, wing, head])}
      ${shape(tail, p.tail)}
      <clipPath id="${p.id}-tail">${tail}</clipPath>
      <g clip-path="url(#${p.id}-tail)">${[316, 344, 372].map((y) => `<rect x="200" y="${y}" width="70" height="9" fill="${p.tailBand}"/>`).join('')}</g>
      ${tail.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(body, p.chest)}
      <clipPath id="${p.id}-body">${body}</clipPath>
      <g clip-path="url(#${p.id}-body)">${p.chestMarks}</g>
      <path d="${bodyPath}" fill="none" ${OL}/>
      ${shape(wing, p.wing)}
      <path d="M252 170 C266 200 274 240 272 290 M266 150 C280 186 286 230 284 280" fill="none" stroke="${p.wingLine}" stroke-width="6" stroke-linecap="round"/>
      ${shape(head, p.head)}
      <clipPath id="${p.id}-head">${head}</clipPath>
      <g clip-path="url(#${p.id}-head)">${p.headMarks ?? ''}</g>
      <path d="${headPath}" fill="none" ${OL}/>
      ${eye(m.eyes, 140, 96, 11, { ring: p.eyeRing, lid: p.head })}
      ${'' /* The heavy brow cuts across the top of the eye: that's the glare. */}
      <path d="M118 88 C132 76 152 74 172 80 L168 92 C152 86 134 88 124 96 Z" fill="${p.brow}"/>
      <path d="M110 100 C98 96 84 104 80 120 C80 130 86 134 92 130 C92 122 98 118 110 120 Z" fill="#3B3A50" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M112 98 C106 98 102 104 104 114 L112 118 Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="4"/>
      <path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
      <path d="${legs}" fill="none" stroke="#F2C94C" stroke-width="9" stroke-linecap="round"/>
      <path d="${talons}" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      ${m.snack ? feather(60, 150) : ''}
      ${m.hearts ? heart(300, 40, 40) + heart(60, 40, 26) : ''}
      ${deco(m, 220, 40, 28, 256, 20, 18)}`;
  },
});

const bars = (color, from = 170, step = 18, w = 7) => Array.from({ length: 9 }, (_, i) => `<path d="M140 ${from + i * step} q20 -6 40 0 q20 6 40 0 q20 -6 40 0" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`).join('');

ART.redtailBody = hawkPerched({
  id: 'redtailp', head: '#8A5E40', chest: '#F4EDE4', wing: '#6A4630', wingLine: '#4E3220', tail: '#C0532E', tailBand: '#9A3A1E', brow: '#4E3220', eyeRing: '#C9955E',
  // A belly band of dark streaks, the red-tail's signature.
  chestMarks: `${Array.from({ length: 14 }, (_, i) => `<path d="M${150 + (i % 7) * 18} ${236 + Math.floor(i / 7) * 22} l4 12" stroke="#6A4630" stroke-width="7" stroke-linecap="round"/>`).join('')}`,
  headMarks: '<path d="M106 120 C130 138 170 144 214 120 L214 160 L106 160 Z" fill="#F4EDE4"/>',
});
ART.coopersBody = hawkPerched({
  id: 'coopersp', head: '#5E6A80', chest: '#F4E2D2', wing: '#4E5A70', wingLine: '#3B4256', tail: '#6E7A90', tailBand: '#2E3448', brow: '#2E3448', eyeRing: '#E5484D',
  // Fine rusty-orange barring, like the adult in the photo.
  chestMarks: bars('#D9774A', 168, 16, 6),
  headMarks: '<path d="M106 40 H220 V82 C190 74 150 74 106 86 Z" fill="#2E3448"/><path d="M110 118 C140 136 180 140 214 120 L214 160 L110 160 Z" fill="#E8C2A8"/>',
});
ART.peregrineBody = hawkPerched({
  id: 'peregrinep', head: '#F4F2F0', chest: '#F4F2F0', wing: '#4E5A70', wingLine: '#2E3448', tail: '#5E6A80', tailBand: '#2E3448', brow: '#1A1A2E', eyeRing: '#F2C94C',
  chestMarks: bars('#3B4256', 214, 16, 5),
  // The dark hood and "mustache".
  headMarks: `<path d="M100 40 H220 V100 C200 92 182 92 168 100 C156 106 150 118 150 140 L128 146 C122 128 118 110 108 100 Z" fill="${C.ink}"/>`,
});

// ── Full-body versions of the selfie animals, for close-up scenes (no background, no
// perch: the scene draws the ground). Feet rest on y = 360 of the 400 canvas.
ART.pigeonBody = {
  shoulder: [0.47, 0.42],
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const tail = '<path d="M300 228 L390 258 L382 290 L296 268 Z"/>';
    const outline = 'M108 232 C108 162 188 140 260 156 C332 172 352 232 332 272 C314 308 250 318 190 312 C138 306 108 282 108 232 Z';
    const body = `<path d="${outline}"/>`;
    const head = '<circle cx="128" cy="126" r="62"/>';
    const legs = 'M196 306 L190 356 M238 308 L244 356 M172 360 L190 352 L206 360 M228 360 L244 352 L260 360';
    return `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${legs}" fill="none" stroke="#E58A8A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      ${shadow([tail, body, head])}
      ${shape(tail, '#4E4D66')}
      <path d="M322 264 L384 284" stroke="#2E2E44" stroke-width="10" stroke-linecap="round"/>
      ${shape(body, '#BDBCD0')}
      <clipPath id="pb-body"><path d="${outline}"/></clipPath>
      <g clip-path="url(#pb-body)">
        <path d="M108 190 C130 222 168 236 214 228" fill="none" stroke="#4FB89A" stroke-width="16" stroke-linecap="round" opacity="0.85"/>
        <path d="M110 212 C134 240 172 252 216 244" fill="none" stroke="#9B6BC4" stroke-width="11" stroke-linecap="round" opacity="0.75"/>
        <path d="M188 190 C258 182 322 212 340 258 C302 288 240 288 194 262 Z" fill="#A3A2BC"/>
        <path d="M238 224 C268 232 294 248 308 264 M262 210 C292 220 316 236 330 252" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
        <path d="M188 190 C182 220 186 244 194 262" fill="none" stroke="${C.ink}" stroke-width="7"/>
      </g>
      <path d="${outline}" fill="none" ${OL}/>
      ${shape(head, '#8F8EA8')}
      ${eye(m.eyes, 112, 116, 17, { ring: '#FF8A3D', lid: '#8F8EA8' })}
      <ellipse cx="146" cy="152" rx="16" ry="10" fill="${C.pink}"/>
      <ellipse cx="80" cy="124" rx="11" ry="8" fill="#fff" stroke="${C.ink}" stroke-width="5"/>
      <path d="M74 128 L42 140 L76 148 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${m.snack ? `<g transform="rotate(-14 30 152)"><path d="M6 168 C2 146 16 132 30 138 C40 126 62 132 60 152 L58 170 Z" fill="#FBE3B5" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M12 162 C10 148 20 140 30 145 C38 136 52 140 52 154" fill="none" stroke="#C98A4B" stroke-width="5" stroke-linecap="round"/></g>` : ''}
      ${m.hearts ? heart(300, 60, 46) + heart(350, 124, 30) : ''}
      ${deco(m, 220, 70, 34, 262, 40, 22)}`;
  },
};

ART.squirrelBody = {
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const tail = '<path d="M246 352 C384 352 404 196 344 116 C304 64 228 86 238 150 C244 192 300 202 300 252 C300 302 270 334 246 342 Z"/>';
    const body = '<path d="M146 360 C118 300 128 222 180 198 C232 176 272 212 278 272 C284 322 264 360 240 360 Z"/>';
    const ears = '<ellipse cx="128" cy="104" rx="16" ry="27" transform="rotate(-16 128 104)"/><ellipse cx="186" cy="100" rx="16" ry="27" transform="rotate(14 186 100)"/>';
    const head = '<ellipse cx="160" cy="162" rx="66" ry="58"/>';
    return `${shadow([tail, body, ears, head])}
      ${shape(tail, '#8C889C')}
      <path d="M318 120 C352 160 368 220 356 280 M284 150 C312 176 322 214 316 250" fill="none" stroke="#6E6A80" stroke-width="11" stroke-linecap="round"/>
      ${shape(body, '#A6A2B6')}
      <ellipse cx="186" cy="300" rx="40" ry="54" fill="#EDE8F2"/>
      <g fill="#A6A2B6" ${OL}><ellipse cx="168" cy="354" rx="30" ry="10"/><ellipse cx="226" cy="356" rx="28" ry="10"/></g>
      ${shape(ears, '#A6A2B6')}
      <ellipse cx="129" cy="108" rx="7" ry="15" transform="rotate(-16 129 108)" fill="${C.pink}"/><ellipse cx="185" cy="104" rx="7" ry="15" transform="rotate(14 185 104)" fill="${C.pink}"/>
      ${shape(head, '#A6A2B6')}
      <ellipse cx="160" cy="186" rx="32" ry="22" fill="#EDE8F2"/>
      ${eye(m.eyes, 136, 150, 16, { lid: '#A6A2B6' })}${eye(m.eyes, 186, 152, 14, { lid: '#A6A2B6' })}
      <ellipse cx="118" cy="176" rx="13" ry="8" fill="${C.pink}"/><ellipse cx="204" cy="178" rx="12" ry="8" fill="${C.pink}"/>
      <path d="M150 172 Q160 166 170 172 Q164 184 160 184 Q156 184 150 172 Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <rect x="152" y="188" width="16" height="14" rx="3" fill="#fff" stroke="${C.ink}" stroke-width="5"/><path d="M160 188 V202" stroke="${C.ink}" stroke-width="3"/>
      ${m.snack ? `<ellipse cx="158" cy="232" rx="18" ry="21" fill="#D9954F" stroke="${C.ink}" stroke-width="6"/><path d="M137 226 Q158 200 179 226 Q158 232 137 226 Z" fill="#7A4E2A" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` : ''}
      <g fill="#A6A2B6" ${OL}><ellipse cx="146" cy="246" rx="13" ry="10"/><ellipse cx="174" cy="250" rx="13" ry="10"/></g>
      ${m.hearts ? heart(290, 40, 44) + heart(70, 70, 30) : ''}
      ${deco(m, 214, 70, 30, 252, 44, 20)}`;
  },
};

ART.raccoonBody = {
  // Sitting up, paws together, ringed tail curled around the side.
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const tail = '<path d="M250 356 C330 362 380 330 386 278 C390 240 362 226 350 252 C342 280 320 312 260 318 Z"/>';
    const body = '<path d="M130 360 C100 300 112 226 170 206 C230 188 284 220 290 282 C294 330 270 360 240 360 Z"/>';
    const ears = '<circle cx="132" cy="96" r="24"/><circle cx="228" cy="96" r="24"/>';
    const head = '<ellipse cx="180" cy="148" rx="82" ry="66"/>';
    return `${shadow([tail, body, ears, head])}
      ${shape(tail, '#A7A3B3')}
      <clipPath id="rb-tail">${tail}</clipPath>
      <g clip-path="url(#rb-tail)"><path d="M300 360 L330 250 M330 360 L360 250 M360 360 L392 250" stroke="#3B3A50" stroke-width="16"/></g>
      ${tail.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(body, '#9C98A8')}
      <ellipse cx="200" cy="300" rx="44" ry="52" fill="#D8D4DE"/>
      <g fill="#8C889C" ${OL}><ellipse cx="170" cy="354" rx="28" ry="10"/><ellipse cx="236" cy="356" rx="26" ry="10"/></g>
      ${shape(ears, '#8C889C')}
      <g fill="#F1EEF4"><circle cx="132" cy="98" r="11"/><circle cx="228" cy="98" r="11"/></g>
      ${shape(head, '#A7A3B3')}
      <ellipse cx="180" cy="172" rx="52" ry="36" fill="#F1EEF4"/>
      <path d="M112 136 C132 116 164 124 180 142 C196 124 228 116 248 136 C250 158 228 170 208 166 C196 164 188 156 180 156 C172 156 164 164 152 166 C132 170 110 158 112 136 Z" fill="${C.ink}"/>
      ${eye(m.eyes, 150, 142, 13, { dark: true })}${eye(m.eyes, 210, 142, 13, { dark: true })}
      <ellipse cx="180" cy="176" rx="13" ry="9" fill="${C.ink}"/>
      <path d="M170 192 Q180 200 190 192" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="130" cy="182" rx="14" ry="8" fill="${C.pink}"/><ellipse cx="230" cy="182" rx="14" ry="8" fill="${C.pink}"/>
      ${m.snack ? `<path d="M196 234 C198 220 206 212 216 208" fill="none" stroke="#3E8E4E" stroke-width="5" stroke-linecap="round"/><circle cx="196" cy="246" r="16" fill="#E5484D" stroke="${C.ink}" stroke-width="6"/><circle cx="190" cy="240" r="4" fill="#fff"/>` : ''}
      <g fill="#8C889C" ${OL}><ellipse cx="174" cy="256" rx="14" ry="11"/><ellipse cx="216" cy="258" rx="14" ry="11"/></g>
      ${m.hearts ? heart(300, 50, 44) + heart(68, 74, 30) : ''}
      ${deco(m, 250, 70, 30, 288, 44, 20)}`;
  },
};

ART.opossumBody = {
  // On all fours, facing left: white pointy face, gray coat, black ears and legs, pink tail.
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const tail = '<path d="M330 290 C372 300 394 330 380 352 C372 362 360 356 364 346 C372 330 356 312 326 306 Z"/>';
    const body = '<path d="M120 266 C120 210 180 186 250 192 C320 198 346 240 340 280 C334 312 290 322 230 320 C170 318 120 306 120 266 Z"/>';
    const head = '<path d="M150 208 C110 196 72 214 44 248 C40 256 46 262 56 260 C90 262 128 268 160 262 Z"/>';
    const ears = '<circle cx="122" cy="196" r="17"/>';
    const legs = 'M170 312 V356 M210 316 V358 M270 316 V358 M310 310 V354';
    return `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/>
      <path d="${legs}" fill="none" stroke="#2E2E44" stroke-width="12" stroke-linecap="round"/>
      ${shadow([tail, body, head, ears])}
      ${shape(tail, '#F2B8C6')}
      ${shape(body, '#A9A6AE')}
      <path d="M150 210 C170 230 200 236 240 232" fill="none" stroke="#E8E6EA" stroke-width="10" stroke-linecap="round"/>
      ${shape(ears, C.ink)}
      ${shape(head, '#F7F5F2')}
      <circle cx="50" cy="252" r="7" fill="#F2A0B0" stroke="${C.ink}" stroke-width="4"/>
      ${eye(m.eyes, 104, 226, 10, { lid: '#F7F5F2' })}
      <ellipse cx="126" cy="246" rx="11" ry="6" fill="${C.pink}"/>
      <path d="M70 248 L46 238 M70 254 L44 258" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
      ${m.snack ? `<g fill="#7B4BB5" stroke="${C.ink}" stroke-width="5"><circle cx="34" cy="268" r="10"/><circle cx="50" cy="270" r="10"/><circle cx="42" cy="284" r="10"/></g>` : ''}
      ${m.hearts ? heart(300, 120, 40) + heart(240, 150, 26) : ''}
      ${deco(m, 200, 130, 30, 238, 104, 20)}`;
  },
};

ART.groundhogBody = {
  // Sitting up tall on their haunches, looking around, the classic groundhog pose.
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M130 360 C96 300 104 210 160 186 C220 164 276 200 282 268 C288 330 266 360 236 360 Z"/>';
    const head = '<ellipse cx="184" cy="134" rx="66" ry="58"/>';
    const ears = '<circle cx="138" cy="94" r="15"/><circle cx="230" cy="94" r="15"/>';
    const tail = '<path d="M262 344 C300 348 318 330 316 312 C304 318 286 326 262 326 Z"/>';
    return `${shadow([tail, body, ears, head])}
      ${shape(tail, '#6E4A30')}
      ${shape(body, '#9A6E48')}
      <ellipse cx="196" cy="292" rx="46" ry="58" fill="#C9A884"/>
      <g fill="#6E4A30" ${OL}><ellipse cx="168" cy="354" rx="28" ry="10"/><ellipse cx="232" cy="356" rx="26" ry="10"/></g>
      ${shape(ears, '#7A5236')}
      ${shape(head, '#9A6E48')}
      <ellipse cx="184" cy="156" rx="40" ry="28" fill="#D9C2A6"/>
      ${eye(m.eyes, 160, 126, 12, { lid: '#9A6E48' })}${eye(m.eyes, 208, 126, 12, { lid: '#9A6E48' })}
      <ellipse cx="184" cy="146" rx="10" ry="7" fill="${C.ink}"/>
      <rect x="176" y="160" width="16" height="16" rx="3" fill="#F7F0E0" stroke="${C.ink}" stroke-width="4"/><path d="M184 160 V176" stroke="${C.ink}" stroke-width="3"/>
      <ellipse cx="140" cy="162" rx="12" ry="7" fill="${C.pink}"/><ellipse cx="228" cy="162" rx="12" ry="7" fill="${C.pink}"/>
      ${m.snack ? `<path d="M196 236 V196" stroke="#3E8E4E" stroke-width="5" stroke-linecap="round"/><circle cx="196" cy="190" r="12" fill="#F2D23C" stroke="${C.ink}" stroke-width="5"/><circle cx="196" cy="190" r="5" fill="#E8A23C"/>` : ''}
      <g fill="#6E4A30" ${OL}><ellipse cx="174" cy="232" rx="13" ry="10"/><ellipse cx="216" cy="234" rx="13" ry="10"/></g>
      ${m.hearts ? heart(300, 50, 44) + heart(70, 70, 30) : ''}
      ${deco(m, 250, 64, 30, 288, 40, 20)}`;
  },
};

ART.deerBody = {
  // Standing side-on, facing left: big ears, white tail tuft, slim legs.
  tint: 'none',
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M150 210 C150 176 210 164 280 170 C340 176 362 206 356 236 C350 266 310 272 250 270 C190 268 150 254 150 210 Z"/>';
    // Head and neck as one smooth shape: nose, round forehead, the back of the neck curving
    // down into the shoulders, then the throat back up to the chin.
    const headNeck = '<path d="M60 120 C62 94 96 74 132 74 C166 74 188 94 188 120 C188 152 196 180 214 198 L156 216 C140 194 130 170 124 148 C100 148 76 144 64 136 C57 131 56 125 60 120 Z"/>';
    const ears = '<ellipse cx="160" cy="70" rx="14" ry="30" transform="rotate(30 160 70)"/><ellipse cx="128" cy="66" rx="13" ry="28" transform="rotate(-8 128 66)"/>';
    const legs = 'M186 262 L184 356 M220 266 L222 356 M300 264 L302 356 M330 258 L336 352';
    return `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="20" stroke-linecap="round"/>
      <path d="${legs}" fill="none" stroke="#A9784E" stroke-width="10" stroke-linecap="round"/>
      <path d="M180 356 h10 M216 356 h10 M296 356 h10 M330 352 h10" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
      ${'' /* Only the body casts the offset shadow: on the slim neck it looked like a wobbly line. */}${shadow([body])}
      ${'' /* Body and neck as one shape: outline both, then fill both on top, so there's no seam between them. */}
      ${shape(ears, '#B9875E')}
      <ellipse cx="161" cy="72" rx="7" ry="18" transform="rotate(30 161 72)" fill="#F4EDE4"/><ellipse cx="128" cy="69" rx="6" ry="16" transform="rotate(-8 128 69)" fill="#F4EDE4"/>
      <g fill="none" ${OL}>${body}${headNeck}</g>
      <g fill="#B9875E">${body}${headNeck}</g>
      <clipPath id="db-body">${body}</clipPath>
      <g clip-path="url(#db-body)"><ellipse cx="262" cy="276" rx="96" ry="26" fill="#F4EDE4"/></g>
      ${m.fawn ? `<g clip-path="url(#db-body)">${dots([[196, 192], [228, 184], [262, 184], [296, 188], [326, 198], [212, 218], [246, 212], [280, 214], [312, 224], [338, 222]], 7, '#F4EDE4')}</g>` : ''}
      <path d="M352 210 C372 198 382 214 368 230 C362 236 354 232 354 226 Z" fill="#F4EDE4" stroke="${C.ink}" stroke-width="6"/>

      <path d="M66 126 C80 136 100 138 116 134" fill="none" stroke="#F4EDE4" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="62" cy="120" rx="9" ry="7" fill="${C.ink}"/>
      ${eye(m.eyes, 118, 104, 13, { lid: '#B9875E' })}
      <ellipse cx="144" cy="124" rx="12" ry="7" fill="${C.pink}"/>
      ${m.snack ? `<path d="M48 134 C32 142 26 158 40 166 C54 160 58 146 48 134 Z" fill="#7FBF5A" stroke="${C.ink}" stroke-width="5"/>` : ''}
      ${m.hearts ? heart(300, 60, 44) + heart(240, 100, 28) : ''}
      ${deco(m, 230, 80, 30, 268, 54, 20)}`;
  },
};

// Little ones, for family scenes. Most babies are drawn as small grown-ups, but some look
// nothing like their parents: ducklings, goslings and cygnets are fuzzy puffballs, gull and
// tern chicks are speckled fluff, and fawns have spots.
ART.fawn = { ...ART.deerBody, svg: (m) => ART.deerBody.svg({ ...m, fawn: true }) };
const chick = (p) => ({
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const body = '<ellipse cx="236" cy="248" rx="116" ry="84"/>';
    const head = '<circle cx="146" cy="168" r="70"/>';
    const tuft = 'M146 100 q-8 -22 4 -32 M162 102 q4 -22 20 -24 M130 106 q-16 -12 -12 -28';
    const legs = 'M208 324 L204 362 M262 324 L268 362 M186 366 L204 358 L218 368 M250 368 L268 358 L286 366';
    return `${p.pose === 'stand' ? `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="${legs}" fill="none" stroke="${p.legs}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${shadow([body, head])}
      ${shape(body, p.back)}
      <clipPath id="${p.id}-b">${body}</clipPath>
      <g clip-path="url(#${p.id}-b)">
        <ellipse cx="196" cy="306" rx="116" ry="58" fill="${p.belly}"/>
        ${p.speckle ? dots([[250, 196], [290, 208], [318, 236], [226, 222], [270, 238], [304, 266], [248, 266]], 6, p.speckle) : ''}
      </g>
      <ellipse cx="236" cy="248" rx="116" ry="84" fill="none" ${OL}/>
      <path d="M252 222 C302 214 340 242 332 280 C302 290 268 280 252 254 Z" fill="${p.wing}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      <path d="${tuft}" fill="none" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/>
      <path d="${tuft}" fill="none" stroke="${p.face}" stroke-width="6" stroke-linecap="round"/>
      ${shape(head, p.face)}
      <clipPath id="${p.id}-h">${head}</clipPath>
      <g clip-path="url(#${p.id}-h)">
        ${p.cap ? `<path d="M60 80 H240 V156 C206 136 160 132 96 148 L60 150 Z" fill="${p.cap}"/>` : ''}
        ${p.stripe ? `<path d="M70 160 C110 150 160 152 220 166" fill="none" stroke="${p.stripe}" stroke-width="12" stroke-linecap="round"/>` : ''}
      </g>
      <circle cx="146" cy="168" r="70" fill="none" ${OL}/>
      ${eye(m.eyes, 128, 162, 20, { lid: p.face })}
      <ellipse cx="168" cy="200" rx="18" ry="10" fill="${C.pink}"/>
      <path d="M84 172 C68 168 50 174 42 184 C52 194 70 194 86 186 Z" fill="${p.bill}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${m.snack ? droplet(40, 204) : ''}
      ${m.hearts ? heart(300, 60, 44) + heart(352, 122, 28) : ''}
      ${deco(m, 250, 70, 32, 290, 42, 22)}`;
  },
});
ART.duckling = chick({ id: 'duckling', pose: 'swim', back: '#8A6A3E', wing: '#6E5230', belly: '#F7D774', face: '#F7D774', cap: '#8A6A3E', stripe: '#5E4A30', bill: '#3E3D4F', legs: '#E8A23C' });
ART.gosling = chick({ id: 'gosling', pose: 'stand', back: '#C9C26A', wing: '#A8A050', belly: '#F2E58A', face: '#F2E27A', cap: '#B8B060', bill: '#3E3D4F', legs: '#55546A' });
ART.cygnet = chick({ id: 'cygnet', pose: 'swim', back: '#B8B6C4', wing: '#9C9AAC', belly: '#D2D0DA', face: '#CFCDD8', bill: '#3E3D4F', legs: '#55546A' });
ART.gullChick = chick({ id: 'gullchick', pose: 'stand', back: '#BDAE92', wing: '#A39478', belly: '#D9CDB4', face: '#D2C4A8', speckle: '#5E5446', bill: '#3E3D4F', legs: '#C98A7A' });
ART.ternChick = chick({ id: 'ternchick', pose: 'stand', back: '#E3D3B0', wing: '#CBB990', belly: '#F2E8D2', face: '#EADCBC', speckle: '#7A6A50', bill: '#F2804A', legs: '#E5484D' });

// ── New neighbors: red fox, coyote, eastern cottontail, bats and wild turkey. Each is
// one full-body drawing used for the round sticker and the close-up scenes alike.

/** A dog-shaped neighbor standing side-on, facing left: the fox and the coyote share the build. */
const canid = (p) => ({
  tint: p.tint,
  tilt: 0,
  svg: (m) => {
    const legs = p.legs;
    const body = `<path d="${p.body}"/>`;
    const tail = `<path d="${p.tail}"/>`;
    const head = '<path d="M184 184 C184 150 158 128 128 130 C102 132 84 150 80 172 C62 186 44 204 34 220 C42 234 78 240 114 236 C152 238 184 216 184 184 Z"/>';
    const ears = `<path d="M98 152 L ${p.ear[0]} Z"/><path d="M146 136 L ${p.ear[1]} Z"/>`;
    return `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/>
      <path d="${legs}" fill="none" stroke="${p.sock}" stroke-width="12" stroke-linecap="round"/>
      ${shadow([tail, body, head, ears])}
      ${shape(tail, p.coat)}
      <clipPath id="${p.id}-tail">${tail}</clipPath>
      <g clip-path="url(#${p.id}-tail)"><circle cx="${p.tip[0]}" cy="${p.tip[1]}" r="30" fill="${p.tipColor}"/></g>
      ${tail.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(body, p.coat)}
      <clipPath id="${p.id}-body">${body}</clipPath>
      <g clip-path="url(#${p.id}-body)">
        <ellipse cx="196" cy="${p.bellyY}" rx="78" ry="30" fill="${p.belly}"/>
        <path d="M200 196 C240 192 290 200 320 220" fill="none" stroke="${p.back}" stroke-width="16" stroke-linecap="round"/>
      </g>
      ${body.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(ears, p.coat)}
      <path d="M104 154 L ${p.earIn[0]} Z M148 140 L ${p.earIn[1]} Z" fill="${p.earInside}"/>
      ${shape(head, p.coat)}
      <clipPath id="${p.id}-head">${head}</clipPath>
      <g clip-path="url(#${p.id}-head)"><path d="M30 214 C64 206 104 206 140 214 C160 222 176 236 186 250 L30 250 Z" fill="${p.belly}"/></g>
      ${head.replace('/>', ` fill="none" ${OL}/>`)}
      <circle cx="38" cy="219" r="9" fill="${C.ink}"/>
      ${eye(m.eyes, 122, 176, 13, { lid: p.coat })}
      <ellipse cx="152" cy="206" rx="13" ry="8" fill="${C.pink}"/>
      <path d="M58 232 Q68 238 78 233" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${m.snack ? berries(42, 252) : ''}
      ${m.hearts ? heart(296, 60, 44) + heart(236, 96, 28) : ''}
      ${deco(m, 196, 82, 30, 234, 56, 20)}`;
  },
});

ART.fox = {
  // Sitting up and facing you: big pointed ears with fluffy insides, a white heart-shaped
  // muzzle, big shiny eyes, a white bib, and a huge fluffy tail curled around the side.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const orange = '#E8742E';
    const cream = '#FFF6EC';
    // The tail sweeps up beside the body, lifted, white tip high.
    const tail = '<path d="M244 352 C308 360 362 326 366 270 C370 232 354 204 332 204 C310 204 302 224 314 242 C326 264 318 296 284 318 C268 328 256 332 244 334 Z"/>';
    const body = '<path d="M126 362 C106 306 118 242 160 214 L240 214 C282 242 294 306 274 362 Z"/>';
    const ears = '<path d="M118 124 L96 22 L186 90 Z"/><path d="M282 124 L304 22 L214 90 Z"/>';
    const head = '<path d="M200 76 C252 76 294 108 304 154 C320 166 334 182 326 194 C306 218 262 240 200 242 C138 240 94 218 74 194 C66 182 80 166 96 154 C106 108 148 76 200 76 Z"/>';
    const fluff = (x, y, dir) => `<path d="M${x} ${y} l${8 * dir} -16 l${4 * dir} 14 l${8 * dir} -12 l${2 * dir} 16" fill="none" stroke="${cream}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<g transform="translate(0 -10)">${shadow([tail, body, ears, head])}
      ${shape(tail, orange)}
      <clipPath id="fox-tail">${tail}</clipPath>
      <g clip-path="url(#fox-tail)">
        <circle cx="336" cy="214" r="34" fill="${cream}"/>
        <path d="M290 320 C324 306 348 280 352 250" fill="none" stroke="#D2602A" stroke-width="7" stroke-linecap="round"/>
      </g>
      ${tail.replace('/>', ` fill="none" ${OL}/>`)}
      <path d="M318 196 l-6 -10 M334 192 l0 -12 M350 198 l8 -8" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${shape(body, orange)}
      <path d="M160 218 C166 262 174 300 200 334 C226 300 234 262 240 218 Z" fill="${cream}"/>
      <path d="M176 316 l8 10 l8 -8 l8 10 l8 -10 l8 8" fill="none" stroke="${cream}" stroke-width="6" stroke-linejoin="round"/>
      <g fill="#D2602A" ${OL}><ellipse cx="170" cy="358" rx="22" ry="11"/><ellipse cx="230" cy="358" rx="22" ry="11"/></g>
      ${shape(ears, orange)}
      <path d="M124 112 L108 44 L172 92 Z M276 112 L292 44 L228 92 Z" fill="#F4A9A0"/>
      ${fluff(118, 96, 1)}${fluff(282, 96, -1)}
      ${shape(head, orange)}
      <clipPath id="fox-head">${head}</clipPath>
      <g clip-path="url(#fox-head)">
        <path d="M70 176 C108 172 152 184 200 200 C248 184 292 172 330 176 C322 214 270 244 200 244 C130 244 78 214 70 176 Z" fill="${cream}"/>
      </g>
      <path d="M200 76 C252 76 294 108 304 154 C320 166 334 182 326 194 C306 218 262 240 200 242 C138 240 94 218 74 194 C66 182 80 166 96 154 C106 108 148 76 200 76 Z" fill="none" ${OL}/>
      <ellipse cx="158" cy="114" rx="10" ry="6" fill="${cream}"/><ellipse cx="242" cy="114" rx="10" ry="6" fill="${cream}"/>
      ${eye(m.eyes, 158, 152, 23, { lid: orange })}${eye(m.eyes, 242, 152, 23, { lid: orange })}
      ${m.eyes === 'open' || m.eyes === 'wide' || m.eyes === 'curious' ? '<path d="M132 140 l-12 -6 M134 132 l-10 -10 M268 140 l12 -6 M266 132 l10 -10" stroke="' + C.ink + '" stroke-width="5" stroke-linecap="round"/>' : ''}
      <ellipse cx="122" cy="196" rx="15" ry="9" fill="${C.pink}"/><ellipse cx="278" cy="196" rx="15" ry="9" fill="${C.pink}"/>
      <path d="M186 194 C186 186 214 186 214 194 C214 202 204 208 200 208 C196 208 186 202 186 194 Z" fill="${C.ink}"/>
      <circle cx="194" cy="191" r="3" fill="#fff"/>
      <path d="M200 208 V216 M188 220 Q194 226 200 216 Q206 226 212 220" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${m.snack ? berries(250, 236) : ''}
      ${m.hearts ? heart(318, 30, 40) + heart(50, 50, 30) : ''}
      ${deco(m, 300, 58, 28, 336, 32, 18)}</g>`;
  },
};

ART.coyote = {
  // Standing side-on, facing left, handsome and alert: long muzzle, tall ears, amber
  // eyes, white throat and chest, a grizzled gray-brown saddle, tawny legs, and a long
  // bushy tail hanging down with a black tip.
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const coat = '#B8A68A';
    const saddle = '#8A7C6C';
    const tawny = '#C9A274';
    const cream = '#F4EEE4';
    const legs = 'M156 252 L152 348 M186 258 L184 350 M292 248 C306 280 298 310 304 346 M320 240 C336 276 328 312 332 344';
    const tail = '<path d="M318 194 C356 198 376 244 376 294 C376 334 360 360 340 352 C324 344 330 310 326 284 C322 258 314 234 300 216 Z"/>';
    const body = '<path d="M122 212 C118 172 162 154 212 158 C262 162 302 158 330 174 C356 190 356 236 336 254 C314 270 284 262 264 256 C234 250 208 262 182 266 C144 270 124 248 122 212 Z"/>';
    const neck = '<path d="M100 150 C124 146 160 158 180 188 L140 220 C120 204 104 182 100 150 Z"/>';
    // A softer, shorter muzzle and a rounder head, for a cuter face.
    const head = '<path d="M160 144 C160 106 134 78 102 78 C74 78 56 96 52 116 C40 122 30 130 24 138 C22 154 40 164 64 166 C86 170 106 178 124 196 C148 186 160 166 160 144 Z"/>';
    const ears = '<path d="M80 104 L76 30 L134 86 Z"/><path d="M114 90 L146 24 L162 100 Z"/>';
    // A lighter outline than the other neighbors: thinner, in dark brown instead of ink.
    const line = '#5E5448';
    const LINE = `stroke="${line}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"`;
    const open = m.eyes === 'open' || m.eyes === 'wide' || m.eyes === 'curious';
    return `<path d="${legs}" fill="none" stroke="${line}" stroke-width="29" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${legs}" fill="none" stroke="${tawny}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="${cream}" stroke="${line}" stroke-width="7"><ellipse cx="146" cy="350" rx="16" ry="8"/><ellipse cx="178" cy="352" rx="16" ry="8"/><ellipse cx="298" cy="348" rx="16" ry="8"/><ellipse cx="326" cy="346" rx="16" ry="8"/></g>
      <g fill="${coat}" ${LINE}>${tail}</g>
      <clipPath id="coy-tail">${tail}</clipPath>
      <g clip-path="url(#coy-tail)">
        <path d="M320 198 C352 214 366 252 368 298" fill="none" stroke="${saddle}" stroke-width="16" stroke-linecap="round"/>
        <path d="M332 250 l14 -6 M336 276 l14 -4 M338 302 l14 0" stroke="#5E5448" stroke-width="4" stroke-linecap="round"/>
        <circle cx="346" cy="352" r="30" fill="#2E2E44"/>
      </g>
      ${tail.replace('/>', ` fill="none" ${LINE}/>`)}
      <g fill="none" stroke="${line}" stroke-width="15" stroke-linejoin="round">${body}${neck}</g>
      <g fill="${coat}">${body}${neck}</g>
      <clipPath id="coy-body">${body}${neck}</clipPath>
      <g clip-path="url(#coy-body)">
        <path d="M150 146 C210 146 284 148 344 172 C334 196 292 196 250 192 C210 190 180 188 150 172 Z" fill="${saddle}"/>
        <path d="M180 170 l10 -12 M210 168 l10 -12 M240 168 l10 -12 M270 170 l10 -12 M300 176 l10 -12" stroke="#5E5448" stroke-width="5" stroke-linecap="round"/>
        <path d="M96 160 C110 206 140 250 196 270 L96 270 Z" fill="${cream}"/>
        <ellipse cx="244" cy="270" rx="72" ry="18" fill="${cream}"/>
        <path d="M292 200 C312 230 314 252 302 268 L344 268 L344 200 Z" fill="${tawny}" opacity="0.8"/>
      </g>
      <g fill="${coat}" stroke="${line}" stroke-width="8" stroke-linejoin="round">${ears}</g>
      <path d="M90 96 L88 54 L120 86 Z M126 88 L143 50 L151 94 Z" fill="${cream}"/>
      <path d="M92 90 l8 -12 M128 86 l4 -14" stroke="${saddle}" stroke-width="4" stroke-linecap="round"/>
      ${'' /* A slight dark-brown outline, like the rest of the coyote. */}<g fill="${coat}" stroke="${line}" stroke-width="8">${head}</g>
      <clipPath id="coy-head">${head}</clipPath>
      <g clip-path="url(#coy-head)">
        <path d="M18 144 C52 142 86 150 110 160 C126 170 140 186 152 204 L18 204 Z" fill="${cream}"/>
        <ellipse cx="124" cy="150" rx="22" ry="16" fill="${cream}"/>
        <path d="M54 118 C76 110 104 110 124 118" fill="none" stroke="${tawny}" stroke-width="12" stroke-linecap="round"/>
      </g>
      <path d="M18 134 C18 124 38 124 38 134 C38 144 30 148 28 148 C26 148 18 144 18 134 Z" fill="${C.ink}"/><circle cx="24" cy="131" r="3.5" fill="#fff"/>
      <path d="M30 150 V156 M40 160 Q50 166 60 158" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
      ${open ? `<circle cx="98" cy="116" r="${m.eyes === 'wide' ? 19 : 17}" fill="#E8A23C" stroke="${C.ink}" stroke-width="3"/>` : ''}
      ${eye(m.eyes, 98, 116, 13, { lid: coat })}
      <path d="M80 98 Q96 90 116 96" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="132" cy="152" rx="12" ry="7" fill="${C.pink}"/>
      ${'' /* A ruff of fur at the throat. */}<path d="M104 176 l8 12 l6 -10 l8 14 l6 -12 l8 14 l6 -10" fill="none" stroke="${cream}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      ${m.snack ? berries(36, 180) : ''}
      ${m.hearts ? heart(250, 60, 42) + heart(200, 100, 26) : ''}
      ${deco(m, 196, 66, 30, 234, 40, 20)}`;
  },
};

ART.rabbit = {
  // Sitting up, facing left: long ears, round body, a white cotton tail.
  tint: C.pinkT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M146 340 C116 300 124 226 186 210 C252 194 302 236 300 290 C298 330 268 350 228 350 Z"/>';
    const tail = '<circle cx="300" cy="306" r="26"/>';
    const ears = '<ellipse cx="150" cy="86" rx="20" ry="62" transform="rotate(-6 150 86)"/><ellipse cx="196" cy="94" rx="19" ry="58" transform="rotate(22 196 94)"/>';
    const head = '<ellipse cx="150" cy="180" rx="62" ry="56"/>';
    return `${shadow([tail, body, ears, head])}
      ${shape(tail, '#F7F5F2')}
      ${shape(body, '#A88A6E')}
      <clipPath id="rabbit-body">${body}</clipPath>
      <g clip-path="url(#rabbit-body)"><ellipse cx="170" cy="300" rx="50" ry="56" fill="#E8DCC8"/></g>
      ${body.replace('/>', ` fill="none" ${OL}/>`)}
      <g fill="#A88A6E" ${OL}><ellipse cx="150" cy="346" rx="34" ry="11"/><ellipse cx="226" cy="348" rx="30" ry="10"/></g>
      ${shape(ears, '#A88A6E')}
      <ellipse cx="150" cy="90" rx="9" ry="44" transform="rotate(-6 150 90)" fill="${C.pink}"/><ellipse cx="194" cy="98" rx="8" ry="40" transform="rotate(22 194 98)" fill="${C.pink}"/>
      ${shape(head, '#A88A6E')}
      <ellipse cx="128" cy="204" rx="38" ry="26" fill="#E8DCC8"/>
      ${eye(m.eyes, 140, 170, 15, { lid: '#A88A6E' })}
      <path d="M100 196 Q106 190 112 196 Q108 204 106 204 Q104 204 100 196 Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M106 206 V212 M98 216 Q106 220 114 216" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M96 204 L66 198 M96 210 L68 214" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="176" cy="200" rx="13" ry="8" fill="${C.pink}"/>
      ${m.snack ? `<path d="M100 222 C96 240 104 250 110 262 M110 262 C96 262 90 252 92 244 M110 262 C122 258 126 248 120 240" fill="none" stroke="#3E8E4E" stroke-width="5" stroke-linecap="round"/><g fill="#7FBF5A" stroke="${C.ink}" stroke-width="4"><circle cx="88" cy="238" r="9"/><circle cx="102" cy="230" r="9"/><circle cx="96" cy="246" r="9"/></g>` : ''}
      <g fill="#E8DCC8" stroke="${C.ink}" stroke-width="6"><ellipse cx="138" cy="262" rx="11" ry="9"/><ellipse cx="176" cy="268" rx="11" ry="9"/></g>
      ${m.hearts ? heart(296, 70, 44) + heart(250, 130, 28) : ''}
      ${deco(m, 252, 80, 30, 290, 54, 20)}`;
  },
};

/** A little brown bat. Flying: wings out, facing you. Hanging (`hang`): upside down, wings wrapped. */
const BAT = { fur: '#7A5A48', face: '#A07E66', wing: '#4A3A40', ear: '#5E4638' };
ART.bat = {
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const wings = '<path d="M168 196 C130 150 70 132 22 150 C40 168 44 190 36 210 C58 202 80 210 88 230 C104 216 126 218 140 236 C150 224 160 214 168 214 Z"/><path d="M232 196 C270 150 330 132 378 150 C360 168 356 190 364 210 C342 202 320 210 312 230 C296 216 274 218 260 236 C250 224 240 214 232 214 Z"/>';
    const body = '<ellipse cx="200" cy="222" rx="50" ry="64"/>';
    const ears = '<path d="M160 156 L150 96 L190 140 Z"/><path d="M240 156 L250 96 L210 140 Z"/>';
    return `${shadow([wings, body, ears])}
      ${shape(wings, BAT.wing)}
      <path d="M150 190 L60 156 M146 210 L72 204 M150 226 L104 226 M250 190 L340 156 M254 210 L328 204 M250 226 L296 226" stroke="#6E5A62" stroke-width="5" stroke-linecap="round"/>
      ${shape(ears, BAT.ear)}
      <path d="M162 150 L156 112 L182 142 Z M238 150 L244 112 L218 142 Z" fill="#E8B4BC"/>
      ${shape(body, BAT.fur)}
      <ellipse cx="200" cy="200" rx="40" ry="34" fill="${BAT.face}"/>
      ${eye(m.eyes, 180, 194, 12, { lid: BAT.face })}${eye(m.eyes, 220, 194, 12, { lid: BAT.face })}
      <ellipse cx="200" cy="212" rx="9" ry="6" fill="${C.ink}"/>
      <path d="M190 222 Q200 230 210 222" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M196 224 L198 231 L200 224 Z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>
      <ellipse cx="166" cy="216" rx="11" ry="7" fill="${C.pink}"/><ellipse cx="234" cy="216" rx="11" ry="7" fill="${C.pink}"/>
      <path d="M182 282 l-6 12 M218 282 l6 12" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      ${m.snack ? droplet(200, 270, 0.8) : ''}
      ${m.hearts ? heart(300, 60, 40) + heart(70, 70, 28) : ''}
      ${deco(m, 252, 76, 28, 288, 50, 18)}`;
  },
};
ART.batHang = {
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    // Feet hooked at the top, wings wrapped like a little cloak, head at the bottom.
    const pod = '<path d="M200 70 C254 74 268 140 260 196 C254 236 232 262 200 266 C168 262 146 236 140 196 C132 140 146 74 200 70 Z"/>';
    const head = '<ellipse cx="200" cy="286" rx="46" ry="40"/>';
    const ears = '<path d="M168 300 L156 352 L190 318 Z"/><path d="M232 300 L244 352 L210 318 Z"/>';
    return `<path d="M184 74 l-6 -22 M216 74 l6 -22" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      ${shadow([pod, head, ears])}
      ${shape(pod, BAT.wing)}
      <path d="M200 84 C186 140 186 210 200 258 M172 96 C160 150 162 210 176 246 M228 96 C240 150 238 210 224 246" fill="none" stroke="#6E5A62" stroke-width="5" stroke-linecap="round"/>
      ${shape(ears, BAT.ear)}
      ${shape(head, BAT.fur)}
      <ellipse cx="200" cy="292" rx="34" ry="26" fill="${BAT.face}"/>
      ${eye(m.eyes, 184, 296, 10, { lid: BAT.face })}${eye(m.eyes, 216, 296, 10, { lid: BAT.face })}
      <ellipse cx="200" cy="280" rx="7" ry="5" fill="${C.ink}"/>
      <ellipse cx="170" cy="284" rx="9" ry="6" fill="${C.pink}"/><ellipse cx="230" cy="284" rx="9" ry="6" fill="${C.pink}"/>
      ${m.hearts ? heart(300, 120, 36) : ''}
      ${deco(m, 270, 150, 26, 304, 124, 18)}`;
  },
};

ART.turkey = {
  // A wild turkey, standing side-on facing left: tail fanned, bronze feathers, a bare
  // blue-and-red head with a wattle and a little snood over the beak.
  tint: C.yellowT,
  tilt: 0,
  shoulder: [0.56, 0.5],
  svg: (m) => {
    const fan = '<path d="M240 250 C200 182 214 80 280 50 C336 26 388 62 380 128 C374 188 318 246 240 250 Z"/>';
    const body = '<path d="M120 270 C110 210 170 176 236 182 C300 188 330 236 316 282 C304 322 250 338 196 332 C150 326 126 304 120 270 Z"/>';
    const neck = '<path d="M150 214 C140 190 132 160 134 130 L170 132 C168 160 174 186 186 206 Z"/>';
    const head = '<ellipse cx="146" cy="120" rx="30" ry="26"/>';
    const legs = 'M190 330 L184 372 M240 330 L246 372 M166 376 L184 366 L198 378 M232 378 L246 366 L262 376';
    return `<path d="${legs}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${legs}" fill="none" stroke="#C9A098" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      ${shadow([fan, body, neck, head])}
      ${shape(fan, '#7A5A3A')}
      <clipPath id="tk-fan">${fan}</clipPath>
      <g clip-path="url(#tk-fan)">
        <path d="M240 250 L240 0 M240 250 L310 0 M240 250 L390 20 M240 250 L400 110 M240 250 L400 190" stroke="#5E4428" stroke-width="5"/>
        <path d="M214 120 C240 56 324 18 378 74 C390 150 334 216 280 234" fill="none" stroke="#E8D2B0" stroke-width="16"/>
        <path d="M214 120 C240 56 324 18 378 74 C390 150 334 216 280 234" fill="none" stroke="#2E2E44" stroke-width="6" transform="translate(-10 10)"/>
      </g>
      ${fan.replace('/>', ` fill="none" ${OL}/>`)}
      ${shape(body, '#6E4A30')}
      <clipPath id="tk-body">${body}</clipPath>
      <g clip-path="url(#tk-body)">
        <path d="M150 230 q14 12 28 0 M186 220 q14 12 28 0 M222 216 q14 12 28 0 M258 222 q14 12 28 0 M170 262 q14 12 28 0 M206 256 q14 12 28 0 M242 256 q14 12 28 0 M280 262 q14 12 28 0" fill="none" stroke="#C9A060" stroke-width="5" stroke-linecap="round"/>
        <path d="M220 250 C260 240 300 250 320 280 C296 300 250 304 220 290 Z" fill="#5A3A24"/>
        <path d="M232 262 H304 M236 278 H300" stroke="#F4EDE4" stroke-width="5" opacity="0.8"/>
      </g>
      ${body.replace('/>', ` fill="none" ${OL}/>`)}
      <path d="M150 232 C156 252 160 268 156 286" stroke="#2E2E44" stroke-width="7" stroke-linecap="round" fill="none"/>
      ${shape(neck, '#C9D6F2')}
      <path d="M150 170 C142 190 140 204 146 214 C156 206 162 190 160 170 Z" fill="#E5484D" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      ${shape(head, '#9DB9F2')}
      <path d="M132 120 C120 128 112 150 116 160 C126 156 134 140 136 124 Z" fill="#E5484D" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      ${eye(m.eyes, 144, 112, 9, { lid: '#9DB9F2' })}
      <path d="M118 112 C108 112 98 118 94 124 C102 130 112 128 120 124 Z" fill="#E8C27A" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="162" cy="130" rx="9" ry="6" fill="${C.pink}"/>
      ${m.snack ? `<ellipse cx="88" cy="134" rx="10" ry="7" transform="rotate(-20 88 134)" fill="#D9954F" stroke="${C.ink}" stroke-width="5"/>` : ''}
      ${m.hearts ? heart(70, 40, 40) + heart(40, 120, 26) : ''}
      ${deco(m, 196, 48, 28, 232, 26, 18)}`;
  },
};

// Every neighbor in close-up scenes: which drawing, how they're posed, and where their
// feet are on the 400 canvas (as a fraction), so the scene can stand them on its branch,
// sidewalk, grass or water. Poses: perch (on a branch, ledge or wire), stand (on the
// ground), swim (at the waterline), wade (legs in the shallows), cling (to a trunk),
// fly (in the air) and web (in the middle of a web).
const P = (art, pose, feet = 0.815) => ({ art, pose, feet });
const CUTOUTS = {
  'rock-pigeon': P('pigeonBody', 'stand', 0.9),
  'house-sparrow': P('sparrow', 'perch'),
  'eastern-gray-squirrel': P('squirrelBody', 'stand', 0.9),
  'european-starling': P('starling', 'perch'),
  'mourning-dove': P('dove', 'perch'),
  'american-robin': P('robin', 'perch'),
  'herring-gull': P('gull', 'perch'),
  raccoon: P('raccoonBody', 'stand', 0.9),
  monarch: P('monarch', 'fly', 0.75),
  'red-tailed-hawk': P('redtailBody', 'perch', 0.84),
  'blue-jay': P('jay', 'perch'),
  'dark-eyed-junco': P('junco', 'perch'),
  'virginia-opossum': P('opossumBody', 'stand', 0.92),
  'american-crow': P('crow', 'perch'),
  'white-throated-sparrow': P('whitethroat', 'perch'),
  'chimney-swift': P('swift', 'fly', 0.6),
  moths: P('moth', 'fly', 0.75),
  'canada-goose': P('goose', 'stand', 0.935),
  mallard: P('mallard', 'swim', 0.74),
  brant: P('brant', 'swim', 0.74),
  'double-crested-cormorant': P('cormorant', 'stand', 0.81),
  // Wings spread to dry, for the slides that say so.
  'double-crested-cormorant:spread': P('cormorantSpread', 'stand', 0.81),
  'ring-billed-gull': P('ringbill', 'perch'),
  'common-tern': P('tern', 'perch'),
  'great-blue-heron': P('heron', 'wade', 0.82),
  'black-crowned-night-heron': P('nightheron', 'perch'),
  bufflehead: P('bufflehead', 'swim', 0.74),
  'mute-swan': P('swan', 'swim', 0.74),
  'red-winged-blackbird': P('redwing', 'perch'),
  'white-tailed-deer': P('deerBody', 'stand', 0.9),
  'northern-mockingbird': P('mockingbird', 'perch'),
  'northern-cardinal': P('cardinal', 'perch'),
  'common-grackle': P('grackle', 'perch'),
  'gray-catbird': P('catbird', 'perch'),
  'song-sparrow': P('songsparrow', 'perch'),
  'american-kestrel': P('kestrel', 'perch'),
  'coopers-hawk': P('coopersBody', 'perch', 0.84),
  'peregrine-falcon': P('peregrineBody', 'perch', 0.84),
  'downy-woodpecker': P('downy', 'cling', 0.9),
  'red-bellied-woodpecker': P('redbelly', 'cling', 0.9),
  'tufted-titmouse': P('titmouse', 'perch'),
  'hermit-thrush': P('thrush', 'perch'),
  'yellow-rumped-warbler': P('warbler', 'perch'),
  'common-eastern-bumble-bee': P('bumblebee', 'fly', 0.75),
  'western-honey-bee': P('honeybee', 'fly', 0.75),
  'eastern-carpenter-bee': P('carpenterbee', 'fly', 0.75),
  'common-eastern-firefly': P('firefly', 'fly', 0.75),
  'blue-dasher': P('dasher', 'fly', 0.75),
  'large-milkweed-bug': P('milkweedbug', 'fly', 0.85),
  'pond-slider': P('turtle', 'swim', 0.73),
  groundhog: P('groundhogBody', 'stand', 0.9),
  'orb-weavers': P('orbweaver', 'web', 0.8),
  // Little ones who don't look like their parents (the rest are drawn as small grown-ups).
  'mallard:young': P('duckling', 'swim', 0.74),
  'mute-swan:young': P('cygnet', 'swim', 0.74),
  'canada-goose:young': P('gosling', 'stand', 0.9),
  'herring-gull:young': P('gullChick', 'stand', 0.9),
  'ring-billed-gull:young': P('gullChick', 'stand', 0.9),
  'common-tern:young': P('ternChick', 'stand', 0.9),
  'white-tailed-deer:young': P('fawn', 'stand', 0.9),
  'red-fox': P('fox', 'stand', 0.9),
  coyote: P('coyote', 'stand', 0.92),
  'eastern-cottontail': P('rabbit', 'stand', 0.88),
  bats: P('bat', 'fly', 0.75),
  // Bats sleep hanging upside down, wings wrapped.
  'bats:hang': P('batHang', 'fly', 0.9),
  'wild-turkey': P('turkey', 'stand', 0.93),
};

// Species id → drawing.
const SPECIES = {
  'rock-pigeon': 'pigeon',
  'house-sparrow': 'sparrow',
  raccoon: 'raccoon',
  'eastern-gray-squirrel': 'squirrel',
  'american-crow': 'crow',
  'american-robin': 'robin',
  'northern-cardinal': 'cardinal',
  'mourning-dove': 'dove',
  'european-starling': 'starling',
  'canada-goose': 'goose',
  mallard: 'mallard',
  'blue-jay': 'jay',
  'herring-gull': 'gull',
  'dark-eyed-junco': 'junco',
  'white-throated-sparrow': 'whitethroat',
  'song-sparrow': 'songsparrow',
  'northern-mockingbird': 'mockingbird',
  'gray-catbird': 'catbird',
  'red-winged-blackbird': 'redwing',
  'common-grackle': 'grackle',
  'tufted-titmouse': 'titmouse',
  'hermit-thrush': 'thrush',
  'yellow-rumped-warbler': 'warbler',
  'ring-billed-gull': 'ringbill',
  'downy-woodpecker': 'downy',
  'red-bellied-woodpecker': 'redbelly',
  'chimney-swift': 'swift',
  'red-tailed-hawk': 'redtail',
  'coopers-hawk': 'coopers',
  'american-kestrel': 'kestrel',
  'peregrine-falcon': 'peregrine',
  'common-tern': 'tern',
  'black-crowned-night-heron': 'nightheron',
  brant: 'brant',
  bufflehead: 'bufflehead',
  'mute-swan': 'swan',
  'double-crested-cormorant': 'cormorant',
  'great-blue-heron': 'heron',
  'virginia-opossum': 'opossum',
  'white-tailed-deer': 'deer',
  groundhog: 'groundhog',
  'red-fox': 'fox',
  coyote: 'coyote',
  'eastern-cottontail': 'rabbit',
  bats: 'bat',
  'wild-turkey': 'turkey',
  'pond-slider': 'turtle',
  'common-eastern-bumble-bee': 'bumblebee',
  'western-honey-bee': 'honeybee',
  'eastern-carpenter-bee': 'carpenterbee',
  monarch: 'monarch',
  moths: 'moth',
  'common-eastern-firefly': 'firefly',
  'blue-dasher': 'dasher',
  'large-milkweed-bug': 'milkweedbug',
  'orb-weavers': 'orbweaver',
};

// Smaller strings for the app: one space at most, none between tags, and coordinates
// rounded to a tenth of a point (invisible on a 400-point canvas).
const tidy = (svg) =>
  svg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/-?\d+\.\d{2,}/g, (n) => String(Math.round(Number(n) * 10) / 10));

const draw = (a, m) =>
  tidy(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${a.tint}"/><g transform="rotate(${a.tilt} 200 220)">${a.svg(m)}</g></svg>`);

// A cutout: no background, no tilt, no perch (the close-up scene draws those).
const drawCut = (a, m) => tidy(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${a.svg({ ...m, cut: true })}</svg>`);

// Most of a mood's drawing is the same as the hello drawing: only the eyes and what
// floats by the head change. So each frame is stored as a patch on the species' hello
// drawing: [characters kept from the start, the new middle, characters kept from the
// end]. src/components/characters/frames.ts rebuilds them on the phone, and gives each
// frame its own clip-path ids there (two drawings on screen sharing an id can grab each
// other's shapes, so a blink would nudge a wing or tail patch).
const patch = (base, svg) => {
  let a = 0;
  while (a < base.length && a < svg.length && base[a] === svg[a]) a++;
  let b = 0;
  while (b < base.length - a && b < svg.length - a && base[base.length - 1 - b] === svg[svg.length - 1 - b]) b++;
  return [a, svg.slice(a, svg.length - b), b];
};
const framesOf = (render) => {
  const base = render(MOODS[0]);
  return {
    base,
    frames: MOODS.map((m) => ({
      mood: m.name,
      open: patch(base, render(m)),
      // A blink frame for moods with open eyes.
      ...(BLINKS.includes(m.eyes) ? { shut: patch(base, render({ ...m, eyes: 'shut' })) } : {}),
    })),
  };
};

const characters = {};
for (const [id, key] of Object.entries(SPECIES)) characters[id] = framesOf((m) => draw(ART[key], m));

const cutouts = {};
for (const [id, { art, pose, feet }] of Object.entries(CUTOUTS)) {
  cutouts[id] = {
    feet,
    pose,
    ...(ART[art].shoulder ? { shoulder: ART[art].shoulder.map((v) => Math.round(v * 1000) / 1000) } : {}),
    ...framesOf((m) => drawCut(ART[art], m)),
  };
}

module.exports = { characters, cutouts, MOODS };

if (require.main === module) {
  const file = path.join(__dirname, '..', 'src', 'components', 'characters', 'xml.ts');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `// Generated by scripts/build_characters.js. Do not edit by hand.\n\n` +
      `/** [characters kept from the start of the base drawing, the new middle, characters kept from the end]. */\n` +
      `export type Patch = [number, string, number];\n` +
      `export type PatchedFrame = { mood: string; open: Patch; shut?: Patch };\n` +
      `export type Drawings = { base: string; frames: PatchedFrame[] };\n\n` +
      `export const characterXml: Record<string, Drawings> = ${JSON.stringify(characters)};\n\n` +
      `/** Close-up scene versions: no background or perch; \`feet\` is where they stand, as a fraction of the height. */\n` +
      `export const cutoutXml: Record<string, Drawings & { feet: number; pose: 'perch' | 'stand' | 'swim' | 'wade' | 'cling' | 'fly' | 'web'; shoulder?: [number, number] }> = ${JSON.stringify(cutouts)};\n`,
  );
  console.log(`wrote ${Object.keys(characters).length} neighbors × ${MOODS.length} moods`);
}
