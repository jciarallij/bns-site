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
	.get('/comments/:blogId', loginRequired, (req, res, next) => {
		const { blogId } = req.params;
		db('comments')
			.where('blogId', blogId)
			.then(comments => {
				if (!comments) {
					return res.send({ message: `Sorry unable to retrieve any comments for blog: ${blogId}.` });
				}
				res.send(comments);
			}, next);
	})
	.post('/addComment', loginRequired, (req, res, next) => {
// To-do: add check to make sure blogId exists
		const newComment = {
// delete this seed data for username
			createdBy: 'Tlobaugh',
			// createdBy: req.user.userName,
			blogId: req.body.blogId,
			body: req.body.body
		};
		db('comments')
			.insert(newComment)
			.then(comments => {
				if (!comments) {
					return res.send({ message: 'Error...Couldn\'t post your comment' });
				}
				newComment.id = comments[0];
				res.send(newComment);
			}, next);
	});

module.exports = router;
