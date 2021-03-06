var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var employeeRouter = require('./routes/employee');
var userRouter = require('./routes/user');
var productRouter = require('./routes/product');
var orderRouter = require('./routes/order');
var supplyRouter = require('./routes/supply');
var whRouter = require('./routes/wh');
var app = express();
var CronJob = require('cron').CronJob;
const job = require('./utils/cron');

app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
var cronRecommend = new CronJob('00 34 20 * * *', function() {
  job.genRecommendProductTogether();
  job.genRecommend();
 });
 cronRecommend.start();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/employee', employeeRouter);
app.use('/user', userRouter);
app.use('/product', productRouter);
app.use('/order', orderRouter);
app.use('/supply', supplyRouter);
app.use('/wh', whRouter);
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
});

module.exports = app;
