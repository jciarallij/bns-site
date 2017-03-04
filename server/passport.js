const bcrypt = require('bcrypt-nodejs');
const db = require('./db');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const GitHubStrategy = require('passport-github').Strategy;

function authenticate(user_name, password, done) {
	db('users')
	.where('user_name', user_name)
	.first()
	.then(user => {
		if (!user || !bcrypt.compareSync(password, user.password)) {
			return done(null, false, { message: 'Invalid username and password combination' });
		}
		done(null, user);
	}, done);
}

function register(req, user_name, password, done) {
	db('users')
	.where('user_name', user_name)
	.first()
	.then(user => {
		if (user) {
			return done(null, false, { message: `Sorry, username "${user_name}" already exists` });
		}
		if (password !== req.body.password2) {
			return done(null, false, { message: 'Sorry, passwords don\'t match' });
		}
		const newUser = {
			user_name: req.body.user_name,
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email,
			is_admin: 0,
			is_staff: 0,
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

passport.use(new LocalStrategy(authenticate));
passport.use('local-register', new LocalStrategy({ passReqToCallback: true }, register));
// passport.use(new GitHubStrategy({
// 	// Need to protect these keys
// 	clientID: '',
// 	clientSecret: '',
// 	callbackURL: 'http://localhost:3000/auth/github/callback'
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
