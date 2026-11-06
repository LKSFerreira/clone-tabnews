describe("POST to /api/v1/migrations", () => {
  let response;

  beforeAll(async () => {
    response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "POST",
    });
  });

  test("Deveria retornar 200", async () => {
    expect(response.status).toBe(200);
  });

  test("Dever receber um Array do endpoint", async () => {
    const responseBody = await response.json();
    console.log(responseBody);
    expect(Array.isArray(responseBody)).toBe(true);
  });
});
