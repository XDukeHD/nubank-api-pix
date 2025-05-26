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

const getLogoFromBase64 = async (base64Image) => {
  try {
    if (!base64Image) return null;
    
    let imageData = base64Image;
    if (base64Image.includes('base64,')) {
      imageData = base64Image.split('base64,')[1];
    }
    
    const buffer = Buffer.from(imageData, 'base64');
    const tempImage = await Jimp.read(buffer);
    return tempImage;
  } catch (error) {
    console.error('Error processing base64 image:', error);
    return null;
  }
};

const getLogoFromUrl = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    
    const logo = await Jimp.read(imageUrl);
    return logo;
  } catch (error) {
    console.error(`Error loading image from URL ${imageUrl}:`, error);
    return null;
  }
};

const generatePixPayment = async (userId, amount, expiresAt, imgQr = null) => {
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
    
    const defaultLogoPath = path.join(__dirname, '../../public/logo.png');
    let customLogo = null;
    
    if (imgQr) {
      if (imgQr.startsWith('http://') || imgQr.startsWith('https://')) {
        customLogo = await getLogoFromUrl(imgQr);
      } else {
        customLogo = await getLogoFromBase64(imgQr);
      }
    }
    
    if (customLogo) {
      const tempLogoPath = path.join(__dirname, '../../public/qrcodes', `temp_logo_${Date.now()}.png`);
      await customLogo.writeAsync(tempLogoPath);
      await overlayLogoOnQrCode(tempQrCodePath, tempLogoPath, qrCodePath);
      
      if (fs.existsSync(tempLogoPath)) {
        fs.unlinkSync(tempLogoPath);
      }
    } else {
      await overlayLogoOnQrCode(tempQrCodePath, defaultLogoPath, qrCodePath);
    }
    
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
  generatePixPayment,
  overlayLogoOnQrCode,
  getLogoFromBase64,
  getLogoFromUrl
};
