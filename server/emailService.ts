import nodemailer from 'nodemailer';
import { Order } from '@shared/schema';
import sgMail from '@sendgrid/mail';

// Get email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || EMAIL_USER;
const FROM_NAME = process.env.FROM_NAME || 'Radheya Alankara';

// SendGrid configuration (preferred for Render)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized for email delivery');
}

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // Faster timeouts for production (quick failover)
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
    // TLS settings for better compatibility
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Format currency for Indian Rupees
const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(parseFloat(amount.toString()));
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Generate order confirmation email HTML
const generateOrderConfirmationHTML = (order: any) => {
  const items = order.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5A3C 0%, #D4A574 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
        .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #8B5A3C; color: white; padding: 12px; text-align: left; }
        .total-row { background: #f8f9fa; font-weight: bold; }
        .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${order.customerName}!</h2>
          <p>We're excited to confirm that your order has been received and is being processed.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p><strong>Order Status:</strong> ${order.orderStatus}</p>
          </div>

          <h3>Items Ordered</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
              <tr class="total-row">
                <td colspan="4" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(order.subtotal)}</strong></td>
              </tr>
              <tr class="total-row">
                <td colspan="4" style="padding: 12px; text-align: right;"><strong>Shipping:</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(order.shipping)}</strong></td>
              </tr>
              <tr class="total-row">
                <td colspan="4" style="padding: 12px; text-align: right; font-size: 16px;"><strong>Total:</strong></td>
                <td style="padding: 12px; text-align: right; font-size: 16px;"><strong>${formatCurrency(order.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h3>Shipping Address</h3>
          <div class="order-details">
            <p>
              ${order.customerName}<br>
              ${order.shippingAddress}<br>
              ${order.city}, ${order.state} ${order.pinCode}<br>
              Phone: ${order.customerPhone}
            </p>
          </div>

          <p>We'll send you another email with tracking information once your order ships.</p>
          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
        </div>

        <div class="footer">
          <p><strong>Radheya Alankara</strong></p>
          <p>Exquisite Jewelry for Every Occasion</p>
          <p>Email: info@radheyaalankara.com | Phone: +91 XXXXX XXXXX</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate order status update email HTML
const generateStatusUpdateHTML = (order: any, oldStatus: string, newStatus: string, trackingNumber?: string) => {
  const statusMessages = {
    pending: "We've received your order and it's being processed.",
    processing: "Your order is currently being prepared with care.",
    shipped: `Great news! Your order has been shipped ${trackingNumber ? `with tracking number: ${trackingNumber}` : ''}.`,
    delivered: "Your order has been delivered successfully. We hope you love your new jewelry!"
  };

  const statusColors = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#10b981',
    delivered: '#22c55e'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update - ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5A3C 0%, #D4A574 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
        .status-update { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${statusColors[newStatus as keyof typeof statusColors] || '#6b7280'}; }
        .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .tracking-info { background: #dbeafe; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
          <p>Your order status has been updated</p>
        </div>
        
        <div class="content">
          <h2>Hello ${order.customerName}!</h2>
          
          <div class="status-update">
            <h3>Status Update: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h3>
            <p>${statusMessages[newStatus as keyof typeof statusMessages] || `Your order status has been updated to: ${newStatus}`}</p>
          </div>

          ${trackingNumber ? `
            <div class="tracking-info">
              <h4>Tracking Information</h4>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              <p>You can track your package using this tracking number with our shipping partner.</p>
            </div>
          ` : ''}
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
            <p><strong>Total Amount:</strong> ${formatCurrency(order.total)}</p>
          </div>

          <p>Thank you for choosing Radheya Alankara. If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <div class="footer">
          <p><strong>Radheya Alankara</strong></p>
          <p>Exquisite Jewelry for Every Occasion</p>
          <p>Email: info@radheyaalankara.com | Phone: +91 XXXXX XXXXX</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order: any) => {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: order.customerEmail,
    subject: `Order Confirmation - ${order.id}`,
    html: generateOrderConfirmationHTML(order),
  };

  const success = await sendEmailWithRetry(mailOptions);
  
  // Log order details for manual follow-up if email fails
  if (!success) {
    console.error('📧 ORDER CONFIRMATION EMAIL FAILED:');
    console.error(`   Order ID: ${order.id}`);
    console.error(`   Customer: ${order.customerName} <${order.customerEmail}>`);
    console.error(`   Phone: ${order.customerPhone}`);
    console.error(`   Total: ₹${order.total}`);
    console.error(`   Status: ${order.orderStatus}`);
    console.error('   ⚠️  MANUAL EMAIL FOLLOW-UP REQUIRED');
  }
  
  return success;
};

// Send order status update email
export const sendOrderStatusUpdateEmail = async (order: any, oldStatus: string, newStatus: string, trackingNumber?: string) => {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: order.customerEmail,
    subject: `Order Status Update - ${order.id}`,
    html: generateStatusUpdateHTML(order, oldStatus, newStatus, trackingNumber),
  };

  const success = await sendEmailWithRetry(mailOptions);
  
  // Log status update details for manual follow-up if email fails
  if (!success) {
    console.error('📧 STATUS UPDATE EMAIL FAILED:');
    console.error(`   Order ID: ${order.id}`);
    console.error(`   Customer: ${order.customerName} <${order.customerEmail}>`);
    console.error(`   Status Change: ${oldStatus} → ${newStatus}`);
    if (trackingNumber) console.error(`   Tracking: ${trackingNumber}`);
    console.error('   ⚠️  MANUAL EMAIL FOLLOW-UP REQUIRED');
  }
  
  return success;
};

// Send email using SendGrid API (perfect for Render hosting)
const sendEmailViaSendGrid = async (mailOptions: any): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  try {
    const msg = {
      to: mailOptions.to,
      from: {
        email: FROM_EMAIL || 'noreply@radheyaalankara.com',
        name: FROM_NAME
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent via SendGrid to ${mailOptions.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email failed:', error.message);
    if (error.response?.body?.errors) {
      console.error('SendGrid errors:', error.response.body.errors);
    }
    return false;
  }
};

// Send email with smart routing (SendGrid for Render, SMTP for local)
const sendEmailWithRetry = async (mailOptions: any): Promise<boolean> => {
  // Check if we're on Render or production - use SendGrid first
  const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
  
  if (isRender && SENDGRID_API_KEY) {
    // On Render, try SendGrid first (SMTP is often blocked)
    const sendGridSuccess = await sendEmailViaSendGrid(mailOptions);
    if (sendGridSuccess) {
      return true;
    }
    console.log('SendGrid failed, falling back to SMTP...');
  }

  // Try SMTP (works locally, fallback for production)
  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email transporter not available');
    // If SMTP fails and we haven't tried SendGrid yet, try it
    if (!isRender && SENDGRID_API_KEY) {
      return await sendEmailViaSendGrid(mailOptions);
    }
    return false;
  }

  // SMTP attempt with quick timeout for Render
  const maxRetries = isRender ? 1 : 2; // Less retries on Render since SMTP is likely blocked
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent via SMTP to ${mailOptions.to}`);
      return true;
    } catch (error: any) {
      // If it's a connection timeout or network error, wait and retry
      if (attempt < maxRetries) {
        const waitTime = 1000; // Wait 1s between retries
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If SMTP failed completely, try SendGrid as final fallback
      if (attempt === maxRetries) {
        console.error(`❌ SMTP failed after ${maxRetries} attempts:`, error.message);
        if (SENDGRID_API_KEY && !isRender) {
          console.log('Trying SendGrid as fallback...');
          return await sendEmailViaSendGrid(mailOptions);
        }
      }
    }
  }
  
  return false;
};

// Test email configuration (tries both SendGrid and SMTP)
export const testEmailConfiguration = async () => {
  console.log('🔧 Testing email configuration...');
  
  // Test SendGrid first (preferred for Render)
  if (SENDGRID_API_KEY) {
    try {
      // SendGrid doesn't have a verify method, so we'll just check if the key exists
      console.log('✅ SendGrid API key configured');
      return true;
    } catch (error) {
      console.error('SendGrid configuration error:', error);
    }
  } else {
    console.log('⚠️  SendGrid API key not configured');
  }

  // Test SMTP as fallback
  const transporter = createTransporter();
  if (!transporter) {
    console.log('❌ SMTP configuration missing');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP configuration valid');
    return true;
  } catch (error) {
    console.error('❌ SMTP configuration error:', error);
    return false;
  }
};