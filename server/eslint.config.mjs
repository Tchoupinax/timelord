// eslint.config.mjs
import { eslintTypescript } from "eslint-config-tchoupinax";

export default [
  ...eslintTypescript,
  {
    ignores: [
      "prisma/generated/**",
    ],
  },
  {
    rules: {
      "@stylistic/operator-linebreak": [
        "error",
        "after",
        { overrides: { "+=": "before", "|": "before", "?": "before", ":": "before" } },
      ],
    },
  },
];
