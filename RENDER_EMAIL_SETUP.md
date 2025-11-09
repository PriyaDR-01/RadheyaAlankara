# Email Setup for Render.com Hosting

This guide will help you set up email functionality that works perfectly with Render.com hosting.

## 🚀 Quick Setup (Recommended)

### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com/) and sign up for a free account
2. Free plan includes **100 emails/day** - perfect for getting started
3. Verify your email address

### Step 2: Create API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name like "RadheyaAlankara-Production"
5. Under **Mail Send**, select **Full Access**
6. Click **Create & View**
7. **Copy the API key immediately** (you won't see it again!)

### Step 3: Configure Render Environment Variables
1. In your Render dashboard, go to your service
2. Go to **Environment** tab
3. Add these environment variables:

```
SENDGRID_API_KEY=SG.your_actual_api_key_here
FROM_EMAIL=noreply@yourdomain.com  
FROM_NAME=Radheya Alankara
NODE_ENV=production
```

### Step 4: Domain Verification (Optional but Recommended)
1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., radheyaalankara.com)
4. Follow DNS setup instructions
5. This improves email deliverability

## 🔧 How It Works

### Smart Email Routing
- **On Render**: Uses SendGrid API (SMTP is blocked)
- **Locally**: Uses Gmail SMTP for development
- **Automatic Failover**: Falls back between methods

### Email Flow
```
Order Created → Email Service → SendGrid API → Customer's Inbox
                              ↓ (if fails)
                           Log for Manual Follow-up
```

## 📧 Email Features

### ✅ What Works
- Order confirmation emails
- Order status update emails  
- Professional HTML templates
- Automatic retry logic
- Detailed error logging

### 📊 Monitoring
Check your Render logs for:
```
✅ SendGrid initialized for email delivery
✅ Email sent via SendGrid to customer@email.com
❌ SendGrid email failed: [error details]
```

## 🛠 Alternative: Using Gmail SMTP (Limited)

If you prefer Gmail (not recommended for Render):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: Render often blocks SMTP ports, so SendGrid is much more reliable.

## 🆘 Troubleshooting

### Issue: "SendGrid API key not configured"
**Solution**: Add `SENDGRID_API_KEY` to Render environment variables

### Issue: "Unauthorized" error
**Solution**: Check API key permissions include "Mail Send: Full Access"

### Issue: Emails not being received
**Solutions**:
1. Check spam folder
2. Verify sender domain in SendGrid
3. Use your actual domain instead of Gmail for FROM_EMAIL

### Issue: Free plan limits exceeded
**Solution**: SendGrid free plan = 100 emails/day. Upgrade plan if needed.

## 📈 Production Tips

1. **Use your own domain**: `noreply@yourdomain.com` instead of Gmail
2. **Monitor usage**: Check SendGrid dashboard for email statistics
3. **Set up webhooks**: Track bounces and opens (optional)
4. **Custom templates**: Enhance email designs in SendGrid UI

## 🔗 Useful Links

- [SendGrid Dashboard](https://app.sendgrid.com/)
- [SendGrid API Documentation](https://docs.sendgrid.com/)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

**Need Help?** Check your Render service logs for detailed error messages!