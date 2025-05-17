const { google } = require('googleapis');
const { Payment } = require('../models');
const config = require('../../config/config.json');
const webhookService = require('./webhookService');
const { Op } = require('sequelize');

let emailCheckInterval;
let oldEmailCleanupInterval;


const startEmailCheck = () => {
  emailCheckInterval = setInterval(checkEmailsForPayments, 20000); 
  console.log('Email checking service started. Checking every 15 seconds.');
  
  cleanupOldEmails().catch(err => console.error('Error during initial old email cleanup:', err));
  
  oldEmailCleanupInterval = setInterval(cleanupOldEmails, 24 * 60 * 60 * 1000);
  console.log('Email cleanup service started. Cleaning every 24 hours.');
};

const stopEmailCheck = () => {
  if (emailCheckInterval) {
    clearInterval(emailCheckInterval);
    emailCheckInterval = null;
  }
  
  if (oldEmailCleanupInterval) {
    clearInterval(oldEmailCleanupInterval);
    oldEmailCleanupInterval = null;
  }
};


const checkEmailsForPayments = async () => {
  try {
    
    const oauth2Client = new google.auth.OAuth2(
      config.email.gmail.clientId,
      config.email.gmail.clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: config.email.gmail.refreshToken
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `from:${config.email.gmail.sender} (subject:"transferência" OR subject:"Pix" OR subject:"pagamento") is:unread`
    });
    
    const { messages } = response.data;
    if (!messages || messages.length === 0) {
      return;
    }
    
    
    for (const message of messages) {
      await processPaymentEmail(gmail, message.id);
    }
  } catch (error) {
    console.error('Error checking emails:', error);
  }
};


const processPaymentEmail = async (gmail, messageId) => {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'  
    });
    
    const email = response.data;
    const emailContent = decodeEmailBody(email);
    
    const paymentInfo = parsePaymentEmail(emailContent);
    if (!paymentInfo) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
            addLabelIds: ['PROCESSED_BUT_FAILED']
          }
        });
      } catch (markError) {
        console.error('Error marking email as read:', markError);
      }
      
      return;
    }
    

    const maxDifference = 0.03;
    const minAmount = paymentInfo.amount - maxDifference;
    const maxAmount = paymentInfo.amount + maxDifference;
    
    const pendingPayments = await Payment.findAll({
      where: {
        amount: {
          [Op.between]: [minAmount, maxAmount]
        },
        status: 'pending'
      }
    });
    
    if (pendingPayments.length === 0) {
      return;
    }
    
    const matchedPayment = pendingPayments[0];
    
    if (!matchedPayment) {
      return;
    }
    
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
    
    let paymentDate = paymentInfo.transferTime;
    if (paymentDate instanceof Date) {
      paymentDate = new Date(paymentDate.getTime() - 3 * 60 * 60 * 1000);
    }
    await matchedPayment.update({
      status: 'paid',
      payment_date: paymentDate
    });

    try {
      const qrPath = require('path').join(__dirname, '../../public/qrcodes', matchedPayment.qr_code_path);
      const fs = require('fs');
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
        console.log(`QR code apagado: ${qrPath}`);
      }
    } catch (e) {
      console.error('Erro ao apagar QR code:', e);
    }
    
    console.log(`Payment ${matchedPayment.id} marked as paid`);
    
    await webhookService.sendPaymentWebhook(matchedPayment);
    
    console.log(`Deleting processed payment email...`);
    await deleteEmail(gmail, messageId);
  } catch (error) {
    console.error('Error processing payment email:', error);
  }
};


const decodeEmailBody = (email) => {
  try {
    const parts = email.payload.parts || [email.payload];
    
    const subject = email.payload.headers?.find(h => h.name === 'Subject')?.value || '';
    const sender = email.payload.headers?.find(h => h.name === 'From')?.value || '';
    
    let body = '';
    let htmlFound = false;
      for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body.data) {
        const htmlBody = Buffer.from(part.body.data, 'base64').toString('utf8');
        body = htmlBody.replace(/=\r?\n/g, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        htmlFound = true;
        break;
      }
      
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === 'text/html' && nestedPart.body.data) {
            const htmlBody = Buffer.from(nestedPart.body.data, 'base64').toString('utf8');
            body = htmlBody.replace(/=\r?\n/g, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            htmlFound = true;
            break;
          }
        }
        if (htmlFound) break;
      }
    }
      if (!htmlFound) {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf8');
          break;
        }
        
        if (part.parts) {
          for (const nestedPart of part.parts) {
            if (nestedPart.mimeType === 'text/plain' && nestedPart.body.data) {
              body = Buffer.from(nestedPart.body.data, 'base64').toString('utf8');
              break;
            }
          }
        }
      }
    }
    
    return body;
  } catch (error) {
    console.error('Error decoding email body:', error);
    return '';
  }
};


const parsePaymentEmail = (emailContent) => {
  try {
    const moneyPatterns = [
      /R\$\s*(\d+(?:[,.]\d+)?)/i,
      /valor\s*(?:de|recebido|:)?\s*R?\$?\s*(\d+(?:[,.]\d+)?)/i,
      /R\$\D*?(\d+[,.]\d+)/i,
      /(\d+,\d{2})/i,
      /(\d+\.\d{2})/i
    ];
    
    let amount = null;
    let amountStr = null;
    
    for (const pattern of moneyPatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        amountStr = match[1].replace(',', '.');
        amount = parseFloat(amountStr);
        break;
      }
    }
    
    if (amount === null) {
      const lastResortMatch = emailContent.match(/R\$\D*(\d+(?:[,.]\d+)?)/i);
      if (lastResortMatch) {
        amountStr = lastResortMatch[1].replace(',', '.');
        amount = parseFloat(amountStr);
      }
    }
    
    if (amount === null) {
      return null;
    }
    
    const datePatterns = [
      /(\d{1,2})\s+([A-Za-zçÇ]{3,})(?:\s+às|\s+at|\s+de)\s+(\d{1,2}):(\d{1,2})/i,
      /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-]\d{2,4})?\s*(?:às|at|de)?\s*(\d{1,2}):(\d{1,2})/i,
      /(hoje|ontem)(?:\s+às|\s+at|\s+de)?\s+(\d{1,2}):(\d{1,2})/i
    ];
    
    let transferTime = null;
    
    for (const pattern of datePatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        const now = new Date();
        
        if (pattern.toString().includes('hoje|ontem')) {
          const dayType = match[1].toLowerCase();
          const hour = parseInt(match[2]);
          const minute = parseInt(match[3]);
          
          transferTime = new Date(now);
          if (dayType === 'ontem') {
            transferTime.setDate(transferTime.getDate() - 1);
          }
          transferTime.setHours(hour, minute, 0, 0);
          
        } else if (pattern.toString().includes('[\/\-]')) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const hour = parseInt(match[3]);
          const minute = parseInt(match[4]);
          
          transferTime = new Date(now.getFullYear(), month, day, hour, minute);
          
        } else {
          const day = parseInt(match[1]);
          let monthText = match[2].toLowerCase();
          const monthAbbr = monthText.substring(0, 3).toLowerCase();
          const hour = parseInt(match[3]);
          const minute = parseInt(match[4]);
          
          const monthMap = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
            'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
            'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
          };
          
          let month = monthMap[monthText] !== undefined ? monthMap[monthText] : monthMap[monthAbbr];
          
          if (month === undefined) {
            continue;
          }
          
          transferTime = new Date(now.getFullYear(), month, day, hour, minute);
        }
        
        if (transferTime > now && transferTime - now > 24 * 60 * 60 * 1000) {
          transferTime.setFullYear(transferTime.getFullYear() - 1);
        }
        break;
      }
    }
    
    if (!transferTime) {
      transferTime = new Date();
    }
      
    return {
      amount,
      transferTime
    };
  } catch (error) {
    console.error('Error parsing payment email:', error);
    return null;
  }
};


const deleteEmail = async (gmail, messageId) => {
  try {
    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId
    });
    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    return false;
  }
};

const cleanupOldEmails = async () => {
  try {
    console.log('Starting cleanup of old Pix emails...');
    
    const oauth2Client = new google.auth.OAuth2(
      config.email.gmail.clientId,
      config.email.gmail.clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: config.email.gmail.refreshToken
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const query = `from:${config.email.gmail.sender} (subject:"transferência" OR subject:"Pix" OR subject:"pagamento") before:${twoDaysAgo.getFullYear()}/${twoDaysAgo.getMonth() + 1}/${twoDaysAgo.getDate()}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });
    
    const { messages } = response.data;
    if (!messages || messages.length === 0) {
      console.log('No old emails to clean up');
      return;
    }
    
    console.log(`Found ${messages.length} old Pix emails to delete`);
    
    let deletedCount = 0;
    for (const message of messages) {
      const deleted = await deleteEmail(gmail, message.id);
      if (deleted) deletedCount++;
    }
    
    console.log(`Deleted ${deletedCount} old Pix emails`);
  } catch (error) {
    console.error('Error cleaning up old emails:', error);
  }
};

module.exports = {
  startEmailCheck,
  stopEmailCheck,
  checkEmailsForPayments,
  cleanupOldEmails
};
