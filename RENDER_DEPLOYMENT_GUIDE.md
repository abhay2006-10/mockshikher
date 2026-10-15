# Mockshikhar — Render Deployment Guide

This guide outlines the production deployment of Mockshikhar to **Render** using your managed **Neon PostgreSQL** database.

---

## 1. Prerequisites Checklist
- [x] Production build tested and verified (`npm run build` succeeds cleanly)
- [x] TypeScript validation passing (`tsc --noEmit` returns 0 errors)
- [x] Neon PostgreSQL schema synced and verified
- [x] Admin account configured (`abhayverm24@gmail.com`)
- [x] Bulk question importer tested with 100+ MCQs preview and error handling

---

## 2. Render Web Service Configuration

When creating a new **Web Service** on [Render](https://dashboard.render.com):

| Setting | Value |
| :--- | :--- |
| **Name** | `mockshikhar` (or your preferred service name) |
| **Language / Environment** | `Node` |
| **Region** | `Ohio (US East)` (matches your Neon DB region: `us-east-2`) |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Node Version** | `20.x` or `22.x` |

---

## 3. Required Environment Variables

Configure the following environment variables in your Render Service Dashboard (**Environment** tab):

### Database Configuration (Neon PostgreSQL)
* `DATABASE_URL`: Your Neon **Pooled** connection string (host ends in `-pooler.us-east-2.aws.neon.tech`). Used by Next.js application runtime for high concurrency connection pooling.
* `DIRECT_URL`: Your Neon **Direct** connection string (host does **not** include `-pooler`). Used by Prisma CLI during `db push` to bypass PgBouncer transaction-mode limitations.

### NextAuth & Security
* `NEXTAUTH_URL`: Your production URL on Render (e.g., `https://mockshikhar.onrender.com` or your custom domain `https://mockshikhar.com`).
* `NEXTAUTH_SECRET`: A secure 32+ character random secret string (e.g., generated with `openssl rand -base64 32`).
* `AUTH_TRUST_HOST`: Set to `true` (required for NextAuth behind Render reverse proxies).

### App Configuration
* `NEXT_PUBLIC_APP_NAME`: `Mockshikhar`
* `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://mockshikhar.onrender.com`).

### Admin Setup
* `ADMIN_EMAIL`: `abhayverm24@gmail.com`
* `ADMIN_PASSWORD`: Your chosen admin password (used if running `npm run create-admin` in Render Shell).

### Razorpay Payments (when ready)
* `RAZORPAY_KEY_ID`: Your Razorpay Key ID (Live or Test).
* `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
* `RAZORPAY_WEBHOOK_SECRET`: Webhook secret configured in your Razorpay dashboard pointing to `/api/payments/webhook`.

### Brevo Email Verification (Transactional)
* `BREVO_API_KEY`: Your Brevo API key (`xkeysib-...`).
* `EMAIL_FROM`: `Mockshikhar <support@mockshikhar.com>`.

---

## 4. Post-Deployment Verification Checklist

Once the deployment completes on Render:
1. Visit `https://<your-service>.onrender.com/` — confirm home page loads instantly.
2. Go to `https://<your-service>.onrender.com/exams` — confirm exams list from Neon.
3. Test login at `https://<your-service>.onrender.com/auth/login` using your configured admin credentials.
4. Visit `https://<your-service>.onrender.com/admin` — verify the Admin Control Centre.
5. In **Question Bank**, test the "Download CSV Template" button.
6. Upload a sample batch using the **Bulk Importer** in Preview Mode to verify everything works smoothly on the live server.
