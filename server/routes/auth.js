const passport = require('passport');
const router = require('express').Router();
const multer = require('multer');

const upload = multer({ dest: './uploads/profileImages' });

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/blogs');
	}
	next();
}

router
	.get('/', (req, res, next) => {
		res.send({
			session: req.session,
			user: req.user,
			authenticated: req.isAuthenticated(),
		});
	})
	.get('/login', isLoggedIn, (req, res, next) => {
		res.render('login');
	})
	.post('/login',
		passport.authenticate('local', {
			failureRedirect: 'login'
		}),
		(req, res) => {
			req.flash('success', 'You are now logged in');
			res.redirect('blogs');
		}
	)
	.get('/logout', (req, res, next) => {
		req.session.destroy(err => {
			res.redirect('login');
		});
	})
	.get('/register', isLoggedIn, (req, res, next) => {
		res.render('register');
	})
	.post('/register', upload.single('profileImage'), passport.authenticate('local-register', {
		successRedirect: 'blogs',
		failureRedirect: 'register'
	}));

// 	.get('/auth/github',
//   passport.authenticate('github', { scope: ['user:email'] }))
// 	.get('/auth/github/callback',
//   passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//     // Successful authentication, redirect home.
// 	res.redirect('/');
// });

module.exports = router;
