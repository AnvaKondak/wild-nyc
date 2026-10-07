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

// ── Little birds: one perched, three-quarter pose (the sparrow's), each with their
// own colors, markings, beak and snack. Coordinates match the sparrow above.
const PERCH_BODY = 'M96 236 C96 166 166 134 238 142 C320 152 352 222 332 282 C312 334 232 348 172 334 C120 322 96 284 96 236 Z';
const PERCH_WING = 'M206 150 C290 140 352 196 350 262 C334 306 290 318 236 306 C214 272 198 214 206 150 Z';
const dots = (pts, r, fill) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const perched = (p) => ({
  tint: p.tint,
  tilt: 0,
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
    return `${perch}
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
      ${m.zees ? zee(270, 50, 40) + zee(326, 10, 28) : ''}
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
  snack: `<path d="M48 158 c-12 12 10 22 -2 34 c-12 12 10 22 -2 32" fill="none" stroke="${C.ink}" stroke-width="15" stroke-linecap="round"/><path d="M48 158 c-12 12 10 22 -2 34 c-12 12 10 22 -2 32" fill="none" stroke="#F28BA0" stroke-width="7" stroke-linecap="round"/>`,
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
  snack: `<g transform="rotate(-14 30 176)"><path d="M6 176 C16 164 40 164 52 176 C40 188 16 188 6 176 Z M52 176 L66 166 L66 186 Z" fill="#B4C3D6" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><circle cx="16" cy="174" r="3" fill="${C.ink}"/></g>`,
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
  snack: `<g transform="rotate(-20 20 166)"><ellipse cx="20" cy="166" rx="16" ry="11" fill="#3E8E4E" stroke="${C.ink}" stroke-width="6"/><path d="M20 156 V176" stroke="${C.ink}" stroke-width="4"/></g>`,
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
  snack: `<g transform="rotate(-14 30 178)"><path d="M6 178 C16 166 40 166 52 178 C40 190 16 190 6 178 Z M52 178 L66 168 L66 188 Z" fill="#B4C3D6" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><circle cx="16" cy="176" r="3" fill="${C.ink}"/></g>`,
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
    return `<rect x="276" y="-10" width="140" height="420" fill="#9A6A44"/><path d="M276 -10 V410" stroke="${C.ink}" stroke-width="10"/>
      <path d="M320 40 C316 90 326 130 318 180 M360 200 C354 250 366 290 356 350 M338 300 V380" fill="none" stroke="#7A4E2A" stroke-width="8" stroke-linecap="round"/>
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
      ${m.snack ? `<path d="M64 140 C54 146 52 160 62 166 C72 172 82 164 78 154" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/><path d="M64 140 C54 146 52 160 62 166 C72 172 82 164 78 154" fill="none" stroke="#F4E7C8" stroke-width="8" stroke-linecap="round"/>` : ''}
      ${m.hearts ? heart(60, 56, 40) + heart(108, 26, 28) : ''}
      ${m.zees ? zee(48, 62, 32) + zee(92, 34, 22) : ''}`;
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
      ${m.snack ? `<circle cx="34" cy="210" r="7" fill="${C.ink}"/><path d="M30 204 C22 192 14 196 18 206 M38 204 C46 192 54 196 50 206" fill="#F4F2F0" stroke="${C.ink}" stroke-width="4"/>` : ''}
      ${m.hearts ? heart(70, 70, 42) + heart(130, 40, 28) : ''}
      ${m.zees ? zee(80, 80, 34) + zee(124, 50, 22) : ''}`;
  },
};

// Hawks and falcons: hooked beak with a yellow base. Their snack is a feather for the
// nest (or, for kestrels, a grasshopper), never prey.
const HOOK = 'M98 126 C84 118 60 126 50 146 C48 160 58 168 66 162 C66 152 76 150 98 162 Z';
const CERE = '<path d="M98 128 C92 126 86 130 84 140 C88 150 94 156 98 158 Z" fill="#F2C94C" stroke="#1A1A2E" stroke-width="6"/>';
const feather = (x = 44, y = 168) => `<g transform="rotate(-30 ${x} ${y})"><path d="M${x - 30} ${y} C${x - 10} ${y - 14} ${x + 14} ${y - 12} ${x + 30} ${y} C${x + 14} ${y + 12} ${x - 10} ${y + 14} ${x - 30} ${y} Z" fill="#F4F2F0" stroke="#1A1A2E" stroke-width="6"/><path d="M${x - 34} ${y} H${x + 30}" stroke="#1A1A2E" stroke-width="4"/></g>`;
const fishSnack = (x = 30, y = 178) => `<g transform="rotate(-14 ${x} ${y})"><path d="M${x - 24} ${y} C${x - 14} ${y - 12} ${x + 10} ${y - 12} ${x + 22} ${y} C${x + 10} ${y + 12} ${x - 14} ${y + 12} ${x - 24} ${y} Z M${x + 22} ${y} L${x + 36} ${y - 10} L${x + 36} ${y + 10} Z" fill="#B4C3D6" stroke="#1A1A2E" stroke-width="6" stroke-linejoin="round"/><circle cx="${x - 14}" cy="${y - 2}" r="3" fill="#1A1A2E"/></g>`;

ART.redtail = perched({
  id: 'redtail', tint: C.yellowT,
  headAt: [150, 150, 86], eyeAt: [134, 138, 22],
  back: '#7A5236', breast: '#F4EDE4', wing: '#6A4630', tail: '#C0532E', head: '#8A5E40',
  underside: dots([[104, 286], [124, 296], [146, 302], [168, 306], [116, 312], [140, 318], [190, 308]], 8, '#6A4630'),
  tailMarks: `<path d="M318 300 L384 318" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
  wingMarks: dots([[246, 210], [276, 204], [262, 244], [294, 238], [282, 274]], 7, '#B9946E'),
  face: '<path d="M90 176 C104 170 128 174 140 188 C138 204 120 212 104 208 C96 200 92 190 90 176 Z" fill="#F4EDE4"/>',
  beakShape: HOOK, beak: '#5E5E6E', beakMarks: CERE, legs: '#F2C94C', snack: feather(),
});

ART.coopers = perched({
  id: 'coopers', tint: C.blueT,
  headAt: [150, 150, 84], eyeAt: [134, 138, 18], eyeRing: '#E5484D',
  back: '#5E6A80', breast: '#F4EDE4', wing: '#556075', tail: '#5E6A80', head: '#C9B8AE',
  tailShape: '<path d="M300 256 L404 284 L400 318 L294 302 Z"/>',
  tailMarks: `<path d="M330 268 l-6 30 M356 276 l-6 30 M382 284 l-6 28" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M398 290 L394 314" stroke="#F4F2F0" stroke-width="7"/>`,
  underside: `<path d="M96 224 H210 M92 248 H210 M94 272 H210 M100 296 H210 M110 320 H210" stroke="#D9774A" stroke-width="9" stroke-linecap="round"/>`,
  headMarks: '<path d="M50 50 H260 V118 C210 100 160 96 60 112 Z" fill="#3B4256"/>',
  beakShape: HOOK, beak: '#3B3A50', beakMarks: CERE, legs: '#F2C94C', snack: feather(),
});

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
  snack: `<g transform="rotate(-24 40 170)"><ellipse cx="40" cy="170" rx="26" ry="9" fill="#7FBF5A" stroke="${C.ink}" stroke-width="6"/><path d="M50 166 L68 150 L74 170 M30 174 L22 190" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/></g>`,
});

ART.peregrine = perched({
  id: 'peregrine', tint: C.yellowT, rail: true,
  headAt: [150, 150, 84], eyeAt: [132, 138, 19], eyeRing: '#F2C94C', lid: C.ink,
  back: '#5E6A80', breast: '#F4F2F0', wing: '#4E5A70', tail: '#4E5A70', head: '#F4F2F0',
  underside: `<path d="M100 270 H220 M104 292 H220 M112 314 H220" stroke="#3B4256" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 10"/>`,
  tailMarks: `<path d="M330 268 l-6 28 M358 276 l-6 28" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
  headMarks: `<path d="M40 40 H260 V200 C230 180 214 150 196 140 C170 130 140 128 110 132 L40 140 Z" fill="${C.ink}"/>`,
  face: `<path d="M116 150 C128 170 132 196 126 222 L150 216 C154 192 150 166 140 148 Z" fill="${C.ink}"/>`,
  blushAt: [172, 196],
  beakShape: HOOK, beak: '#3B3A50', beakMarks: CERE, legs: '#F2C94C', snack: feather(),
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
  legs: '#E5484D', snack: fishSnack(26, 176),
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
  snack: fishSnack(22, 174),
});

// ── Water birds with their own poses.
ART.goose = {
  // Standing on the grass: plump brown body, long black neck, white chin strap.
  tint: C.blueT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M120 262 C120 202 200 178 280 188 C350 198 386 242 372 288 C358 328 290 342 220 336 C160 330 120 306 120 262 Z"/>';
    const tail = '<path d="M352 230 L392 214 L396 250 L366 262 Z"/>';
    const neck = '<path d="M126 256 C108 204 102 150 112 108 L166 110 C156 150 160 200 180 238 Z"/>';
    const head = '<ellipse cx="128" cy="96" rx="54" ry="44"/>';
    return `<rect x="-10" y="336" width="420" height="80" fill="#8BC27A"/><path d="M-10 336 H410" stroke="${C.ink}" stroke-width="10"/>
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
      ${m.zees ? zee(250, 64, 34) + zee(292, 34, 22) : ''}`;
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
        <path d="M262 246 L322 246 L318 262 L258 262 Z" fill="#4A4FD6" stroke="#F7F5F2" stroke-width="5"/>
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
      <path d="M-10 296 Q40 282 90 296 T190 296 T290 296 T390 296 T490 296 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/>
      <path d="M40 330 q20 -10 40 0 M180 346 q20 -10 40 0 M300 328 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>
      ${m.hearts ? heart(300, 50, 46) + heart(352, 112, 30) : ''}
      ${m.zees ? zee(250, 64, 34) + zee(292, 34, 22) : ''}`;
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
      ${m.zees ? zee(184, 96, 28) + zee(222, 70, 20) : ''}`;
  },
};

// ── More water birds.
const WATER = `<path d="M-10 296 Q40 282 90 296 T190 296 T290 296 T390 296 T490 296 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/><path d="M40 330 q20 -10 40 0 M180 346 q20 -10 40 0 M300 328 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>`;
const UP_RIGHT = (m) => `${m.hearts ? heart(300, 50, 46) + heart(352, 112, 30) : ''}${m.zees ? zee(250, 64, 34) + zee(292, 34, 22) : ''}`;

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
      ${WATER}
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
      ${shape(body, '#F7F5F2')}
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="42" stroke-linecap="round"/>
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
      ${WATER}
      ${UP_RIGHT(m)}`;
  },
};

ART.cormorant = {
  // Standing on a post, wings spread out to dry.
  tint: C.yellowT,
  tilt: 0,
  svg: (m) => {
    const wingL = '<path d="M164 206 C114 156 54 156 12 196 C42 214 62 252 72 292 C112 272 150 262 172 252 Z"/>';
    const wingR = '<path d="M236 206 C286 156 346 156 388 196 C358 214 338 252 328 292 C288 272 250 262 228 252 Z"/>';
    const body = '<ellipse cx="200" cy="250" rx="58" ry="88"/>';
    const head = '<ellipse cx="170" cy="100" rx="40" ry="32"/>';
    const neckLine = 'M200 186 C196 156 186 132 176 112';
    return `<rect x="168" y="322" width="64" height="100" fill="#9A6A44" stroke="${C.ink}" stroke-width="9"/><ellipse cx="200" cy="322" rx="32" ry="10" fill="#B9875E" stroke="${C.ink}" stroke-width="8"/>
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
      ${m.snack ? fishSnack(64, 120) : ''}
      ${m.hearts ? heart(252, 26, 36) + heart(296, 64, 24) : ''}
      ${m.zees ? zee(222, 44, 30) + zee(258, 22, 20) : ''}`;
  },
};

ART.heron = {
  // Tall in the shallows: blue-gray, S neck, black head stripe and plume, dagger bill.
  tint: C.pinkT,
  tilt: 0,
  svg: (m) => {
    const body = '<path d="M150 222 C150 182 210 162 270 168 C330 174 362 208 352 242 C342 272 292 286 232 282 C182 278 150 256 150 222 Z"/>';
    const tail = '<path d="M336 226 L386 252 L344 262 Z"/>';
    const head = '<ellipse cx="128" cy="92" rx="40" ry="30"/>';
    const neckLine = 'M176 210 C138 176 172 136 152 108';
    return `<path d="M222 276 L214 346 M252 278 L258 346" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
      <path d="M222 276 L214 346 M252 278 L258 346" stroke="#8A7356" stroke-width="7" stroke-linecap="round"/>
      ${shadow([tail, body, head])}
      ${shape(tail, '#5E6E8E')}
      ${shape(body, '#7D8FAE')}
      <path d="M210 196 C256 182 312 190 340 222 C306 246 252 248 214 236 Z" fill="#5E6E8E"/>
      <path d="M170 236 C176 252 186 262 200 268 M184 232 C190 248 200 258 214 264" fill="none" stroke="#C9D3E3" stroke-width="7" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="${C.ink}" stroke-width="38" stroke-linecap="round"/>
      <path d="${neckLine}" fill="none" stroke="#B8C3D6" stroke-width="22" stroke-linecap="round"/>
      <path d="M160 196 C148 180 150 160 156 144" fill="none" stroke="#5E4A3A" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 8"/>
      ${shape(head, '#F4F2F0')}
      <path d="M108 74 C130 66 160 70 168 82 C150 82 130 82 112 86 Z" fill="${C.ink}"/>
      <path d="M160 80 C186 78 210 86 228 100" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      ${eye(m.eyes, 118, 92, 12, { ring: '#F2E28C', lid: '#F4F2F0' })}
      <ellipse cx="140" cy="108" rx="12" ry="7" fill="${C.pink}"/>
      <path d="M96 88 C80 86 46 92 8 102 C46 108 80 108 98 102 Z" fill="#F2C94C" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
      ${m.snack ? fishSnack(24, 116) : ''}
      <path d="M-10 330 Q40 318 90 330 T190 330 T290 330 T390 330 T490 330 V420 H-10 Z" fill="#8FB3E8" stroke="${C.ink}" stroke-width="8"/>
      <path d="M60 360 q20 -10 40 0 M260 366 q20 -10 40 0" fill="none" stroke="#F7F5F2" stroke-width="6" stroke-linecap="round"/>
      ${UP_RIGHT(m)}`;
  },
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
};

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
