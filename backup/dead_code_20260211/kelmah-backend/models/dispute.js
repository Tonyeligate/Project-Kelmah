'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Contract, { foreignKey: 'contractId' });
      this.belongsTo(models.User, { foreignKey: 'raisedBy' });
    }
  }
  Dispute.init({
    contractId: DataTypes.INTEGER,
    raisedBy: DataTypes.INTEGER,
    reason: DataTypes.TEXT,
    status: DataTypes.STRING,
    resolution: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Dispute',
  });
  return Dispute;
};