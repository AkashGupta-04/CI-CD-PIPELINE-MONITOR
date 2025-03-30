//Import Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const router = require("./Routes/routes");
const { Server } = require("socket.io");
const http = require("http");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
//Add Some middlewares
app.use(express.json());
app.use(cors({ credentials: true }));

app.use("/", router);

//Webhook Setup kardiya

app.post("/webhook", (req, res) => {
  const payload = req.body;

  if (payload.workflow_run) {
    const { id, status, conclusion } = payload.workflow_run;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;

    if (status === "in_progress") {
      io.emit("workflowStarted", { owner, repo, run_id: id });
    }

    if (status === "completed") {
      io.emit("workflowCompleted", { owner, repo, run_id: id, conclusion });
    }
  }

  res.status(200).send("Webhook received");
});

io.on("connection", (socket) => {
  console.log("A client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on Port:${PORT}`));
