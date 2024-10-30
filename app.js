const express = require('express');
const app = express();
const authRoutes = require('./routes/Auth');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
require('dotenv').config(); // npm install dotenv

const { connectToMongo } = require('./config/database');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/Logos',
  collection: 'sessions'
});

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  store
}));

app.use(express.static('views'));
app.use('/auth', authRoutes);

const fs = require('fs');

// const authenticate = (req, res, next) => {
//   if (!req.token || req.token.expired) {
//     return res.redirect('/');
//   }
//   next();
// };
// const authenticate = (req, res, next) => {
//   const sessionToken = req.headers['x-session-token'];
//   if (!sessionToken || sessionToken.expired) {
//     return res.redirect('/login');
//   }
//   next();
// };
const authenticate = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// app.get('/success', authenticate, (req, res) => {
//   if (req.session.userId) {
//     res.sendFile(__dirname + '/views/success.htm');
//     // res.send('Logged in successfully');
//   } else {
//     res.redirect('/login');
//   }
// });
const path = require('path');
const User = require('./models/User');

const { ObjectId } = require('mongodb');
app.get('/success', authenticate, async (req, res) => {
  try {
    console.log('Session in /success:', req.session);

    if (!req.session || !req.session.userId) {
      console.log('Session expired or invalid');
      return res.redirect('/login');
    }

    console.log('User ID:', req.session.userId);
    const db = await connectToMongo();
    const users = db.collection('hypers');
const userCount = await users.countDocuments();
console.log('User Count:', userCount);

    const userId = req.session.userId;
    // const user = await User.findById(userId).select('username email');
    const user = await db.collection('hypers').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          username: 1,
          email: 1,
          _id: 0,
        },
      }
    );
    const message = req.session.message || 'Welcome back!';
    delete req.session.message;

    const html = fs.readFileSync(__dirname + '/views/success.htm', 'utf8');
    const replacedHtml = html
      .replace('{{message}}', message)
      .replace('{{username}}', user.username)
      .replace('{{email}}', user.email);

    res.send(replacedHtml);
  } catch (err) {
    console.error('Error fetching user:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

app.get('/login', (req, res) => {
  let message = req.session.message || req.query.message;
  if (message) {
    delete req.session.message;
    const html = fs.readFileSync(__dirname + '/views/login.htm', 'utf8');
    const replacedHtml = html.replace('{{message}}', message);
    res.send(replacedHtml);
  } else {
    res.sendFile(__dirname + '/views/login.htm');
  }
});


app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/views/signup.htm');
});

app.listen(3000, () => {
  console.log('Ohanz Server listening on port 3000');
})