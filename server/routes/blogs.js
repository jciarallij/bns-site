const passport = require('passport');
const router = require('express').Router();
const multer = require('multer');

const upload = multer({ dest: './uploads/blogImages' });
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

// NOT USED
// function adminRequired(req, res, next) {
// 	if (!req.user.isAdmin) {
// 		return res.render('403');
// 	}
// 	next();
// }

function authRequired(req, res, next) {
	const { createdBy } = req.params || null;
	if (!(req.user.userName === req.body.createdBy || createdBy) || !req.user.isAdmin) {
		return res.render('403');
	}
	next();
}

router
// Get all blogs with Title, Description, Ceated By, Created Date and Likes
	.get('/blogs', loginRequired, (req, res, next) => {
		db
			.select('id', 'title', 'description', 'createdBy', 'createdAt', 'likes')
			.from('blogs')
			.then(blogs => {
// TO-DO need to uncomment and delete the render once client side has been created.
				// res.send(blogs);
				res.render('blogs', {
					title: 'Blogs Shortened',
					blogs
				});
			});
	})

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
					.where({
						blogId: id,
						isAllowed: 1
					})
					.then(comments => {
						if (!comments) {
							return res.send({ message: 'Sorry unable to get comments' });
						}
						// res.send({ blog, comments });
						res.render('blog', {
							title: blog.title,
							blog,
							comments
						});
					}, next);
			}, next);
	})

// Get for liking blog
	.get('/likeBlog/:id', loginRequired, (req, res, next) => {
		const { id } = req.params;
		const blogsLikedArray = req.user.blogsLiked.split(',');
		if (blogsLikedArray.includes(id)) {
			return res.send({ message: 'Sorry already liked this blog.' });
		}
		db('blogs')
			.where('id', id)
			.increment('likes', 1)
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to like blog' });
				}
				db('users')
				.where('userName', req.user.userName)
				.update('blogsLiked', `${req.user.blogsLiked},${id}`)
				.then(blogsLiked => {
					if (!blogsLiked) {
						return res.send({ message: 'Error...Couldn\'t update user blogsLiked' });
					}
					req.flash('success', 'Blog liked.');
					res.sendStatus(200);
				}, next);
			}, next);
	})

// .GET for rendering addBlog page
	.get('/addBlog', loginRequired, staffRequired, (req, res, next) => {
		res.render('addBlog', {
			title: 'Add A Blog'
		});
	})

// Post for adding blogs by the Admin or Staff
	.post('/addBlog',
		upload.single('blogImage'),
		loginRequired,
		staffRequired,
		(req, res, next) => {
// Form Validator
			req.checkBody('title', 'Title field is required').notEmpty();
			req.checkBody('body', 'Body field is required').notEmpty();

// Check Errors
			const errors = req.validationErrors();
			if (errors) {
				return next({ errors });
			}

// Handle image name
			let blogImage;
			if (req.file) {
				blogImage = req.file.filename;
			} else {
				blogImage = 'noimage.jpg';
			}

// Check db for duplicate titles
			db('blogs')
				.where('title', req.body.title)
				.first()
				.then(blog => {
					if (blog) {
						return res.send({ message: `Sorry blog title: ${req.body.title} already exists` });
					}
				}, next);

// Create new Blog
			const newBlog = {
				createdBy: req.user.userName,
				title: req.body.title,
				description: req.body.description,
				blogImage,
				body: req.body.body,
				twitter: req.body.twitter,
				fb: req.body.fb,
				personalWebsite: req.body.personalWebsite,
				linkedin: req.body.linkedin
			};
			db('blogs')
				.insert(newBlog)
				.then(blogIds => {
					if (!blogIds) {
						return res.send({ message: 'Error...Couldn\'t post blog' });
					}
					newBlog.id = blogIds[0];
					req.flash('success', 'Blog added.');
					// res.send(newBlog);
					res.redirect('blogs');
				}, next);
		})

// Put for editing blog, Staff can only edit their own blogs and Admin can edit all
	.put('/editBlog/:id',
		upload.single('blogImage'),
		loginRequired,
		staffRequired,
		authRequired,
		(req, res, next) => {
// Form Validator
			req.checkBody('createdBy', 'Created By field is required').notEmpty();
			req.checkBody('title', 'Title field is required').notEmpty();
			req.checkBody('body', 'Body field is required').notEmpty();

// Check Errors
			const errors = req.validationErrors();
			if (errors) {
				return next({ errors });
			}

// Handle new image name if added
			if (req.file) {
				req.body.blogImage = req.file.filename;
			}

// Handle fields
			const { id } = req.params;
			req.body.editedBy = req.user.userName;
			req.body.hasEdit = 1;
			req.body.editedAt = new Date();

// Update blog to db
			db('blogs')
				.where('id', id)
				.update(req.body)
				.then(result => {
					if (result === 0) {
						return res.send({ message: 'Sorry unable to edit blog' });
					}
					req.flash('success', 'Blog edited.');
					res.sendStatus(200);
				}, next);
		})

// Delete to delete blogs, Staff can only delete their own blogs and Admin can delete all.
	// .delete('/deleteBlog/:id/:createdBy', loginRequired, staffRequired, authRequired, (req, res, next) => {
	.get('/deleteBlog/:id/:createdBy', loginRequired, staffRequired, authRequired, (req, res, next) => {
		const { id } = req.params;
		db('blogs')
			.where('id', id)
			.delete()
			.then(result => {
				if (result === 0) {
					return res.send({ message: 'Sorry unable to delete blog' });
				}
				req.flash('success', 'Blog deleted');
				// res.sendStatus(200);
				res.redirect('/api/blogs');
			}, next);
	});

module.exports = router;
