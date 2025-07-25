const express = require("express");
const router = express.Router();

// Import controllers for user operations
const { getAllUsers, createUser } = require("../controllers/user.controller");

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createUser);

module.exports = router;
