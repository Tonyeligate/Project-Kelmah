const express = require("express");
const router = require("express").Router();

// Stub profile routes
router.get("/", (req, res) => {
  res.json({ message: "User Service: profile routes stub" });
});

module.exports = router;
