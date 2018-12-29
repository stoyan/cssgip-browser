(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _index = _interopRequireDefault(require("../index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.gip = (img, debug) => {
  return (0, _index.default)(img, debug);
};

},{"../index":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * This is adopted from `color-thief` and its dependencies `quantize` and `MMCQ`
 * Mostly as-is except for minor lint fixes and stripping unused code
 */

/*!
 * quantize.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * @license
 */
// fill out a couple protovis dependencies

/*!
 * Block below copied from Protovis: http://mbostock.github.com/protovis/
 * Copyright 2010 Stanford Visualization Group
 * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
 * @license
 */
const pv = {
  map(array, f) {
    const o = {};
    return f ? array.map((d, i) => {
      o.index = i;
      return f.call(o, d);
    }) : array.slice();
  },

  naturalOrder(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  },

  sum(array, f) {
    const o = {};
    return array.reduce(f ? (p, d, i) => {
      o.index = i;
      return p + f.call(o, d);
    } : (p, d) => {
      return p + d;
    }, 0);
  },

  max(array, f) {
    return Math.max.apply(null, f ? pv.map(array, f) : array);
  }

};
/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.com/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 *
 * @author Nick Rabinowitz
 * @example

// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                // etc
                ];
var maxColors = 4;

var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) {
    return cmap.map(p);
});

 */

var MMCQ = function () {
  // private constants
  var sigbits = 5,
      rshift = 8 - sigbits,
      maxIterations = 1000,
      fractByPopulations = 0.75; // get reduced-space color index for a pixel

  function getColorIndex(r, g, b) {
    return (r << 2 * sigbits) + (g << sigbits) + b;
  } // Simple priority queue


  function PQueue(comparator) {
    var contents = [],
        sorted = false;

    function sort() {
      contents.sort(comparator);
      sorted = true;
    }

    return {
      push: function (o) {
        contents.push(o);
        sorted = false;
      },
      peek: function (index) {
        if (!sorted) sort();
        if (index === undefined) index = contents.length - 1;
        return contents[index];
      },
      pop: function () {
        if (!sorted) sort();
        return contents.pop();
      },
      size: function () {
        return contents.length;
      },
      map: function (f) {
        return contents.map(f);
      },
      debug: function () {
        if (!sorted) sort();
        return contents;
      }
    };
  } // 3d color space box


  function VBox(r1, r2, g1, g2, b1, b2, histo) {
    var vbox = this;
    vbox.r1 = r1;
    vbox.r2 = r2;
    vbox.g1 = g1;
    vbox.g2 = g2;
    vbox.b1 = b1;
    vbox.b2 = b2;
    vbox.histo = histo;
  }

  VBox.prototype = {
    volume: function (force) {
      var vbox = this;

      if (!vbox._volume || force) {
        vbox._volume = (vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1);
      }

      return vbox._volume;
    },
    count: function (force) {
      var vbox = this,
          histo = vbox.histo;

      if (!vbox._count_set || force) {
        var npix = 0,
            index,
            i,
            j,
            k;

        for (i = vbox.r1; i <= vbox.r2; i++) {
          for (j = vbox.g1; j <= vbox.g2; j++) {
            for (k = vbox.b1; k <= vbox.b2; k++) {
              index = getColorIndex(i, j, k);
              npix += histo[index] || 0;
            }
          }
        }

        vbox._count = npix;
        vbox._count_set = true;
      }

      return vbox._count;
    },
    copy: function () {
      var vbox = this;
      return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
    },
    avg: function (force) {
      var vbox = this,
          histo = vbox.histo;

      if (!vbox._avg || force) {
        var ntot = 0,
            mult = 1 << 8 - sigbits,
            rsum = 0,
            gsum = 0,
            bsum = 0,
            hval,
            i,
            j,
            k,
            histoindex;

        for (i = vbox.r1; i <= vbox.r2; i++) {
          for (j = vbox.g1; j <= vbox.g2; j++) {
            for (k = vbox.b1; k <= vbox.b2; k++) {
              histoindex = getColorIndex(i, j, k);
              hval = histo[histoindex] || 0;
              ntot += hval;
              rsum += hval * (i + 0.5) * mult;
              gsum += hval * (j + 0.5) * mult;
              bsum += hval * (k + 0.5) * mult;
            }
          }
        }

        if (ntot) {
          vbox._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
        } else {
          //                    console.log('empty box');
          vbox._avg = [~~(mult * (vbox.r1 + vbox.r2 + 1) / 2), ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2), ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)];
        }
      }

      return vbox._avg;
    },
    contains: function (pixel) {
      const vbox = this;
      const rval = pixel[0] >> rshift;
      const gval = pixel[1] >> rshift;
      const bval = pixel[2] >> rshift;
      return rval >= vbox.r1 && rval <= vbox.r2 && gval >= vbox.g1 && gval <= vbox.g2 && bval >= vbox.b1 && bval <= vbox.b2;
    }
  }; // Color map

  function CMap() {
    this.vboxes = new PQueue(function (a, b) {
      return pv.naturalOrder(a.vbox.count() * a.vbox.volume(), b.vbox.count() * b.vbox.volume());
    });
  }

  CMap.prototype = {
    push: function (vbox) {
      this.vboxes.push({
        vbox: vbox,
        color: vbox.avg()
      });
    },
    palette: function () {
      return this.vboxes.map(function (vb) {
        return vb.color;
      });
    },
    size: function () {
      return this.vboxes.size();
    },
    map: function (color) {
      var vboxes = this.vboxes;

      for (var i = 0; i < vboxes.size(); i++) {
        if (vboxes.peek(i).vbox.contains(color)) {
          return vboxes.peek(i).color;
        }
      }

      return this.nearest(color);
    },
    nearest: function (color) {
      var vboxes = this.vboxes,
          d1,
          d2,
          pColor;

      for (var i = 0; i < vboxes.size(); i++) {
        d2 = Math.sqrt(Math.pow(color[0] - vboxes.peek(i).color[0], 2) + Math.pow(color[1] - vboxes.peek(i).color[1], 2) + Math.pow(color[2] - vboxes.peek(i).color[2], 2));

        if (d2 < d1 || d1 === undefined) {
          d1 = d2;
          pColor = vboxes.peek(i).color;
        }
      }

      return pColor;
    },
    forcebw: function () {
      // XXX: won't  work yet
      var vboxes = this.vboxes;
      vboxes.sort(function (a, b) {
        return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
      }); // force darkest color to black if everything < 5

      var lowest = vboxes[0].color;
      if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5) vboxes[0].color = [0, 0, 0]; // force lightest color to white if everything > 251

      var idx = vboxes.length - 1,
          highest = vboxes[idx].color;
      if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251) vboxes[idx].color = [255, 255, 255];
    }
  }; // histo (1-d array, giving the number of pixels in
  // each quantized region of color space), or null on error

  function getHisto(pixels) {
    const histosize = 1 << 3 * sigbits;
    const histo = new Array(histosize);
    pixels.forEach(function (pixel) {
      const rval = pixel[0] >> rshift;
      const gval = pixel[1] >> rshift;
      const bval = pixel[2] >> rshift;
      const index = getColorIndex(rval, gval, bval);
      histo[index] = (histo[index] || 0) + 1;
    });
    return histo;
  }

  function vboxFromPixels(pixels, histo) {
    var rmin = 1000000,
        rmax = 0,
        gmin = 1000000,
        gmax = 0,
        bmin = 1000000,
        bmax = 0,
        rval,
        gval,
        bval; // find min/max

    pixels.forEach(function (pixel) {
      rval = pixel[0] >> rshift;
      gval = pixel[1] >> rshift;
      bval = pixel[2] >> rshift;
      if (rval < rmin) rmin = rval;else if (rval > rmax) rmax = rval;
      if (gval < gmin) gmin = gval;else if (gval > gmax) gmax = gval;
      if (bval < bmin) bmin = bval;else if (bval > bmax) bmax = bval;
    });
    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
  }

  function medianCutApply(histo, vbox) {
    if (!vbox.count()) return;
    var rw = vbox.r2 - vbox.r1 + 1,
        gw = vbox.g2 - vbox.g1 + 1,
        bw = vbox.b2 - vbox.b1 + 1,
        maxw = pv.max([rw, gw, bw]); // only one pixel, no split

    if (vbox.count() === 1) {
      return [vbox.copy()];
    }
    /* Find the partial sum arrays along the selected axis. */


    var total = 0,
        partialsum = [],
        lookaheadsum = [],
        i,
        j,
        k,
        sum,
        index;

    if (maxw === rw) {
      for (i = vbox.r1; i <= vbox.r2; i++) {
        sum = 0;

        for (j = vbox.g1; j <= vbox.g2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(i, j, k);
            sum += histo[index] || 0;
          }
        }

        total += sum;
        partialsum[i] = total;
      }
    } else if (maxw === gw) {
      for (i = vbox.g1; i <= vbox.g2; i++) {
        sum = 0;

        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(j, i, k);
            sum += histo[index] || 0;
          }
        }

        total += sum;
        partialsum[i] = total;
      }
    } else {
      /* maxw === bw */
      for (i = vbox.b1; i <= vbox.b2; i++) {
        sum = 0;

        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.g1; k <= vbox.g2; k++) {
            index = getColorIndex(j, k, i);
            sum += histo[index] || 0;
          }
        }

        total += sum;
        partialsum[i] = total;
      }
    }

    partialsum.forEach(function (d, i) {
      lookaheadsum[i] = total - d;
    });

    function doCut(color) {
      var dim1 = color + '1',
          dim2 = color + '2',
          left,
          right,
          vbox1,
          vbox2,
          d2,
          count2 = 0;

      for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
        if (partialsum[i] > total / 2) {
          vbox1 = vbox.copy();
          vbox2 = vbox.copy();
          left = i - vbox[dim1];
          right = vbox[dim2] - i;
          if (left <= right) d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2)); // avoid 0-count boxes

          while (!partialsum[d2]) d2++;

          count2 = lookaheadsum[d2];

          while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2]; // set dimensions


          vbox1[dim2] = d2;
          vbox2[dim1] = vbox1[dim2] + 1; //                    console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());

          return [vbox1, vbox2];
        }
      }
    } // determine the cut planes


    return maxw === rw ? doCut('r') : maxw === gw ? doCut('g') : doCut('b');
  }

  function quantize(pixels, maxcolors) {
    // short-circuit
    if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
      //            console.log('wrong number of maxcolors');
      return false;
    } // XXX: check color content and convert to grayscale if insufficient


    var histo = getHisto(pixels); // check that we aren't below maxcolors already

    var nColors = 0;
    histo.forEach(function () {
      nColors++;
    });

    if (nColors <= maxcolors) {} // XXX: generate the new colors from the histo and return
    // get the beginning vbox from the colors


    var vbox = vboxFromPixels(pixels, histo),
        pq = new PQueue(function (a, b) {
      return pv.naturalOrder(a.count(), b.count());
    });
    pq.push(vbox); // inner function to do the iteration

    function iter(lh, target) {
      var ncolors = 1,
          niters = 0,
          vbox;

      while (niters < maxIterations) {
        vbox = lh.pop();

        if (!vbox.count()) {
          /* just put it back */
          lh.push(vbox);
          niters++;
          continue;
        } // do the cut


        var vboxes = medianCutApply(histo, vbox),
            vbox1 = vboxes[0],
            vbox2 = vboxes[1];

        if (!vbox1) {
          //                    console.log("vbox1 not defined; shouldn't happen!");
          return;
        }

        lh.push(vbox1);

        if (vbox2) {
          /* vbox2 can be null */
          lh.push(vbox2);
          ncolors++;
        }

        if (ncolors >= target) return;

        if (niters++ > maxIterations) {
          //                    console.log("infinite loop; perhaps too few pixels!");
          return;
        }
      }
    } // first set of colors, sorted by population


    iter(pq, fractByPopulations * maxcolors); // Re-sort by the product of pixel occupancy times the size in color space.

    var pq2 = new PQueue(function (a, b) {
      return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
    });

    while (pq.size()) {
      pq2.push(pq.pop());
    } // next set - generate the median cuts using the (npix * vol) sorting.


    iter(pq2, maxcolors - pq2.size()); // calculate the actual colors

    var cmap = new CMap();

    while (pq2.size()) {
      cmap.push(pq2.pop());
    }

    return cmap;
  }

  return {
    quantize: quantize
  };
}();
/*
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright 2011, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */

/*
 * getPalette(sourceImage[, colorCount, quality])
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
 *
 * colorCount determines the size of the palette; the number of colors returned. If not set, it
 * defaults to 10.
 *
 * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
 *
 * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster the palette generation but the greater the likelihood that colors will be missed.
 *
 *
 */


function getColorPalette(imageData, colorCount, quality) {
  if (typeof colorCount === 'undefined' || colorCount < 2 || colorCount > 256) {
    colorCount = 10;
  }

  if (typeof quality === 'undefined' || quality < 1) {
    quality = 10;
  }

  var pixels = imageData;
  var pixelCount = imageData.length; // Store the RGB values in an array format suitable for quantize function

  var pixelArray = [];

  for (var i = 0, offset, r, g, b, a; i < pixelCount; i += 4 * quality) {
    offset = i * 4;
    r = pixels[offset + 0];
    g = pixels[offset + 1];
    b = pixels[offset + 2];
    a = pixels[offset + 3]; // If pixel is mostly opaque and not white

    if (a >= 125) {
      if (!(r > 250 && g > 250 && b > 250)) {
        pixelArray.push([r, g, b]);
      }
    }
  } // Send array to quantize function which clusters values
  // using median cut algorithm


  var cmap = MMCQ.quantize(pixelArray, colorCount);
  var palette = cmap ? cmap.palette() : null;
  return palette;
}

;
var _default = getColorPalette;
exports.default = _default;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _colorThief = _interopRequireDefault(require("./color-thief"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PALETTESIZE = 4;

function _default(img, debug) {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, w, h);
  const tl = (0, _colorThief.default)(context.getImageData(0, 0, w / 2, h / 2).data, PALETTESIZE);
  const tr = (0, _colorThief.default)(context.getImageData(w / 2, 0, w / 2, h / 2).data, PALETTESIZE);
  const bl = (0, _colorThief.default)(context.getImageData(0, h / 2, w / 2, h / 2).data, PALETTESIZE);
  const br = (0, _colorThief.default)(context.getImageData(w / 2, h / 2, w / 2, h / 2).data, PALETTESIZE);
  const palette = (0, _colorThief.default)(context.getImageData(0, 0, w, h).data, PALETTESIZE).map(toHex);
  const background = palette[0];
  const distances = [getDistance(tl[0], bl[0]), getDistance(tl[0], tr[0]), getDistance(tl[0], br[0]), getDistance(bl[0], tr[0]), getDistance(tr[0], br[0]), getDistance(bl[0], br[0])];
  const colors = [[tl[0], bl[0]], [tl[0], tr[0]], [tl[0], br[0]], [bl[0], tr[0]], [tr[0], br[0]], [bl[0], br[0]]];
  const directions = ['to bottom', 'to right', '135deg', '45deg', 'to bottom', 'to right'];
  const furthest = Math.max.apply(null, distances);
  const idx = distances.findIndex((el, idx) => el === furthest);
  const gradient = `linear-gradient(${directions[idx]}, ${toHex(colors[idx][0])} 0%, ${toHex(colors[idx][1])} 100%)`;

  if (debug) {
    const res = [];
    res.push(background);
    res.push(gradient);
    const pretty = `linear-gradient(\n  ${directions[idx]},\n  ${toHex(colors[idx][0])} 0%,\n  ${toHex(colors[idx][1])} 100%\n)`;
    return {
      css: res,
      palettes: {
        topleft: tl.map(toHex),
        topright: tr.map(toHex),
        bottomleft: bl.map(toHex),
        bottomright: br.map(toHex),
        overall: palette
      },
      pretty
    };
  }

  const css = `background: ${background}; background: ${gradient}`;
  return {
    css,
    background,
    gradient
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
  return Math.sqrt(Math.pow(rgb2[0] - rgb1[0], 2), Math.pow(rgb2[1] - rgb1[1], 2), Math.pow(rgb2[2] - rgb1[2], 2));
}

},{"./color-thief":2}]},{},[1]);