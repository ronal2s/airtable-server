var nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: process.env.ownEmail,
        pass: process.env.ownPassword
    }
});

module.exports = { transporter }