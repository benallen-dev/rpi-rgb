var RgbChannel = require('./index.js').Channel;
var Colour = require('./index.js').Colour;

var Channel1 = new RgbChannel(23,21,22);
var red = new Colour(100,0,0);
Channel1.setRgb(red); 

//Channel1.pulseRgb(10, 0, 0, 100, 0, 0, 500, 700);
//Channel1.fadeRgb(200,4,29,2000);

