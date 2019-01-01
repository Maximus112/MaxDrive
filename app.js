const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const fs = require('fs');
const jwt = require('express-jwt');

const getTokenFromHeaders = (req) => {
	const { headers: { authorization } } = req;
	if(authorization && authorization.split(' ')[0] == 'Bearer'){
		return authorization.split(' ')[1];
	}
	return null;
};

const auth = {
	required: jwt({
		secret: 'secret',
		userProperty: 'payload',
		getToken: getTokenFromHeaders
	}),
	optional: jwt({
		secret: 'secret',
		userProperty: 'payload',
		getToken: getTokenFromHeaders,
		credentialsRequired: false
	})
};

mongoose.promise = global.Promise;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

app.use(function(err, req, res, next){
	if(err) return res.json(err);
});

fs.readFile('mongouri.txt', 'utf8', function(err, contents){
	if(err)
		console.log(err);
	else 
		mongoose.connect(contents, {useNewUrlParser: true});
});

mongoose.set('debug', true);

require('./models/users');
const Users = mongoose.model('Users');

require('./config/passport');

app.post('/api/users/register', (req, res, err) => {
	
	console.log('register');
	
	const {body: {user}} = req;
	
	if(!user.email){
		return res.status(422).json({
			errors:{
				email: 'is required'
			}
		});
	}
	
	if(!user.password){
		return res.status(422).json({
			errors:{
				password: 'is required'
			}
		});
	}
	
	const finalUser = new Users(user);
	finalUser.set_password(user.password);
	
	return finalUser.save()
		.then(()=> res.json({user: finalUser.to_auth_json()}));
		
});

app.post('/api/users/login', (req, res, err) => {
	console.log(1234);
});

app.get('/api/users/current', auth.required, (req, res, next) => {
	
	return Users.findById(req.payload._id).then((user) =>{
		if(!user){
			return res.sendStatus(400);
		}
		return res.json({user: user.to_auth_json() });
	});
	
});

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));