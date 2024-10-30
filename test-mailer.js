const transporter = require('./mailer');
const fs = require('fs');

// const mailOptions = {
//   from: 'example1@gmail.com',
//   to: 'example2@yahoo.com',
//   subject: 'Ohanz Test Email',
//   text: 'Hello from Nodemailer!',
//   html: '<h1>Hello from Nodemailer!<br />Ohanz Just Ran a Test</h1>',
// };

// transporter.sendMail(mailOptions, (err, info) => {
//   if (err) {
//     console.error('Error sending email:', err);
//   } else {
//     console.log('Email sent:', info);
//     console.log('Email headers:', info.headers);
//     console.log('Email response:', info.response)
//     console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
//   }
// });

// Create a file
const fileName = 'ohanz.txt';
const fileContent = 'Hello from Nodemailer! \n Just got this from Ohanz.';

fs.writeFile(fileName, fileContent, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`File ${fileName} created successfully.`);

    // Email options
    const mailOptions = {
      from: 'email-from@gmail.com',
      to: 'email-to@yahoo.com',
      subject: 'Ohanz Test Email with Attachment',
      text: 'Hello from Nodemailer!',
      html: '<h1>Hello from Nodemailer! <br /><br />Hyper "Ohanz" Just Ran a Test</h1>',
      attachments: [
        {
          filename: fileName,
          path: `./${fileName}`,
        },
      ],
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info);
        console.log('Email headers:', info.headers);
        console.log('Email response:', info.response);
      }
    });
  }
});
