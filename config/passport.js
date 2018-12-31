const mongoose = require('mongoose');
const passport = require('passport');
const local_strategy = require('passport-local');

const users = mongoose.model('Users');

passport.use(new local_strategy({
	usernameField: 'user[email]',
	passwordField: 'user[password]'
}, (email, password, done) =>{
	Users.findOne({email})
		.then((user) => {
		if(!user || !user.validatePassword(password)){
			return done(null, false, { errors: {'email or password': 'is invalid' } });
		}
		return done(null, user);
	}).catch(done);
}));