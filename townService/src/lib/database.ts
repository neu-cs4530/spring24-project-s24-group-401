import { Sequelize } from 'sequelize';
const sequelize = new Sequelize('template1', 'postgres', '', {
  host: 'my.postgres-server.com',
  port: 5432,
  dialect: 'postgres',
});

// import { DataTypes } from 'sequelize';
// import sequelize from '../database';

// const Player = sequelize.define('Player', {
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   score: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     defaultValue: 0
//   }
// });

// export default Player;