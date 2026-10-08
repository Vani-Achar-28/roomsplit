fetch("http://localhost:4000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Vani",
    email: "vani@test.com",
    password: "123456",
  }),
})
  .then((r) => r.json())
  .then((data) => console.log(data))
  .catch((err) => console.log("Error:", err.message));