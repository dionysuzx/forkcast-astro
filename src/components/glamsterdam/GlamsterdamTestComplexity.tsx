import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronDown,
	ExternalLink,
	Filter,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { layerBadgeClass, stageBadgeClass, stageLabel } from "@/domain/display";
import {
	type ComplexityAnchor,
	type ComplexitySortField,
	type ComplexityTierFilter,
	type SortDirection,
	type SteelComplexityAssessment,
	scoreToneClass,
	sortTestComplexityRows,
	type TestComplexityRow,
	tierBadgeClass,
} from "@/domain/test-complexity/test-complexity";

interface GlamsterdamTestComplexityProps {
	rows: TestComplexityRow[];
	source: string;
	retrievedAt: string;
}

export const GlamsterdamTestComplexity = ({
	rows,
	source,
	retrievedAt,
}: GlamsterdamTestComplexityProps) => {
	const [sortField, setSortField] = useState<ComplexitySortField>("score");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [tierFilter, setTierFilter] = useState<ComplexityTierFilter>("all");
	const [hideExcluded, setHideExcluded] = useState(true);
	const [expandedProposalId, setExpandedProposalId] = useState<number | null>(
		null,
	);
	const [filtersOpen, setFiltersOpen] = useState(false);

	useEffect(() => {
		document.body.style.overflow = filtersOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [filtersOpen]);

	const filteredRows = useMemo(() => {
		let result = rows;

		if (hideExcluded) {
			result = result.filter(
				(row) =>
					row.inclusionStage !== "Declined for Inclusion" &&
					row.inclusionStage !== "Withdrawn" &&
					row.inclusionStage !== "Unknown",
			);
		}

		if (tierFilter === "unassessed") {
			result = result.filter((row) => !row.assessment);
		} else if (tierFilter !== "all") {
			result = result.filter((row) => row.assessment?.tier === tierFilter);
		}

		return result;
	}, [hideExcluded, rows, tierFilter]);

	const sortedRows = useMemo(
		() => sortTestComplexityRows(filteredRows, sortField, sortDirection),
		[filteredRows, sortDirection, sortField],
	);

	const activeFilterCount = tierFilter === "all" ? 0 : 1;

	const clearFilters = () => setTierFilter("all");

	const toggleSort = (field: ComplexitySortField) => {
		if (sortField === field) {
			setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
			return;
		}

		setSortField(field);
		setSortDirection(
			field === "stage" || field === "proposal" ? "asc" : "desc",
		);
	};

	const toggleExpanded = (proposalId: number) => {
		setExpandedProposalId((currentId) =>
			currentId === proposalId ? null : proposalId,
		);
	};

	return (
		<>
			<p className="mb-1 text-slate-500 text-sm dark:text-slate-400">
				Scores based on 24 anchors from{" "}
				<a
					href={source}
					target="_blank"
					rel="noopener noreferrer"
					className="text-purple-600 underline decoration-1 underline-offset-2 transition-colors hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
				>
					STEEL
				</a>
				. Tiers:{" "}
				<span className="text-emerald-600 dark:text-emerald-400">
					Low &lt;10
				</span>
				,{" "}
				<span className="text-amber-600 dark:text-amber-400">Medium 10-19</span>
				, <span className="text-red-600 dark:text-red-400">High &ge;20</span>.
			</p>
			<p className="mb-6 text-slate-500 text-xs dark:text-slate-400">
				Scores reflect testing effort, not implementation complexity. Early
				estimates subject to change.
				<span className="sr-only"> Snapshot captured {retrievedAt}.</span>
			</p>

			<div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
					<button
						type="button"
						onClick={() => setFiltersOpen(true)}
						className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-medium text-sm transition-colors ${
							activeFilterCount > 0
								? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
								: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						}`}
					>
						<Filter className="h-5 w-5" aria-hidden="true" />
						<span className="hidden sm:inline">Filters</span>
						{activeFilterCount > 0 && (
							<span className="rounded-full bg-purple-200 px-1.5 py-0.5 text-purple-800 text-xs dark:bg-purple-800 dark:text-purple-200">
								{activeFilterCount}
							</span>
						)}
					</button>

					<label className="flex cursor-pointer select-none items-center gap-2">
						<input
							type="checkbox"
							checked={hideExcluded}
							onChange={(event) => setHideExcluded(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600"
						/>
						<span className="text-slate-600 text-sm dark:text-slate-300">
							Active only
						</span>
					</label>

					<div className="ml-auto flex items-center gap-4 text-sm">
						<span className="text-slate-500 dark:text-slate-400">
							{sortedRows.length} EIPs
						</span>
					</div>
				</div>
			</div>

			{filtersOpen && (
				<FiltersDialog
					tierFilter={tierFilter}
					activeFilterCount={activeFilterCount}
					resultCount={sortedRows.length}
					onTierChange={setTierFilter}
					onClear={clearFilters}
					onClose={() => setFiltersOpen(false)}
				/>
			)}

			<div className="space-y-2 md:hidden">
				{sortedRows.length === 0 ? (
					<EmptyState />
				) : (
					sortedRows.map((row) => (
						<ComplexityCard
							key={row.proposalId}
							row={row}
							isExpanded={expandedProposalId === row.proposalId}
							onToggle={() => row.assessment && toggleExpanded(row.proposalId)}
						/>
					))
				)}
			</div>

			<div className="hidden overflow-hidden rounded border border-slate-200 bg-white md:block dark:border-slate-700 dark:bg-slate-800">
				<table className="w-full">
					<thead className="bg-slate-50 dark:bg-slate-700/50">
						<tr>
							<SortableHeader
								align="left"
								field="proposal"
								label="EIP"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<th className="px-4 py-3 text-left font-medium text-slate-700 text-sm dark:text-slate-300">
								Title
							</th>
							<SortableHeader
								align="left"
								field="stage"
								label="Stage"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<SortableHeader
								align="left"
								field="tier"
								label="Tier"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<SortableHeader
								align="right"
								field="score"
								label="Score"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<th className="px-4 py-3 text-center font-medium text-slate-700 text-sm dark:text-slate-300">
								Details
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200 dark:divide-slate-700">
						{sortedRows.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
								>
									No EIPs found with this complexity filter
								</td>
							</tr>
						) : (
							sortedRows.map((row) => (
								<ComplexityTableRow
									key={row.proposalId}
									row={row}
									isExpanded={expandedProposalId === row.proposalId}
									onToggle={() => toggleExpanded(row.proposalId)}
								/>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h3 className="mb-3 font-medium text-slate-700 text-sm dark:text-slate-300">
					Score Legend
				</h3>
				<div className="flex flex-wrap gap-3 text-xs">
					<span className={`rounded px-2 py-1 ${scoreToneClass(0)}`}>
						Low &lt;10
					</span>
					<span className={`rounded px-2 py-1 ${scoreToneClass(10)}`}>
						Medium 10-19
					</span>
					<span className={`rounded px-2 py-1 ${scoreToneClass(20)}`}>
						High &ge;20
					</span>
					<span className="rounded bg-slate-100 px-2 py-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
						- = Not assessed
					</span>
				</div>
			</div>

			<div className="mt-8 text-center text-slate-400 text-xs dark:text-slate-400">
				<p>
					Complexity data sourced from the{" "}
					<a
						href={source}
						target="_blank"
						rel="noreferrer"
						className="underline hover:text-slate-600 dark:hover:text-slate-300"
					>
						STEEL team
					</a>
					. Assessments may not be available for all EIPs.
				</p>
			</div>
		</>
	);
};

interface SortableHeaderProps {
	field: ComplexitySortField;
	label: string;
	sortField: ComplexitySortField;
	sortDirection: SortDirection;
	align: "left" | "right";
	onSort: (field: ComplexitySortField) => void;
}

const SortableHeader = ({
	field,
	label,
	sortField,
	sortDirection,
	align,
	onSort,
}: SortableHeaderProps) => (
	<th className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
		<button
			type="button"
			onClick={() => onSort(field)}
			className={`inline-flex items-center gap-2 font-medium text-slate-700 text-sm hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 ${
				align === "right" ? "justify-end" : "justify-start"
			}`}
		>
			{label}
			<SortIcon active={sortField === field} direction={sortDirection} />
		</button>
	</th>
);

const SortIcon = ({
	active,
	direction,
}: {
	active: boolean;
	direction: SortDirection;
}) => {
	if (!active) return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
	return direction === "asc" ? (
		<ArrowUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
	) : (
		<ArrowDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
	);
};

interface ComplexityCardProps {
	row: TestComplexityRow;
	isExpanded: boolean;
	onToggle: () => void;
}

const ComplexityCard = ({ row, isExpanded, onToggle }: ComplexityCardProps) => (
	<div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
		<button
			type="button"
			onClick={onToggle}
			disabled={!row.assessment}
			className="w-full px-4 py-3 text-left disabled:cursor-default"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<span className="font-mono text-purple-600 text-sm dark:text-purple-400">
							{row.displayId}
						</span>
						{row.layer && (
							<span
								className={`rounded px-1.5 py-0.5 text-[10px] ${layerBadgeClass(row.layer)}`}
							>
								{row.layer}
							</span>
						)}
						<span
							className={`rounded px-1.5 py-0.5 text-[10px] ${stageBadgeClass(row.inclusionStage)}`}
						>
							{stageLabel(row.inclusionStage)}
						</span>
					</div>
					<p className="line-clamp-2 text-slate-900 text-sm dark:text-slate-100">
						{row.title}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{row.assessment ? (
						<span
							className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${scoreToneClass(
								row.assessment.totalScore,
							)}`}
						>
							{row.assessment.totalScore}
						</span>
					) : (
						<span className="text-slate-400 text-xs italic dark:text-slate-400">
							Not assessed
						</span>
					)}
					{row.assessment && (
						<ChevronDown
							className={`h-4 w-4 text-slate-400 transition-transform ${
								isExpanded ? "rotate-180" : ""
							}`}
							aria-hidden="true"
						/>
					)}
				</div>
			</div>
		</button>
		{isExpanded && row.assessment && (
			<div className="border-slate-100 border-t px-4 pt-2 pb-4 dark:border-slate-700">
				<AssessmentDetails assessment={row.assessment} compact />
			</div>
		)}
	</div>
);

interface ComplexityTableRowProps {
	row: TestComplexityRow;
	isExpanded: boolean;
	onToggle: () => void;
}

const ComplexityTableRow = ({
	row,
	isExpanded,
	onToggle,
}: ComplexityTableRowProps) => (
	<>
		<tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
			<td className="px-4 py-3">
				<div className="flex items-center gap-2">
					<a
						href={row.href}
						className="font-mono text-purple-600 text-sm hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
					>
						{row.displayId}
					</a>
					{row.layer && (
						<span
							className={`rounded px-1.5 py-0.5 text-[10px] ${layerBadgeClass(row.layer)}`}
						>
							{row.layer}
						</span>
					)}
				</div>
			</td>
			<td className="px-4 py-3">
				<a
					href={row.href}
					className="line-clamp-1 text-slate-900 text-sm hover:text-purple-600 dark:text-slate-100 dark:hover:text-purple-400"
				>
					{row.title}
				</a>
			</td>
			<td className="px-4 py-3">
				<span
					className={`inline-block rounded px-2 py-0.5 text-xs ${stageBadgeClass(row.inclusionStage)}`}
				>
					{stageLabel(row.inclusionStage)}
				</span>
			</td>
			<td className="px-4 py-3">
				{row.assessment ? (
					<span
						className={`inline-flex items-center rounded px-2 py-1 font-medium text-xs ${tierBadgeClass(
							row.assessment.tier,
						)}`}
					>
						{row.assessment.tier}
					</span>
				) : (
					<span className="text-slate-400 text-xs italic dark:text-slate-400">
						Not assessed
					</span>
				)}
			</td>
			<td className="px-4 py-3 text-right">
				{row.assessment ? (
					<span className="font-mono text-slate-700 text-sm dark:text-slate-300">
						{row.assessment.totalScore}
					</span>
				) : (
					<span className="text-slate-400 dark:text-slate-400">-</span>
				)}
			</td>
			<td className="px-4 py-3 text-center">
				{row.assessment ? (
					<button
						type="button"
						onClick={onToggle}
						className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
						aria-label={isExpanded ? "Collapse details" : "Expand details"}
					>
						<ChevronDown
							className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
							aria-hidden="true"
						/>
					</button>
				) : (
					<span className="text-slate-300 dark:text-slate-600">-</span>
				)}
			</td>
		</tr>
		{isExpanded && row.assessment && (
			<tr className="bg-slate-50 dark:bg-slate-800/50">
				<td colSpan={6} className="px-4 py-4">
					<AssessmentDetails assessment={row.assessment} />
				</td>
			</tr>
		)}
	</>
);

const AssessmentDetails = ({
	assessment,
	compact = false,
}: {
	assessment: SteelComplexityAssessment;
	compact?: boolean;
}) => {
	const scoredCount = assessment.anchors.filter(
		(anchor) => anchor.score > 0,
	).length;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4">
				<div className="min-w-0">
					<h4 className="font-medium text-slate-700 text-sm dark:text-slate-300">
						Anchor Scores
					</h4>
					<p className="text-slate-500 text-xs dark:text-slate-400">
						{scoredCount} of {assessment.anchors.length} anchors scored
					</p>
				</div>
				<a
					href={assessment.assessmentUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex shrink-0 items-center gap-1 text-purple-600 text-xs hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
				>
					Full assessment
					<ExternalLink className="h-3 w-3" aria-hidden="true" />
				</a>
			</div>
			<div
				className={`grid grid-cols-1 gap-x-6 gap-y-1.5 ${
					compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"
				}`}
			>
				{assessment.anchors.map((anchor) => (
					<AnchorScore key={anchor.name} anchor={anchor} />
				))}
			</div>
		</div>
	);
};

const AnchorScore = ({ anchor }: { anchor: ComplexityAnchor }) => (
	<div className="flex items-center gap-2 py-0.5" title={anchor.notes}>
		{anchor.score <= 3 ? (
			<div className="flex gap-0.5">
				{[1, 2, 3].map((level) => (
					<div
						key={level}
						className={`h-2 w-2 rounded-sm ${
							anchor.score >= level
								? level === 1
									? "bg-amber-400"
									: level === 2
										? "bg-orange-500"
										: "bg-red-500"
								: "bg-slate-200 dark:bg-slate-600"
						}`}
					/>
				))}
			</div>
		) : (
			<span className="inline-flex h-4 min-w-[26px] items-center justify-center rounded bg-red-200/60 px-1.5 font-semibold text-[10px] text-red-600 dark:bg-red-600/40 dark:text-red-100">
				{anchor.score}
			</span>
		)}
		<span
			className={`truncate text-xs ${
				anchor.score > 0
					? "text-slate-700 dark:text-slate-200"
					: "text-slate-400 dark:text-slate-400"
			}`}
		>
			{anchor.name}
		</span>
	</div>
);

interface FiltersDialogProps {
	tierFilter: ComplexityTierFilter;
	activeFilterCount: number;
	resultCount: number;
	onTierChange: (value: ComplexityTierFilter) => void;
	onClear: () => void;
	onClose: () => void;
}

const FiltersDialog = ({
	tierFilter,
	activeFilterCount,
	resultCount,
	onTierChange,
	onClear,
	onClose,
}: FiltersDialogProps) => (
	<div className="fixed inset-0 z-50 animate-fadeIn">
		<button
			type="button"
			className="absolute inset-0 bg-black/50"
			onClick={onClose}
			aria-label="Close filters"
		/>
		<div className="absolute right-0 bottom-0 left-0 md:inset-0 md:flex md:items-center md:justify-center">
			<div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-white md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-2xl md:shadow-2xl dark:bg-slate-800">
				<div className="flex items-center justify-between border-slate-200 border-b px-4 py-3 dark:border-slate-700">
					<h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
						Filters
					</h2>
					<div className="flex items-center gap-3">
						{activeFilterCount > 0 && (
							<button
								type="button"
								onClick={onClear}
								className="font-medium text-purple-600 text-sm dark:text-purple-400"
							>
								Clear all
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
							aria-label="Close filters"
						>
							<X className="h-6 w-6 text-slate-500" aria-hidden="true" />
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 md:p-6">
					<h3 className="mb-3 font-semibold text-slate-700 text-sm dark:text-slate-300">
						Complexity Tier
					</h3>
					<div className="flex flex-wrap gap-2">
						{[
							{ value: "all" as const, label: "All Tiers" },
							{ value: "Low" as const, label: "Low (<10)" },
							{ value: "Medium" as const, label: "Medium (10-19)" },
							{ value: "High" as const, label: "High (\u226520)" },
							{ value: "unassessed" as const, label: "Not Assessed" },
						].map(({ value, label }) => (
							<button
								key={value}
								type="button"
								onClick={() => onTierChange(value)}
								className={`rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
									tierFilter === value
										? "bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-1 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-offset-slate-800"
										: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<div className="border-slate-200 border-t bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
					<button
						type="button"
						onClick={onClose}
						className="w-full rounded-lg bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700"
					>
						Show {resultCount} {resultCount === 1 ? "result" : "results"}
					</button>
				</div>
			</div>
		</div>
	</div>
);

const EmptyState = () => (
	<div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
		No EIPs found with this complexity filter
	</div>
);
