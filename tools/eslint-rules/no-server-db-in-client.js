import { hasUseClientDirective, isInsideRepoPath, isServerOnlyModule } from "./scope.js";

const SERVER_ONLY_MODULES = ["@/lib/db/server", "@/lib/db/server.ts"];

function isServerSideOnly(source) {
  return (
    isServerOnlyModule(source) ||
    SERVER_ONLY_MODULES.some((module) => source === module || source.startsWith(`${module}/`))
  );
}

/**
 * Bounds keamanan §8.5: berkas klien tidak boleh menyentuh apa pun yang membawa
 * service role. Satu salah impor dan seluruh akses database tanpa batas ikut
 * terkirim ke browser (inilah cacat v1 di lib/supabase/client.ts).
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Larangan impor lib/db/server dan `server-only` dari komponen klien atau berkas 'use client'",
    },
    schema: [],
    messages: {
      serverDbInClient:
        "'{{source}}' hanya untuk server. Berkas ini berjalan di browser (direktif 'use client' atau berada di src/components/*); pakai src/lib/db/browser.ts atau pindahkan akses data ke server.",
    },
  },

  create(context) {
    const isComponentPath = isInsideRepoPath(context.filename, "/src/components/");

    return {
      Program(node) {
        const isClientFile = isComponentPath || hasUseClientDirective(node);
        if (!isClientFile) {
          return;
        }

        for (const statement of node.body) {
          if (statement.type !== "ImportDeclaration") {
            continue;
          }

          const source = statement.source.value;
          if (typeof source !== "string" || !isServerSideOnly(source)) {
            continue;
          }

          context.report({
            node: statement,
            messageId: "serverDbInClient",
            data: { source },
          });
        }
      },
    };
  },
};

export default rule;
