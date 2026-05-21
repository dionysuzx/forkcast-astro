import type { APIRoute } from "astro";
import { buildProposalSearchIndex } from "@/domain/proposals/search";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(buildProposalSearchIndex()), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
