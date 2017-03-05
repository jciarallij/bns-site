const passport = require('passport');
const router = require('express').Router();
const db = require('../db');

router
	.get('/posts', (req, res, next) => {
		db('blogs')
			.where('hasEdit', '0')
			.then(blogs => {
				console.log(blogs);
				res.render('posts', {
					title: 'your posts',
					blogs
				});
			});
	});

module.exports = router;
