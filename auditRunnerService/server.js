/*jshint esversion: 6 */

const mongoose = require('mongoose');
const axios = require('axios');
const parseXml = require('xml2js').parseString;
const keys = require('./config');
const mailer = require('./mailService');
const isEqual = require('lodash').isEqual;

// Library for difference between 2 html
const htmldiff = require('./htmlDiff2');

// Importing Mongoose model 
require('./customer.model');
require('./audit.model');
const Customer = require('mongoose').model('Customer');
const Audit = require('mongoose').model('Audit');
const getAssets = (data) => {
	if(data.collection.typeName === "index") {
		return data.collection.collections.map(col => col.mainImage ? col.mainImage.assetUrl: null);
					
		} else if(data.collection.typeName === "page") {
			return data.collection.mainImage ? [data.collection.mainImage.assetUrl] : null;
		}
}
// Audit Logic
const run = async (customers) => {
	let changedUrls = [];
	for(let customer of customers) {
				console.log(`${customer.url} --------------------- Audit`);

				if(customer.sitemap) {
					for(currentSitemap of customer.sitemap) {
						
						const loadedData = await axios.get(`${currentSitemap.loc}?format=json`)
							.then(res => res.data)
							.catch(err => console.log(`${customer.url} is down`));
						if(loadedData) {
							const assets = getAssets(loadedData);
							
							const tempSitemap = ((currentSitemap.lastChange.toString() !== loadedData.collection.updatedOn.toString()) || !isEqual(currentSitemap.assets, assets)) 
								? currentSitemap 
								: null;
							
							if(tempSitemap) {
								changedUrls.push({
									id: tempSitemap.id,
									url: tempSitemap.loc,
									customer: customer,
									content: tempSitemap.content,
									modified: loadedData.collection.updatedOn,
									data: loadedData,
									oldAssets: currentSitemap.assets,
									newAssets: assets,
								});
							}		
						}
					}
				}
	}

	// console.log(changedUrls); 

	for(let currentUrl of changedUrls) {
		// Content Return the site content from the API
		let content = "";
		if(currentUrl.data.collection.typeName === "index") {
			content =  currentUrl.data.collection.collections.map(col => col.mainContent).join("<br><br>");
		} else if(currentUrl.data.collection.typeName === "page"){
			content =  currentUrl.data.mainContent;
		}

		if(content) {
			// Create an Audit Object
				const audit = {
					url: currentUrl.url,
					oldData: currentUrl.content,
					newData: content,
					oldAssets: currentUrl.oldAssets,
					newAssets: currentUrl.newAssets,
					diffData: htmldiff(currentUrl.content, content),
					cu: currentUrl.customer.id,
					cuName: currentUrl.customer.name,
					rootUrl: currentUrl.customer.url,
					modified: currentUrl.modified
				};

					// Saves Audit
					new Audit(audit).save();

					// Creates New updated Sitemap and update Customer Model
					const nsm = [...currentUrl.customer.sitemap.filter(el => el.id !== currentUrl.id), {loc: currentUrl.url, lastChange: currentUrl.modified, content: content, assets: currentUrl.newAssets}];
					const updatedCustomer = currentUrl.customer;
					updatedCustomer.sitemap = nsm; 

					Customer.findByIdAndUpdate(updatedCustomer.id, updatedCustomer, {new: true}, function(error, model) {
						if(error) { 
							console.log(error);
						} else {
							const mail_html = `
							<h3 style="color:purple;">OC SCAN detected a change to your Wesbite</h3>
							<p>Click below to see a report of changes and when (??) they were made. </p>
							<p>Visit OC SCAN Portal <a href="www.omnicommando.com">Click here </a></p>
							<p>Link to the Page on your site: <a href="${audit.url}">${audit.url} </a></p>

							`;
							mailer(model.email, 'OC SCAN detected change', mail_html);
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

				},4*60*60*1000);
};

runner();
