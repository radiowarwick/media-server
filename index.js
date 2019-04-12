/**
 * Load env variables.
 */
require("dotenv").config();

/**
 * Initiate the app.
 */
const app = require("./src/app");

/**
 * Define port, and listen...
 */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("listening on port " + port));
