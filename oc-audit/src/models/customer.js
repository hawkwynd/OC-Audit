const mongoose = require('mongoose');
const shortid = require('shortid');
  let Schema = mongoose.Schema;

  let CustomerSchema = new Schema({
    name: {
        type: String
    },
    url: {
        type: String
    },
    code: {
        type: String,
        index: true,
        default: shortid.generate,
        unique: true
    },
    email: {
      type: String,
      required: true
    },
    sitemap: [
        {
            loc: String,
            lastChange: String,
            content: Schema.Types.Mixed
        }
    ]
  },
  { timestamps: true}
);

CustomerSchema.statics.getCustomerByCode = function(code, callback) {
  this.model('Customer').findOne({code: code}).then(callback)
};

  //Create Collection and add Schema
  mongoose.model('Customer', CustomerSchema);
