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
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject, attachments = []) {
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

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendOrderStatusUpdate() {
    // Generate PDF receipt
    const receiptPath = path.join(__dirname, '../temp/receipts', `${this.order._id}.pdf`);
    await generateReceipt(this.order, receiptPath);

    // Prepare attachments
    const attachments = [
      {
        filename: `receipt-${this.order._id}.pdf`,
        path: receiptPath,
        contentType: 'application/pdf',
      },
    ];

    try {
      await this.send(
        'orderStatusUpdate',
        `Your Order #${this.order._id} has been updated`,
        attachments
      );
    } finally {
      // Clean up the temporary PDF file
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

module.exports = { Email };
