describe("GET to /api/v1/status", () => {
  let response;
  let originalBody;
  let responseBody;

  beforeAll(async () => {
    response = await fetch("http://localhost:3000/api/v1/status");
    originalBody = await response.json();
  });

  beforeEach(() => {
    responseBody = JSON.parse(JSON.stringify(originalBody));
  });

  test("Deveria retornar 200", async () => {
    expect(response.status).toBe(200);
  });

  test("Deveria retornar uma data válida", async () => {
    const parsedUpdatedAt = new Date( responseBody.updated_at).toISOString();

    expect(responseBody.updated_at).toBeDefined();
    expect(responseBody.updated_at).toEqual(expect.any(String));
    expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
    expect(responseBody.updated_at).toBe(parsedUpdatedAt);
  });

  test("Deveria retornar o máximo de conexões no banco de dados", () => {
    expect(responseBody.dependencies.database.max_connections).toBe(100);
  });

  test("Deveria retornar o número de conexões abertas no banco de dados", () => {
    console.log(responseBody.dependencies.database.opened_connections);
    expect(responseBody.dependencies.database.opened_connections).toBe(1);
  });

  test("Deveria retornar o número da versão do banco postgres", () => {
    const version = responseBody.dependencies.database.version;
    const parsedVersion = parseInt(version);

    expect(version).toBeDefined();
    expect(version).toEqual(expect.any(String));
    expect(parsedVersion).toBeGreaterThan(15);
    expect(parsedVersion).toBeGreaterThanOrEqual(16);
    expect(parsedVersion).toBeLessThan(17);
  });

});
