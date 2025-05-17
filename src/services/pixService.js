const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const { pix } = require('@klawdyo/pix.js');
const config = require('../../config/config.json');
const { v4: uuidv4 } = require('uuid');


const addAmountVariation = (originalAmount) => {

  const variations = [0.01, 0.02, 0.03, -0.01, -0.02];
  const randomIndex = Math.floor(Math.random() * variations.length);
  const variation = variations[randomIndex];
  
  const adjustedAmount = Math.round((originalAmount + variation) * 100) / 100;
  
  return Math.max(0.01, adjustedAmount);
};

const overlayLogoOnQrCode = async (qrCodePath, logoPath, outputPath) => {
  try {
    const qrCode = await Jimp.read(qrCodePath);
    const logo = await Jimp.read(logoPath);

    const logoSize = qrCode.getWidth() * 0.25;
    logo.resize(logoSize, logoSize);

    const mask = new Jimp(logo.getWidth(), logo.getHeight(), 0xFFFFFFFF);
    mask.circle();
    logo.mask(mask, 0, 0);

    const logoX = (qrCode.getWidth() - logo.getWidth()) / 2;
    const logoY = (qrCode.getHeight() - logo.getHeight()) / 2;
    qrCode.composite(logo, logoX, logoY, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
      opacityDest: 1
    });

    await qrCode.writeAsync(outputPath);
  } catch (error) {
    console.error('Error overlaying logo on QR code:', error);
    throw new Error('Failed to overlay logo on QR code');
  }
};

const generatePixPayment = async (userId, amount, expiresAt) => {
  try {   
    const txid = uuidv4().replace(/-/g, '').substring(0, 25);
    
    const pixKey = config.pix.key;
    const merchantName = config.pix.merchantName || 'MERCHANT';
    const merchantCity = config.pix.merchantCity || 'CITY';
    
    const adjustedAmount = addAmountVariation(amount);
    
    const pixCode = pix({
      key: pixKey,
      name: merchantName,
      city: merchantCity,
      amount: adjustedAmount,
      txId: txid,
      description: `Pagamento User ID: ${userId}`
    });
    
    const qrCodeFilename = `pix_${Date.now()}_${userId}.png`;
    const qrCodePath = path.join(__dirname, '../../public/qrcodes', qrCodeFilename);
    const tempQrCodePath = path.join(__dirname, '../../public/qrcodes', `temp_${qrCodeFilename}`);
    
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    await QRCode.toFile(tempQrCodePath, pixCode, qrOptions);
    
    const logoPath = path.join(__dirname, '../../public/logo.png');
    
    await overlayLogoOnQrCode(tempQrCodePath, logoPath, qrCodePath);
    
    if (fs.existsSync(tempQrCodePath)) {
      fs.unlinkSync(tempQrCodePath);
    }
    
    return {
      pixCode,
      qrCodePath: qrCodeFilename,
      adjustedAmount
    };
  } catch (error) {
    console.error('Error generating PIX payment:', error);
    throw new Error('Failed to generate PIX payment');
  }
};

module.exports = {
  generatePixPayment
};
