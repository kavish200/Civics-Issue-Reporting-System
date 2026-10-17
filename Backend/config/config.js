const dotenv = require("dotenv");
dotenv.config();

if(!process.env.MONGO_URI || !process.env.PORT || !process.env.JWT_SECRET) {
    throw new Error("One or more required environment variables are not defined");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET
};

module.exports = config