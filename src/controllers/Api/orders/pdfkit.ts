
import PDFDocument = require("pdfkit");
import axios from "axios";
import getStream = require("get-stream");

async function fetchImage(src) {
  const image = await axios.get(src, {
    responseType: "arraybuffer",
  });
  //   console.log(image)
  return image.data;
}

export async function createInvoice(invoice) {
  let doc = new PDFDocument({ size: "A4", margin: 50 }) as any;

  doc.registerFont("Roboto", __dirname + "/Roboto-Regular.ttf");
  await generateHeader(doc, invoice);
  await generateCustomerInformation(doc, invoice);
  await generateInvoiceTable(doc, invoice);
  await generateFooter(doc);

  doc.end();
  const pdfStream = await getStream.buffer(doc);

  return pdfStream;
}

async function generateHeader(doc, invoice) {
  
  let x = 50
  console.log(invoice?.logo)
  if(invoice?.logo)
 {
  const logo = await fetchImage(invoice?.logo);
   await doc.image(logo, 50, 45, { width: 50 });
   x = x+60
 }

  await doc
    .fillColor("#444444")
    .fontSize(20)
    .text(invoice?.storeAddress?.name, x, 57)
    .fontSize(10)
    .text(invoice?.storeAddress?.address, 200, 65, {
      align: "right",
    })
    .text(invoice?.storeAddress?.addressLine2, 200, 80, {
      align: "right",
    })
    .text(
      (invoice?.storeAddress?.city || " ") +
        `${invoice?.storeAddress?.city ? ", " : ""}` +
        (invoice?.storeAddress?.postal_code || ""),
      200,
      95,
      {
        align: "right",
      }
    )
    .text(
      (invoice?.storeAddress?.state || " "),
      200,
      110,
      {
        align: "right",
      }
    )
    .moveDown();
}

async function generateCustomerInformation(doc, invoice) {
  await doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 140);

  await generateHr(doc, 165);

  const customerInformationTop = 180;

  await doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Total Amount:", 50, customerInformationTop + 30)
    .font("Roboto")
    .text(
      formatCurrency(invoice.subtotal - invoice.paid),
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.shipping?.name || "", 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.shipping?.mobile || "", 300, customerInformationTop + 15)

    if (invoice.shipping.address)
    {
        await doc
          .text(invoice.shipping.address, 300, customerInformationTop + 30)
          .text(
            invoice?.shipping?.addressLine2,
            300,
            customerInformationTop + 45
          )
          .text(
            (invoice.shipping.city || " ") +
              `${invoice.shipping.city ? ", " : ""}` +
              (invoice.shipping.postal_code || ""),
            300,
            customerInformationTop + 60
          )
          .text(invoice.shipping.state || " ", 300, customerInformationTop + 75)
          .moveDown();

          await generateHr(doc, customerInformationTop + 90);
    }
    else await generateHr(doc, customerInformationTop + 50);

  
}

async function generateInvoiceTable(doc, invoice) {
  let i;
  let invoiceTableTop = 330;

  if (!invoice.shipping.address){
       invoiceTableTop = 270;
  } 
  await doc.font("Helvetica-Bold");
  await generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  await generateHr(doc, invoiceTableTop + 20);
  await doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    await generateTableRow(
      doc,
      position,
      item.item,
      item.description,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    await generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  await generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  await generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "",
    "",
    ""
  );

  const duePosition = paidToDatePosition + 25;
  await doc.font("Helvetica-Bold");
  await generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Total Amount",
    "",
    formatCurrency(invoice.subtotal - invoice.paid)
  );
  await doc.font("Helvetica");
}

async function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "This is a computer generated invoice.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

async function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  await doc
    .font("Roboto")
    .fontSize(10)
    .text(item, 50, y)
    
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" })
    .font("Helvetica");
}

async function generateHr(doc, y) {
  await doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "\u20B9" + (parseFloat(cents)).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}
