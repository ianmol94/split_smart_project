import express from "express";
const app = express();

app.use(express.json());

// in-memory store (no DB yet)
let users = [
  { id: 1, name: "Anmol", email: "anmol@gmail.com" },
  { id: 2, name: "Raj", email: "raj@gmail.com" }
];

// CREATE
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  const newUser = { id: users.length + 1, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// READ all
app.get("/users", (req, res) => {
  res.json(users);
});

// READ one
app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// UPDATE
app.patch("/users/:id", (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  res.json(user);
});

// DELETE
app.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = users.find(u => u.id === id);
  if (!exists) return res.status(404).json({ error: "User not found" });
  users = users.filter(u => u.id !== id);
  res.json({ deleted: id });
});

app.listen(5000, () => console.log("Running on http://localhost:5000"));