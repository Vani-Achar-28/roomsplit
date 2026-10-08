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
  const houses = await call("/houses/mine", "GET", null, admin.token);
  const house = houses[0];

  for (const [name, email] of [["Ravi", "ravi@test.com"], ["Asha", "asha@test.com"]]) {
    await call("/auth/register", "POST", { name, email, password: "123456" });
    const u = await login(email);
    console.log(name, "join:", await call("/houses/join", "POST", { inviteCode: house.inviteCode }, u.token));
  }

  const bill = await call(`/houses/${house.id}/expenses`, "POST",
    { title: "Electricity bill", category: "Electricity", amountRupees: 1000 }, admin.token);
  console.log("Bill:", JSON.stringify(bill, null, 2));

  const ravi = await login("ravi@test.com");
  console.log("Ravi dues:", JSON.stringify(await call(`/houses/${house.id}/my-dues`, "GET", null, ravi.token), null, 2));
}
run();