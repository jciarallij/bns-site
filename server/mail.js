// load aws sdk
const aws = require('aws-sdk');

// load aws config
aws.config.loadFromPath('config.js');

// load AWS SES
const ses = new aws.SES({ apiVersion: '2010-12-01' });

// send to list
const to = [aws.email];

// this must relate to a verified SES account
const from = 'emailc@example.com';


// this sends the email
// @todo - add HTML version

module.exports = ses;
