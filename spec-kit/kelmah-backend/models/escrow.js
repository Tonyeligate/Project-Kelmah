'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Escrow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Contract, { foreignKey: 'contractId' });
    }
  }
  Escrow.init({
    contractId: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    fundedAt: DataTypes.DATE,
    releasedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Escrow',
  });
  return Escrow;
};