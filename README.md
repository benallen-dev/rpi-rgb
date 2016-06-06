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

### .setRgb (myColour)
Immediately sets desired colour, colour values described in percent.

### .fadeRgb (myColour, time)
Fades to desired colour linearly, over `time` ms.

### .pulseRgb (startColour, endColour, fadeTime, pulseTime)
First, fades to `startColour` over `fadeTime` ms as with `.fadeRgb`, but then fades back and forth between this initial colour and `endColour`. In this case, pulseTime is the time in ms fading from one colour to the next, e.g. the total period is 2*`pulseTime`.

### .endPulse()
Stops the pulse effect.

### .close()
Shuts down the PWM channel.

