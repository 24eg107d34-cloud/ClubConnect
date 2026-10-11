const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
console.log("RUNNING INDEX.JS");
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
res.send("College Club Project Backend is Running!");
});

// Get all clubs from MySQL
app.get("/api/clubs", (req, res) => {
const sql = "SELECT * FROM clubs ORDER BY id DESC";

db.query(sql, (err, results) => {
    if (err) {
        console.error("Error fetching clubs:", err);

        return res.status(500).json({
            message: "Failed to fetch clubs",
            error: err.message
        });
    }

    res.status(200).json(results);
});

});

// Start server
app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});