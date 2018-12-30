const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const fs = require('fs');

mongoose.promise = global.Promise;

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!isProduction){
	app.use(errorHandler());
}

fs.readFile('mongouri.txt', 'utf8', function(err, contents){
	if(err)
		console.log(err);
	else 
		mongoose.connect(contents, {useNewUrlParser: true});
});

mongoose.set('debug', true);

require('./models/users');

if(!isProduction){
	app.use( (req, res, err) => {
		res.status(err.status || 500);
		res.json({
			errors:{
				message: err.message,
				error: err
			}
		});
	});
}

app.use( (req, res, err) => {
	res.status(err.status || 500);
	res.json({
		errors:{
			message: err.message,
			error: {}
		}
	});
});

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));