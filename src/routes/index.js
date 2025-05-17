const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');

router.post('/payments/pix/create', authenticate, paymentController.createPixPayment);
router.get('/payments/status', authenticate, paymentController.getPaymentStatus);

module.exports = router;
