const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');

// --- Banking App Service ---
router.post('/pay', bankingController.payBill);

module.exports = router;
