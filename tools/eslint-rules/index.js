import noDirectDbInApiRoute from "./no-direct-db-in-api-route.js";
import noLibToFeatures from "./no-lib-to-features.js";
import noServerDbInClient from "./no-server-db-in-client.js";

/**
 * Plugin ESLint lokal: menegakkan aturan dependensi IDEA.md §5 dan pemisahan
 * server/client §8.5. Diuji di tests/unit/eslint-rules.test.ts.
 */
const plugin = {
  meta: {
    name: "damez-boundaries",
    version: "2.0.0",
  },
  rules: {
    "no-lib-to-features": noLibToFeatures,
    "no-server-db-in-client": noServerDbInClient,
    "no-direct-db-in-api-route": noDirectDbInApiRoute,
  },
};

export default plugin;
