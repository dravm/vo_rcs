// Module is responsible for users authorization and user management api
var express = require('express');
var router = express.Router();
var db = require("../core/db");

router.get('/logout', function (req, res) {
	delete req.session.user;
	res.send({res:"success"});
});

// Login route - In case of success, mark the session as authenticated.
router.get('/login', function (req, res) {
	console.log("Route: login: " + req.query.user + " pass: " + req.query.pass);

	if (req.session.user) {
		res.send({login: req.query.user});
		return;
	}

	if (req.query.user && req.query.pass) {
		db.checkUserLogin(req.query.user, req.query.pass, function(loginOk) {
			if (loginOk) {
				req.session.user = req.query.user;
				res.send({login: req.query.user});
			}
			else 
				res.sendStatus(401);
		});
	}
});

//	Check if login exists in DB.
router.get('/checkLoginExists', function (req, res) {	
	db.getUserByLogin(req.query.user, function(user){
		user ? res.send({res: true}) : res.send({res: false});
	});
});

//User registration
router.post('/registerUser', function (req, res) {
	console.log("Registering user " + JSON.stringify(req.body.user));

	var userLogin = req.body.user;	
	var password = req.body.password;

	db.getUserByLogin(userLogin.login, function(user) {
		if (!user) {
			db.addUser(userLogin, password, function(userDB, error) {
				if (error)
					res.status(400).send(error);
				else 
					res.send(userDB);
			});
		}
		else {
			console.log("User " + userLogin.login + " already exists!");
			res.sendStatus(400);
		}
	});
});
		
module.exports = router;