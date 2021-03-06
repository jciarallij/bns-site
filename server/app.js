var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
// var RedisStore = require('connect-redis')(session);
var expressValidator = require('express-validator');
var expressMessages = require('express-messages');
var multer = require('multer');
var flash = require('connect-flash');
var aws = require('aws-sdk');
var db = require('./db');
var cache = require('./cache');
var upload = multer({ dest: './uploads' });
require('./passport');

// Routes
var authRoutes = require('./routes/auth');
var blogsRoutes = require('./routes/blogs');
var commentsRoutes = require('./routes/comments');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Validator (needs to be directly after bodyParser)
app.use(expressValidator({
	errorFormatter(param, msg, value) {
		var namespace = param.split('.');
		var root = namespace.shift();
		var formParam = root;
		while (namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param: formParam,
			msg,
			value
		};
	}
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Handle sessions and cacheing
app.use(session({
	// store: new RedisStore(),
	secret: 'josh is awesome',
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());
app.use(function (req, res, next) {
	res.locals.messages = expressMessages(req, res);
	next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api', blogsRoutes);
app.use('/api', commentsRoutes);

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
