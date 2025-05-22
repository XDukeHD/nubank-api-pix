const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config/config.json');


const sendPaymentWebhook = async (payment) => {
  try {
    const webhookUrl = config.pix.webhook.url;
    if (!webhookUrl) {
      console.log('Webhook URL not configured, skipping webhook notification');
      return;
    }
    
    if (payment.webhook_sent) {
      console.log(`Webhook already sent for payment ${payment.id}`);
      return;
    }
    
    const payload = {
      event: 'payment.confirmed',
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: parseFloat(payment.amount),
      payment_date: payment.payment_date,
      status: payment.status
    };
    
    const signature = generateWebhookSignature(payload, config.pix.webhook.secret);
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': signature
      },
      timeout: 10000 
    });
    
    console.log(`Webhook sent for payment ${payment.id}. Status: ${response.status}`);
    
    await payment.update({
      webhook_sent: true
    });
  } catch (error) {
    console.error(`Error sending webhook for payment ${payment.id}:`, error);
  }
};


const generateWebhookSignature = (payload, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
};

module.exports = {
  sendPaymentWebhook
};
