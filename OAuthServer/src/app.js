const express = require("express");
const cors = require("cors");
const app = express();
const router = require("./members/Router");

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).send({success: false, message: err.message});
    next();
});

app.use(router);

module.exports = app;
