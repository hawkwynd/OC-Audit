/* jshint esversion: 6*/
const mongoose =  require('mongoose');
const Audit =  mongoose.model('Audit');
const paginate = require('express-paginate');

// const paginate = (page, data, offset) => {
//     return data.slice((page - 1)*offset, (page*offset - 1));
// }

module.exports = {
    getAudits:   async (req, res) => {
        let auditsCount = 0;
        if(req.session.user) {
            // pagination pageCount, audits count setup
            await Audit.count().then(c => auditsCount = c).catch(e => console.log(e))
            const pageCount = Math.ceil(auditsCount / req.query.limit);
            
            let query = {};
            let id = "";

            if(req.headers.referer.includes('cu=')) {
                const referer = req.headers.referer;
                id = referer.substring(referer.indexOf('=') + 1);
            }

            if(req.query.cu || (id && req.query.date)) {
                cu = req.query.cu || id;
                query= req.query.date ? 
                    {cu: cu, compareDate: req.query.date} : 
                    {cu: cu};
            } else {
                 query= req.query.date ? {compareDate: req.query.date} : {};
            }
            Audit.find(query).sort([['createdAt', -1]]).limit(req.query.limit).skip(req.skip).then(results => {
                const newData = require('../helpers/htmlParse')(results);

                res.render('audits', {
                    audits: newData.sort((a, b) => b.modified.localeCompare(a.modified)), 
                    user: req.session.user,
                    pageCount,
                    auditsCount,
                    pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
                });
            });
        } else if(req.session.visitor) {
            const id = mongoose.Types.ObjectId(req.session.visitor);
            const query= req.query.date ? 
                {cu: id, compareDate: req.query.date} : 
                {cu: id};
                
            // pagination pageCount, audits count setup
            await Audit.count(query).then(c => auditsCount = c).catch(e => console.log(e))
            const pageCount = Math.ceil(auditsCount / req.query.limit);

            Audit.find(query).sort([['createdAt', -1]]).limit(req.query.limit).skip(req.skip).then(results => {
                const newData = require('../helpers/htmlParse')(results);

                res.render('audits', {
                    audits: newData.sort((a, b) => b.modified.localeCompare(a.modified)), 
                    visitor: req.session.visitor,
                    pageCount,
                    auditsCount,
                    pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
                });
            });
        }  else {
            res.redirect('/customer/login');
        }
    },
    
    getAuditById: (req, res) => {
        if(req.session.user || req.session.visitor) {
            Audit.findById(req.params.id)
                .then((result) => {
                    const newData = require('../helpers/htmlParseDiff')(result);
                    res.render('audit', {
                        audit: newData, user: req.session.user, 
                        visitor: req.session.visitor
                    });
                }).catch(err => console.log("Error Retrieving data"));
        } else {
            res.redirect('/');
        }
    },

    getDevAuditById: (req, res) => {
        if(req.session.user || req.session.visitor) {
            Audit.findById(req.params.id).then((result) => {
                const newData = require('../helpers/htmlParseDiff')(result);
                const diff = require('../helpers/diff2html')(newData);
                res.render('devAudit', {
                    audit: result, 
                    code: diff, 
                    user: req.session.user, 
                    visitor: req.session.visitor
                });
            });
        } else {
            res.redirect('/');
        }
    },

    deleteAuditById: (req, res) => {
        Audit.findByIdAndDelete(req.params.id).then(results => {
            res.redirect('/audits');
        });
    }
};