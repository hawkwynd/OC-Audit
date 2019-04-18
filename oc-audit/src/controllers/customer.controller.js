/* jshint esversion: 6 */

const Customer = require('mongoose').model('Customer');
const Audit = require('mongoose').model('Audit');
const axios = require('axios');
const initialLoad = require('../helpers/initalLoad');
const parseXml = require('xml2js').parseString;

module.exports = {
    index: (req, res) => {
        if(req.session.user) {
            Customer.aggregate([{
                $lookup: 
                        {
                          from: "audits",
                          localField: "_id",
                          foreignField: "cu",
                          as: "audits"
                        }}
            ]).exec((err, results) => {
                if(results) res.render('home', {customers: results, user: req.session.user});
            });
        } else {
            res.redirect('/customer/login');
        }
    },

    renderLogin: (req, res) => {
        res.render('customerLogin', {error: req.session.error});
        req.session.error = null;
    },

    renderCustomerRegister: (req, res) => {
        if(req.session.user) {
            res.render('register', { success: req.session.success, errors: req.session.errors, user: req.session.user });
            req.session.errors = null;
        } else {
            res.redirect("/");
        }
    },
    RenderEditCustomerById: (req, res) => {
        if(req.session.user) {
            Customer.findById(req.params.id).then(result => {
                res.render('editCustomer', {success: req.session.success, errors: req.session.errors, user: req.session.user, customer: result});
            });
        } else {
            res.redirect("/");
        }
    },

    editCustomerById: (req, res) => {
        const {id, code, name, url, email } = req.body;

            req.checkBody('name', 'Name is required').notEmpty();
            req.checkBody('url', 'Url is required').notEmpty();
            req.checkBody('url', 'Url Should be www.url.com ').matches(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
            req.checkBody('email', 'Email is required').notEmpty();

            var errors = req.validationErrors();

            if(errors) {
                req.session.errors = errors;
                req.session.success = false;
                res.redirect('/customer/edit/'+ id);
            } else {
                // No errors
                req.session.success = true;

                Customer.update({_id: id}, { $set: {name: name, url: url, email: email} })
                    .then((affected,error , result) => {
                        if(error) console.log(error);
                        res.redirect('/');
                });
            }
        },

    registerCustomer: (req, res) => {
        const {name, url, email } = req.body;

            req.checkBody('name', 'Name is required').notEmpty();
            req.checkBody('url', 'Url is required').notEmpty();
            req.checkBody('url', 'Url Should be www.url.com ').matches(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
            req.checkBody('email', 'Email is required').notEmpty();

            var errors = req.validationErrors();

            if(errors) {
                req.session.errors = errors;
                req.session.success = false;
                res.redirect('/newCustomer');
            } else {
                // No errors
                req.session.success = true;

                let newCustomer = {
                    name: name.toUpperCase(),
                    url: url.toLowerCase(),
                    email: email.toLowerCase()
                };

                // get sitemap
                axios.get(`https://${url}/sitemap.xml`)
                    .then(res => res.data)
                    .then(xml => {
                        parseXml(xml, (err, sitemapArray) => {
                            initialLoad(sitemapArray.urlset.url, newCustomer);
                        });
                    })
                    .catch(err => console.log(err));


                res.redirect('/');

        }
    },

    login: (req, res) => {
            const { customerId } = req.body;
            if(customerId) {
                Customer.getCustomerByCode(customerId, (customer) => {
                if(customer){
                    req.session.visitor = customer._id;
                    res.redirect('/audits');
                } else {
                    req.session.error = "Customer Account not Found";
                    req.session.visitor = null;
                    res.redirect('/customer/login');
                }
                });
            }
    },
    deleteDevAuditById: (req, res) => {
        const id = req.params.id;
        Audit.deleteMany({cu: id}, function(err) {
            if(err) console.log();
        });
        Customer.findByIdAndDelete(id).then(results => {
            res.redirect('/');
        });
    }
};