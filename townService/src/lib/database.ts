import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('template1', 'postgres', '', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
});

export default sequelize;
