// Lets TypeScript understand side-effect style imports like:
//   import "./globals.css";
// Next.js handles .css at build time; this file only silences the editor error
// "Cannot find module './globals.css' or its corresponding type declarations."
declare module "*.css";
