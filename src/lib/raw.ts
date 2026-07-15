export function raw(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined && values[i] !== null ? String(values[i]) : ""), "");
}