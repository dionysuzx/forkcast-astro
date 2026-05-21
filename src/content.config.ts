import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const eipSpecs = defineCollection({
	loader: glob({
		base: "./src/content/eip-specs",
		pattern: "**/*.md",
		generateId: ({ entry }) => entry.replace(/\.md$/, ""),
	}),
});

export const collections = {
	eipSpecs,
};
