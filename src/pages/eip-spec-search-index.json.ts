import type { APIRoute } from "astro";
import { buildProposalSpecSearchIndex } from "@/domain/proposals/spec-search";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(buildProposalSpecSearchIndex()), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
