# PIX Payment API Documentation

Complete documentation for the PIX Payment API, a solution to generate PIX charges and automatically verify payments through Nubank email monitoring.

## Overview

This API allows you to:
- Generate PIX charges with payment codes and customized QR Codes
- Automatically monitor payments received through Nubank emails
- Receive notifications via webhook when a payment is confirmed
- Check payment status at any time

The main advantage of this system is allowing PIX integration **without needing a business account** or access to the official PIX API.

## Requirements

- Node.js v14 or higher
- Gmail account to receive Nubank notifications
- Gmail API access (OAuth 2.0)
- PIX key for receiving payments

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/XDukeHD/nubank-api-pix
   cd pix-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Rename the file `config.example.json` to `config.json` (Files are located in the `config` folder):
   ```
   cp config/config.example.json config/config.json
   ```

4. Configure your `config/config.json` file with your information:
   - PIX key for receiving payments (`pix.key`)
   - Receiver's name and city (`pix.merchantName` and `pix.merchantCity`)
   - Gmail API credentials
   - Webhook URL and secret

5. Add a logo image (optional):
   - Save your logo as `logo.png` in the `public/` directory

6. Run the setup script to create your first API client:
   ```
   npm run setup
   ```

7. Start the server:
   ```
   npm start
   ```

## Gmail Configuration

For automatic payment verification to work, you need to set up OAuth 2.0 access to the Gmail API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Gmail API
4. Set up OAuth 2.0 credentials
5. Configure the OAuth consent screen
6. Generate a refresh token

For detailed instructions on this process, see the [official Google documentation](https://developers.google.com/gmail/api/quickstart/nodejs).

## API Endpoints

### 1. Create PIX Charge

This endpoint generates a new PIX code and customized QR Code for payment.

**Endpoint:** `POST /api/payments/pix/create`

**Headers:**
- `api-key`: Your API key (required)

**Body:**
```json
{
  "user_id": "123",
  "amount": 99.90,
  "img_qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfF..." 
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "pix_code": "00020126330014BR.GOV.BCB.PIX0111...",
    "qr_code_image_url": "http://localhost:3000/qrcodes/pix_1747598840874_847187d46bc3d63459038a4a950a0a29.png",
    "expires_at": "2023-01-01T15:00:00.000Z"
  }
}
```

**Notes:**
- The `user_id` can be any identifier you use to associate the payment with a user or order
- The `img_qr` field is optional and can contain a base64 image or URL that will be used as the logo in the QR Code
- The system applies small variations to the amount to help identify the payment
- The generated QR Code includes your custom logo or the image provided in the `img_qr` parameter
- The `expires_at` field indicates when the charge expires (default: 3 hours)

### 2. Check Payment Status

This endpoint allows you to check the current status of a payment.

**Endpoint:** `GET /api/payments/status?payment_id=550e8400-e29b-41d4-a716-446655440000`

**Headers:**
- `api-key`: Your API key (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "paid", // pending, paid or expired
    "amount": 99.90,
    "created_at": "2023-01-01T12:00:00.000Z",
    "expires_at": "2023-01-01T15:00:00.000Z",
    "payment_date": "2023-01-01T12:30:00.000Z"
  }
}
```

**Possible statuses:**
- `pending`: Payment awaiting confirmation
- `paid`: Payment confirmed
- `expired`: Payment deadline expired

## Payment Verification

The API automatically monitors emails received in the configured Gmail account, looking for emails from the sender `todomundo@nubank.com.br` with the title "Você recebeu uma transferência!" (You received a transfer!).

### Processing Flow

When a transfer email is found, the API:

1. Extracts the transfer amount and date/time from the email body
2. Adjusts the time to Brasília timezone (UTC-3)
3. Looks for pending charges with an amount close to the one received (with tolerance for small variations)
4. Verifies if the transfer occurred within the valid timeframe (3 hours after the charge was created by default)
5. Marks the payment as paid and records the payment date/time
6. Sends a webhook to the configured system (optional)
7. Deletes the QR code from disk to save space

### Webhook Notification

When a payment is confirmed, the API can send a notification to a configured webhook endpoint:

**Webhook payload:**
```json
{
  "event": "payment.confirmed",
  "payment_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123",
  "amount": 99.90,
  "payment_date": "2023-01-01T12:30:00.000Z",
  "status": "paid"
}
```

**Webhook headers:**
- `Content-Type`: `application/json`
- `x-webhook-secret`: HMAC SHA-256 signature of the payload using the configured secret

To enable the webhook, configure in the `config.json` file:
```json
"webhook": {
  "url": "https://your-system.com/api/webhook",
  "secret": "your_secret_for_validation",
  "active": true
}
```

## Security

- **HTTPS**: Use HTTPS in production to protect communications
- **API Key**: Keep your API key secure and don't share it publicly
- **Gmail Permissions**: Configure the minimum necessary permissions for the Gmail API
- **Webhook Secrets**: Use the webhook signature to validate notifications
- **Access Control**: Limit access to API endpoints using firewalls and network rules

## Troubleshooting

### Gmail Authorization Issues

If you're having trouble with email verification, check:

1. **OAuth Credentials**: Confirm that your credentials (client ID, client secret, and refresh token) are correct
2. **Permissions**: Verify that the necessary permissions have been granted (`https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.modify`)
3. **Two-Step Verification**: Some issues may occur if the account has two-step verification enabled
4. **Correct Sender**: Confirm that the `sender` field is set to `todomundo@nubank.com.br`
5. **API Limits**: Check if you've hit Gmail API usage limits

### QR Code Not Generated

Possible causes:

1. **Directory Permissions**: Check if the `public/qrcodes` directory exists and has write permissions
2. **Missing Logo**: Confirm that the `public/logo.png` file exists
3. **Dependencies**: Verify that all dependencies were installed correctly (`jimp` and `qrcode`)

### Payments Not Detected

Common reasons:

1. **Amount Mismatch**: The system looks for payments with amounts close to, but with small variations
2. **Email Lost**: The Nubank email may not have been received or was classified as spam
3. **Email Format Changed**: Nubank may have changed the notification email format
4. **Check Interval**: The system checks emails every 20 seconds by default

## Technical Details & Notes

- **QR Code Storage**: The `qr_code_path` field in the database only saves the filename, not the full path
- **Automatic Cleanup**: The QR code is automatically deleted from disk when the payment is confirmed
- **Timezone**: All dates are saved already adjusted to Brasília timezone (UTC-3)
- **Expiration**: Charges automatically expire after 3 hours by default (configurable)
- **Amount Variation**: The system applies small variations to amounts to help identify payments
- **Web Server**: The API exposes generated QR codes via the URL `/qrcodes/{filename}`
- **Email Deletion**: Processed emails are deleted to keep the inbox clean

## Project Structure

```
pix-api/
├── config/
│   ├── config.example.json    # Configuration template
│   └── config.json            # Actual configuration (gitignore)
├── docs/
│   ├── docs-en.md             # English documentation
│   └── docs-pt.md             # Portuguese documentation
├── public/
│   ├── logo.png               # Logo for QR Codes
│   └── qrcodes/               # Generated QR Codes
├── scripts/
│   └── setup.js               # Initial setup script
├── src/
│   ├── controllers/
│   │   └── paymentController.js  # Payment controllers
│   ├── middlewares/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── apiClient.js       # API client model
│   │   ├── index.js           # Sequelize configuration
│   │   └── payment.js         # Payment model
│   ├── routes/
│   │   └── index.js           # API routes
│   ├── services/
│   │   ├── cronService.js     # Scheduled tasks service
│   │   ├── emailService.js    # Email verification service
│   │   ├── pixService.js      # PIX generation service
│   │   └── webhookService.js  # Webhook service
│   ├── utils/
│   │   └── responseUtil.js    # Response utilities
│   └── index.js               # Application entry point
├── database.sqlite            # SQLite database
├── LICENSE                    # Project license
├── package.json               # Dependencies and scripts
└── README.md                  # Simplified documentation
```

## Project Status

This project is in BETA version. While it's functional for production use, API changes may occur and new features are being added constantly.

## Roadmap

Features planned for future versions:

- [ ] Support for banks other than Nubank
- [ ] Administration panel for payment management
- [ ] Integration with notification systems (SMS, WhatsApp)
- [ ] Payment report generation
- [ ] Support for recurring payments
- [ ] Improvements in payment detection

## Contributions

Contributions are welcome! Feel free to open issues or pull requests to improve the project.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

Developed by Túlio Cadilhac - XDuke.
