# Production-Level E-Commerce Backend (Inspired by Croma)

This repository contains the backend for a production-ready, scalable E-Commerce application inspired by Croma. The project is built using modern Node.js, Express.js, and MongoDB, adhering to clean architecture, SOLID principles, and MVC patterns.

## Tech Stack
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB & Mongoose
* **Security & Optimization**: Helmet, CORS, Compression, Express Rate Limit, Cookie Parser
* **Authentication**: JWT & BcryptJS (HTTP-Only Cookies)
* **Validation**: Express Validator
* **Upload**: Multer & Cloudinary
* **Email & Notifications**: Nodemailer

---

## Folder Structure
```
backend/
├── src/
│   ├── config/             # DB, Cloudinary, Mail configurations
│   ├── controllers/        # Request handlers (grouped by module)
│   ├── middlewares/        # Authentication, Validation, Errors, Upload
│   ├── models/             # Mongoose schemas & indexing
│   ├── routes/             # API routing endpoints
│   ├── services/           # Business logic & external systems integration
│   ├── helpers/            # Reusable sub-routines
│   ├── utils/              # APIResponse, APIError classes and helpers
│   ├── constants/          # Static app configs and error codes
│   ├── validations/        # Express validator rulesets
│   ├── app.js              # Express app configs and middleware setup
│   └── server.js           # Server runner and DB initialization
├── .env.example            # Environment variables template
├── .gitignore              # Ignored folders list
├── package.json            # Node project configuration
└── README.md               # Project documentation
```

---

## Setup Instructions

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB (Local or Atlas instance)

### Installation
1. Clone the repository and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the base dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit the `.env` file with your credentials.*

4. Run the project in development mode:
   ```bash
   npm run dev
   ```
