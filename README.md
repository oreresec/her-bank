

## What I Built

**User Authentication**
Secure sign-up and login using JWT (JSON Web Tokens) and bcrypt for password hashing.

**Two Types of Transfers**
- **Internal (Intra-Bank):** Instantly moves money between accounts inside the bank.
- **External (Inter-Bank):** Sends money to other banks using the NIBSS system.

**Smart Safety Features**
- **Idempotency:** Generates a unique reference key for every transaction so a user can never accidentally get charged twice if the network glitches.
- **Automatic Refunds:** If an external bank transfer fails or times out, the system automatically puts the money back into the sender's account.
- **Transaction Status Query (TSQ):** An endpoint to check the live status of a pending transfer.
- **Transaction History:** A clean record of all past transfers, sorted by date.
- **Rate Limiting:** Protects the app from being spammed or hit by brute-force attacks.

## Tech Stack

| Category | Tools |
|---|---|
| Server | Node.js, Express |
| Database | MongoDB, Mongoose |
| Security | JWT, bcrypt |
| Validation & Requests | Zod, Axios |

## API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new customer | Public |
| POST | `/api/auth/login` | Authenticate user, issue JWT | Public |
| GET | `/api/account/balance` | Fetch live account balance | Protected |
| GET | `/api/transactions` | Retrieve transaction history | Protected |
| POST | `/api/transfer` | Initiate intra or inter-bank transfer | Protected |
| GET | `/api/transfer/:reference` | Check TSQ status, trigger refund if failed | Protected |

## What I Want to Learn From This Project
- **Race conditions** — why checking a balance and then updating it in two separate steps leaves a gap where two simultaneous transfers can both pass the check before either debits. Fixed this with atomic `findOneAndUpdate` operations that check and deduct in a single database query.
- **IDOR (Insecure Direct Object Reference)** — why identity must always come from the verified JWT (`req.user.customerId`), never from `req.body` or `req.params`. Also learned that identity alone isn't enough when fetching a specific resource by ID — you still need to verify that resource actually belongs to the requester.
- **Money and floating point math** — why financial calculations shouldn't rely on JavaScript's floating point arithmetic in application code, and why letting the database handle atomic increments/decrements (`$inc`) is safer than computing new balances in JS and writing them back.


## I do not understand these well yet

- **Mongoose sessions and transactions** — how to group multiple database writes (debit sender, credit recipient, create ledger entry) so they either all succeed together or all roll back together, instead of risking a half-completed transfer.
- **Escrow and compensating transactions** — locking funds locally before calling an external API, and automatically refunding if that external call fails or times out.
- **Pagination** — why returning an entire transaction history in one response doesn't scale, and how to implement `page` and `limit` query parameters properly.

## Features I'd Like to Add Next

- Cloudinary integration for KYC — customers upload a passport photo during signup
- Pagination for transaction history (`?page=1&limit=20`)
- Refresh token rotation for session security

## Author

Built as part of my backend engineering journey at TS Academy.
