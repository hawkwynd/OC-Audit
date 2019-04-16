/* jshint esversion: 6*/
const mongoose =  require('mongoose');
const Audit =  mongoose.model('Audit');
const moment = require('moment');

module.exports = {
    getAudits:   (req, res) => {
    
        if(req.session.user) {
            let query = {};
            let id = "";

            if(req.headers.referer.includes('cu=')) {
                const referer = req.headers.referer;
                id = referer.substring(referer.indexOf('=') + 1);
            }

            if(req.query.cu || id) {
                cu = req.query.cu || id;
                query= req.query.date ? {cu: cu, modified: moment(req.query.date).format("YYYY-MM-DD")} : {cu: cu};
            } else {
                 query= req.query.date ? {modified: moment(req.query.date).format("YYYY-MM-DD")} : {};
            }
            Audit.find(query).then(results => {
                const newData = require('../helpers/fixhtml')(results);
                res.render('audits', {audits: newData.sort((a, b) => b.modified.localeCompare(a.modified)), user: req.session.user});
            });
        } else if(req.session.visitor) {
            const id = mongoose.Types.ObjectId(req.session.visitor);
            const query= req.query.date ? {cu: id, modified: moment(req.query.date).format("YYYY-MM-DD")} : {cu: id};
            Audit.find(query).then(results => {
                const newData = require('../helpers/fixhtml')(results);
                res.render('audits', {audits: newData.sort((a, b) => b.modified.localeCompare(a.modified)), visitor: req.session.visitor});
            });
        }  else {
            res.redirect('/customer/login');
        }
    },

    getAuditById: (req, res) => {
        Audit.findById(req.params.id)
            .then((result) => {
                const newData = require('../helpers/fixhtml1')(result);
                res.render('audit', {audit: newData, user: req.session.user, visitor: req.session.visitor});
            }).catch(err => console.log("Error Retrieving data"));
    },

    getDevAuditById: (req, res) => {
        Audit.findById(req.params.id).then((result) => {
            const newData = require('../helpers/fixhtml1')(result);
            const diff = require('../helpers/diff2html')(newData);
            res.render('devAudit', {audit: result, code: diff, user: req.session.user, visitor: req.session.visitor});
        });
    },

    deleteDevAuditById: (req, res) => {
        Audit.findByIdAndDelete(req.params.id).then(results => {
            res.redirect('/audits');
        });
    }
};