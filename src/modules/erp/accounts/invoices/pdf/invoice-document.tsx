import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { Invoice, InvoiceAgent } from "../invoice-types";

interface InvoiceDocumentProps {
  invoice: Invoice;
  agent?: InvoiceAgent | null;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  companySection: {
    width: "55%",
  },

  companyName: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 5,
  },

  companySubtitle: {
    fontSize: 9,
    color: "#666666",
  },

  invoiceSection: {
    width: "40%",
    alignItems: "flex-end",
  },

  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },

  invoiceNumber: {
    fontSize: 10,
    color: "#555555",
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#D9D9D9",
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  infoColumn: {
    width: "48%",
  },

  infoLabel: {
    fontSize: 8,
    color: "#777777",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: 10,
    fontWeight: 700,
  },

  infoSecondary: {
    fontSize: 9,
    color: "#555555",
    marginTop: 3,
  },

  table: {
    width: "100%",
    marginBottom: 20,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9D9D9",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },

  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#444444",
    textTransform: "uppercase",
  },

  descriptionColumn: {
    width: "55%",
  },

  amountColumn: {
    width: "45%",
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
  },

  tableText: {
    fontSize: 9,
  },

  summaryWrapper: {
    width: "100%",
    alignItems: "flex-end",
  },

  summary: {
    width: "45%",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  summaryLabel: {
    fontSize: 9,
    color: "#555555",
  },

  summaryValue: {
    fontSize: 9,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222222",
    paddingTop: 9,
    marginTop: 4,
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },

  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },

  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  paidLabel: {
    fontSize: 9,
    color: "#555555",
  },

  paidValue: {
    fontSize: 9,
    fontWeight: 700,
  },

  balanceBox: {
    marginTop: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 4,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  balanceLabel: {
    fontSize: 10,
    fontWeight: 700,
  },

  balanceValue: {
    fontSize: 10,
    fontWeight: 700,
  },

  status: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  statusLabel: {
    fontSize: 8,
    color: "#777777",
    marginRight: 7,
    textTransform: "uppercase",
  },

  statusValue: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  notesSection: {
    marginTop: 30,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  notesTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 5,
  },

  notesText: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.4,
  },

  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 7,
  },

  footerText: {
    fontSize: 7,
    color: "#888888",
  },
});

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatStatus(status: Invoice["status"]) {
  switch (status) {
    case "draft":
      return "Draft";

    case "sent":
      return "Sent";

    case "paid":
      return "Paid";

    case "overdue":
      return "Overdue";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

export function InvoiceDocument({
  invoice,
  agent,
}: InvoiceDocumentProps) {
  const outstandingAmount = Math.max(
    invoice.totalAmount - invoice.paidAmount,
    0,
  );

  return (
    <Document
      title={`Invoice ${invoice.invoiceNo}`}
      author="OverseasErp"
      subject={`Invoice ${invoice.invoiceNo}`}
    >
      <Page
        size="A4"
        style={styles.page}
      >
        {/* =================================================
         * HEADER
         * ================================================= */}

        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>
              OverseasErp
            </Text>

            <Text style={styles.companySubtitle}>
              Accounting &amp; Invoice Management
            </Text>
          </View>

          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceTitle}>
              INVOICE
            </Text>

            <Text style={styles.invoiceNumber}>
              {invoice.invoiceNo}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* =================================================
         * CUSTOMER / INVOICE INFO
         * ================================================= */}

        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>
              Bill To
            </Text>

            <Text style={styles.infoValue}>
              {invoice.customerName}
            </Text>

            {agent && (
              <Text style={styles.infoSecondary}>
                Agent: {agent.name}
                {agent.code
                  ? ` (${agent.code})`
                  : ""}
              </Text>
            )}
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>
              Invoice Date
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(invoice.issueDate)}
            </Text>

            {invoice.dueDate && (
              <>
                <Text
                  style={[
                    styles.infoLabel,
                    { marginTop: 10 },
                  ]}
                >
                  Due Date
                </Text>

                <Text style={styles.infoValue}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* =================================================
         * AMOUNT TABLE
         * ================================================= */}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.descriptionColumn}>
              <Text style={styles.tableHeaderText}>
                Description
              </Text>
            </View>

            <View style={styles.amountColumn}>
              <Text style={styles.tableHeaderText}>
                Amount
              </Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.descriptionColumn}>
              <Text style={styles.tableText}>
                Invoice Subtotal
              </Text>
            </View>

            <View style={styles.amountColumn}>
              <Text style={styles.tableText}>
                BDT {formatAmount(invoice.subtotal)}
              </Text>
            </View>
          </View>

          {invoice.discount > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.descriptionColumn}>
                <Text style={styles.tableText}>
                  Discount
                </Text>
              </View>

              <View style={styles.amountColumn}>
                <Text style={styles.tableText}>
                  - BDT{" "}
                  {formatAmount(invoice.discount)}
                </Text>
              </View>
            </View>
          )}

          {invoice.tax > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.descriptionColumn}>
                <Text style={styles.tableText}>
                  Tax
                </Text>
              </View>

              <View style={styles.amountColumn}>
                <Text style={styles.tableText}>
                  BDT {formatAmount(invoice.tax)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* =================================================
         * SUMMARY
         * ================================================= */}

        <View style={styles.summaryWrapper}>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal
              </Text>

              <Text style={styles.summaryValue}>
                BDT {formatAmount(invoice.subtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Discount
              </Text>

              <Text style={styles.summaryValue}>
                - BDT{" "}
                {formatAmount(invoice.discount)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tax
              </Text>

              <Text style={styles.summaryValue}>
                BDT {formatAmount(invoice.tax)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                BDT{" "}
                {formatAmount(invoice.totalAmount)}
              </Text>
            </View>

            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>
                Paid
              </Text>

              <Text style={styles.paidValue}>
                BDT{" "}
                {formatAmount(invoice.paidAmount)}
              </Text>
            </View>

            <View style={styles.balanceBox}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>
                  Balance Due
                </Text>

                <Text style={styles.balanceValue}>
                  BDT{" "}
                  {formatAmount(
                    outstandingAmount,
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
         * STATUS
         * ================================================= */}

        <View style={styles.status}>
          <Text style={styles.statusLabel}>
            Status
          </Text>

          <Text style={styles.statusValue}>
            {formatStatus(invoice.status)}
          </Text>
        </View>

        {/* =================================================
         * NOTES
         * ================================================= */}

        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>
              Notes
            </Text>

            <Text style={styles.notesText}>
              {invoice.notes}
            </Text>
          </View>
        )}

        {/* =================================================
         * FOOTER
         * ================================================= */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by OverseasErp
          </Text>

          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}