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
// To-do - need to make an approved comments and non approved comments endpoint???
// get comments by blogId
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
// approveComments
	.get('/approveComment/:id', loginRequired, staffRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
			.update('isAllowed', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to approve comment' });
				}
				res.sendStatus(200);
			}, next);
	})
// post comments
	.post('/addComment', loginRequired, (req, res, next) => {
// To-do - add check to make sure blogId exists??? - NO
		const newComment = {
	// DELETE THIS SEED DATA FOR userName
			createdBy: 'Tlobaugh',
			// createdBy: req.user.userName,
			blogId: req.body.blogId,
			body: req.body.body
		};
		if (req.user.isStaff) {
			newComment.isAllowed = 1;
		}
		db('comments')
			.insert(newComment)
			.then(comments => {
				if (!comments) {
					return res.send({ message: 'Error...Couldn\'t post your comment' });
				}
				newComment.id = comments[0];
				res.send(newComment);
			}, next);
	})
// edit comments
	.put('/editComment/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		req.body.hasEdit = 1;
// To-do - Create function for authorization???
// To-do - Get the createdBy from the database and not the req.body??
		if (req.user.userName === req.body.createdBy || req.user.isAdmin) {
			if (req.user.isStaff) {
				req.body.isAllowed = 1;
			}
			db('comments')
				.where('id', id)
				.update(req.body)
				.then(result => {
					if (result === 0) {
						return res.send({ message: 'Sorry unable to edit blog' });
					}
					res.sendStatus(200);
				}, next);
		} else {
			return res.render('403');
		}
	})
// deleteComments
	.delete('/deleteComment/:id', loginRequired, staffRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
			.delete()
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to delete comment' });
				}
				res.sendStatus(200);
			}, next);
	});
// To-do Create inital end-point called api

module.exports = router;
