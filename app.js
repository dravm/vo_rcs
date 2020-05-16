var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var createError = require('http-errors');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var cors = require('cors');

//  Routes
var indexRouter = require('./routes/index');
var userRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var reporterRouter = require('./routes/reporters');
var eventRouter = require('./routes/events');

var oldLog = console.log;
const RS="\x1b[0m" ;

console.log = function(msg, level, color) {
  var date = new Date();

  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var milliseconds = date.getMilliseconds();

  !level && (level = "trace");
	
  var logDate = day + "/" + month + "/" + year + " - " + hours + ":" + minutes + ":" + seconds + ":" + milliseconds;

  color ? oldLog.apply(console, [ color + "[" + logDate + "][" + level + "]: " + msg + RS ]) : 
          oldLog.apply(console, [ "[" + logDate + "][" + level + "]: " + msg ]);
};

var ON_DEATH = require('death')({
	uncaughtException : true
});

ON_DEATH(function(signal, err) {
	console.log("Process died, cleaning up " + signal + " " + err);

	if (err) {
		console.log("Error " + err.stack);
  }
  
	process.exit();
});

var app = express();

app.use(cors({origin: '*'}));

// view engine setup
/* app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); */

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//  Secure random string - use it as a cookie secret.
app.use(session({
  cookieName : 'session',
  secret : 'AABBCCDDEEFF',
  duration : 30 * 60 * 1000,
  activeDuration : 30 * 60 * 1000,
}));

function checkLogin(req, res, next) {
  console.log("Checking login " + req.path);
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (req.session.user || ip == "localhost" || ip.indexOf("127.0.0.1") >= 0
      || req.path.indexOf("/auth") === 0
      || req.path.indexOf("/login") === 0
      || req.path.indexOf("/register") === 0
      || req.path.indexOf("/forgotten-password.html") === 0){ 
        next(); 
  } else {
      res.redirect("/login?path=" + encodeURI(req.originalUrl));
  }
}

app.use(function(req, res, next) {
	if (!req.session.id) {
		req.session.id = req.cookies.session;
	}
	next();
});

app.all('/*.html', checkLogin);
app.all('/', checkLogin);

app.use("/login", function(req, res, next) {
  res.render('login', { title: 'RemoteControl' });
});

// Rest API routes
app.use('/', checkLogin, indexRouter);
app.use('/auth', authRouter);
app.use("/reporters", checkLogin, reporterRouter);
app.use('/users', checkLogin, userRouter);
app.use("/events", checkLogin, eventRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  /* res.status(500).json({
    message: err.message,
    error: err
  }); */
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  const path = require('path');
  app.get('*', (req,res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  })
}

module.exports = app;
