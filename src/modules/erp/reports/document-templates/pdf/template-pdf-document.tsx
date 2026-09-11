import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
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

/* ---------------------------------------------------------
   ARABIC FONT SUPPORT
   ---------------------------------------------------------
   @react-pdf/renderer's built-in fonts (Helvetica, Times,
   Courier) only cover Latin glyphs. Any Arabic text rendered
   with them shows up blank/boxes in the exported PDF (the
   on-screen HTML preview is unaffected — browsers already
   have Arabic fonts installed).

   Font.register() runs once, at module load, and fetches the
   font file from a CDN at PDF-generation time (in the user's
   browser) — no local font file or build step needed.

   containsArabic() below then switches JUST the runs of text
   that actually contain Arabic characters over to this font,
   so Latin/English text keeps using the default Helvetica
   (which renders sharper for Latin glyphs).
--------------------------------------------------------- */

const ARABIC_FONT_FAMILY = "NotoNaskhArabic"

Font.register({
  family: ARABIC_FONT_FAMILY,
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-naskh-arabic@latest/arabic-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-naskh-arabic@latest/arabic-700-normal.ttf",
      fontWeight: 700,
    },
  ],
})

const ARABIC_CHAR_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function containsArabic(text: string): boolean {
  return ARABIC_CHAR_PATTERN.test(text)
}

/**
 * Returns the extra style to spread onto a <Text> element so
 * Arabic runs render with a font that actually has Arabic
 * glyphs, and align right (natural reading direction) instead
 * of inheriting a left-aligned Latin layout.
 */
function arabicTextStyle(text: string) {
  return containsArabic(text)
    ? { fontFamily: ARABIC_FONT_FAMILY, textAlign: "right" as const }
    : {}
}
function alignStyle(align?: "left" | "center" | "right") {
  return { textAlign: align ?? "left" }
}

const justifyContentFor: Record<string, "flex-start" | "center" | "flex-end"> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
}
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
    imageWrap: {
  width: "100%",
  flexDirection: "row",
},

image: {
  objectFit: "contain",
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
                <Text
                  key={block.id}
                  style={[styles.heading, arabicTextStyle(block.text)]}
                >
                  {block.text}
                </Text>
              )

            case "paragraph":
              return (
                <Text
                  key={block.id}
                  style={[styles.paragraph, arabicTextStyle(block.text)]}
                >
                  {block.text}
                </Text>
              )

            case "field-row":
              return (
                <View key={block.id} style={styles.fieldRow}>
                  <Text
                    style={[styles.fieldLabel, arabicTextStyle(block.label)]}
                  >
                    {block.label}:
                  </Text>
                  <Text
                    style={[styles.fieldValue, arabicTextStyle(block.token)]}
                  >
                    {block.token}
                  </Text>
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
                          style={[styles.tableCell, arabicTextStyle(cell)]}
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
                      style={[styles.signatureLine, arabicTextStyle(line)]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )
              case "image":
  return block.src ? (
    <View
      key={block.id}
      style={[
        styles.imageWrap,
        { justifyContent: justifyContentFor[block.align ?? "left"] },
      ]}
    >
      <Image
        src={block.src}
        style={[styles.image, { width: `${block.width ?? 40}%` }]}
      />
    </View>
  ) : null
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