import type { Rule } from "eslint";

type BoundariesPlugin = {
  meta: { name: string; version: string };
  rules: Record<string, Rule.RuleModule>;
};

declare const plugin: BoundariesPlugin;
export default plugin;
