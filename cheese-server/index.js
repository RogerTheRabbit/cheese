const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const fs = require("fs");
const https = require("https");

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
  const cheeseeIp = getIpFromReq(req);
  const deviceOwner = getDeviceOwner(cheeseeIp);
  if (!deviceOwner) {
    console.error("Someone tried to cheese an unregistered devic: ", cheeseeIp);
    res
      .status(400)
      .send(
        `${cheeseeIp} is not a registered device. Please reach out to the Kevin to get this device registered.`,
      );
    return;
  }
  if (wasCheesedWithinLastHour(deviceOwner?.user_id)) {
    res
      .status(400)
      .send(`${deviceOwner.username} was already cheesed within the last hour`);
    return;
  }
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
  const ip = getIpFromReq(req);

  res.send(getDeviceOwner(ip));
});

const getDeviceOwner = (ip) => {
  return db
    .prepare(
      "SELECT d.device_name, d.device_id, u.username, u.user_id from devices as d JOIN users as u ON d.user_id = u.user_id WHERE ip = :ip",
    )
    .get({ ip: ip });
};

const wasCheesedWithinLastHour = (userId) => {
  const hourAgo = Date.now() - 3600000; // 1 hour
  return !!db
    .prepare(
      "SELECT * from cheeses WHERE cheeses.time > :hourAgo AND cheesee = :userId LIMIT 1;",
    )
    .get({ hourAgo: hourAgo, userId: userId });
};

const getIpFromReq = (req) => {
  const ip = req.ip;
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }
  return ip;
};

let server = app;
try {
  server = https.createServer(
    {
      key: fs.readFileSync("privkey.pem"),
      cert: fs.readFileSync("fullchain.pem"),
    },
    app,
  );
} catch (error) {
  console.log("Failed to create HTTPs server, falling back to HTTP", error);
}

server.listen(port, "0.0.0.0", () => {
  console.log(
    `[${server === app ? "HTTP" : "HTTPS"}] Listening on port ${port}`,
  );
});
