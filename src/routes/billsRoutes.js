// src/routes/billsRoutes.js
const express = require('express');
const router = express.Router();
const billsController = require('../controllers/billsController');

// Dosya yükleme ayarı (CSV için)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Geçici klasör

// --- Mobile Provider App ---
router.post('/query', billsController.queryBill);
router.post('/query-detailed', billsController.queryBillDetailed); 

// --- Banking App ---
router.post('/pay', billsController.payBill);

// --- Website (Admin) ---
router.post('/admin/add', billsController.addBill); 
router.post('/admin/batch-upload', upload.single('file'), billsController.uploadBatchBills); 
router.post('/banking/query', billsController.listUnpaidBills);

module.exports = router;