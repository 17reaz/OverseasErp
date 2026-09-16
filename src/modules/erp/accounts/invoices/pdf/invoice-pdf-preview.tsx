import { useEffect, useState } from "react";
import {
  PDFViewer,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { InvoiceDocument } from "./invoice-document";
import type {
  Invoice,
  InvoiceAgent,
} from "../invoice-types";

interface InvoicePdfPreviewProps {
  invoice: Invoice;
  agent?: InvoiceAgent | null;
}

export function InvoicePdfPreview({
  invoice,
  agent,
}: InvoicePdfPreviewProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);

    const timer = window.setTimeout(() => {
      setReady(true);
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [invoice.id]);

  if (!ready) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing invoice preview...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-end">
        <PDFDownloadLink
          document={
            <InvoiceDocument
              invoice={invoice}
              agent={agent}
            />
          }
          fileName={`${invoice.invoiceNo}.pdf`}
        >
          {({ loading }) => (
            <Button
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/30">
        <PDFViewer
          width="100%"
          height="100%"
          showToolbar={false}
        >
          <InvoiceDocument
            invoice={invoice}
            agent={agent}
          />
        </PDFViewer>
      </div>
    </div>
  );
}