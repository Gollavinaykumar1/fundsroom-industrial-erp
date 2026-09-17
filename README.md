# Fundsroom Industrial ERP

A full-stack industrial sales and inventory workflow application built using PostgreSQL, Express.js, React.js, Node.js, Prisma and JWT authentication.

## Workflow

Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch

## Features

- JWT authentication
- ADMIN and SALES role-based access
- Customer enquiry management
- Product and inventory management
- Backend-calculated quotation totals
- GST and discount calculation
- Quotation lifecycle: DRAFT → SENT → ACCEPTED / REJECTED
- Accepted quotation conversion to Sales Order
- Transactional inventory reservation
- PostgreSQL row locking for concurrent reservation protection
- Dispatch management
- Inventory quantity updates after dispatch
- Search and status filtering
- Responsive ERP interface

## Technology Stack

- PostgreSQL
- Node.js
- Express.js
- React.js
- Vite
- Prisma ORM
- JWT
- bcrypt

## Project Structure

```text
fundsroom-erp-starter/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── style.css
│   └── package.json
│
├── docs/
│   ├── API.md
│   └── ER-DIAGRAM.md
│
└── README.md

## Database Setup

Create a PostgreSQL database named:

```text
industrialflow