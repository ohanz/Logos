// auth.js
const express = require('express');
const router = express.Router();
const { connectToMongo } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Import bcryptjs

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
      res.json({ message: 'Logged in successfully' });
    } catch (err) {
      console.error('Error logging in:', err.message, err.stack);
      res.status(500).json({ message: 'Error logging in', error: { message: err.message, stack: err.stack } });
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
    res.json({ message: 'Signed up successfully' });
  } catch (err) {
    console.error('Error creating user:', err.message, err.stack);
    res.status(500).json({ message: 'Error creating user', error: { message: err.message, stack: err.stack } });
  }
});

  
module.exports = router;