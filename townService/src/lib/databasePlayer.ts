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

DatabasePlayer.sync({ force: true })
  .then(() => {
    console.log('Table created successfully');
  })
  .catch(err => {
    console.error('Error creating table:', err);
  });

export default DatabasePlayer;