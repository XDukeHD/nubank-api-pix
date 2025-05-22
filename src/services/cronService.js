const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Payment } = require('../models');
const config = require('../../config/config.json');

let cronJobs = [];


const startCronJobs = () => {
  const cleanupJob = cron.schedule('0 * * * *', async () => {
    console.log('Running cleanup of expired payments and QR codes...');
    await cleanupExpiredQrCodes();
  });
  
  cronJobs.push(cleanupJob);
  console.log('Cron jobs started');
};


const stopCronJobs = () => {
  cronJobs.forEach(job => job.stop());
  cronJobs = [];
  console.log('Cron jobs stopped');
};


const cleanupExpiredQrCodes = async () => {
  try {
    const expiredPayments = await Payment.findAll({
      where: {
        status: 'pending',
        expires_at: {
          [Op.lt]: new Date()
        }
      }
    });
    
    console.log(`Found ${expiredPayments.length} expired payments to clean up`);
    
    for (const payment of expiredPayments) {
      try {
        const qrCodePath = payment.qr_code_path;
        if (fs.existsSync(qrCodePath)) {
          fs.unlinkSync(qrCodePath);
          console.log(`Deleted expired QR code: ${qrCodePath}`);
        }
        
        await payment.update({
          status: 'expired'
        });
        
        console.log(`Marked payment ${payment.id} as expired`);
      } catch (error) {
        console.error(`Error processing expired payment ${payment.id}:`, error);
      }
    }
    
    console.log('Expired payment cleanup completed');
  } catch (error) {
    console.error('Error cleaning up expired QR codes:', error);
  }
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  cleanupExpiredQrCodes
};
