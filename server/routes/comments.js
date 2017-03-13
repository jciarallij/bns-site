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
// .GET all comments that have not been apporved
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

// .GET for approving comment by id
	.get('/approveComment/:id', loginRequired, staffRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
			.update('isAllowed', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to approve comment' });
				}
				req.flash('success', 'Comment approved.');
				res.sendStatus(200);
			}, next);
	})

// .GET for liking comment by id
	.get('/likeComment/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		const commentsLikedArray = req.user.commentsLiked.split(',');
		if (commentsLikedArray.includes(id)) {
			return res.send({ message: 'Sorry already liked this comment.' });
		}
		db('comments')
			.where('id', id)
			.increment('likes', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to like comment' });
				}
				db('users')
				.where('userName', req.user.userName)
				.update('commentsLiked', `${req.user.commentsLiked},${id}`)
				.then(commentsLiked => {
					if (!commentsLiked) {
						return res.send({ message: 'Error...Couldn\'t update user commentsLiked' });
					}
					req.flash('success', 'Comment liked.');
					res.sendStatus(200);
				}, next);
			}, next);
	})

// .POST comment for a blog
	.post('/addComment',
		loginRequired,
		(req, res, next) => {
// Form Validator
			req.checkBody('blogTitle', 'Blog Title field is required').notEmpty();
			req.checkBody('body', 'Body field is required').notEmpty();

// Check Errors
			const errors = req.validationErrors();
			if (errors) {
				return next({ errors });
			}

			const newComment = {
				createdBy: req.user.userName,
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
					req.flash('success', 'Comment added. Will need to be approved before visable.');
					res.send(newComment);
				}, next);
		})

// .PUT to edit comment by id, user can edit own comments and staff and edit all comments
	.put('/editComment/:id',
		loginRequired,
		authRequired,
		(req, res, next) => {
// Form Validator
			req.checkBody('createdBy', 'Created By field is required').notEmpty();
			req.checkBody('blogTitle', 'Blog Title field is required').notEmpty();
			req.checkBody('body', 'Body field is required').notEmpty();

// Check Errors
			const errors = req.validationErrors();
			if (errors) {
				return next({ errors });
			}

// Handle fields
			const { id } = req.params;
			req.body.hasEdit = 1;
			req.body.editedBy = req.user.userName;
			req.body.editedAt = new Date();

			if (req.user.isStaff) {
				req.body.isAllowed = 1;
			} else {
				req.body.isAllowed = 0;
			}

// Update comment to db
			db('comments')
				.where('id', id)
				.update(req.body)
				.then(result => {
					if (result === 0) {
						return res.send({ message: 'Sorry unable to edit blog' });
					}
					req.flash('success', 'Comment updated.');
					res.sendStatus(200);
				}, next);
		})

// .DELETE to delete comment by ID user can delete own comments and staff and delete all comments
	.delete('/deleteComment/:id', loginRequired, authRequired, (req, res, next) => {
		const { id } = req.params;
		db('comments')
			.where('id', id)
			.delete()
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to delete comment' });
				}
				req.flash('success', 'Comment deleted.');
				res.sendStatus(200);
			}, next);
	});

module.exports = router;
