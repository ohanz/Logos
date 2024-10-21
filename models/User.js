const bcrypt = require('bcryptjs');
const connectToMongo = require('../config/database'); // Import your db connection function

class User {
  constructor(username, email, password) {
    this.username = username;
    this.email = email;
    this.password = bcrypt.hashSync(password, 10);
  }

  static async findByEmail(email) {
    const db = await connectToMongo();
    const users = db.collection('hypers');
    return await users.findOne({ email });
  }

  static async findById(id) {
    const db = await connectToMongo();
    const users = db.collection('hypers');
    return await users.findOne({ _id: id });
  }
}

module.exports = User;
