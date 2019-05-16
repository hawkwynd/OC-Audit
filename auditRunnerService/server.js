/*jshint esversion: 6 */

const mongoose = require('mongoose');
const axios = require('axios');
const parseXml = require('xml2js').parseString;
const keys = require('./config');
const mailer = require('./mailService');

// Library for difference between 2 html
const htmldiff = require('./htmlDiff2');

// Importing Mongoose model 
require('./customer.model');
require('./audit.model');
const Customer = require('mongoose').model('Customer');
const Audit = require('mongoose').model('Audit');

// Audit Logic
const run = async (customers) => {
	let changedUrls = [];
	for(let customer of customers) {
				console.log(`${customer.url} --------------------- Audit`);
        const array = await axios.get(`https://${customer.url}/sitemap.xml`)
            .then(res => {
					let jsonData = []; 
					parseXml(res.data, (err, sitemapArray) =>  jsonData = sitemapArray.urlset.url);
					return jsonData;
				}).catch(err => console.log(`${customer.url} is down`));

				if(array) {
					for(newSitemap of array) {
						const tempSitemap = customer.sitemap.find(data => {
							if(newSitemap.lastmod) {
								return (data.loc === newSitemap.loc[0]) && (newSitemap.lastmod && (data.lastChange !== newSitemap.lastmod[0]));
									}							
							return null;
						});
						
						if(tempSitemap) {
							// console.log(tempSitemap.loc);
							changedUrls.push({
								id: tempSitemap.id,
								url: tempSitemap.loc,
								customer: customer,
								content: tempSitemap.content,
								modified: newSitemap.lastmod[0]
							});
						}		
					}
				}
	}

	// console.log(changedUrls); 

	for(let currentUrl of changedUrls) {
		// Content Return the site content from the API
		const content = await axios.get(currentUrl.url + '?format=json').then(res => res.data)
			.then(data =>  {
				if(data.collection.typeName === "index") {
					return data.collection.collections.map(col => col.mainContent).join("<br><br>");
				} else if(data.collection.typeName === "page"){
					return data.mainContent;
				}
			}).catch(error => console.log(`Error retrieving ${currentUrl.url}`));

			if(content) {
				// Create an Audit Object
					const audit = {
						url: currentUrl.url,
						oldData: currentUrl.content,
						newData: content,
						diffData: htmldiff(currentUrl.content, content),
						cu: currentUrl.customer.id,
						cuName: currentUrl.customer.name,
						rootUrl: currentUrl.customer.url,
						modified: currentUrl.modified
					};

					// Saves Audit
					new Audit(audit).save();

					// Creates New updated Sitemap and update Customer Model
					const nsm = [...currentUrl.customer.sitemap.filter(el => el.id !== currentUrl.id), {loc: currentUrl.url, lastChange: currentUrl.modified, content: content}];
					const updatedCustomer = currentUrl.customer;
					updatedCustomer.sitemap = nsm; 

					Customer.findByIdAndUpdate(updatedCustomer.id, updatedCustomer, {new: true}, function(error, model) {
						if(error) { 
							console.log(error);
						} else {
							const mail_html = `
							<h2 style="color:purple;">OC Audit detected a change on your Wesbite</h2>
							<p>Page Url: <a href="${audit.url}">${audit.url} </a></p>
							<p>Visit OC Audit Portal <a href="www.omnicommando.com">Click here </a></p>

							`;
							mailer(model.email, 'Website change detected', mail_html);
							console.log(`${model.url} updated!`);
							// send mail
						}
					});
			}
	}
}

// Process Runner Method
const runner = () => {
	// find all customers and Run Audit
	console.log('Running Audit *************************************');
	const mail_html = `
      <h2 style="color:purple;">Audit Service is running</h2>
      <p>time: ${new Date()}</p>
	`;
	mailer('oumar@omnicommander.com', 'Audit running', mail_html);
	// Connecting mogo DB
	let mongodbUri = `mongodb://${keys.db.username}:${keys.db.password}@ds161074.mlab.com:61074/audit-dev`;
	mongoose.connect(mongodbUri, {useNewUrlParser: true})
		.then(() => {
			console.log("mongoDB connected");
		}).catch((err) => {
			console.log(" Mongoose connection error", err);
		});

	Customer.find()
		.then((customers) => {
        if(customers) {
						run(customers);
          }
      }).catch(err => console.log("Unable to reach database at the Moment"));

				// Loop To make process run every {1.5s}
				setTimeout(() => {
						runner();					
				}, 90000);
};

runner();