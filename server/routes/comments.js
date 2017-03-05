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

router
	.get('/comments/:id', (req, res, next) => {
		const { id } = req.params;
		db('blogs')
			.where('id', id)
			.first()
			.then(blog => {
				if (!blog) {
					return res.send({ message: 'Sorry unable to retrieve comments' });
				}
				res.send(blog.comments);
			}, next);
	})
	.post('/comments/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
// how to update the array???
			.update(req.body.comments);
	});
