const mongoose = require('mongoose');

require("dotenv").config();
exports.dbConnect = () => {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => { console.log("Connected to database successfully") })
        .catch((err) => {
            console.log("DB Connection Failed");
            console.error(err)
            process.exit(1);
        })
}