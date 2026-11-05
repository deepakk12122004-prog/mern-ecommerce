const express = require("express"); 
const { isProduction } = require("../config/env"); 
const { getHealth, triggerTestError } = require("../controllers/healthController"); 
const router = express.Router(); 
router.get("/", getHealth); 
// The test-error route must never exist on a live server 
if (!isProduction) { 
router.get("/error", triggerTestError); 
} 
module.exports = router;