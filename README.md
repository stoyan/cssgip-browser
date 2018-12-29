# GIP

Gradient Image Placeholders.

This is a browser version of the CSSGIP module (https://www.npmjs.com/package/cssgip) and source (https://github.com/stoyan/cssgip/)

## Purpose

Generate background CSS for an image to show something while the image is yet to load.

Writeup: https://calendar.perfplanet.com/2018/gradient-image-placeholders/

## Try it out

A demo app built with this library:
https://tools.w3clubs.com/gip/

For a simpler demo, see demo.html in the `build/` directory

## Usage

### Old school

In a non-module environment, include the `gip.js` file found in the `build/` directory and use the global function `gip()`:

```
<script src="gip.js"></script>
<script>
// img is a reference to an image element
const result = gip(img);
</script>
```

So `img` can be an object created with `new Image()` or `document.createElement('image')` or found in the DOM like `document.images[0]` or `document.getElementsByTagName('image')[0]` or `document.getElementById('the-logo')` and so on.

### Import

```
import gip from 'cssgip-browser';
const result = gip(img);
```

### Result

The object returned by `gip(img)` has three properties, like so:

```
css: "background: #ab9f92; background: linear-gradient(135deg, #cbc6c2 0%, #5d5347 100%)"
background: "#ab9f92"
gradient: "linear-gradient(135deg, #cbc6c2 0%, #5d5347 100%)"
```

### Debugging result

If you want to play around with the tool and make it better, you can see more detailed data as to how we got the end result. Calling `gip(img, true)` spits out debugging palettes.

```
css: (2) […]
  0: "#ab9f92"
​​  1: "linear-gradient(135deg, #cbc6c2 0%, #5d5347 100%)"
palettes: {…}
​​  bottomleft: Array(4) [ "#827c76", "#d5d4d3", "#dcb487", ... ]
​​  bottomright: Array(4) [ "#5d5347", "#cda579", "#c3c2c2", ... ]
  topleft: Array(4) [ "#cbc6c2", "#5d5852", "#7d726a", ... ]
  topright: Array(4) [ "#b6b1ab", "#524c47", "#696967", ... ]
  ​​overall: Array(4) [ "#ab9f92", "#44413c", "#dbd8d7", ... ]
pretty: "linear-gradient(\n  135deg,\n  #cbc6c2 0%,\n  #5d5347 100%\n)"
```

This info is visible in the demo https://tools.w3clubs.com/gip/

