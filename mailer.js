const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Gmail
  port:  465,
  secure: true, // or 'STARTTLS'
  auth: {
    user: 'email-from@gmail.com',
    pass: 'app generated password',
  },
});

module.exports = transporter;
