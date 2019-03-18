const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');
const uuidv1 = require('uuid/v1');

mongoose.promise = global.Promise;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(function(err, req, res, next){
	if(err) return res.json(err);
});

/* Connect to MongoDB Atlas. */
/*
fs.readFile('mongouri.txt', 'utf8', function(err, contents){
	if(err)
		console.log(err);
	else
		mongoose.connect(contents, {useNewUrlParser: true});
});
*/

/* Connect to local MongoDB. */
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

require('./models/users');

const Users = mongoose.model('Users');

app.use(cookieParser());

app.get('/',function(req,res) {
	res.render('landing.html', {name:'max'});
});

app.get('/register',function(req,res) {
	res.render('register.html', {name:'max'});
});

app.get('/login',function(req,res) {
	res.render('login.html', {name:'max'});
});  

/* Handle route to the users root folder. */
app.get('/gateway', verify_token, function(req,res) {
	
	if(mongoose.Types.ObjectId.isValid(req.client_id)){
		res.redirect('api/users/' + req.client_id + '/resources/root');
	}
	
}); 

app.get('/logout',function(req,res) {
	res.render('login.html', {name:'max'});
});

function verify_token(req, res, next){
	var token = req.cookies['jwt'];
	if (!token)
		return res.redirect('/login');
	jwt.verify(token, 'secret', function(err, decoded) {
		if (err) res.redirect('/login');
		//if everything good, save to request for use in other routes
		req.client_id = decoded._id;
		return next();
	});
}

/* Retrieves all users. Development purposes only. */
app.get('/api/users', (req, res, next) => {
	return Users.find({}).select('_id email').then((users) =>{
		if(users.length === 0)
			return res.status(422).sendStatus(400);
		
		return res.json(users); 
	});
});

/* Create an account. */
app.post('/api/users', (req, res, err) => {
	
	/* Validate email */
	if(!req.body.email){
		return res.status(422).json({
			error:{
				email: 'is required'
			}
		});
	}  
	
	/* Validate password */
	if(!req.body.password){
		return res.status(422).json({
			error:{
				password: 'is required'
			}
		});
	}
	
	/* Check email is unique. */
	Users.findOne({ 'email' : req.body.email }, function(err, user){
		if(user)
			return res.json({error : "Email address is already registered to another user."});
		else {
			
			var user = {
				email: req.body.email,
				password: req.body.password,
				resources: {
					"type": "folder",
					"guid": "root",
					"name": "root",
					"items": [],
					"revisions": []
				}
			}
			
			const finalUser = new Users(user);
			finalUser.set_password(req.body.password);
			/* Return token. */
			finalUser.save();
			return res.cookie('jwt', finalUser.generate_jwt()).json({success: 'Registration complete.'});
		
		}
	});
	
});

/* Returns jwt on submission of valid login credentials. */
app.post('/api/login', (req, res, err) => {
	
	var email = req.body.email;
	var password = req.body.password;
	
	if(!email){
		return res.status(422).json({
			errors: {
				email: 'is required'
			}
		});
	} 
	if(!password){
		return res.status(422).json({
			errors: {
				password: 'is required'
			}
		});
	}
	
	Users.findOne({ 'email' : req.body.email }, function(err, user){
		if(!user || !user.validate_password(password)){
			return res.json({ error: 'email or password is incorrect.'});
		} else {
			return res.cookie('jwt', user.generate_jwt()).json({success: 'Registration complete.'});
		}
	});
	
});

app.get('/api/users/:id', (req, res) => {
	
	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = mongoose.Types.ObjectId(req.params.id);
		Users.find({_id: id}, function(err, user){
			if(!user){
				return res.json({error: "User with id " + req.params.id + " not found."});
			} else{
				return res.json(user);
			}
		});
	} else {
		return res.json({error: "id '" + req.params.id + "' is invalid."});
	}
	
});

app.put('/api/users/:id', (req, res) => {
	
	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = mongoose.Types.ObjectId(req.params.id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){
				return res.json({error: "User with id " + req.params.id + " not found."});
			} else{
				if(req.body.user === undefined)
					return res.json({error: "Please use {user:{}} in request body."});
				else {
					for (attr in req.body.user){
						/* Don't let salt or hash be updated. */
						if(attr != 'salt' && attr != 'hash'){	
							if(attr in user[0]){
								user[0][attr] = req.body.user[attr];
							}
						}
					}
					Users.findOneAndUpdate({_id: id}, user[0], {new: true, upsert:true}, function(err, user){
						if(err) return res.json({error: err});
						else return res.json(user);
					});
				}       
			}
		});
	} else {
		return res.json({error: "id '" + req.params.id + "' is invalid."});
	}
	
});

app.delete('/api/users/:id', (req, res) => {
	
	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = mongoose.Types.ObjectId(req.params.id);
		Users.find({_id: id}, function(err, user){
			if(!user){
				return res.json({error: "User with id " + req.params.id + " not found."});
			} else{
				Users.deleteOne({ _id: id }, function (err) {
				  if (err) return res.json(err);
				  else return res.json({success: 'User ' + id + ' deleted successfully.'});
				});
			}
		});
	} else {
		return res.json({error: "id '" + req.params.id + "' is invalid."});
	}
	
});

/* Get current logged in user. Development purposes only. */
app.get('/api/users/current', verify_token, (req, res) => {
	
	var owner_id = req.body.resource.owner_id;
	var path = req.body.resource.path;
	var type = req.body.resource.type;
	var parent_id = req.body.resource.parent_id;
	var revisions = req.body.resource.revisions;
	var sharing = req.body.resource.sharing;
	var deleted = req.body.resource.deleted;
	var activity = req.body.resource.activity;
	
	
	return Users.findById(req.user_id).then((user) =>{
		if(user.length === 0){
			return res.sendStatus(400);
		}
		return res.json({user: user.to_auth_json() });
	});
});

/* Get folder resource. */
app.get('/api/users/:owner_id/resources/:resource_id', verify_token, function(req,res) {
	
	if(mongoose.Types.ObjectId.isValid(req.params.owner_id)){
		var id = mongoose.Types.ObjectId(req.params.owner_id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){ 
				return res.json({error: "Owner with id " + req.params.owner_id + " doesn't exist."});
			} else{
				
				var breadcrumbs = [];
				
				function find_folder(obj){
					var res = null;
					if(obj.guid == req.params.resource_id){
						res = obj;
					} else {
						for(var i = 0; i < obj.items.length; i++){
							if(obj.items[i].type == 'folder'){
								var ret = find_folder(obj.items[i]);
								if(ret != null) {
									breadcrumbs.unshift(obj.items[i]);
									res = ret;
								}
							}
						}
					}
					return res;
				}
				
				
				
				var folder = find_folder(user[0].resources);
				if(folder == null){
					return res.json({error: "Resource with id '" + req.params.resource_id + "' doesn't exist."});
				}
				breadcrumbs.unshift(user[0].resources);
				
				if(req.params.owner_id != req.client_id){
					return res.json({error: "You don't have access to this resource."});
				}
				
				/* TODO - Check if user is authorized to access resource through sharing. */

				return res.render('resources.html', {client_id: req.client_id, folder: JSON.stringify(folder), owner: user[0], breadcrumbs: JSON.stringify(breadcrumbs)});

			}
		});
	} else {
		return res.json({error: "user id '" + req.params.user_id + "' is invalid."});
	}
	
});

/* Format resources for tree view. */
app.get('/api/users/:owner_id/treeview/:omit_id', verify_token, function(req,res) {
	
	var omit_id = req.params.omit_id;
	
	if(mongoose.Types.ObjectId.isValid(req.params.owner_id)){
		var id = mongoose.Types.ObjectId(req.params.owner_id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){
				return res.json({error: "Owner with id " + req.params.owner_id + " doesn't exist."});
			} else{
				
				var flat = [];
				
				
				/* Generates ordered array of folders. */
				function convert_to_flat(obj, parent_id){
					
					for(var i = 0; i < obj.items.length; i++){
						if(obj.items[i].type == 'folder'){ /* No files just folders. */
							flat.push( { text: obj.items[i].name, guid: obj.items[i].guid, parent_id: parent_id, children: [] } );
							convert_to_flat(obj.items[i], obj.items[i].guid);
						}
					}
					
				}
				
				convert_to_flat(user[0].resources, 'root');
				
				var tree = [];
				
				/* Add root to tree */
				for(var i = 0; i < flat.length; i++){
					
					if(flat[i].parent_id == 'root' && flat[i].guid != omit_id){
						flat[i]["children"] = [];
						tree.push(flat[i]);
						flat.splice(i, 1);
						i--;
					}

				}
				
				function add_to_tree(branch, folder){
					
					for(var i = 0; i < branch.length; i++){
						if(branch[i].guid == folder.parent_id){
							branch[i].children.push(folder);
						}
						else {
							add_to_tree(branch[i].children, folder);
						}
					}
				}
				
				/* Add each item in the tree. */
				for(var i = 0; i < flat.length; i++){

					if(flat[i].guid != omit_id)
						add_to_tree(tree , flat[i]);
					
				}
				
				res.json(tree);
				
			}
		});
	} else {
		return res.json({error: "user id '" + req.params.user_id + "' is invalid."});
	}
	
});

/* Create a new resource. 

@param owner_id
@param folder_id
@param type
@param revisions

*/
app.post('/api/users/:owner_id/resources', verify_token, (req, res) =>{

	var owner_id = req.params.owner_id;
	var target_folder_id = req.body.target_folder_id;
	var current_folder_id = req.body.current_folder_id;
	
	var name = req.body.name;
	var type = req.body.type;
	var guid = req.body.guid;
	var activity = req.body.activity;
	var items = req.body.items;
	var revisions = req.body.revisions;
	var sharing = req.body.items;
	
	if(owner_id === undefined)
		return res.json({ error: 'owner_id is required.' });
	if(target_folder_id === undefined)
		return res.json({ error: 'target_folder_id is required.' });
	if(current_folder_id === undefined)
		current_folder_id = target_folder_id;
	
	if(name === undefined)
		return res.json({ error: 'name is required.' });
	if(type === undefined)
		return res.json({ error: 'type is required' });
	
	if(guid === undefined)
		guid = uuidv1();
	if(activity === undefined)
		activity = [];
	if(items === undefined)
		items = [];
	if(revisions === undefined)
		revisions = [];
	if(type === undefined)
		sharing = [];
	
	/* Check if owner_id is valid. */
	if(mongoose.Types.ObjectId.isValid(owner_id)){
		var id = mongoose.Types.ObjectId(owner_id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){
				return res.json({error: "owner_id " + owner_id + " not found."});
			} else{
				
				function find_folder(obj){
					var res = null;
					if(obj.guid == target_folder_id){
						res = obj;
					} else {
						for(var i = 0; i < obj.items.length; i++){
							if(obj.items[i].type == 'folder'){
								var ret = find_folder(obj.items[i]);
								if(ret != null) res = ret;
							}
						}
					}
					return res;
				}
				
				var folder = find_folder(user[0].resources);
			
				if(folder == null){
					return res.json({error: "Resource with id '" + req.params.target_folder_id + "' doesn't exist."});
				}
				
				/* Is user the owner of this resource? */
				if(owner_id != req.client_id){
					return res.json({error: "User with id " + req.client_id + " does not have access to this resource."});
				}
				
				/* TODO - Check if user is authorized to access resource through sharing. */
				
				folder.items.push(
					{
						'guid': guid, 'name': name, 'type': type, 'items': items, 'revisions': revisions, 'sharing': sharing, 'activity': activity
					}
				);
				
				const finalUser = new Users(user[0]);
				
				function find_current_folder(obj){
					var res = null;
					if(obj.guid == current_folder_id){
						res = obj;
					} else {
						for(var i = 0; i < obj.items.length; i++){
							if(obj.items[i].type == 'folder'){
								var ret = find_current_folder(obj.items[i]);
								if(ret != null) res = ret;
							}
						}
					}
					return res;
				}
				
				folder = find_current_folder(finalUser.resources);
				
				return finalUser.save().then(()=> res.json(folder));
				
			}
		});
	} else {
		return res.json({error: "owner_id '" + owner_id + "' is invalid."});
	}
	
});

/* Delete a resource. */
app.delete('/api/users/:owner_id/resources/:resource_id', verify_token, (req, res) =>{
	
	var owner_id = req.params.owner_id;
	var target_id = req.body.target_id;
	var resource_id = req.params.resource_id;
	
	if(target_id === undefined)
		return res.json({ error: 'target_id is required.' });

	/* Check if owner_id is valid. */
	if(mongoose.Types.ObjectId.isValid(owner_id)){
		var id = mongoose.Types.ObjectId(owner_id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){
				return res.json({error: "owner_id " + owner_id + " not found."});
			} else{
					
				function find_folder(obj){
					var res = null;
					if(obj.guid == resource_id){
						res = obj;
					} else {
						for(var i = 0; i < obj.items.length; i++){
							if(obj.items[i].type == 'folder'){
								var ret = find_folder(obj.items[i]);
								if(ret != null) res = ret;
							}
						}
					}
					return res;
				}
					
				var folder = find_folder(user[0].resources);
				if(folder == null){
					return res.json({error: "Resource id '" + resource_id + "' is invalid."});
				}
				
				/* Is user the owner of this resource? */
				if(owner_id != req.client_id){
					return res.json({error: "User with id " + req.client_id + " does not have access to this resource."});
				}
				
				/* TODO - Check if user is authorized to access resource through sharing. */
				
				for(var i = 0; i < folder.items.length; i++){
					if(folder.items[i].guid == target_id)
						folder.items.splice(i, 1);
				}
				
				const finalUser = new Users(user[0]);
				return finalUser.save().then(()=> res.json(folder));
					
			}
		});
	} else {
		return res.json({error: "owner_id '" + owner_id + "' is invalid."});
	}
	
});

/* Update a resource in a folder. */
app.put('/api/users/:owner_id/resources/:resource_id', verify_token, (req, res) =>{
	
	var owner_id = req.params.owner_id;
	var target = req.body.target;
	var resource_id = req.params.resource_id;
	
	if(target === undefined)
		return res.json({ error: 'target is required.' });

	/* Check if owner_id is valid. */
	if(mongoose.Types.ObjectId.isValid(owner_id)){
		var id = mongoose.Types.ObjectId(owner_id);
		Users.find({_id: id}, function(err, user){
			if(user.length === 0){
				return res.json({error: "owner_id " + owner_id + " not found."});
			} else{
					
				function find_folder(obj){
					var res = null;
					if(obj.guid == resource_id){
						res = obj;
					} else {
						for(var i = 0; i < obj.items.length; i++){
							if(obj.items[i].type == 'folder'){
								var ret = find_folder(obj.items[i]);
								if(ret != null) res = ret;
							}
						}
					}
					return res;
				}
					
				var folder = find_folder(user[0].resources);
				if(folder == null){
					return res.json({error: "Resource id '" + resource_id + "' is invalid."});
				}
				
				/* Is user the owner of this resource? */
				if(owner_id != req.client_id){
					return res.json({error: "User with id " + req.client_id + " does not have access to this resource."});
				}
				
				/* TODO - Check if user is authorized to access resource through sharing. */
				
				for(var i = 0; i < folder.items.length; i++){
					if(folder.items[i].guid == target.guid)
						folder.items[i] = target;
				}
				
				const finalUser = new Users(user[0]);
				return finalUser.save().then(()=> res.json(folder));
					
			}
		});
	} else {
		return res.json({error: "owner_id '" + owner_id + "' is invalid."});
	}
	
});

/* Update the resource. */
app.put('/api/resources/:id', (req, res) => {
	
	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = mongoose.Types.ObjectId(req.params.id);
		Resources.find({_id: id}, function(err, resource){
			if(resource.length === 0){
				return res.json({error: "Resource with id " + req.params.id + " not found."});
			} else{
				if(req.body.resource === undefined)
					return res.json({error: "Please use {resource:{}} in request body."});
				else {
					/* TODO - Validate the structure of the JSON revisions array. */
					Resources.findOneAndUpdate({_id: id}, req.body.resource, {new: true, upsert:true}, function(err, resource){
						if(err) return res.json({error: err});
						else return res.json(resource);
					});
				}
			}
		});
	} else {
		return res.json({error: "id '" + req.params.id + "' is invalid."});
	}
	
});

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));
