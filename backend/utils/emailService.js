const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');
const path = require('path');
const fs = require('fs');
const { generateReceipt } = require('./pdfGenerator');

class Email {
  constructor(user, order) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.order = order;
    this.from = `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // Mailtrap for development
    const host = process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io';
    const port = parseInt(process.env.EMAIL_PORT) || 2525;
    const username = process.env.EMAIL_USERNAME || '';
    const password = process.env.EMAIL_PASSWORD || '';

    if (!username || !password) {
      console.warn('Email credentials not configured. EMAIL_USERNAME and EMAIL_PASSWORD must be set in .env');
    }

    console.log(`Creating email transport: ${host}:${port} (user: ${username ? '***' : 'NOT SET'})`);

    return nodemailer.createTransport({
      host,
      port,
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  // Send the actual email
  async send(template, subject, attachments = []) {
    try {
      // 1) Render HTML based on a pug template
      const html = pug.renderFile(
        `${__dirname}/../views/emails/${template}.pug`,
        {
          firstName: this.firstName,
          order: this.order,
          subject,
        }
      );

      // 2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: convert(html, {
          wordwrap: 130,
        }),
        attachments: [...attachments],
      };

      console.log(`Sending email to: ${this.to}, subject: ${subject}`);

      // 3) Create a transport and send email
      const transport = this.newTransport();
      const info = await transport.sendMail(mailOptions);
      
      console.log(`Email sent successfully. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error in email send method:', {
        error: error.message,
        stack: error.stack,
        to: this.to,
        subject,
        template
      });
      throw error;
    }
  }

  async sendOrderStatusUpdate() {
    let attachments = [];
    let receiptPath = null;

    // Try to generate PDF receipt (optional - don't fail email if PDF fails)
    try {
      // Ensure temp/receipts directory exists
      const receiptsDir = path.join(__dirname, '../temp/receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      receiptPath = path.join(receiptsDir, `${this.order._id}.pdf`);
      await generateReceipt(this.order, receiptPath);

      attachments = [
        {
          filename: `receipt-${this.order._id}.pdf`,
          path: receiptPath,
          contentType: 'application/pdf',
        },
      ];
      console.log('PDF receipt generated successfully');
    } catch (pdfError) {
      console.warn('PDF receipt generation failed, sending email without attachment:', pdfError.message);
      // Continue without PDF attachment
    }

    try {
      await this.send(
        'orderStatusUpdate',
        `Your Order #${this.order._id} has been updated`,
        attachments
      );
    } finally {
      // Clean up the temporary PDF file if it was created
      if (receiptPath) {
        try {
          if (fs.existsSync(receiptPath)) {
            fs.unlinkSync(receiptPath);
          }
        } catch (err) {
          console.error('Error deleting temporary receipt file:', err);
        }
      }
    }
  }

  async sendOrderConfirmation() {
    await this.send(
      'orderConfirmation',
      `Thanks for your order #${this.order._id}`
    );
  }
}

module.exports = { Email };
