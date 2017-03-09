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
	if (!(req.user.userName === req.body.createdBy) || !req.user.isStaff) {
		return res.render('403');
	}
	next();
}

router
// Get all comments that have not been apporved
	.get('/unapprovedComments', loginRequired, staffRequired, (req, res, next) => {
		db('comments')
			.where('isApproved', 0)
			.then(comments => {
				if (!comments) {
					return res.send({ message: 'Sorry unable to retrieve any comments' });
				}
				res.send(comments);
			}, next);
	})

// Get to approve comment by id
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

// Get for liking comment by id
	.get('/likeComment/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
			.increment('likes', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to like comment' });
				}
				res.sendStatus(200);
			}, next);
	})

// Post comment for a blog
	.post('/addComment', loginRequired, (req, res, next) => {
		const newComment = {
	// DELETE THIS SEED DATA FOR userName
			createdBy: 'Tlobaugh',
			// createdBy: req.user.userName,
			blogTitle: req.body.blogTitle,
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

// Put to edit comment by id, user can edit own comments and staff and edit all comments
	.put('/editComment/:id', loginRequired, authRequired, (req, res, next) => {
		const { id } = req.params;
		req.body.hasEdit = 1;
		if (req.user.isStaff) {
			req.body.isAllowed = 1;
		} else {
			req.body.isAllowed = 0;
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
	})

// Delete to delete comment by ID user can delete own comments and staff and delete all comments
	.delete('/deleteComment/:id', loginRequired, authRequired, (req, res, next) => {
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

module.exports = router;
