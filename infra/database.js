import { Client } from "pg";
import fs from "fs";
import path from "path";

async function query(queryObject) {
  const client = new Client({
    host: getHostValue(),
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValue(),
  });

  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } finally {
    await client.end();
  }
}

export default {
  query: query,
};

function getSSLValue() {
  if (process.env.POSTGRES_HOST === "localhost") {
    return false;
  }

  return {
    ca: fs.readFileSync(path.resolve("infra", "global-bundle.pem")).toString(),
    // rejectUnauthorized: false,
  };
}

function getHostValue() {
  if (process.env.POSTGRES_HOST === "localhost") {
    return "database";
  }

  return process.env.POSTGRES_HOST;
}