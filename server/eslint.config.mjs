// eslint.config.mjs
import { eslintTypescript } from "eslint-config-tchoupinax";

export default [
  ...eslintTypescript,
  {
    ignores: ["prisma/generated/**"],
  },
];
