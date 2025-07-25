const express = require("express");
const router = require("express").Router();

// Stub settings routes
router.get("/", (req, res) => {
  res.json({ message: "User Service: settings routes stub" });
});

module.exports = router;
