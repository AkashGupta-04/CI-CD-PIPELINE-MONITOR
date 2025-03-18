//Import Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const router = require("./Routes/routes");

const app = express();

//Add Some middlewares
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "devBecons",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set true if using HTTPS
      httpOnly: true, // Prevent client-side JS from accessing it
      maxAge: 3600000, // 1 hour
    },
  })
);

app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on Port:${PORT}`));
