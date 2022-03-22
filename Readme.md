# Get Parked Backend

## Required Environments

- `.env` file with

```env
PORT=3000
SERVER_NAME=serverName

DATABASE_URL=mysql://username:password@localhost:3306/get_parked_db

ENCRYPTION_KEY=yourEcryptionKey
API_TOKEN_DECRYPTED=yourApiTokenDecrypted

ACCESS_TOKEN_SECRET=yourAccessToken
ADMIN_USER_TOKEN=yourAdminUserToken

UNIVERSAL_API_TOKEN=yourUniversalApiToken

GOOGLE_APPLICATION_CREDENTIALS=./firebase.json

CUSTOMER_MAIL_ID=yourCustomerEmailId
CUSTOMER_MAIL_PASSWORD=yourEmailPassword

RAZORPAY_KEY_ID=yourRazorpayKey
RAZORPAY_KEY_SECRET=yourRazorpaySecret
```

- `awsSmsConfig.json` file with

```json
{
    "accessKeyId":"yourAccessKeyId",
    "secretAccessKey":"yourSecretAccessKey",
    "region":"yourRegion"
}
```

- `firebase.json` file.

- `mysql.env` for running mysql container on docker.

```env
MYSQL_ROOT_PASSWORD=password
MYSQL_USER=admin
MYSQL_PASSWORD=password
```

## Prisma Installation

```cmd
npm install prisma --save-dev
```

```cmd
npx prisma
```

```cmd
npx prisma migrate dev
```

```cmd
npx prisma generate

```
