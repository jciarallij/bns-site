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
// .GET to get current user
	.get('/', (req, res, next) => {
		res.send({
			session: req.session,
			user: req.user,
			authenticated: req.isAuthenticated(),
		});
	})

// .GET render login page (ONLY NEEDED IN DEV)
	.get('/login', isLoggedIn, (req, res, next) => {
		res.render('login');
	})

// .GET for logout and destroy the session
	.get('/logout', (req, res, next) => {
		req.session.destroy(err => {
// TO-DO flash requires sessions so need to sort this out cuz session is destroyed
			// req.flash('success', 'You have been logged out.');
			res.redirect('login');
		});
	})

// .GET render register page (ONLY NEEDED IN DEV)
	.get('/register', isLoggedIn, (req, res, next) => {
		res.render('register');
	})

// .POST for user login
	.post('/login',
		passport.authenticate('local', {
			failureRedirect: 'login'
		}),
		(req, res) => {
			req.flash('success', 'You are now logged in.');
			res.redirect('blogs');
		}
	)

// .POST for registering new user
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
