'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Wallet.init({
    userId: DataTypes.INTEGER,
    balance: DataTypes.DECIMAL,
    currency: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Wallet',
  });
  return Wallet;
};