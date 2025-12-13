import database from "infra/database.js";

async function status(request, response) {

  const versionResult = await database.query("SHOW server_version;");
  const version = versionResult.rows[0].server_version;

  const maxConnectionsResult = await database.query("SHOW max_connections");
  const maxConnections = maxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  // Sanatização feito pelo node-postgres
  const openedConnectionsResult = await database.query({
    values: [databaseName],
    text: "SELECT * FROM pg_stat_activity WHERE datname = $1;",
  });
  const openedConnections = openedConnectionsResult.rowCount;

  const status_api = {
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        max_connections: parseInt(maxConnections),
        opened_connections: parseInt(openedConnections),
        version: version
      }
    }
  };

  response.status(200).json(status_api);
}

export default status;
