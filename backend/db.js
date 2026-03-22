const { Pool } = require("pg");

const isRailway = !!process.env.DATABASE_URL;

const pool = new Pool(
  isRailway
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: "127.0.0.1",
        port: 5432,
        user: "postgres",
        password: "O02014034i",
        database: "avans_db",
      },
);

module.exports = pool;