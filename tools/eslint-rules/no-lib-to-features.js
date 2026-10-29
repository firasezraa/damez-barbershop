import { isInsideRepoPath } from "./scope.js";

/**
 * Lapisan `lib/*` adalah fondasi: ia tidak boleh tahu apa pun tentang
 * `features/*`. Tanpa aturan ini, engine slot bisa menggantung pada komponen
 * UI dan impor jadi melingkar.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Larangan impor @/features/* dari dalam src/lib/* (aturan dependensi IDEA.md §5)",
    },
    schema: [],
    messages: {
      libImportsFeatures:
        "src/lib/* tidak boleh mengimpor '{{source}}'. Arah dependensi hanya features/* -> lib/*; pindahkan logika bersama ke src/lib/*.",
    },
  },

  create(context) {
    if (!isInsideRepoPath(context.filename, "/src/lib/")) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || !source.startsWith("@/features/")) {
          return;
        }

        context.report({
          node,
          messageId: "libImportsFeatures",
          data: { source },
        });
      },
    };
  },
};

export default rule;
