import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type {
  ContentBlock,
  TemplateSettings,
} from "../template-types"

/* =========================================================
   TEMPLATE PDF DOCUMENT
   ---------------------------------------------------------
   Mirrors reports/pdf/report-document.tsx — same library
   (@react-pdf/renderer), same lazy-import usage pattern from
   the calling component. This keeps the project on a single
   PDF system instead of introducing a second one.

   Blocks passed in here must already be FULLY RESOLVED
   (no `{{ }}` tokens left) — resolution happens once, in the
   Use Template screen, and the same resolved blocks feed
   both the on-screen preview and this PDF.
========================================================= */

type TemplatePdfDocumentProps = {
  title: string
  blocks: ContentBlock[]
  settings: TemplateSettings
}

const mm = (value: number) => `${value}mm`

function buildStyles(settings: TemplateSettings) {
  return StyleSheet.create({
    page: {
      paddingTop: mm(settings.margins.top),
      paddingBottom: mm(settings.margins.bottom),
      paddingLeft: mm(settings.margins.left),
      paddingRight: mm(settings.margins.right),
      fontSize: 10,
      lineHeight: 1.5,
    },

    heading: {
      fontSize: 12,
      fontWeight: 700,
      marginTop: 10,
      marginBottom: 4,
      textTransform: "uppercase",
    },

    paragraph: {
      marginBottom: 6,
    },

    fieldRow: {
      flexDirection: "row",
      marginBottom: 3,
    },

    fieldLabel: {
      width: 140,
      color: "#52525b",
    },

    fieldValue: {
      fontWeight: 700,
      flex: 1,
    },

    table: {
      width: "100%",
      marginVertical: 6,
    },

    tableRow: {
      flexDirection: "row",
    },

    tableCell: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#d4d4d8",
      padding: 5,
    },

    signatureBlock: {
      marginTop: 24,
    },

    signatureLine: {
      marginBottom: 14,
    },

    spacer: {
      width: "100%",
    },
  })
}

export function TemplatePdfDocument({
  title,
  blocks,
  settings,
}: TemplatePdfDocumentProps) {
  const styles = buildStyles(settings)

  return (
    <Document title={title}>
      <Page
        size={settings.paperSize === "Letter" ? "LETTER" : "A4"}
        orientation={settings.orientation}
        style={styles.page}
      >
        {blocks.map((block) => {
          switch (block.type) {
            case "heading":
              return (
                <Text key={block.id} style={styles.heading}>
                  {block.text}
                </Text>
              )

            case "paragraph":
              return (
                <Text key={block.id} style={styles.paragraph}>
                  {block.text}
                </Text>
              )

            case "field-row":
              return (
                <View key={block.id} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{block.label}:</Text>
                  <Text style={styles.fieldValue}>{block.token}</Text>
                </View>
              )

            case "table":
              return (
                <View key={block.id} style={styles.table}>
                  {block.rows.map((row, rowIndex) => (
                    <View
                      key={`${block.id}-${rowIndex}`}
                      style={styles.tableRow}
                    >
                      {row.map((cell, cellIndex) => (
                        <Text
                          key={`${block.id}-${rowIndex}-${cellIndex}`}
                          style={styles.tableCell}
                        >
                          {cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )

            case "signature":
              return (
                <View key={block.id} style={styles.signatureBlock}>
                  {block.lines.map((line, index) => (
                    <Text
                      key={`${block.id}-${index}`}
                      style={styles.signatureLine}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )

            case "spacer":
              return (
                <View
                  key={block.id}
                  style={[styles.spacer, { height: block.height ?? 12 }]}
                />
              )

            default:
              return null
          }
        })}
      </Page>
    </Document>
  )
}
