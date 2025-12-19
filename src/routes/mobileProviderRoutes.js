const express = require('express');
const router = express.Router();
const mobileProviderController = require('../controllers/mobileProviderController');

// --- Mobile Provider App Service ---
router.post('/query', mobileProviderController.queryBill);
router.post('/query-detailed', mobileProviderController.queryBillDetailed);

module.exports = router;
