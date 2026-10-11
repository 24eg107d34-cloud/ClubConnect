
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Check required environment variables
if (
  !process.env.ADMIN_USERNAME ||
  process.env.ADMIN_PASSWORD === undefined ||
  !process.env.JWT_SECRET
) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ClubConnect API is running",
  });
});

// Get all clubs
app.get("/api/clubs", (req, res) => {
  db.query("SELECT * FROM clubs", (err, results) => {
    if (err) {
      console.error("Get clubs error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch clubs",
      });
    }

    res.json(results);
  });
});

// Student signup
app.post("/api/students/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO students (full_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              success: false,
              message: "This email is already registered",
            });
          }

          console.error("Student signup database error:", err);

          return res.status(500).json({
            success: false,
            message: "Could not create student account",
          });
        }

        res.status(201).json({
          success: true,
          message: "Student registered successfully",
          studentId: result.insertId,
        });
      }
    );
  } catch (err) {
    console.error("Student signup error:", err);

    res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
});

// Student login
app.post("/api/students/login", (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.query(
    `SELECT id, full_name, email, password_hash
     FROM students
     WHERE email = ?`,
    [cleanEmail],
    async (err, results) => {
      if (err) {
        console.error("Student login database error:", err);

        return res.status(500).json({
          success: false,
          message: "Login failed due to a server error",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      try {
        const student = results[0];

        const validPassword = await bcrypt.compare(
          password,
          student.password_hash
        );

        if (!validPassword) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        const token = jwt.sign(
          { id: student.id, role: "student" },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.json({
          success: true,
          message: "Login successful",
          token,
          student: {
            id: student.id,
            full_name: student.full_name,
            email: student.email,
          },
        });
      } catch (error) {
        console.error("Student login error:", error);

        res.status(500).json({
          success: false,
          message: "Server error during login",
        });
      }
    }
  );
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  const configuredUsername = process.env.ADMIN_USERNAME.trim();
  const submittedUsername = username.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (
    submittedUsername !== configuredUsername ||
    password !== configuredPassword
  ) {
    console.log("Admin login rejected: credentials did not match.");

    return res.status(401).json({
      success: false,
      message: "Invalid admin username or password",
    });
  }

  try {
    const token = jwt.sign(
      { username: configuredUsername, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } catch (err) {
    console.error("Admin token error:", err);

    return res.status(500).json({
      success: false,
      message: "Could not create admin session",
    });
  }
});

// Admin authentication middleware
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required",
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Get registrations (admin only)
app.get("/api/registrations", verifyAdmin, (req, res) => {
  db.query(
    `SELECT
       r.*,
       c.name AS club_name
     FROM registrations r
     LEFT JOIN clubs c ON r.club_id = c.id
     ORDER BY r.id DESC`,
    (err, results) => {
      if (err) {
        console.error("Get registrations database error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch registrations",
        });
      }

      // Match the response format expected by Admin.jsx
      return res.json({
        success: true,
        registrations: results,
      });
    }
  );
});

// Join a club — duplicate registrations are allowed
app.post("/api/registrations", (req, res) => {
  const { student_name, roll_number, email, club_id } = req.body;

  if (
    typeof student_name !== "string" ||
    !student_name.trim() ||
    typeof roll_number !== "string" ||
    !roll_number.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    club_id === undefined ||
    club_id === null ||
    String(club_id).trim() === "" ||
    !Number.isInteger(Number(club_id)) ||
    Number(club_id) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Student name, roll number, email, and valid club ID are required",
    });
  }

  const cleanName = student_name.trim();
  const cleanRollNumber = roll_number.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanClubId = Number(club_id);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });
  }

  db.query(
    "SELECT id FROM clubs WHERE id = ?",
    [cleanClubId],
    (clubErr, clubs) => {
      if (clubErr) {
        console.error("Club lookup database error:", clubErr);

        return res.status(500).json({
          success: false,
          message: "Could not verify club",
        });
      }

      if (clubs.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Club not found",
        });
      }

      // No duplicate check: each valid submission is inserted.
      db.query(
        `INSERT INTO registrations
          (student_name, roll_number, email, club_id)
         VALUES (?, ?, ?, ?)`,
        [cleanName, cleanRollNumber, cleanEmail, cleanClubId],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Registration insert database error:", insertErr);

            return res.status(500).json({
              success: false,
              message: "Failed to register for club",
            });
          }

          console.log("Registration saved. ID:", result.insertId);

          return res.status(201).json({
            success: true,
            message: "Club registration successful",
            registrationId: result.insertId,
          });
        }
      );
    }
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
