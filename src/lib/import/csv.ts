export function parseCsv(text: string): string[][] {
  if (!text) return [];

  const input = text.replace(/\r\n/g, "\n");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let fieldQuoted = false;
  let inQuotes = false;
  let justClosedQuote = false;
  let rowHasComma = false;
  let rowHasQuotedField = false;

  const pushField = () => {
    row.push(fieldQuoted ? field : field.trim());
    field = "";
    fieldQuoted = false;
    justClosedQuote = false;
  };

  const pushRow = () => {
    if (row.length === 0) return;

    const isWhitespaceOnlyLine =
      row.length === 1 && row[0] === "" && !rowHasComma && !rowHasQuotedField;

    if (!isWhitespaceOnlyLine) {
      rows.push(row);
    }

    row = [];
    rowHasComma = false;
    rowHasQuotedField = false;
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
        justClosedQuote = true;
      } else {
        field += char;
      }
      continue;
    }

    if (justClosedQuote) {
      if (char === ",") {
        pushField();
        rowHasComma = true;
      } else if (char === "\n") {
        pushField();
        pushRow();
      } else if (char === " " || char === "\t" || char === "\r") {
        continue;
      } else {
        justClosedQuote = false;
        field += char;
      }
      continue;
    }

    if (char === ",") {
      pushField();
      rowHasComma = true;
      continue;
    }

    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }

    if (char === '"' && field.trim() === "") {
      field = "";
      inQuotes = true;
      fieldQuoted = true;
      rowHasQuotedField = true;
      continue;
    }

    field += char;
  }

  pushField();
  pushRow();

  return rows;
}
