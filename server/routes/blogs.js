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

router.get('/blogs', loginRequired, (req, res, next) => {
	db('blogs')
		.then(blogs => {
			res.send(blogs);
		});
});

router
	.post('/addBlog', loginRequired, adminRequired, (req, res, next) => {
		db('blogs')
			.where('title', req.body.title)
			.first()
			.then(blog => {
				if (blog) {
					return res.send({ message: `Sorry blog title: ${req.body.title} already exists` });
				}
			}, next);
		const newBlog = {
			title: req.body.title,
			body: req.body.body,
		};
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
	.put('/editBlog/:id', loginRequired, adminRequired, (req, res, next) => {
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
	.delete('/deleteBlog/:id', loginRequired, adminRequired, (req, res, next) => {
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
