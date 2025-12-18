import { Client } from "pg";
import fs from "fs";
import path from "path";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSslValue(),
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

function getSslValue() {
  if (process.env.POSTGRES_HOST === "localhost") {
    return false;
  }

  return {
    ca: fs.readFileSync(path.resolve("infra", "global-bundle.pem")).toString(),
    // rejectUnauthorized: false,
  };
}