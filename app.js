const express = require('express');
const app = express();
const authRoutes = require('./routes/Auth');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

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

app.get('/success', (req, res) => {
  if (req.session.userId) {
    res.send('Logged in successfully');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.htm');
});

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/views/signup.htm');
});

app.listen(3000, () => {
  console.log('Ohanz Server listening on port 3000');
})