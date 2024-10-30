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

      res.json({ message: 'Logged in successfully', sessionToken });
    } catch (err) {
      console.error('Error logging in:', err.message, err.stack);
      res.status(500).json({ message: 'Error logging in', error: { message: err.message, stack: err.stack } });
    }
  });
  
  // Logout route
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.headers['x-session-token'];

    const db = await connectToMongo();
    const sessions = db.collection('sessions');

    // Remove session document
    await sessions.deleteOne({ sessionToken });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error logging out:', err.message, err.stack);
    res.status(500).json({ message: 'Error logging out', error: { message: err.message, stack: err.stack } });
  }
});

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
    const sessionToken = generateSessionToken(userId);
  res.json({ message: 'Signup successful', sessionToken, userId });
    // res.json({ message: 'Signed up successfully' });
  } catch (err) {
    console.error('Error creating user:', err.message, err.stack);
    res.status(500).json({ message: 'Error creating user', error: { message: err.message, stack: err.stack } });
  }
});

  
module.exports = router;