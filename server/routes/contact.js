const passport = require('passport');
const router = require('express').Router();
const ses = require('../mail');
const db = require('../db');

function loginRequired(req, res, next) {
	console.log('Fake Authenticated');
	// if (!req.isAuthenticated()) {
		// return res.redirect('/login');
	// }
	next();
}

function staffRequired(req, res, next) {
	if (!req.user.isStaff) {
		return res.sendStatus(403);
	}
	next();
}

function adminRequired(req, res, next) {
	if (!req.user.isAdmin) {
		return res.sendStatus(403);
	}
	next();
}

function authRequired(req, res, next) {
	const { createdBy } = req.params || null;
	if (!(req.user.userName === req.body.createdBy || createdBy) || !req.user.isStaff) {
		return res.sendStatus(403);
	}
	next();
}


router
// .GET gets all contact requests
	.get('/contacts', loginRequired, adminRequired, (req, res, next) => {
		db('contacts')
			.then(contacts => {
				if (!contacts) {
					return res.send({ message: 'Sorry unable to get contacts' });
				}
				res.send(contacts);
			}, next);
	})

// .POST to add conatct request to db
	.post('/contact',
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
				createdBy: req.body.name,
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
					ses.sendEmail({
						Source: newContact.email,
						Destination: { ToAddresses: 'tlobaugh@gmail.com' },
						Message: {
							Subject: {
								Source: {
									Data: `Contact request from website from ${newContact.createdBy} `
								}
							},
							Body: {
								Text: {
									Data: `Phone: ${newContact.createdBy} | Message: ${newContact.body}`,
								}
							}
						}
					}, (err, data) => {
						if (err) throw err;
						console.log('Email sent:');
						console.log(data);
					});
				}, next);
		})

	// .DELETE to delete contact
	.delete('/deleteContact/:id', loginRequired, adminRequired, (req, res, next) => {
		const { id } = req.params;
		db('contacts')
			.where('id', id)
			.delete()
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to delete contact' });
				}
				req.flash('success', 'Contact deleted.');
				res.sendStatus(200);
			}, next);
	});

module.exports = router;
