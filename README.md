# RadheyaAlankara
Exquisite Jewelry Ecommerce Platform

A full-stack jewelry ecommerce application built with React, Express, and Node.js featuring admin panel, order management, and automated email notifications.

## Features

- 🛍️ Complete ecommerce functionality with cart and checkout
- 💳 Razorpay payment integration
- 📧 Automated email notifications (order confirmation & status updates)
- 👨‍💼 Admin panel for managing products, categories, and orders
- 📱 Responsive design for all devices
- 🖼️ Image management for products and categories
- 📊 Order tracking and management

## Email Configuration

The application sends automated emails for:
- Order confirmations after successful payment
- Order status updates (processing, shipped, delivered)

### Setup Email Service

1. **Gmail Setup (Recommended for development):**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: [Google App Passwords Guide](https://support.google.com/accounts/answer/185833)
   - Update `.env` file with Gmail credentials

2. **Environment Variables:**
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   FROM_EMAIL=your_email@gmail.com
   FROM_NAME=Radheya Alankara
   ```

3. **Alternative Email Providers:**
   - **Outlook/Hotmail:** Use `smtp-mail.outlook.com`
   - **Yahoo:** Use `smtp.mail.yahoo.com`
   - **Production:** Consider using SendGrid, Mailgun, or similar services

4. **Test Email Configuration:**
   - Use the admin panel endpoint: `POST /api/admin/test-email`
   - Send test emails: `POST /api/admin/send-test-email`

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd RadheyaAlankara
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update with your configuration values

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Admin Panel

Access the admin panel at `/admin` with admin credentials:
- Email: `admin@radheyaalankara.com`

### Admin Features:
- **Product Management:** Add, edit, delete products with image uploads
- **Category Management:** Manage product categories with images
- **Order Management:** View orders, update status, add tracking numbers
- **Email Testing:** Test email configuration and send test emails

## API Endpoints

### Public Endpoints:
- `GET /api/products` - Get all products
- `GET /api/categories` - Get all categories
- `GET /api/products/category/:slug` - Get products by category
- `POST /api/razorpay/order` - Create payment order
- `POST /api/razorpay/verify` - Verify payment

### Admin Endpoints (require admin authentication):
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/categories` - Get categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/admin/test-email` - Test email configuration
- `POST /api/admin/send-test-email` - Send test email

## Email Templates

The application includes responsive HTML email templates:
- **Order Confirmation:** Detailed order summary with items, pricing, and shipping info
- **Status Updates:** Order status changes with tracking information

## File Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities and hooks
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage layer
│   └── emailService.ts     # Email functionality
├── data/                   # JSON data files
└── attached_assets/        # Static assets and uploads
```

## Technologies Used

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** JSON file storage (easily adaptable to SQL/NoSQL)
- **Payments:** Razorpay
- **Email:** Nodemailer
- **File Upload:** Multer
- **Build Tool:** Vite 
