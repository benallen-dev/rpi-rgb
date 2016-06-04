module.exports = Channel;

var gpio = require('wiring-pi');
var math = require('mathjs');

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
    
Channel.prototype.setRgb = function (red, green, blue) {
  // setRgb(red, green, blue)
  // returns 0 on success, otherwise returns err
  if (red < 0 || red > 100) {
      return ('R value not between 0 and 100');
  }
  if (green < 0 || green > 100) {
      return ('G value not between 0 and 100');
  }
  if (blue < 0 || blue > 100) {
      return ('B value not between 0 and 100');
  }
  
  this._valRed = red;
  this._valGreen = green;
  this._valBlue = blue;
  
  gpio.softPwmWrite(this._pinRed, this._valRed);
  gpio.softPwmWrite(this._pinGreen, this._valGreen);
  gpio.softPwmWrite(this._pinBlue, this._valBlue);
  
  return 0;
};

Channel.prototype.fadeRgb = function (red, green, blue, time, callback) {
  // Dividing time (ms) by 20 gives 50Hz update rate
  this._fade.steps = math.round(time / 20);

  this._fade.dR = (red - this._valRed) / this._fade.steps;
  this._fade.dG = (green - this._valGreen) / this._fade.steps;
  this._fade.dB = (blue - this._valBlue) / this._fade.steps;

  this._fade.stepcount = 0;
  this._fade.active = true;
  
  this._updateFade(callback);
};

Channel.prototype.pulseRgb = function (redStart, greenStart, blueStart, redEnd, greenEnd, blueEnd, fadeTime, pulseTime) {
  // Fades into start colour and then pulses between Start and End colors. 
  // fadeTime - governs how fast the LEDs fade to the start color.
  // pulseTime - governs how fast the pulse occurs in one direction,
  //             meaning one full cycle lasts 2* pulseTime.
  
  thisObj = this;
  
  this.fadeRgb(redStart, greenStart, blueStart, fadeTime, function() {
    thisObj._fade.pulse = true;
    thisObj.fadeRgb(redEnd, greenEnd, blueEnd, pulseTime);  
  });
  
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