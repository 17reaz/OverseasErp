import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type {
  ReportConfig,
  ReportRow,
} from "../report-types"

type ReportDocumentProps = {
  config: ReportConfig
  rows: ReportRow[]
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
  },

  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 9,
  },

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 6,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 6,
  },

  cell: {
    flex: 1,
    fontSize: 8,
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 8,
  },
})

const labels: Record<
  string,
  string
> = {
  sl: "SL",
  name: "Candidate",
  candidate: "Candidate",
  passport_no: "Passport",
  country: "Country",
  agent: "Agent",
  stage: "Stage",
  status: "Status",
  received_date: "Received Date",
  medical_date: "Medical Date",
  fit_date: "Fit Date",
  mofa_date: "MOFA Date",
  visa_date: "Visa Date",
  flight_date: "Flight Date",
  airline: "Airline",
}

function getValue(
  row: ReportRow,
  column: string,
) {
  if (
    column === "candidate"
  ) {
    return row.name ?? "—"
  }

  return (
    row[column as keyof ReportRow] ??
    "—"
  )
}

export function ReportDocument({
  config,
  rows,
}: ReportDocumentProps) {
  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.title}>
            {config.name ||
              "Untitled Report"}
          </Text>

          <Text style={styles.subtitle}>
            {config.dateFrom &&
            config.dateTo
              ? `${config.dateFrom} → ${config.dateTo}`
              : "All dates"}
          </Text>
        </View>

        {/* Table */}

        <View style={styles.table}>
          {/* Header */}

          <View
            style={styles.tableHeader}
            fixed
          >
            {config.columns.map(
              (column) => (
                <Text
                  key={column}
                  style={styles.cell}
                >
                  {labels[column] ??
                    column}
                </Text>
              ),
            )}
          </View>

          {/* Rows */}

          {rows.map((row) => (
            <View
              key={row.id}
              style={styles.row}
            >
              {config.columns.map(
                (column) => (
                  <Text
                    key={column}
                    style={styles.cell}
                  >
                    {String(
                      getValue(
                        row,
                        column,
                      ),
                    )}
                  </Text>
                ),
              )}
            </View>
          ))}
        </View>

        {/* Footer */}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `OverseasErp • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}