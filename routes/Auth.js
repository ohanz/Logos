// auth.js
const express = require('express');
const router = express.Router();
const { connectToMongo } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Install: npm install jsonwebtoken
// Session expiration time (1 hour)
const SESSION_EXPIRATION = 3600000; // ms
const nodemailer = require('nodemailer');

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validation
      if (!email || !password) {
        res.status(400).json({ message: 'Invalid request' });
        return;
      }
  
      const db = await connectToMongo();
      const users = db.collection('hypers');
      const sessions = db.collection('sessions');
  
      // Find user by email
      const user = await users.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
  
      // Verify password
      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
  
      req.session.userId = user._id;
      // Generate session token
    const sessionToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: SESSION_EXPIRATION / 1000, // Convert ms to seconds
    });

    // Create session document
    await sessions.insertOne({
      userId: user._id,
      sessionToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION),
      createdAt: new Date(),
    });

      // res.json({ message: 'Logged in successfully', sessionToken });
      req.session.message = 'Logged in successfully';
      console.log('Login successful');
      res.redirect('/success');

    } catch (err) {
      console.error('Error logging in:', err.message, err.stack);
      res.status(500).json({ message: 'Error logging in', error: { message: err.message, stack: err.stack } });
    }
  });

  const authenticate = (req, res, next) => {
    if (!req.token || req.token.expired) {
      return res.redirect('/');
    }
    next();
  };
  // to USE:
  // Define routes that require authentication
// app.use('/protected', authenticate, (req, res) => {
//   // Token is valid, proceed with route handler
//   res.send('Hello, authenticated user!');
// });

  
  // Logout route
// router.post('/logout', async (req, res) => {
//   try {
//     const sessionToken = req.headers['x-session-token'];

//     const db = await connectToMongo();
//     const sessions = db.collection('sessions');

//     // Remove session document
//     await sessions.deleteOne({ sessionToken });

//     // res.json({ message: 'Logged out successfully' });
//     req.session.message = 'Logged out successfully';
//     res.redirect('/login');
//   } catch (err) {
//     console.error('Error logging out:', err.message, err.stack);
//     res.status(500).json({ message: 'Error logging out', error: { message: err.message, stack: err.stack } });
//   }
// });
// router.post('/logout', async (req, res) => {
//   try {
//     const sessionToken = req.headers['x-session-token'];
//     const db = await connectToMongo();
//     const sessions = db.collection('sessions');

//     // Remove session document
//     await sessions.deleteOne({ sessionToken });

//     // Set success message
//     req.session.message = 'Logged out successfully';

//     // Redirect to login page
//     res.redirect('/login');
//   } catch (err) {
//     console.error('Error logging out:', err.message, err.stack);
//     res.status(500).json({
//       message: 'Error logging out',
//       error: {
//         message: err.message,
//         stack: err.stack
//       }
//     });
//   } finally {
//     // Optional: Destroy session to ensure cleanup
//     req.session.destroy((err) => {
//       if (err) console.error('Error destroying session:', err);
//     });
//   }
// });

//Updated:
// 1. Removed x-session-token header check (not necessary with server-side sessions)
// 2. Removed MongoDB sessions collection interaction (not needed with server-side sessions)
// 3. Simplified error handling


router.post('/logout', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.redirect('/login?message=Logged+out+successfully');
  } catch (err) {
    console.error('Error logging out:', err.message, err.stack);
    res.status(500).json({ message: 'Error logging out' });
  }
});


// router.post('/signup', async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Validation
//     if (!username || !email || !password) {
//       res.status(400).json({ message: 'Invalid request' });
//       return;
//     }

//     const user = new User(username, email, password);
//     const db = await connectToMongo();
//     const users = db.collection('hypers');

//     // Check existing email
//     const existingUser = await users.findOne({ email });
//     if (existingUser) {
//       res.status(400).json({ message: 'Email already exists' });
//       return;
//     }

//     const result = await users.insertOne(user);
//     console.log('User created:', result.insertedId);
//     req.session.userId = result.insertedId;
//     const sessionToken = generateSessionToken(userId);
//   // res.json({ message: 'Signup successful', sessionToken, userId });
//   req.session.message = 'Signup successful';
//   res.redirect('/success');
//     // res.json({ message: 'Signed up successfully' });
//   } catch (err) {
//     console.error('Error creating user:', err.message, err.stack);
//     res.status(500).json({ message: 'Error creating user', error: { message: err.message, stack: err.stack } });
//   }
// });

// Updated: 
// generative Token redundant for server project
// Update: Email success
async function sendWelcomeEmail(email, username) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'hypercoderd@gmail.com',
    to: email,
    subject: 'Welcome to Logos!',
    text: `Hello ${username}, welcome to Logos! We're excited to have you onboard.`,
    html: `<h1>Welcome to Logos!</h1><p>Hello ${username}, welcome to Logos! We're excited to have you onboard.</p>`,
    headers: {
      'X-Mailer': 'Nodemailer',
      'X-Priority': '3',
      'X-Authenticated-User': 'hypercoderd@gmail.com',
      'X-Mailer-Info': 'Ihype COM',
      'X-Feedback-Id': 'your-feedback-id',
      'X-Spam-Flag': 'NO',
    },
  };
  console.log('Mail options:', mailOptions);
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent');
  } catch (err) {
    console.error('Error sending welcome email:', err);
    throw err;
  }
}

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }
 // Password validation
 if (password.length < 8) {
  res.status(400).json({ message: 'Password must be at least 8 characters long' });
  return;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
if (!passwordRegex.test(password)) {
  res.status(400).json({ message: 'Password must contain: uppercase, lowercase, digits, and special characters' });
  return;
}
    const user = new User(username, email, password);
    const db = await connectToMongo();
    const users = db.collection('hypers');

    // Check existing email
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const result = await users.insertOne(user);
    console.log('User created:', result.insertedId);
    req.session.userId = result.insertedId;
    req.session.message = 'Signup successful!';

    await sendWelcomeEmail(user.email, user.username);

    res.redirect('/success');
  } catch (err) {
    console.error('Error creating user:', err.message, err.stack);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: { message: err.message, stack: err.stack } 
    });
  }
});

const crypto = require('crypto');
function generateResetToken() {
  return crypto.randomBytes(20).toString('hex');
}

router.post('/forgot-password', async (req, res) => {
  try {
    const db = await connectToMongo();
    const usersCollection = db.collection('hypers');

    const { email } = req.body;
    const user = await usersCollection.findOne({ email });
    

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generateResetToken();
    
    await usersCollection.updateOne({ email }, {
      $set: {
        passwordResetToken: resetToken,
        passwordResetExpires: Date.now() + 3600000,
      },
    });


    const resetUrl = 'http://localhost:3000/reset-password'; // Define reset URL

    await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Error Details:', err);
    res.status(500).json({ message: 'Error generating password reset token' });
  }
});


async function sendPasswordResetEmail(email, resetToken, resetUrl) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'hypercoderd@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `Reset your password: ${resetUrl}/${resetToken}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent');
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token and update password
    const user = await User.findOne({ passwordResetToken: token });
    
    if (!user) {
      return res.status(404).json({ message: 'Invalid token' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

router.get('/reset-password/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    // res.render('reset-password', { token }); // Render password reset form
    res.redirect(`/reset-password.htm?token=${token}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});



router.post('/update-password', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || token === '') {
      console.log('Token is empty');
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const db = await connectToMongo();
    const usersCollection = db.collection('hypers');
    
    // const user = await usersCollection.findOne({ passwordResetToken: token });
    console.log('Searching for user with token:', token);
    const filter = { passwordResetToken: token };
    console.log('Filter:', filter);
    const user = await usersCollection.findOne(filter);
    
    
    if (!user) {
      console.log('User not found with token:', token);
      return res.status(404).json({ message: 'Invalid token' });
    }
    
    console.log('User found:', user);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null } }
    );
    
    console.log('Password updated successfully');
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});



  
module.exports = router;