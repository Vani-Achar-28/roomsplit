export const openapi = {
  openapi: "3.0.0",
  info: {
    title: "RoomSplit API",
    version: "1.0.0",
    description: "Bills, chores and payments for flatmates. Log in first, then use the token as a Bearer token.",
  },
  components: {
    securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
  },
  security: [{ bearer: [] }],
  paths: {
    "/api/auth/register": {
      post: { tags: ["Auth"], security: [], summary: "Create an account", requestBody: { content: { "application/json": { example: { name: "Vani", email: "vani@test.com", password: "123456" } } } }, responses: { "201": { description: "Token and user" } } },
    },
    "/api/auth/login": {
      post: { tags: ["Auth"], security: [], summary: "Log in", requestBody: { content: { "application/json": { example: { email: "vani@test.com", password: "123456" } } } }, responses: { "200": { description: "Token and user" } } },
    },
    "/api/houses": {
      post: { tags: ["Houses"], summary: "Create a house (you become admin)", requestBody: { content: { "application/json": { example: { name: "Sunrise PG", type: "PG" } } } }, responses: { "201": { description: "House" } } },
    },
    "/api/houses/mine": { get: { tags: ["Houses"], summary: "Houses I belong to", responses: { "200": { description: "List" } } } },
    "/api/houses/join": {
      post: { tags: ["Houses"], summary: "Join with an invite code", requestBody: { content: { "application/json": { example: { inviteCode: "A350B8" } } } }, responses: { "200": { description: "Joined" } } },
    },
    "/api/houses/{houseId}/expenses": {
      get: { tags: ["Bills"], summary: "All bills in a house", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "List" } } },
      post: { tags: ["Bills"], summary: "Add a bill (split equally, or by days present for admin)", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }], requestBody: { content: { "application/json": { example: { title: "WiFi bill", category: "WiFi", amountRupees: 900 } } } }, responses: { "201": { description: "Bill with splits" } } },
    },
    "/api/houses/{houseId}/my-dues": {
      get: { tags: ["Bills"], summary: "What I still owe", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Dues" } } },
    },
    "/api/houses/{houseId}/summary": {
      get: { tags: ["Bills"], summary: "Fewest payments to settle everyone", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Transfers" } } },
    },
    "/api/houses/{houseId}/chores/today": {
      get: { tags: ["Chores"], summary: "Who does what today (rotates daily)", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "Assignments" } } },
    },
    "/api/houses/{houseId}/report": {
      get: { tags: ["Reports"], summary: "Monthly report", parameters: [{ name: "houseId", in: "path", required: true, schema: { type: "integer" } }, { name: "month", in: "query", schema: { type: "string", example: "2026-11" } }], responses: { "200": { description: "Totals by category and person" } } },
    },
  },
};