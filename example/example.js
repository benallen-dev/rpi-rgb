var RgbChannel = require('./index.js').Channel;
var Colour = require('./index.js').Colour;

var channel1 = new RgbChannel(23,21,22);

var red = new Colour(100,0,0);
var softRed = new Colour(10,0,0);
var blue = new Colour(0,0,100);
var white = new Colour(100,100,100);
var yellow = new Colour(100,100,0);

channel1.fadeRgb(blue, 2000, function() {
  
  channel1.strobeRgb(white, 18, 1000, function() {
    channel1.fadeRgb(yellow, 700);
  });
});

setTimeout(function(thisobj) { thisobj.pulseRgb(softRed, red, 800, 1500); }, 7000, channel1);

