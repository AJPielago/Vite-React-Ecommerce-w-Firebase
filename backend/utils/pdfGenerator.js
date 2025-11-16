const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

const generateReceipt = async (order, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ margin: 50 });

      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create a write stream
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Header
      doc
        .fontSize(20)
        .text(process.env.APP_NAME || 'E-Commerce Store', {
          align: 'center',
          underline: true
        })
        .moveDown(0.5);

      // Order info
      doc
        .fontSize(12)
        .text('ORDER RECEIPT', { align: 'center', underline: true })
        .moveDown(0.5);

      // Order details
      doc
        .fontSize(10)
        .text(`Order #${order._id}`, { align: 'center' })
        .text(`Date: ${format(new Date(order.createdAt), 'PPpp')}`, { align: 'center' })
        .text(`Status: ${order.status.toUpperCase()}`, { align: 'center' })
        .moveDown(1);

      // Customer info
      doc
        .fontSize(10)
        .text('BILLING INFORMATION', { underline: true })
        .text(order.user?.name || 'Guest')
        .text(order.user?.email || '')
        .text(order.shippingAddress?.address || '')
        .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}`)
        .text(order.shippingAddress?.country || '')
        .moveDown(1);

      // Order items table header
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 120;
      const quantityX = 350;
      const priceX = 400;
      const totalX = 480;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Item', itemCodeX, tableTop, { width: 200 })
        .text('Qty', quantityX, tableTop, { width: 50, align: 'right' })
        .text('Price', priceX, tableTop, { width: 80, align: 'right' })
        .text('Total', totalX, tableTop, { width: 80, align: 'right' })
        .moveTo(50, doc.y + 5)
        .lineTo(550, doc.y)
        .stroke();

      // Table rows
      let y = tableTop + 25;
      doc.font('Helvetica');
      
      order.orderItems.forEach((item, i) => {
        doc
          .fontSize(10)
          .text(item.name, itemCodeX, y, { width: 200, lineGap: 5 })
          .text(item.qty.toString(), quantityX, y, { width: 50, align: 'right' })
          .text(`$${item.price.toFixed(2)}`, priceX, y, { width: 80, align: 'right' })
          .text(`$${(item.price * item.qty).toFixed(2)}`, totalX, y, { width: 80, align: 'right' });
        
        y += 20;
        
        // Add a line after each item except the last one
        if (i < order.orderItems.length - 1) {
          doc
            .moveTo(50, y - 5)
            .lineTo(550, y - 5)
            .stroke();
        }
      });

      // Order summary
      const summaryY = y + 20;
      
      doc
        .moveTo(350, summaryY - 10)
        .lineTo(550, summaryY - 10)
        .stroke();

      doc
        .fontSize(10)
        .text('Subtotal:', 350, summaryY, { width: 130, align: 'right' })
        .text(`$${order.itemsPrice?.toFixed(2) || '0.00'}`, 480, summaryY, { width: 70, align: 'right' });

      if (order.taxPrice > 0) {
        doc
          .text('Tax:', 350, summaryY + 20, { width: 130, align: 'right' })
          .text(`$${order.taxPrice?.toFixed(2) || '0.00'}`, 480, summaryY + 20, { width: 70, align: 'right' });
      }

      if (order.shippingPrice > 0) {
        doc
          .text('Shipping:', 350, summaryY + 40, { width: 130, align: 'right' })
          .text(`$${order.shippingPrice?.toFixed(2) || '0.00'}`, 480, summaryY + 40, { width: 70, align: 'right' });
      }

      doc
        .font('Helvetica-Bold')
        .text('Total:', 350, summaryY + 70, { width: 130, align: 'right' })
        .text(`$${order.totalPrice?.toFixed(2) || '0.00'}`, 480, summaryY + 70, { width: 70, align: 'right' });

      // Footer
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(
          'Thank you for your order! If you have any questions, please contact our support team.',
          50,
          750,
          { align: 'center', width: 500 }
        );

      // Finalize the PDF and end the stream
      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReceipt };
