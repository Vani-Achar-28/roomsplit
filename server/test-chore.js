const BASE = "http://localhost:4000/api";

async function call(path, method = "GET", body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

const login = (email) => call("/auth/login", "POST", { email, password: "123456" });

async function run() {
  const admin = await login("vani@test.com");
  const house = (await call("/houses/mine", "GET", null, admin.token))[0];

  for (const title of ["Cook dinner", "Wash dishes", "Clean bathroom"]) {
    await call(`/houses/${house.id}/chores`, "POST", { title }, admin.token);
  }

  const today = await call(`/houses/${house.id}/chores/today`, "GET", null, admin.token);
  console.log("Today's chores:");
  today.forEach((a) => console.log(` - ${a.chore.title}: ${a.user.name} (done: ${a.done})`));

  // Ravi (a normal member) tries to add a chore -> must be blocked
  const ravi = await login("ravi@test.com");
  console.log("Ravi adds chore:", await call(`/houses/${house.id}/chores`, "POST", { title: "Hack" }, ravi.token));
}
run();