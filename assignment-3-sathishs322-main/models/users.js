// const { DataTypes } = require('sequelize')

// const sequelize = require('../lib/sequelize')

// const Users = sequelize.define('users', {
//   id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//   name: { type: DataTypes.TEXT, allowNull: false },
//   email: { type: DataTypes.STRING, length:256, allowNull: false, unique:true},
//   password: { type: DataTypes.TEXT, allowNull: false },
//   admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
// })

// exports.Users = Users

// /*
//  * Export an array containing the names of fields the client is allowed to set
//  * on reviews.
//  */
// exports.UsersClientFields = [
//   'id',
//   'name',
//   'email',
//   'password',
//   'admin'
  
// ]

const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const Users = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.TEXT, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 256] // Minimum and maximum length of the string
    }
  },
  password: { type: DataTypes.TEXT, allowNull: false },
  admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
});

exports.Users = Users;

/*
 * Export an array containing the names of fields the client is allowed to set
 * on reviews.
 */
exports.UsersClientFields = [
  'id',
  'name',
  'email',
  'password',
  'admin'
];
