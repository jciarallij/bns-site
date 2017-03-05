const passport = require('passport');
const router = require('express').Router();

router
	.get('/', (req, res, next) => {
		res.send({
			session: req.session,
			user: req.user,
			authenticated: req.isAuthenticated(),
		});
	})
	.get('/login', (req, res, next) => {
		res.render('login');
	})
	.post('/login', passport.authenticate('local', {
		successRedirect: '/blogs',
		failureRedirect: '/login'
	}))
	.get('/logout', (req, res, next) => {
		req.session.destroy(err => {
			res.redirect('/login');
		});
	})
	.get('/register', (req, res, next) => {
		res.render('register');
	})
	.post('/register', passport.authenticate('local-register', {
		successRedirect: '/blogs',
		failureRedirect: '/register'
	}));
// 	.get('/auth/github',
//   passport.authenticate('github', { scope: ['user:email'] }))
// 	.get('/auth/github/callback',
//   passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//     // Successful authentication, redirect home.
// 	res.redirect('/');
// });

module.exports = router;
