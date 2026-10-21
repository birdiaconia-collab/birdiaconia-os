let eslintConfig;

try {
  const { FlatCompat } = await import("@eslint/eslintrc");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const compat = new FlatCompat({ baseDirectory: __dirname });

  eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
      ignores: [".next/**", "out/**", "build/**", ".testbuild/**", "next-env.d.ts"],
    },
  ];
} catch {
  eslintConfig = [
    {
      ignores: [".next/**", "out/**", "build/**", ".testbuild/**", "next-env.d.ts", "**/*.ts", "**/*.tsx"],
    },
    {
      files: ["**/*.{js,jsx,mjs}"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  ];
}

export default eslintConfig;
