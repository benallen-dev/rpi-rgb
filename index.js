// rpi-rgb
// Supplies simple method of controlling PWM rgb 
// lighting using raspberry pi GPIO

module.exports.Channel = Channel;
module.exports.Colour = Colour;

var gpio = require('wiring-pi');
var math = require('mathjs');

function Colour (red, green, blue) {
  this.red = red;
  this.green = green;
  this.blue = blue;
  
  this.clamp();
}

Colour.prototype.clamp = function() {
  this.red = Math.max(0, Math.min(this.red, 100));
  this.green = Math.max(0, Math.min(this.green, 100));
  this.blue = Math.max(0, Math.min(this.blue, 100));
}

// GPIO is set up to use wiringpi pin numbers.
// See http://wiringpi.com/pins/ for detailed information.
// Alternatively you can run 'gpio readall' in bash to see
// pin information. 
gpio.setup('wpi');

function Channel(redPin, greenPin, bluePin) {
    
  this._pinRed = redPin;
  this._pinGreen = greenPin;
  this._pinBlue = bluePin;
  
  // Current RGB value
  this._valRed = 0;
  this._valGreen = 0;
  this._valBlue = 0;
  
  // Variables needed to track fading
  this._fade = {};
  this._fade.active = false;
  this._fade.pulse = false;
  this._fade.strobe = false;
  this._fade.steps = 0;
  this._fade.stepcount = 0;
  this._fade.dR = 0;
  this._fade.dG = 0;
  this._fade.dB = 0;
  
  gpio.pinMode(this._pinRed, gpio.OUTPUT);
  gpio.pinMode(this._pinGreen,gpio.OUTPUT);
  gpio.pinMode(this._pinBlue, gpio.OUTPUT);
  
  if (gpio.softPwmCreate(this._pinRed, 0, 100)) {
    console.log('Failed to create Red PWM channel on pin ' + this._pinRed);
  }
  if (gpio.softPwmCreate(this._pinGreen, 0, 100)) {
    console.log('Failed to create Green PWM channel on pin ' + this._pinGreen);
  }
  if (gpio.softPwmCreate(this._pinBlue, 0, 100)) {
    console.log('Failed to create Blue PWM channel on pin ' + this._pinBlue);
  }
};
    
Channel.prototype.setRgb = function (colour, callback) {
  
  this._valRed = colour.red;
  this._valGreen = colour.green;
  this._valBlue = colour.blue;
  
  gpio.softPwmWrite(this._pinRed, this._valRed);
  gpio.softPwmWrite(this._pinGreen, this._valGreen);
  gpio.softPwmWrite(this._pinBlue, this._valBlue);
  
  if (typeof callback === 'function') callback();
  
  return 0;
};

Channel.prototype.fadeRgb = function (colour, time, callback) {
  // Dividing time (ms) by 20 gives 50Hz update rate
  this._fade.steps = math.round(time / 20);

  this._fade.dR = (colour.red - this._valRed) / this._fade.steps;
  this._fade.dG = (colour.green - this._valGreen) / this._fade.steps;
  this._fade.dB = (colour.blue - this._valBlue) / this._fade.steps;

  this._fade.stepcount = 0;
  this._fade.active = true;
  
  this._updateFade(callback);
};

Channel.prototype.pulseRgb = function (startColour, endColour, fadeTime, pulseTime) {
  // Fades into start colour and then pulses between Start and End colors. 
  // fadeTime - governs how fast the LEDs fade to the start color.
  // pulseTime - governs how fast the pulse occurs in one direction,
  //             meaning one full cycle lasts 2* pulseTime.
  
  thisObj = this;
  
  this.fadeRgb(startColour, fadeTime, function() {
    thisObj._fade.pulse = true;
    thisObj.fadeRgb(endColour, pulseTime);  
  });
  
}

Channel.prototype.endPulse = function() {
  this._fade.pulse = false;
}

Channel.prototype.strobeRgb = function(colour, pulseLength, duration, callback) {
  
  var halfPeriod = pulseLength; // time in ms between switching on/off
  this._fade.steps = math.round(duration / halfPeriod);
    
  // This line ensures ending in an 'off' state
  if (this._fade.steps % 2 === 0) this._fade.steps++; 
  
  this._fade.dR = colour.red;
  this._fade.dG = colour.green;
  this._fade.dB = colour.blue;
  
  this._fade.strobe = true;
  
  this._updateStrobe(halfPeriod, callback);
}

Channel.prototype.close = function () {
  gpio.softPwmStop(this._pinRed);
  gpio.softPwmStop(this._pinGreen);
  gpio.softPwmStop(this._pinBlue);
};

Channel.prototype._updateFade = function (callback) {
  var fadeInfo = this._fade; // Because of readability
    
  if (fadeInfo.active === false) return;
  
  this._valRed = this._valRed + fadeInfo.dR;
  this._valGreen = this._valGreen + fadeInfo.dG;
  this._valBlue = this._valBlue + fadeInfo.dB;

  gpio.softPwmWrite(this._pinRed, math.floor(this._valRed));
  gpio.softPwmWrite(this._pinGreen, math.floor(this._valGreen));
  gpio.softPwmWrite(this._pinBlue, math.floor(this._valBlue));

  fadeInfo.stepcount++;
  
  if (fadeInfo.stepcount < fadeInfo.steps) {
    setTimeout(function (thisObj) { thisObj._updateFade(callback); }, 20, this);
  } 
  else {
    // End of fade
    if (fadeInfo.pulse)
    {
      //reverse signs on RGB and reset stepcount
      fadeInfo.dR = -fadeInfo.dR;
      fadeInfo.dG = -fadeInfo.dG;
      fadeInfo.dB = -fadeInfo.dB;
      fadeInfo.stepcount = 0;
      
      setTimeout(function (thisObj) { thisObj._updateFade(callback); }, 20, this);
    }
    else {
      //Clean up
      
      // math.abs is used to prevent channels from having a value of -0
      this._valRed = math.abs(math.round(this._valRed));
      this._valGreen = math.abs(math.round(this._valGreen));
      this._valBlue = math.abs(math.round(this._valBlue));
      
      this._fade.active = false;
      this._fade.steps = 0;
      this._fade.stepcount = 0;
      this._fade.dR = 0;
      this._fade.dG = 0;
      this._fade.dB = 0;  
      
      // If callback present, call it
      if (typeof callback === 'function') callback();
    }
  }
};

Channel.prototype._updateStrobe = function (halfPeriod, callback) {

  if (this._fade.strobe === false) return;
  
  switch (this._fade.stepcount % 2) {
    case 0:
      this.setRgb(new Colour(0,0,0));
      break;
    case 1:
      this.setRgb(new Colour(this._fade.dR, this._fade.dG, this._fade.dG));
      break;
  }
  
  this._fade.stepcount++;

  if (this._fade.stepcount < this._fade.steps) {
    setTimeout(function(self, time, callback) {self._updateStrobe(time, callback);}, halfPeriod, this, halfPeriod, callback);
  }
  else {
    this._fade.strobe = false;
    this._fade.steps = 0;
    this._fade.stepcount = 0;
    this._fade.dR = 0;
    this._fade.dG = 0;
    this._fade.dB = 0;  
    
    // If callback present, call it
    if (typeof callback === 'function') callback();
  }
  
}