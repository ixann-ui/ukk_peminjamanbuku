/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure Next uses the intended workspace root when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
