// @ts-check

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const rewriteEipMarkdownLinks = () => {
	/**
	 * @param {any} node
	 */
	const visit = (node) => {
		if (!node || typeof node !== "object") return;
		if (node.type === "link" && typeof node.url === "string") {
			const match = node.url.match(
				/(?:^\.\/eip-|^\.\.\/EIPS\/eip-|^https?:\/\/eips\.ethereum\.org\/EIPS\/eip-)(\d+)(?:\.md)?$/,
			);
			if (match) {
				node.url = `/eips/${match[1]}`;
			}
		}
		if (node.type === "image" && typeof node.url === "string") {
			const match = node.url.match(/^\.\.\/assets\/(.+)$/);
			if (match) {
				node.url = `https://raw.githubusercontent.com/ethereum/EIPs/master/assets/${match[1]}`;
			}
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) visit(child);
		}
	};
	/**
	 * @param {any} tree
	 */
	return (tree) => visit(tree);
};

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false,
	},
	prefetch: {
		defaultStrategy: "hover",
		prefetchAll: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [react()],
	markdown: {
		syntaxHighlight: false,
		remarkPlugins: [rewriteEipMarkdownLinks],
	},
});
