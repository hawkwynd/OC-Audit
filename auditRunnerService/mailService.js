const nodemailer = require('nodemailer');
const config = require('./config');

const mailer = (to, subject, html) => {
  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.gmail.client_user,
    clientId: config.gmail.client_id,
    clientSecret: config.gmail.secret,
    refreshToken: config.gmail.refresh_token,
    accessToken: config.gmail.access_token,
  },
});

var mailOptions = {
    from : 'OMNICOMMANDER <contact@omnicommander.com>',
    to: to,
    subject: subject,
    html: html
};

transporter.sendMail(mailOptions, function(err, res) {
    if(err) {
        console.log('Error sending Email');
    } else {
        console.log('email sent');
    }
});
};

module.exports = mailer;


