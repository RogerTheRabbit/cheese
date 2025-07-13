const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const fs = require("fs");

app.set("trust proxy", true);

// TODO: Consider switching to Node's Sqlite implementation in node v24 when it
//  ends active development in Oct 2025.
const db = require("better-sqlite3")("cheese.db");

const startup = fs.readFileSync("startup.sql", "utf8");
db.exec(startup);

try {
  const serverUser = db
    .prepare(
      "INSERT INTO users (username) VALUES ('localhost') RETURNING user_id;",
    )
    .get();
  db.prepare(
    "INSERT INTO devices (ip, device_name, user_id) VALUES ('::1', 'server', :userId);",
  ).run({ userId: serverUser["user_id"] });
} catch (error) {
  // Only log error if it is not the expected constraint error
  // Surely the "correct" way to do this is to conditionally insert after a fetch but shhh
  console.log(
    "Did not insert localhost user to database",
    !error["code"] === "SQLITE_CONSTRAINT_UNIQUE" ? error : "",
  );
}

app.use(
  cors({
    origin: "*", // TODO Read from env var for production
  }),
);
app.use(express.json());

app.post("/cheese", async (req, res) => {
  const cheeser = req.body.cheeser;
  const cheeseeIp = req.headers["x-forwarded-for"] || req.ip;
  const deviceOwner = getDeviceOwner(cheeseeIp);
  const cheeseEvent = {
    cheesee: deviceOwner.user_id,
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

app.get("/users", (req, res) => {
  res.send(db.prepare("SELECT * from users").all());
});

app.get("/whoami", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.ip;

  res.send(getDeviceOwner(ip));
});

const getDeviceOwner = (ip) => {
  return db
    .prepare(
      "SELECT d.device_name, d.device_id, u.username, u.user_id from devices as d JOIN users as u ON d.user_id = u.user_id WHERE ip = :ip",
    )
    .get({ ip: ip });
};

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
