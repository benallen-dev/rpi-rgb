var RgbChannel = require('./index.js');
var Channel1 = new RgbChannel(23,21,22);

Channel1.setRgb(0,0,100); 

//Channel1.pulseRgb(10, 0, 0, 100, 0, 0, 500, 700);
Channel1.fadeRgb(200,4,29,2000);

