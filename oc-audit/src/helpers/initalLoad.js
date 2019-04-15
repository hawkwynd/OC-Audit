const axios = require('axios');
const Customer = require('mongoose').model('Customer');

const initialLoad =  async function(array, customer) {
	customer.sitemap = [];
	let sitemap =  await array.map(async (el) => {
			
		const content = await axios.get( el.loc[0]+'/?format=json')
			.then(res => res.data)
			.then(data =>  {
				if(data.collection.typeName === "index") {
					return data.collection.collections.map(col => col.mainContent).join("<br><br>");
				} else if(data.collection.typeName === "page"){
					return data.mainContent;
				}
			});

			return {
				loc : el.loc[0],
		 		lastChange: el.lastmod ? el.lastmod[0] : null,
				content: content
			}
		});
		
		Promise.all(sitemap).then(results => {
			customer.sitemap = results.filter(res => res.content);
            new Customer(customer).save();
		});
}

module.exports =  initialLoad;