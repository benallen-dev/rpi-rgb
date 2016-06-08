# rpi-rgb
Implements PWM control of RGB leds for use with Raspberry Pi GPIO in Node.js

## How to use

### Setup
```javascript
var RgbChannel = require('rpi-rgb').Channel;
var Colour = require('rpi-rgb').Colour;

var channel1 = new RgbChannel(<red_pin>,<green_pin>,<blue_pin>);
```
This creates an RGB channel. The pin numbers refer to wiring-pi pin numbers, see http://wiringpi.com/pins for details.

### The Colour class
```javascript
var myColour = new Colour(<red%>, <green%>, <blue%>);
```
Colours in rpi-rgb are defined as objects with red, green and blue properties between 0 (off) and 100 (full-on).

## Methods

### .setRgb (myColour, callback)
Immediately sets desired colour, with optional callback function.

### .fadeRgb (myColour, time, callback)
Fades to desired colour linearly, over `time` ms. Optional callback.

### .pulseRgb (startColour, endColour, fadeTime, pulseTime)
First, fades to `startColour` over `fadeTime` ms as with `.fadeRgb`, but then fades back and forth between this initial colour and `endColour`. In this case, pulseTime is the time in ms fading from one colour to the next, e.g. the total period is 2*`pulseTime`.

### .endPulse()
Stops the pulse effect.

### .strobeRgb(colour, pulselength, duration, callback)
Creates a stroboscope effect where the output is either switched off, or set to `colour`. This switch happens every `pulselength`ms, for a total duration of `duration`ms. Optional callback.

### .close()
Shuts down the PWM channel.

## Example

This example will start by fading in to blue, then strobing for approximately a second. Then it fades to yellow and starts to pulse red.

```javascript
var RgbChannel = require('rpi-rgb').Channel;
var Colour = require('rpi-rgb').Colour;

var channel1 = new RgbChannel(23,21,22);

var red = new Colour(100,0,0);
var softRed = new Colour(10,0,0);
var blue = new Colour(0,100,0);
var white = new Colour(100,100,100);
var yellow = new Colour(100,100,0);

// Start by fading to blue.
channel1.fadeRgb(blue, 2000, function() {
  // When that's done, strobe.
  channel1.strobeRgb(white, 18, 1000, function() {
    // After strobing, fade to yellow.
    channel1.fadeRgb(yellow, 700);
  });
});

// After the timeout, all the above is likely done, so start pulsing red.
setTimeout(function(thisobj) { thisobj.pulseRgb(softRed, red, 800, 1500); }, 7000, channel1);
```

