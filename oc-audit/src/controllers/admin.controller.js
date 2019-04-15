/* jshint esversion: 6*/
const User =  require('mongoose').model('User');

module.exports = {
    renderLogin: (req, res) => {
        if(req.session.user) {
            res.redirect('/');    
        } else {
            res.render('admin/login', { success: req.session.success, errors: req.session.errors, user: req.session.user });
            req.session.errors = null;
        }
    },

    renderRegister: (req, res) => {
        res.render('admin/register', { success: req.session.success, errors: req.session.errors, user: req.session.user });
        req.session.errors = null;
    },
    
    register: (req, res) => {
        const {name, email, password } = req.body;

            req.checkBody('name', 'Name is required').notEmpty();
            req.checkBody('email', 'Email is required').notEmpty();
            req.checkBody('password', 'Password is required').notEmpty();
            req.assert('password-confirm', 'Confirm Must be equal to password').equals(password);

            var errors = req.validationErrors();

            if(errors) {
                req.session.errors = errors;
                req.session.success = false;
                res.redirect('register');
            } else {
                // No errors
                // User Model

                const newUser = new User({
                  name: name,
                  email: email,
                  password: password
                });

                User.createUser(newUser, function(err, user) {
                  if(err) throw err;

                  req.session.success = true;
                  res.redirect('/admin/login');
                });
            }
    },

    login: (req, res) => {
        // const {email, password } = req.body;

            if(!req.user) {
              console.log(req.message);
                req.session.user = null;
                req.session.success = false;
                res.redirect('/admin/login');
            } else {
                // No errors
                req.session.user = req.user;
                res.redirect('/');
            }
    },

    logout: (req, res) => {
        req.session.user = null;
        req.logout();
        res.redirect('/admin/login');
    }
};