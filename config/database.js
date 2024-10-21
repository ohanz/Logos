const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017/';
const dbName = 'Logos';

async function connectToMongo() {
    let client;
    try {
      const client = await MongoClient.connect(url);
      const db = client.db(dbName);
      console.log('Connected to MongoDB');
      return db;
    } catch (err) {
      console.error('MongoDB connection error:', err.message, err.stack);
    } finally {
      // Close client connection (optional)
      if(client){
        client.close();
      }
      
    }
  }

module.exports = { connectToMongo };