const bcrypt = require('bcrypt-nodejs');
const db = require('./db');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

function authenticate(req, username, password, done) {
// Form Validator
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();

// Check Errors
	const errors = req.validationErrors();
	if (errors) {
		return done(null, false, { errors });
	}

// Check for username and password match
	db('users')
	.where('userName', username)
	.first()
	.then(user => {
		if (!user || !bcrypt.compareSync(password, user.password)) {
			return done(null, false, { message: 'invalid user and password combination' });
		}
		done(null, user);
	}, done);
}

function register(req, username, password, done) {
// Form Validator
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('firstName', 'First name field is required').notEmpty();
	req.checkBody('lastName', 'Last name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email is not a valid email address').isEmail();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

// Check Errors
	const errors = req.validationErrors();
	if (errors) {
		return done(null, false, { errors });
	}

// Handle image name
	let profileImage;
	if (req.file) {
		profileImage = req.file.filename;
	} else {
		profileImage = 'noimage.jpg';
	}

// Check db to see if user exists
	db('users')
	.where('userName', username)
	.first()
	.then(user => {
		if (user) {
			return done(null, false, { message: `Sorry, username "${username}" already exists` });
		}
		if (password !== req.body.password2) {
			return done(null, false, { message: 'Sorry, passwords don\'t match' });
		}

// Create user
		const newUser = {
			userName: username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			profileImage,
			isAdmin: 0,
			isStaff: 0,
			password: bcrypt.hashSync(password)
		};
		db('users')
		.insert(newUser)
		.then(ids => {
			newUser.id = ids[0];
			done(null, newUser);
		});
	});
}

passport.use(new LocalStrategy({ passReqToCallback: true }, authenticate));
passport.use('local-register', new LocalStrategy({ passReqToCallback: true }, register));
// passport.use(new GitHubStrategy({
// 	// Need to protect these keys
// 	clientID: '',
// 	clientSecret: '',
// 	callbackURL: 'http://localhost:3021/auth/github/callback'
// }, (accessToken, refreshToken, profile, done) => {
// 	db('users')
// 		.where('oauth_provider', 'github')
// 		.where('oauth_id', profile.username)
// 		.first()
// 		.then(user => {
// 			if (user) {
// 				return done(null, user);
// 			}
// 			const newUser = {
// 				oauth_provider: 'github',
// 				oauth_id: profile.username,
// 			};
// 			return db('users')
// 			.insert(newUser)
// 			.then(ids => {
// 				newUser.id = ids[0];
// 				done(null, newUser);
// 			});
// 		});
// }
// ));

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	db('users')
	.where('id', id)
	.first()
	.then(user => {
		done(null, user);
	}, done);
});
