const request = require('request');

var options = {
	url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
	proxy: 'http://gbinternet:pain1na55@43.194.159.10:10080'
}

request(options, function (err, res, body){
  if (err) { return console.log(err); }
  console.log(res.body);
});