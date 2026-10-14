// .yaml files are imported as text (Wrangler "Text" rule, and the Vitest plugin in vitest.config.ts).
declare module "*.yaml" {
  const text: string;
  export default text;
}
