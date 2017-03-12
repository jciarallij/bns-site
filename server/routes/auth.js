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
	.get('/logout', (req, res, next) => {
		req.session.destroy(err => {
			req.flash('success', 'You have been logged out.');
			res.redirect('login');
		});
	})
	.get('/register', isLoggedIn, (req, res, next) => {
		res.render('register');
	})
	.post('/login',
		passport.authenticate('local', {
			failureRedirect: 'login'
		}),
		(req, res) => {
			req.flash('success', 'You are now logged in.');
			res.redirect('blogs');
		}
	)
	.post('/register',
		upload.single('profileImage'), passport.authenticate('local-register', {
			failureRedirect: 'register'
		}),
			(req, res) => {
				req.flash('success', 'You have successfully registered.');
				res.redirect('blogs');
			}
	);

// 	.get('/auth/github',
//   passport.authenticate('github', { scope: ['user:email'] }))
// 	.get('/auth/github/callback',
//   passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//     // Successful authentication, redirect home.
// 	res.redirect('/');
// });

module.exports = router;
