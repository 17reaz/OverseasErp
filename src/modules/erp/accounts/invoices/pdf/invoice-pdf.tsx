import { pdf } from "@react-pdf/renderer";

import { InvoiceDocument } from "./invoice-document";
import type {
  Invoice,
  InvoiceAgent,
} from "../invoice-types";

export async function generateInvoicePdf(
  invoice: Invoice,
  agent?: InvoiceAgent | null,
): Promise<Blob> {
  const document = (
    <InvoiceDocument
      invoice={invoice}
      agent={agent}
    />
  );

  return pdf(document).toBlob();
}

export async function downloadInvoicePdf(
  invoice: Invoice,
  agent?: InvoiceAgent | null,
): Promise<void> {
  const blob = await generateInvoicePdf(
    invoice,
    agent,
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `${invoice.invoiceNo}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}