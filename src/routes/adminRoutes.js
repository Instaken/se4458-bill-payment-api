const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary folder for CSVs

// --- Website (Admin) Service ---
router.post('/admin/add', adminController.addBill);
router.post('/admin/batch-upload', upload.single('file'), adminController.uploadBatchBills);
router.post('/banking/query', adminController.listUnpaidBills);

module.exports = router;
