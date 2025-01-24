const express = require("express");
const dbconnect = require("./utils/db.connect");
const cors = require("cors");
const stockRoutes = require("./Router/StocksRoute");
const LoginRoute = require("./Router/LoginRoute");
const SignupRoute = require("./Router/SignupRoute");
const app = express();
const port = 4000;

// CORS options
const corsOptions = {
  origin: "https://ims-beta-smoky.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// Api Routes Middleware
app.use("/auth", LoginRoute);
app.use("/user", SignupRoute);
app.use("/api", stockRoutes);

// Connect to the database and start the server
dbconnect()
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port ${port}!`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
