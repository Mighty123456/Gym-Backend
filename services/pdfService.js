const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

const generateReceipt = async (user) => {
  try {
    const doc = new PDFDocument();
    
    // Ensure receipts directory exists
    const receiptDir = path.join(__dirname, '../public/receipts');
    await fs.ensureDir(receiptDir);
    
    // Create unique filename
    const fileName = `receipt-${user._id}-${Date.now()}.pdf`;
    const filePath = path.join(receiptDir, fileName);
    
    // Create write stream
    const writeStream = fs.createWriteStream(filePath);
    
    // Pipe the PDF document to the write stream
    doc.pipe(writeStream);

    // Add content to PDF
    doc
      .fontSize(20)
      .text('StarGym Membership Receipt', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Receipt Date: ${new Date().toLocaleDateString()}`)
      .text(`Member Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .text(`Plan: ${user.plan}`)
      .text(`Start Date: ${new Date(user.startDate).toLocaleDateString()}`)
      .text(`End Date: ${new Date(user.endDate).toLocaleDateString()}`)
      .text(`Payment Method: ${user.paymentMethod}`)
      .text(`Payment Status: Confirmed`)
      .moveDown();

    // Add amount based on plan
    const planPrices = {
      '1month': '₹1,500',
      '2month': '₹2,500',
      '3month': '₹3,500',
      '6month': '₹5,000',
      'yearly': '₹8,000'
    };
    doc.text(`Amount Paid: ${planPrices[user.plan] || 'N/A'}`);

    // Add footer
    doc
      .moveDown(2)
      .fontSize(10)
      .text('Thank you for choosing StarGym!', { align: 'center' })
      .text('This is a computer-generated receipt. No signature required.', { align: 'center' });

    // Finalize the PDF
    doc.end();

    // Wait for the write stream to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Verify the file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create receipt file');
    }

    // Return the relative path to the PDF
    return `/receipts/${fileName}`;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }
};

module.exports = { generateReceipt }; 