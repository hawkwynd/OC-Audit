/* jshint esversion:6 */

const express = require('express');
const expressValidator = require('express-validator');
const session = require('express-session');
const http = require('http');
const reload = require('reload');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const keys = require('./config');
const passport = require('passport');
const moment = require('moment');

const config = require('./config/index');
// console.log(config);

// Load models
require('./models/customer');
require('./models/audit');
require('./models/user');

// initialLoad helper
const customerController = require('./controllers/customer.controller');
const adminController = require('./controllers/admin.controller');
const auditController = require('./controllers/audit.controller');

const app = express();

//Passport config
require('./config/passport')(passport);

// Connecting mogo DB
let mongodbUri = `mongodb://${keys.db.username}:${keys.db.password}@ds161074.mlab.com:61074/audit-dev`;
mongoose.connect(mongodbUri, {useNewUrlParser: true})
  .then(() => {
    console.log("mongoDB connected");
  }).catch((err) => {
    console.log(" Mongoose connection error", err);
  });


app.use(express.static('public'));
// Setting View Engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main',
  helpers: {
        formatDate: function (date, format) {
            return moment.unix(date.slice(0, 10)).format(format);
        }
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(session({secret: keys.session.secret, saveUninitialized: false, resave: false}));

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'handlebars');

// Customer routes
app.get('/', customerController.index);
app.get('/welcome', customerController.welcome);
app.get('/customer/login', customerController.renderLogin);
app.get('/newCustomer', customerController.renderCustomerRegister);
app.post('/register-customer', customerController.registerCustomer);
app.post('/customer/login', customerController.login);
app.get('/customer/delete/:id', customerController.deleteDevAuditById);
app.get('/customer/edit/:id', customerController.RenderEditCustomerById);
app.post('/customer/edit', customerController.editCustomerById);

// Audits routes
app.get('/audits', auditController.getAudits);
app.get('/audits/:id', auditController.getAuditById);
app.get('/audits/dev/:id', auditController.getDevAuditById);
app.get('/audits/delete/:id', auditController.deleteAuditById);
// app.get('/audits/customer/:id', auditController.getAuditByCustomerId);

// Admin
app.get('/admin/register', adminController.renderRegister);
app.get('/admin/login', adminController.renderLogin);
app.post('/admin/register', adminController.register);
app.post('/admin/login', passport.authenticate('local', { failureRedirect: '/admin/login' }), adminController.login);
// Endpoint to logout
app.get('/admin/logout', adminController.logout);

// Wrong urls Redirect
app.get('/sitemap.xml', (req, res) => res.send('sitemap.xml.txt'));
app.get('/robots.txt', (req, res) => res.send('robots.txt'));
app.get('*', (req, res) => res.redirect('/'));

server = http.createServer(app);
server.listen(config.port, () => {
		console.log(`Server running on port ${config.port}`);
});

reload(app);