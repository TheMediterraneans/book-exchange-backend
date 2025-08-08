// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

//// book api routes
const bookRoutes = require("./routes/booksApi.routes");
app.use("/api", bookRoutes);
//router to copies
const copyRoutes = require("./routes/bookCopy.routes")
app.use("/api", copyRoutes)
//reservations routes
const reservationsRoutes = require("./routes/reservation.routes")
app.use("/api", reservationsRoutes)


// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
