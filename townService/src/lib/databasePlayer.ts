import { DataTypes } from 'sequelize';
import sequelize from './database';

const DatabasePlayer = sequelize.define('Player', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

export default DatabasePlayer;