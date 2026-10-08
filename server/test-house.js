async function run() {
  const login = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vani@test.com", password: "123456" }),
  }).then((r) => r.json());
  console.log("Login:", login.user);

  const house = await fetch("http://localhost:4000/api/houses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + login.token,
    },
    body: JSON.stringify({ name: "Sunrise PG", type: "PG" }),
  }).then((r) => r.json());
  console.log("House:", house);
}
run();