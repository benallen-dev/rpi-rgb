# rpi-rgb
Implements PWM control of RGB leds for use with Raspberry Pi GPIO in Node.js

### How to use
```
var RgbChannel = require('rpi-rgb');
var channel1 = new RgbChannel(<red_pin>,<green_pin>,<blue_pin>);
```
This creates an RGB channel. The pin numbers refer to wiring-pi pin numbers, see http://wiringpi.com/pins for details.

### .setRgb (red, green, blue)
Immediately sets desired colour, colour values described in percent.

### .fadeRgb (red, green, blue, time)
Fades to desired colour linearly, over `time` ms.

### .pulseRgb (redStart, greenStart, blueStart, redEnd, greenEnd, blueEnd, fadeTime, pulseTime)
First, fades to `redStart`, `greenStart`, `blueStart` over `fadeTime` ms as with `.fadeRgb`, but then fades back and forth between this initial colour and `redEnd`, `greenEnd` and `blueEnd`. In this case, pulseTime is the time in ms fading from one colour to the next, e.g. the total period is 2*`pulseTime`.

### .close()
Shuts down the PWM channel.

