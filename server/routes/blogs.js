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
	if (!(req.user.userName === req.body.createdBy) || !req.user.isAdmin) {
		return res.render('403');
	}
	next();
}

router
// Get all blogs with Title, Description, Ceated By, Created Date and Likes
	.get('/blogs', loginRequired, (req, res, next) => {
		db
			.select('title', 'description', 'createdBy', 'createdAt', 'likes')
			.from('blogs')
			.then(blogs => {
				res.send(blogs);
			});
	})

// Get full individual blog by id WITH JOIN
	// .get('/blog/:id', loginRequired, (req, res, next) => {
	// 	const { id } = req.params;
	// 	db('blogs')
	// 		.leftJoin('comments', 'blogs.title', 'comments.blogTitle')
	// 		.where('blogs.id', id)
	// 		.then(blog => {
	// 			if (!blog) {
	// 				return res.send({ message: `Sorry blog ${id} couldn't be found` });
	// 			}
	// 			res.send(blog);
	// 		}, next);
	// })

// Get full individual blog and comments by id WITHOUT JOIN
	.get('/blog/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		db('blogs')
			.where('id', id)
			.first()
			.then(blog => {
				if (!blog) {
					return res.send({ message: `Sorry blog ${id} couldn't be found` });
				}
				db('comments')
					.where('blogTitle', blog.title)
					.then(comments => {
						if (!comments) {
							return res.send({ message: 'Sorry unable to get comments' });
						}
						res.send({ blog, comments });
					}, next);
			}, next);
	})

// Get for liking blog
	.get('/likeBlog/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		db('blogs')
			.where('id', id)
			.increment('likes', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to like blog' });
				}
				res.sendStatus(200);
			}, next);
	})

// Post for adding blogs by the Admin or Staff
	.post('/addBlog', loginRequired, staffRequired, (req, res, next) => {
		db('blogs')
			.where('title', req.body.title)
			.first()
			.then(blog => {
				if (blog) {
					return res.send({ message: `Sorry blog title: ${req.body.title} already exists` });
				}
			}, next);
		const newBlog = {
			createdBy: req.user.userName,
			title: req.body.title,
			description: req.body.description,
			body: req.body.body,
		};
		if (req.user.isAdmin) {
			newBlog.isAllowed = 1;
		}
		db('blogs')
			.insert(newBlog)
			.then(blogIds => {
				if (!blogIds) {
					return res.send({ message: 'Error...Couldn\'t post blog' });
				}
				newBlog.id = blogIds[0];
				res.send(newBlog);
			}, next);
	})

// Put for editing blog, Staff can only edit their own blogs and Admin can edit all
	.put('/editBlog/:id', loginRequired, staffRequired, authRequired, (req, res, next) => {
		const { id } = req.params;
		req.body.hasEdit = 1;
		db('blogs')
			.where('id', id)
			.update(req.body)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to edit blog' });
				}
				res.sendStatus(200);
			}, next);
	})

// Delete to delete blogs, Staff can oly delete their own blogs and Admin can delete all.
	.delete('/deleteBlog/:id', loginRequired, staffRequired, authRequired, (req, res, next) => {
		const { id } = req.params;
		db('blogs')
			.where('id', id)
			.delete()
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to delete blog' });
				}
				res.sendStatus(200);
			}, next);
	});

module.exports = router;
