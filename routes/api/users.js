const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

router.post('/login', auth.optional, (req, res, next)=>{
	const {body: {user} } = req;
	if(!user.email){
		return res.status(422).json({
			errors: {
				email: 'is required'
			}
		});
	}
	if(!user.password){
		return res.status(422).json({
			errors: {
				password: 'is required'
			}
		});
	}
	
	return passport.authenticate('local', {session: false}, (err, passportUser, info)=>{
		if(err){
			return next(err);
		}
		
		if(passportUser){
			const user = passportUser;
			user.token = passportUser.generate_jwt();
			
			return res.json({user: user.to_auth_json()});
		}
		
		return status(400).info;
	})(err,req,res,next);
});

module.exports = router;