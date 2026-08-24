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
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 9,
  },

  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
  },

  title: {
    fontSize: 18,
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 9,
    color: "#71717a",
  },

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingVertical: 7,
    paddingHorizontal: 5,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingVertical: 7,
    paddingHorizontal: 5,
  },

  cell: {
    flex: 1,
    fontSize: 8,
  },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#71717a",
    textAlign: "center",
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
    row[
      column as keyof ReportRow
    ] ?? "—"
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
        {/* Report Header */}

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
          {/* Table Header */}

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
              wrap
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
          fixed
          render={({
            pageNumber,
            totalPages,
          }) =>
            `OverseasErp • Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}