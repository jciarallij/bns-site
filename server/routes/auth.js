const passport = require('passport');
const router = require('express').Router();

router
	.get('/login', (req, res, next) => {
		res.send(req.isAuthenticated() ? req.user : '0');
	})
	.post('/login', passport.authenticate('local'), (req, res) => {
		res.json(req.user);
	})
	.get('/logout', (req, res, next) => {
		req.session.destroy(err => {
			res.sendStatus(200);
		});
	})
	.get('/register', (req, res, next) => {
		res.send(req.isAuthenticated() ? req.user : '0');
	})
	.post('/register', passport.authenticate('local-register'),  (req, res) => {
		res.json(req.user);
	});
	// .get('/auth/github',
 //  passport.authenticate('github', { scope: ['user:email'] }))
	// .get('/auth/github/callback',
 //  passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
 //    // Successful authentication, redirect home.
	// res.redirect('/');
	// });

module.exports = router;
