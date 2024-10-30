// auth.js
const express = require('express');
const router = express.Router();
const { connectToMongo } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Install: npm install jsonwebtoken
// Session expiration time (1 hour)
const SESSION_EXPIRATION = 3600000; // ms

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

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Invalid request' });
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
    req.session.message = 'Signup successful';
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
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generateResetToken(); // implement generateResetToken function
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating password reset token' });
  }
});

const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    // mail service configuration
  });

  const mailOptions = {
    from: 'your-email@example.com',
    to: email,
    subject: 'Password Reset',
    text: `Reset your password: ${resetUrl}/${resetToken}`,
  };

  await transporter.sendMail(mailOptions);
}

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ passwordResetToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    // Validate token expiration
    if (user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ message: 'Token expired' });
    }

    // Update user password
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

  
module.exports = router;