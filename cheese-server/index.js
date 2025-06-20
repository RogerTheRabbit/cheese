const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

app.set("trust proxy", true);

// TODO: Consider switching to Node's Sqlite implementation in node v24 when it
//  ends active development in Oct 2025.
const db = require("better-sqlite3")("cheese.db");

db.prepare(
  "CREATE TABLE IF NOT EXISTS cheeses (cheesee TEXT, cheeser TEXT, time INTEGER, comment TEXT)",
).run();

app.use(
  cors({
    origin: "*", // TODO Read from env var for production
  }),
);
app.use(express.json());

const ipCheeseeMap = { "::1": "local user" };

app.post("/cheese", async (req, res) => {
  const cheeser = req.body.cheeser;
  const cheesee = ipCheeseeMap[req.ip] || req.ip;
  const cheeseEvent = {
    cheesee: cheesee,
    cheeser: cheeser,
    time: Date.now(),
    comment: "",
  };
  db.prepare(
    "INSERT INTO cheeses (cheesee, cheeser, time, comment) VALUES (:cheesee, :cheeser, :time, :comment);",
  ).run(cheeseEvent);
  console.log("Cheese event:", cheeseEvent);
  res.sendStatus(200);
});

app.get("/cheese", (req, res) => {
  res.send(db.prepare("SELECT * from cheeses").all());
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
