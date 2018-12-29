'use strict';

import getColorPalette from './color-thief';

const PALETTESIZE = 4;

export default function(img, debug) {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, w, h);
    
  const tl = getColorPalette(context.getImageData(0, 0, w / 2, h / 2).data, PALETTESIZE);
  const tr = getColorPalette(context.getImageData(w / 2, 0, w / 2, h / 2).data, PALETTESIZE);
  const bl = getColorPalette(context.getImageData(0, h / 2, w / 2, h / 2).data, PALETTESIZE);
  const br = getColorPalette(context.getImageData(w / 2, h / 2, w / 2, h / 2).data, PALETTESIZE);
  const palette = getColorPalette(context.getImageData(0, 0, w, h).data, PALETTESIZE).map(toHex);
  const background = palette[0];
  
  const distances = [
    getDistance(tl[0], bl[0]),
    getDistance(tl[0], tr[0]),
    getDistance(tl[0], br[0]),
    getDistance(bl[0], tr[0]),
    getDistance(tr[0], br[0]),
    getDistance(bl[0], br[0]),
  ];

  const colors = [
    [tl[0], bl[0]],
    [tl[0], tr[0]],
    [tl[0], br[0]],
    [bl[0], tr[0]],
    [tr[0], br[0]],
    [bl[0], br[0]],
  ];

  const directions = [
    'to bottom',
    'to right',
    '135deg',
    '45deg',
    'to bottom',
    'to right',
  ];

  const furthest = Math.max.apply(null, distances);
  const idx = distances.findIndex((el, idx) => el === furthest);
  const gradient = `linear-gradient(${directions[idx]}, ${toHex(colors[idx][0])} 0%, ${toHex(colors[idx][1])} 100%)`;
  
  if (debug) {
    const res = [];
    res.push(background);
    res.push(gradient);
    const pretty = `linear-gradient(\n  ${directions[idx]},\n  ${toHex(colors[idx][0])} 0%,\n  ${toHex(colors[idx][1])} 100%\n);`;
    return {
      css: res,
      palettes: {
        topleft: tl.map(toHex),
        topright: tr.map(toHex),
        bottomleft: bl.map(toHex),
        bottomright: br.map(toHex),
        overall: palette,
      },
      pretty,
    };    
  }

  const css = `background: ${background}; background: ${gradient}`;
  return {
    css,
    background,
    gradient,
  };
}

function toHex(rgb) {
  let r = Number(rgb[0]).toString(16);
  let g = Number(rgb[1]).toString(16);
  let b = Number(rgb[2]).toString(16);
  if (r.length === 1) r = '0' + r;
  if (g.length === 1) g = '0' + g;
  if (b.length === 1) b = '0' + b;
  return '#' + r + g + b;
}

function getDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb2[0] - rgb1[0], 2),
    Math.pow(rgb2[1] - rgb1[1], 2),
    Math.pow(rgb2[2] - rgb1[2], 2)
  );
}
