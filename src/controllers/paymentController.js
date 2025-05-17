const { Payment } = require('../models');
const pixService = require('../services/pixService');
const config = require('../../config/config.json');
const path = require('path');

const createPixPayment = async (req, res) => {
  try {
    const { user_id, amount } = req.body;
    
    if (!user_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'user_id and amount are required'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }

    const now = new Date();
    const offsetMs = -3 * 60 * 60 * 1000; 
    const expiresAt = new Date(now.getTime() + config.pix.qrCodeExpiration * 1000 + offsetMs);
    
    const pixData = await pixService.generatePixPayment(user_id, numAmount, expiresAt);
    
    const qrCodeFilename = path.basename(pixData.qrCodePath);
    const payment = await Payment.create({
      user_id,
      amount: pixData.adjustedAmount || numAmount, 
      status: 'pending',
      pix_code: pixData.pixCode,
      qr_code_path: qrCodeFilename, 
      expires_at: expiresAt
    });

    const qrCodeUrl = `${req.protocol}://${req.get('host')}/qrcodes/${path.basename(pixData.qrCodePath)}`;
    
    return res.status(201).json({
      success: true,
      data: {
        payment_id: payment.id,
        pix_code: payment.pix_code,
        qr_code_image_url: qrCodeUrl,
        expires_at: payment.expires_at
      }
    });
  } catch (error) {
    console.error('Error creating Pix payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create Pix payment',
      message: error.message
    });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.query;
    
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_id is required'
      });
    }

    const payment = await Payment.findByPk(payment_id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        payment_id: payment.id,
        status: payment.status,
        amount: payment.amount,
        created_at: payment.createdAt,
        expires_at: payment.expires_at,
        payment_date: payment.payment_date
      }
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
      message: error.message
    });
  }
};

module.exports = {
  createPixPayment,
  getPaymentStatus
};
