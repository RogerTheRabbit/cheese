import express from "express";
import cors from "cors";
import fs from "fs";
import https from "https";
// TODO: Consider switching to Node's Sqlite implementation in node v24 when it
//  ends active development in Oct 2025.
import sqlite3 from "better-sqlite3";
import discord from "./modules/discord/discord.js";
import { UAParser } from "ua-parser-js";

const app = express();
const port = 3000;

app.set("trust proxy", true);

const db = sqlite3("cheese.db");

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
  const cheeser = getUserFromId(req.body.cheeser);
  const cheeseeIp = getIpFromReq(req);
  const deviceOwner = getDeviceOwner(cheeseeIp);
  if (!deviceOwner) {
    const userAgent = new UAParser(req.headers["user-agent"]);
    const device = `${JSON.stringify(getDeviceOrOSFromUserAgent(userAgent))}`;
    console.error(
      `Someone tried to cheese an unregistered ip/device: ${cheeseeIp} / ${device}`,
    );
    discord.sendMessage({
      title: `${cheeser.username} tried to cheese an unregistered device`,
      description: `
        IP Address: ${cheeseeIp}
        Device: ${device}

        Users:
          ${getAllUsers()
            .map((user) => `- ${user.username}: ${user.user_id}`)
            .join("\n")}

        Query: INSERT INTO devices (ip, device_name, user_id) VALUES(${cheeseeIp}, ${device}, [USER_ID])
      `,
    });
    res
      .status(400)
      .send(
        `${cheeseeIp} is not a registered device. Please reach out to the Kevin to get this device registered.`,
      );
    return;
  }
  if (cheeser.user_id === deviceOwner.user_id) {
    res.status(400).send("You can't cheese yourself!");
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
    cheeser: cheeser.user_id,
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
  res.send(getAllUsers());
});

app.get("/whoami", (req, res) => {
  const ip = getIpFromReq(req);

  res.send(getDeviceOwner(ip));
});

const getAllUsers = () => {
  return db.prepare("SELECT * from users").all();
};

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

const getUserFromId = (userId) => {
  return db
    .prepare("SELECT * from users WHERE user_id = :user_id")
    .get({ user_id: userId });
};

const getDeviceOrOSFromUserAgent = (userAgent) => {
  console.log(userAgent.getDevice(), userAgent.getOS());

  const device = userAgent.getDevice();

  return Object.values(device).filter((val) => !!val).length
    ? `[${device.type || "Unknown"}] ${device.vendor + device.model}`
    : userAgent.getOS()?.name;
};

let httpsApp;
if (process.argv[2] !== "development") {
  try {
    httpsApp = https.createServer(
      {
        key: fs.readFileSync("privkey.pem"),
        cert: fs.readFileSync("fullchain.pem"),
      },
      app,
    );
  } catch (error) {
    console.error(
      "Failed to create HTTPs server, falling back to HTTP\n",
      error,
    );
  }
}

(httpsApp || app).listen(port, "0.0.0.0", () => {
  console.log(`[${httpsApp ? "HTTPS" : "HTTP"}] Listening on port ${port}`);
});
