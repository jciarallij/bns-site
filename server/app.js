const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const config = require('./config')[process.env.NODE_ENV || 'development'];
const cache = require('./cache');
const db = require('./db');
require('./passport');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'josh is awesome', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(authRoutes);
app.use(postsRoutes);

app.get('/', (req, res, next) => {
	res.send({
		session: req.session,
		user: req.user,
		authenticated: req.isAuthenticated(),
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
