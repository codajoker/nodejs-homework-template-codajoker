const mongoose = require("mongoose");

const app = require("./app");
require("dotenv").config();
const {DB_HOST} = process.env;


const {SENDGRID_API_KEY} = process.env

const connection = mongoose
  .connect(DB_HOST, {
    promiseLibrary: global.Promise,
  })
  .then(() => 
  {app.listen(5000, function () {

    console.log(`Server running. Use our API on port: 5000`);

  });
  console.log("Database connection successful")})
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  });

