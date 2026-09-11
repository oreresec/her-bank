[ Client / Frontend ]
         │
         ▼
 ┌─────────────────────────────────────────┐
 │       Global Rate Limiter (100 req)     │
 └───────────────────┬─────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
 ┌───────────────┐       ┌───────────────┐
 │  Auth Routes  │       │ Account/Trans │
 └───────┬───────┘       └───────┬───────┘
         │                       │
         ▼                       ▼
 ┌───────────────┐       ┌───────────────┐
 │ JWT / BCRYPT  │       │   Controllers │
 └───────────────┘       └───────┬───────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
 ┌──────────────────────────────┐                ┌──────────────────────────────┐
 │    INTRA-BANK TRANSFER       │                │    INTER-BANK (NIBSS)        │
 │  - Atomic Database Lock      │                │  - Idempotency Key Generation│
 │  - Internal Ledger Update    │                │  - External Gateway Switch   │
 └──────────────────────────────┘                │  - Automated Escrow & Refund │
                                                 └──────────────────────────────┘

                                                 🏦 HER Bank Backend
A digital banking backend system I built using Node.js, Express, and MongoDB. It handles user accounts, secure logins, money transfers, and talks to external banking systems safely.

What I Built:
ser Authentication: Secure sign-up and login using JWT (JSON Web Tokens) and bcrypt for password hashing.

                Two Types of Transfers:
Internal (Intra-Bank): Instantly moves money between accounts inside the bank.
External (Inter-Bank): Sends money to other banks using the NIBSS system.
                Smart Safety Features:
Idempotency: Generates a unique reference key for every transaction so a user can never accidentally get charged twice if the network glitches.
Automatic Refunds: If an external bank transfer fails or times out, the system automatically puts the money back into the sender's account.
Transaction Status Query (TSQ): An endpoint to check the live status of a pending transfer.
Transaction History: A clean record of all past transfers, sorted by date.
Rate Limiting: Protects the app from being spammed or hit by brute-force attacks.
                Tech Stack
Node.js & Express: For building the server and routing.
MongoDB & Mongoose: For storing and managing user data and transactions.
JWT & Bcrypt: For security and authentication.
Zod & Axios: For validating data and making external API requests.


                API Endpoints


📚 What I Want to Learnt from this project


FEATURES  I WILL LIKE TO ADD NEXT
Cloudinary for Paasport  at signup , each customer must profile password image by uploading  for kyc
paginations for transaction

👨‍💻 Author
Built by me from BACKEND IN 
