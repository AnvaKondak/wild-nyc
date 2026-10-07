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
    return `<path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/>
      <path d="M0 334 C120 326 280 326 400 338" fill="none" stroke="#9A6A44" stroke-width="12" stroke-linecap="round"/>
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
