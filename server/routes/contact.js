const passport = require('passport');
const router = require('express').Router();
const db = require('../db');

function loginRequired(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/login');
	}
	next();
}

function staffRequired(req, res, next) {
	if (!req.user.isStaff) {
		return res.render('403');
	}
	next();
}

function adminRequired(req, res, next) {
	if (!req.user.isAdmin) {
		return res.render('403');
	}
	next();
}

function authRequired(req, res, next) {
	const { createdBy } = req.params || null;
	if (!(req.user.userName === req.body.createdBy || createdBy) || !req.user.isStaff) {
		return res.render('403');
	}
	next();
}

router
// .POST comment for a contact
	.post('/contact',
			loginRequired,
		(req, res, next) => {
// Form Validator
			req.checkBody('email', 'Email field is required').notEmpty();
			req.checkBody('phone', 'Phone field is required').notEmpty();
			req.checkBody('body', 'Message field is required').notEmpty();

// Check Errors
			const errors = req.validationErrors();
			if (errors) {
				return next({ errors });
			}

			const newContact = {
				createdBy: req.user.userName,
				email: req.body.email,
				phone: req.body.phone,
				body: req.body.body
			};

			db('contacts')
				.insert(newContact)
				.then(contacts => {
					if (!contacts) {
						return res.send({ message: 'Error...Couldn\'t post your contact request' });
					}
					newContact.id = contacts[0];
					req.flash('success', 'Contact request sent.');
					// res.send(newContact);
					res.sendStatus(200);
				}, next);
		});

module.exports = router;
