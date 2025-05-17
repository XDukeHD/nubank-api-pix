# PIX Payment API Documentation

Complete documentation for the PIX Payment API, a solution to generate PIX charges and automatically verify payments.

## Requirements

- Node.js v14 or higher
- Gmail account to receive Nubank notifications
- Gmail API access (OAuth 2.0)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/your-username/pix-api.git
   cd pix-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Rename the file `config.example.json` to `config.json`  (Files are located in the `config` folder):
   ```
    cp config.example.json config.json
   ```

4. Configure your `config/config.json` file with your information:
   - PIX key for receiving payments
   - Gmail API credentials
   - Webhook URL

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

## API Endpoints

### 1. Create PIX Charge

**Endpoint:** `POST /api/payments/pix/create`

**Headers:**
- `api-key`: Your API key (required)

**Body:**
```json
{
  "user_id": "123",
  "amount": 99.90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "pix_code": "00020126330014BR.GOV.BCB.PIX0111...",
    "qr_code_image_url": "http://localhost:3000/qrcodes/pix_123456789.png",
    "expires_at": "2023-01-01T15:00:00.000Z"
  }
}
```

### 2. Check Payment Status

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

## Payment Verification

The API automatically monitors emails received in the configured Gmail account, looking for emails from the sender `todomundo@nubank.com.br` with the title "Você recebeu uma transferência!" (You received a transfer!).

When a transfer email is found, the API:
1. Extracts the transfer amount and date/time (adjusted to Brasília time)
2. Looks for pending charges with the same amount
3. Verifies if the transfer occurred within 3 hours after the charge was created
4. Marks the payment as paid, deletes the QR code from disk, and sends a webhook to the configured system

## Security

- Use HTTPS in production
- Keep your API key secure
- Configure Gmail API permissions correctly
- Set webhook secrets to validate notifications

## Troubleshooting

### Gmail Authorization Issues
If you're having trouble with email verification, check:
1. If OAuth credentials are correct
2. If the necessary permissions have been granted
3. If the account doesn't have two-step verification blocking access

### QR Code Not Generated
Check if the `public/qrcodes` directory exists and has write permissions.

## Technical Details & Notes

- The `qr_code_path` field only saves the filename, not the full path.
- The QR code is automatically deleted from disk when the payment is confirmed.
- All dates are saved already adjusted to Brasília time (UTC-3).
- The system automatically looks for the QR code in the `public/qrcodes` folder when displaying the charge.

## Project Status

This project is in BETA version. While it's functional for production use, API changes may occur and new features are being added constantly.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
