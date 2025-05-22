const { Sequelize } = require('sequelize');
const config = require('../../config/config.json');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.database.path,
  logging: config.server.environment === 'development' ? console.log : false
});

const db = {
  sequelize,
  Sequelize
};

db.Payment = require('./payment')(sequelize, Sequelize);
db.ApiClient = require('./apiClient')(sequelize, Sequelize);

module.exports = db;
