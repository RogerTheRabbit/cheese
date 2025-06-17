const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

app.use(
  cors({
    origin: "*", // TODO Read from env var for production
  }),
);
app.use(express.json());

const cheeses = {};

app.post("/cheese", (req, res) => {
  const cheeser = req.body.cheeser;
  cheeses[cheeser] = !cheeses[cheeser] ? 1 : cheeses[cheeser] + 1;
  console.log("Updated cheeses", cheeses);
  res.send("Hello World!");
});

app.get("/cheese", (req, res) => {
  res.send(cheeses);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
