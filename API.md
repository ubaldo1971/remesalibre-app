# RemesaLibre API Documentation

## Base URL
`http://localhost:3000/api`

---

## 🔐 Authentication (Coming Soon)
Currently using hardcoded user IDs for prototype. Production will use JWT tokens.

---

## 📱 User Directory (DICT)

### Find User by Phone
**GET** `/user/by-phone?phone={phone}`

Query user by phone number (Pix-style lookup).

**Query Parameters:**
- `phone` (string, required) - Phone in international format (e.g., +5215512345678)

**Response:**
```json
{
  "exists": true,
  "user": {
    "id": "user-1",
    "phone_number": "+5215512345678",
    "full_name": "Usuario Demo",
    "status": "active",
    "is_pre_registered": false
  }
}
```

---

### Register User
**POST** `/user/register`

Register a new user in the directory.

**Request Body:**
```json
{
  "phone_number": "+5215551234567",
  "full_name": "Juan Pérez",
  "email": "juan@example.com",
  "cashout_preference": "bank",
  "bank_account": {
    "clabe": "012345678901234567",
    "bank_name": "BBVA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": { /*...*/ },
  "message": "Usuario registrado exitosamente"
}
```

---

### Update Profile
**PUT** `/user/profile`

Update user profile information.

**Request Body:**
```json
{
  "phone": "+5215512345678",
  "updates": {
    "full_name": "Usuario Demo Actualizado",
    "email": "nuevo@email.com"
  }
}
```

---

### Update Cashout Configuration
**PUT** `/user/cashout-config`

Configure cashout method and bank details.

**Request Body:**
```json
{
  "phone": "+5215512345678",
  "method": "bank",
  "bank_account": {
    "clabe": "012345678901234567",
    "bank_name": "Santander"
  }
}
```

---

## 💸 Transactions

### Get Quote
**POST** `/transactions/quote`

Calculate fees, exchange rate, and final amount before sending.

**Request Body:**
```json
{
  "amount": 100,
  "currency": "USD",
  "type": "send"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "amount": 100,
    "currency": "USD",
    "fee": 0.50,
    "exchangeRate": 19.2075,
    "amountReceived": 1911.35,
    "totalCost": 100
  }
}
```

---

### Send Money
**POST** `/transactions/send`

Execute a money transfer (USDC → $PESO → MXN flow).

**Request Body:**
```json
{
  "amount": 100,
  "currency": "USD",
  "recipient": "+5215587654321",
  "note": "Para gastos"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "tx-uuid",
    "sender_id": "user-1",
    "receiver_id": "user-2",
    "amount_original": 100,
    "currency_original": "USD",
    "amount_converted": 1911.35,
    "currency_converted": "MXN",
    "exchange_rate": 19.2075,
    "commission": 0.50,
    "status": "completed",
    "created_at": "2025-11-27T08:00:00.000Z"
  },
  "newBalance": 900.00
}
```

---

## 📊 Wallet

### Get Balance
**GET** `/wallet/balance/:userId`

Get user's wallet balances.

**Response:**
```json
{
  "user_id": "user-1",
  "balance_usd": 1000.00,
  "balance_mxn": 5000.00,
  "updated_at": "2025-11-27T08:00:00.000Z"
}
```

---

## 💰 Cash-out

### Request Cashout
**POST** `/cashout/request`

Request money withdrawal to bank or OXXO.

**Request Body (SPEI):**
```json
{
  "user_id": "user-2",
  "amount_mxn": 200,
  "method": "bank_spei",
  "destination": {
    "clabe": "012345678901234567",
    "bank_name": "BBVA"
  }
}
```

**Request Body (OXXO):**
```json
{
  "user_id": "user-2",
  "amount_mxn": 500,
  "method": "oxxo"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "status": "completed",
    "reference_code": "SPEI1732...",
    "amount_mxn": 200
  },
  "message": "Transferencia SPEI procesada exitosamente",
  "new_balance_mxn": 300
}
```

---

### Get History
**GET** `/cashout/history`

Get withdrawal history.

**Query Parameters:**
- `user_id` (optional, defaults to user-2)

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "amount_mxn": 200,
      "method": "bank_spei",
      "status": "completed",
      "created_at": "..."
    }
  ]
}
```

---

## 📱 QR Payments

### Generate Payment QR
**POST** `/qr/generate`

Generate a dynamic QR code for receiving payment.

**Request Body:**
```json
{
  "user_id": "user-1",
  "amount_mxn": 500,
  "description": "Pago de servicio",
  "ttl_seconds": 300
}
```

**Response:**
```json
{
  "success": true,
  "qr_code": {
    "id": "uuid",
    "payload": "000201...",
    "amount": 500,
    "expires_at": "2025-11-27T..."
  }
}
```

---

### Validate QR
**POST** `/qr/validate`

Validate a scanned QR code string.

**Request Body:**
```json
{
  "qr_payload": "000201..."
}
```

**Response:**
```json
{
  "valid": true,
  "request": {
    "id": "uuid",
    "receiver_name": "Usuario Demo",
    "amount": 500,
    "description": "Pago de servicio"
  }
}
```

---

### Pay from QR
**POST** `/qr/pay`

Pay a QR code request.

**Request Body:**
```json
{
  "payer_id": "user-2",
  "qr_payload": "000201...",
  "amount_input": 500,
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago realizado exitosamente",
  "amount_paid_usd": 25.64,
  "amount_received_mxn": 500
}
```

---

## ⚙️ Admin (TODO - Phase 2)

### Get System Configuration
**GET** `/admin/config`

Get current system configuration (fees, rates, limits).

---

### Update Configuration
**PUT** `/admin/config`

Update system parameters (admin only).

**Request Body:**
```json
{
  "commission_rate": 0.005,
  "spread": 0.015,
  "exchange_rate_usd_mxn": 19.50
}
```

---

### Get Statistics
**GET** `/admin/stats`

Get system-wide statistics.

**Query Parameters:**
- `from` - Start date
- `to` - End date

---

## 🔒 Security Notes

### Current Implementation (Prototype)
- No JWT authentication yet
- Hardcoded sender ID (`user-1`)
- No PIN verification
- No rate limiting

### Production TODO
- Implement JWT tokens
- Add PIN verification for transactions
- Implement rate limiting
- Add OTP for sensitive operations
- Enable 2FA

---

## ⚡ Real-Time Updates (Socket.io)

### Connect
```javascript
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  socket.emit('subscribe_transactions', 'user-1');
});
```

### Events
- `transaction_completed` - When a transaction is completed
- `money_received` - When you receive money
- `balance_updated` - When your balance changes

---

## 🚀 Test Examples

### cURL Examples

**Get Quote:**
```bash
curl -X POST http://localhost:3000/api/transactions/quote \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "type": "send"}'
```

**Send Money:**
```bash
curl -X POST http://localhost:3000/api/transactions/send \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "recipient": "+5215587654321",
    "note": "Test payment"
  }'
```

**Find User by Phone:**
```bash
curl "http://localhost:3000/api/user/by-phone?phone=%2B5215512345678"
```

---

## 📝 Response Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🔗 Related Documentation

- [Implementation Plan](./implementation_plan.md)
- [Architecture](./ARCHITECTURE.md) (TODO)
- [Blockchain Integration](./server/src/blockchain/) - Smart contract placeholders
