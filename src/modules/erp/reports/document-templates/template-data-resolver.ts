import type {
  ContentBlock,
  FieldValueMap,
  TemplateDataContext,
} from "./template-types"

/* =========================================================
   TEMPLATE DATA RESOLVER
   ---------------------------------------------------------
   Turns `{{source.key}}` placeholders inside template
   content into real values, given a TemplateDataContext.

   This file has ZERO knowledge of Supabase, candidates,
   companies, etc. — it only knows how to look values up in
   plain string maps. Building those maps from real records
   happens in template-service.ts, keeping this module pure
   and easy to unit test.
========================================================= */

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}\}/g

export function extractTokens(text: string): string[] {
  const tokens = new Set<string>()

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    tokens.add(`${match[1]}.${match[2]}`)
  }

  return Array.from(tokens)
}

export function resolveToken(
  token: string,
  context: TemplateDataContext,
): string {
  const [source, key] = token.split(".")

  const map: FieldValueMap | null | undefined = (
    {
      candidate: context.candidate,
      company: context.company,
      agent: context.agent,
      contract: context.contract,
      system: context.system,
    } as Record<string, FieldValueMap | null | undefined>
  )[source]

  const value = map?.[key]

  return value && value.trim().length > 0 ? value : ""
}

/**
 * Replaces every `{{source.key}}` occurrence in `text` with its
 * resolved value. Unresolved/empty values fall back to an
 * em-dash so a generated document never leaks raw `{{ }}`
 * syntax to the end user.
 */
export function resolveText(
  text: string,
  context: TemplateDataContext,
): string {
  return text.replace(TOKEN_PATTERN, (_match, source: string, key: string) => {
    const resolved = resolveToken(`${source}.${key}`, context)

    return resolved.length > 0 ? resolved : "—"
  })
}

/**
 * Resolves an entire block list. Table rows / signature lines
 * / field-row tokens are all resolved the same way as
 * paragraph text.
 */
export function resolveBlocks(
  blocks: ContentBlock[],
  context: TemplateDataContext,
): ContentBlock[] {
  return blocks.map((block) => {
    switch (block.type) {
      case "heading":
      case "paragraph":
        return { ...block, text: resolveText(block.text, context) }

      case "field-row":
        return {
          ...block,
          token: resolveToken(
            block.token.replace(/\{\{|\}\}/g, "").trim(),
            context,
          ) || "—",
        }

      case "table":
        return {
          ...block,
          rows: block.rows.map((row) =>
            row.map((cell) => resolveText(cell, context)),
          ),
        }

      case "signature":
        return {
          ...block,
          lines: block.lines.map((line) => resolveText(line, context)),
        }

      case "spacer":
      default:
        return block
    }
  })
}

/**
 * Builds the system.* field map. Kept separate so the
 * generation flow can call this once and reuse the same
 * generated_date/document_number across preview + PDF + the
 * saved generated_documents row.
 */
export function buildSystemFields(documentNumber: string): FieldValueMap {
  const now = new Date()
  const formatted = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return {
    current_date: formatted,
    generated_date: formatted,
    document_number: documentNumber,
  }
}

export function generateDocumentNumber(templateCategory: string): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  const prefix = templateCategory.slice(0, 3).toUpperCase()

  return `DOC-${prefix}-${stamp}-${random}`
}
