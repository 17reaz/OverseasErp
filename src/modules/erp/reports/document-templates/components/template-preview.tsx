import type { ReactNode } from "react"

import type {
  ContentBlock,
  TemplateSettings,
} from "../template-types"

/* =========================================================
   TEMPLATE PREVIEW
   ---------------------------------------------------------
   Renders a ContentBlock[] as an actual A4-style document —
   NOT a dashboard card. Reused by both:

   - the Template Builder (edit mode, tokens shown as
     highlighted `{{source.key}}` pills)
   - the Use Template screen (usage mode, `resolver` supplied
     so tokens render as real values)

   Passing a `resolver` is what switches between the two
   modes; the block list itself never changes shape.
========================================================= */

type TokenResolver = (token: string) => string

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\s*\}\}/g

function InlineText({
  text,
  resolver,
}: {
  text: string
  resolver?: TokenResolver
}) {
  const parts: ReactNode[] = []

  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  TOKEN_PATTERN.lastIndex = 0

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[1]

    if (resolver) {
      const value = resolver(token)
      parts.push(value && value.length > 0 ? value : "—")
    } else {
      parts.push(
        <span
          key={`tok-${key++}`}
          className="
            rounded
            bg-primary/10
            px-1
            py-0.5
            font-medium
            text-primary
          "
        >
          {`{{${token}}}`}
        </span>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

type TemplatePreviewProps = {
  blocks: ContentBlock[]
  settings?: TemplateSettings
  resolver?: TokenResolver
  className?: string
}

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}
const justifyClass: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
}

export function TemplatePreview({
  blocks,
  resolver,
  className,
}: TemplatePreviewProps) {
  return (
    <div
      className={`
        w-[794px]
        min-w-[794px]
        min-h-[1123px]
        shrink-0
        bg-white
        px-16
        py-14
        text-[13px]
        leading-relaxed
        text-foreground
        ${className ?? ""}
      `}
    >
      {blocks.length === 0 ? (
        <div className="flex h-full min-h-[600px] items-center justify-center text-sm text-muted-foreground">
          This template has no content yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {blocks.map((block) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={block.id}
                    className={`mt-2 text-base font-semibold uppercase tracking-wide ${
                      alignClass[block.align ?? "left"]
                    }`}
                  >
                    <InlineText text={block.text} resolver={resolver} />
                  </h2>
                )

              case "paragraph":
                return (
                  <p
                    key={block.id}
                    className={alignClass[block.align ?? "left"]}
                  >
                    <InlineText text={block.text} resolver={resolver} />
                  </p>
                )

              case "field-row":
                return (
                  <div
                    key={block.id}
                    className="flex gap-2 text-sm"
                  >
                    <span className="w-44 shrink-0 font-medium text-muted-foreground">
                      {block.label}:
                    </span>

                    <span className="font-medium">
                      <InlineText text={block.token} resolver={resolver} />
                    </span>
                  </div>
                )

              case "table":
                return (
                  <table
                    key={block.id}
                    className="w-full border-collapse text-sm"
                  >
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr key={`${block.id}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${block.id}-${rowIndex}-${cellIndex}`}
                              className="border border-zinc-300 px-3 py-2"
                            >
                              <InlineText text={cell} resolver={resolver} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )

              case "signature":
                return (
                  <div
                    key={block.id}
                    className="mt-6 flex flex-col gap-4 text-sm"
                  >
                    {block.lines.map((line, index) => (
                      <div key={`${block.id}-${index}`}>
                        <InlineText text={line} resolver={resolver} />
                      </div>
                    ))}
                  </div>
                )

              case "spacer":
                return (
                  <div
                    key={block.id}
                    style={{ height: block.height ?? 12 }}
                  />
                )
              case "image":
  return (
    <div
      key={block.id}
      className={`flex ${justifyClass[block.align ?? "left"]}`}
    >
      {block.src ? (
        <img
          src={block.src}
          alt=""
          style={{ width: `${block.width ?? 40}%` }}
          className="object-contain"
        />
      ) : (
        <div className="flex h-24 w-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No image uploaded
        </div>
      )}
    </div>
  )

              default:
                return null
            }
          })}
        </div>
      )}
    </div>
  )
}
