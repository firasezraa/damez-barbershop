const FORBIDDEN_SOURCES = ["@/lib/db/pg", "@/lib/db/server", "pg"];
const API_ROUTE_PATTERN = /\/src\/app\/api\/.*route\.tsx?$/;

function isApiRouteFile(filename) {
  return API_ROUTE_PATTERN.test(filename.split("\\").join("/"));
}

function isForbidden(source) {
  return FORBIDDEN_SOURCES.some(
    (forbidden) => source === forbidden || source === `${forbidden}.ts` || source.startsWith(`${forbidden}/`),
  );
}

/**
 * Route handler adalah lapisan transport, bukan lapisan data (IDEA.md §5).
 * Query langsung di dalam route membuat harga, filter, dan otorisasi tersebar
 * di puluhan endpoint — persis penyebab cacat v1. Semua akses data lewat
 * features/*\/queries.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Larangan query database langsung dari src/app/api/**/route.ts; akses wajib lewat features/*/queries",
    },
    schema: [],
    messages: {
      directDbInApiRoute:
        "Route handler tidak boleh mengimpor '{{source}}'. Pindahkan query ke src/features/<domain>/queries.ts lalu panggil dari route.",
    },
  },

  create(context) {
    if (!isApiRouteFile(context.filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || !isForbidden(source)) {
          return;
        }

        context.report({
          node,
          messageId: "directDbInApiRoute",
          data: { source },
        });
      },
    };
  },
};

export default rule;
