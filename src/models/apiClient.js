module.exports = (sequelize, DataTypes) => {
  const ApiClient = sequelize.define('ApiClient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    webhook_url: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'api_clients',
    timestamps: true
  });
  
  return ApiClient;
};
