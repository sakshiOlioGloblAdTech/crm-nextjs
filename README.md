# CRM Admin Panel

A full-featured e-commerce CRM admin panel built with **Next.js 14**, **Node.js**, **Prisma**, and **PostgreSQL**. Migrated and rebuilt from a Laravel + Filament PHP project.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (JWT sessions) |
| Excel Export | ExcelJS |
| Icons | Lucide React |
| Styling | Tailwind CSS |

---

## ✨ Features

### 🔐 Authentication
- Secure login with JWT sessions
- bcrypt password hashing
- Role-based access — Super Admin / Admin / Staff
- Route protection via Next.js middleware

### 📦 Catalog Management
- **Categories** — Create, edit, delete with HSN code, GST %, SEO meta fields
- **Sub Categories** — Linked to parent categories with featured/status flags
- **Products** — Full CRUD with image support, badges (New, Featured, Best Seller)
- **Product Variations** — Multiple SKUs per product with price, stock, weight, dimensions
- **Attributes** — Color, Size and custom attributes per variation

### 🛒 Order Management
- **Current Orders** — Placed, Processing, Shipped orders with search and filter
- **Past Orders** — Delivered, Completed, Cancelled, Refunded orders
- **Order Detail** — Full order view with items, pricing breakdown, customer info, address
- **Status Updates** — Move orders through the pipeline with one click
- **Order Progress Timeline** — Visual step tracker from placement to completion
- **Cancellation** — Cancel with mandatory reason, updates both master and detail records

### 🔄 Returns & After-Sales
- **Return Orders** — View and manage return requests with Approve / Reject actions
- **Refund Tracking** — Completed returns with total refunded amount summary
- **Warranty Claims** — Manage warranty submissions with approve/reject workflow

### 🏷️ Marketing
- **Promo Codes** — Percentage or flat discount codes with expiry, usage limits
- **Code Scope** — Global, First Order only, Product-specific, or Subcategory-specific
- **Home Banners** — Visual banner management with live image preview

### ⚙️ Configuration
- **Settings** — Delivery fee config, multiple notification email addresses
- **Admin Users** — Add team members with role assignment (Super Admin / Admin / Staff)

### 📊 Reports & Exports
- **Sales Report** — Revenue, orders, GST summary with daily trend chart
- **Product Performance** — Best-selling products ranked by revenue
- **Customer Report** — All customers with total spend and order history
- **Date Range Filter** — Filter any report by custom date range
- **Excel Export** — Download any report as a formatted `.xlsx` file

---

## 🗄️ Database Schema

24 tables covering the full e-commerce domain:
