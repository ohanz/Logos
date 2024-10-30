const transporter = require('./mailer');

const mailOptions = {
  from: 'hypercoderd@gmail.com',
  to: 'ohaekimdaniel@gmail.com',
  subject: 'Test Email',
  text: 'Hello from Nodemailer!',
  html: '<h1>Hello from Nodemailer!</h1>',
//   attachments: [
//     {
//       filename: 'example.txt',
//       content: 'Hello from Nodemailer!',
//     },
//   ],
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Error sending email:', err);
  } else {
    console.log('Email sent:', info);
    console.log('Email headers:', info.headers);
    console.log('Email response:', info.response)
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
});
