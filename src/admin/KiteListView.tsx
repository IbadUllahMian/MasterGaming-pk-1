'use client';

import { Button, buttonVariants } from '@appsmithorg/kite-ui/components/button';
import { Checkbox } from '@appsmithorg/kite-ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@appsmithorg/kite-ui/components/dropdown-menu';
import { Icon } from '@appsmithorg/kite-ui/components/icon';
import { Input } from '@appsmithorg/kite-ui/components/input';
import {
  Table as DsTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@appsmithorg/kite-ui/components/table';
import {
  Gutter,
  ListSelection,
  SelectionProvider,
  TableColumnsProvider,
  useConfig,
  useListQuery,
  useSelection,
  useTableColumns,
} from '@payloadcms/ui';
import { WhereBuilder } from '@payloadcms/ui/elements/WhereBuilder';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ListViewClientProps } from 'payload';
import React from 'react';
import { BackIconLink } from './BackIconLink';
import { descriptionText, labelToString } from './payloadLabel';

// Replacement for Payload's DefaultListView, wired via
// `admin.components.views.list.Component` — the collection list (Pages) in the
// embedded Content tab.
//
// WHY A FULL VIEW REPLACEMENT: the list-controls row (search + Columns +
// Filters) is rendered by Payload's `ListControls`, which sits ABOVE the first
// available override slot (`beforeListTable`) in DefaultListView. There is no
// slot for it, so the row is all-or-nothing — the only way to build it from the
// design system is to own the view.
//
// WHAT STAYS PAYLOAD'S, DELIBERATELY:
//   - `ListSelection` (the "N selected — Edit / Publish / Delete" bar) is
//     imported from Payload. It owns the bulk-action modals and their delete
//     semantics; a hand-rolled bar would be a destructive action reimplemented
//     from scratch. Without it the row checkboxes below would be an affordance
//     nothing consumes, and bulk delete — which DefaultListView has — would be
//     gone.
//   - `WhereBuilder` (the condition builder inside the Filters panel) is
//     imported from Payload. It depends on `reduceFieldsToOptions` and a
//     per-field-type operator map, neither of which @payloadcms/ui exports
//     (`./elements/*` only resolves directories with an index). A hand-rolled
//     query builder fails by returning the WRONG ROWS rather than by looking
//     broken, so this reuses the real one and styles it.
//
// Everything around them — header, Create button, search, Columns menu, the
// Filters toggle and the pagination footer — is kite-ui.
//
// PROVIDERS: DefaultListView renders TableColumnsProvider with SelectionProvider
// nested inside it, and the `Table` node reads from both. That nesting is
// mirrored exactly below; inverting or dropping one throws a context error from
// inside a node this file does not own, which is hard to attribute.
// `ListQueryProvider` is already supplied by @payloadcms/next around whatever
// component the view resolves to, so `useListQuery` works here without setup.

// The server view also passes a pre-rendered `Table` node (part of
// ListViewClientProps). It is deliberately unused: KiteTable below rebuilds the
// table from `columnState`, reusing the per-column `Heading` and
// `renderedCells` that the same server pass produced, so sorting and cell
// rendering are preserved while the markup becomes DS.
type KiteListViewProps = ListViewClientProps;

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const KiteListView: React.FC<KiteListViewProps> = (props) => {
  const { data } = useListQuery();

  return (
    <TableColumnsProvider
      collectionSlug={props.collectionSlug}
      columnState={props.columnState}
    >
      <SelectionProvider
        docs={data?.docs ?? []}
        totalDocs={data?.totalDocs ?? 0}
      >
        <ListShell {...props} />
      </SelectionProvider>
    </TableColumnsProvider>
  );
};

// The rows table, built from the design system rather than Payload's `Table`.
//
// This does NOT reimplement the table's behaviour — it reuses the two pieces
// Payload already rendered server-side and exposes on each column:
//   - `Heading`: the header cell INCLUDING Payload's sort control, so clicking
//     to sort keeps working without touching the query.
//   - `renderedCells[i]`: the cell for row `i`, already rendered with the
//     correct Cell component (including the linked title that navigates to the
//     document).
// Only the surrounding table markup and the selection checkboxes are ours.
//
// WHY THE ROW SET AND THE CELLS CANNOT DRIFT APART, though they are read from
// two hooks: both are the SAME server render's output, and neither is mutated
// on the client. `useListQuery().data` is a plain prop threaded into context
// (@payloadcms/ui providers/ListQuery), and `columnState` reaches
// `useTableColumns()` through `useOptimistic(columnStateFromProps)`
// (providers/TableColumns), which tracks its prop. Paging, searching and the
// per-page control all go through `refineListData`, which is a `router.replace`
// inside a route transition — a new server render that re-supplies BOTH props
// in one commit, not a client-side mutation of one of them. Payload's own
// `Table` element indexes `renderedCells[rowIndex]` against a row array the
// same way.
//
// Row selection goes through Payload's `useSelection`, the same context its own
// SelectRow/SelectAll use, so bulk actions keep seeing the right documents.
const KiteTable: React.FC<{ enableRowSelections?: boolean }> = ({
  enableRowSelections,
}) => {
  const { data } = useListQuery();
  const { columns } = useTableColumns();
  const { selectAll, selected, setSelection, toggleAll } = useSelection();

  const docs = data?.docs ?? [];
  const activeColumns = (columns ?? []).filter((column) => column.active);

  if (!docs.length) {
    return (
      <div className="border-bd-neutral-subtle text-fg-subtle rounded-lg border border-dashed p-10 text-center text-sm">
        No results found.
      </div>
    );
  }

  // `selectAll` is Payload's four-state enum. Both "all on this page" and "all
  // across pages" mean every visible row is ticked, so the header checkbox is
  // checked for either; only `some` is indeterminate.
  const allSelected = selectAll === 'allInPage' || selectAll === 'allAvailable';
  const someSelected = selectAll === 'some';

  // No wrapper div here: kite-ui's Table already renders its own
  // `[data-slot=table-container]` with `rounded-lg border`. Adding a second
  // bordered box drew two concentric lines — and that container sets no
  // border-COLOUR class, so it fell back to currentColor (near-black). It is
  // given the platform's subtle border in admin-ds.css instead.
  return (
    <DsTable>
      <TableHeader className="bg-transparent">
        <TableRow>
          {enableRowSelections ? (
            <TableHead className="text-fg-subtle w-10 text-xs">
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={() => toggleAll()}
              />
            </TableHead>
          ) : null}
          {activeColumns.map((column) => (
            <TableHead className="text-fg-subtle text-xs" key={column.accessor}>
              {column.Heading}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc, rowIndex) => (
          <TableRow key={doc?.id ?? rowIndex}>
            {enableRowSelections ? (
              <TableCell className="w-10">
                <Checkbox
                  aria-label={`Select row ${rowIndex + 1}`}
                  checked={Boolean(selected?.get(doc?.id))}
                  onCheckedChange={() => setSelection(doc?.id)}
                />
              </TableCell>
            ) : null}
            {activeColumns.map((column) => (
              <TableCell key={column.accessor}>
                {column.renderedCells?.[rowIndex]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DsTable>
  );
};

const ListShell: React.FC<KiteListViewProps> = ({
  collectionSlug,
  disableBulkDelete,
  disableBulkEdit,
  enableRowSelections,
  hasCreatePermission,
  hasDeletePermission,
  newDocumentURL,
  renderedFilters,
  resolvedFilterOptions,
}) => {
  const { data, query, refineListData } = useListQuery();
  const { columns, toggleColumn } = useTableColumns();
  const { config, getEntityConfig } = useConfig();
  const adminRoute = config.routes.admin;

  const collectionConfig = getEntityConfig({ collectionSlug });
  const title = labelToString(collectionConfig?.labels?.plural, collectionSlug);
  const description = descriptionText(collectionConfig?.admin?.description);

  // Payload labels its own search box from the collection's `useAsTitle`; match
  // that instead of hardcoding, so this view can be pointed at any collection.
  const searchPlaceholder = (() => {
    const useAsTitle = collectionConfig?.admin?.useAsTitle;
    if (!useAsTitle) return 'Search';
    return `Search by ${useAsTitle.charAt(0).toUpperCase()}${useAsTitle.slice(1)}`;
  })();

  const [showFilters, setShowFilters] = React.useState(
    () => Object.keys(query?.where ?? {}).length > 0,
  );

  // Local echo of the search box so typing stays responsive, with the actual
  // list refetch debounced. `refineListData` hits the server and rewrites the
  // URL, so firing it per keystroke would both thrash the list and fight the
  // input's own cursor position.
  const [search, setSearch] = React.useState(() => query?.search ?? '');
  const committedSearch = React.useRef(query?.search ?? '');

  React.useEffect(() => {
    if (search === committedSearch.current) return;
    const timer = setTimeout(() => {
      committedSearch.current = search;
      void refineListData({ page: 1, search });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, refineListData]);

  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const totalDocs = data?.totalDocs ?? 0;
  const limit = data?.limit ?? PER_PAGE_OPTIONS[0];
  const rangeStart = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalDocs);

  // `Gutter` is Payload's, deliberately — it is the horizontal layout wrapper
  // the admin shell expects (DefaultListView and Dashboard.tsx both use it),
  // not a visual component. Without it the view renders flush to the edge.
  return (
    <Gutter>
      {/* Top margin matches the bottom one. The 8px that used to sit here was
          measured against Payload's app header above it; with that header gone
          the view starts at the very top of the pane, so the title needs the
          same breathing room it has below. */}
      <header className="mt-6 mb-6 flex items-start justify-between gap-4">
        {/* See Dashboard.tsx: gap, not a margin, because `box-trim` removes the
            h1's leading. */}
        <div className="flex flex-col gap-2">
          {/* A collection list is not the root of this admin — the dashboard
              is — so it gets the same back control as a document, beside its
              own title. */}
          <div className="flex items-center gap-3">
            <BackIconLink href={adminRoute} label="Back to content" />
            <h1 className="text-fg-normal text-3xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="text-fg-subtle text-sm">{description}</p>
          ) : null}
        </div>
        {/* `buttonVariants` on the Link rather than `<Button asChild>`, matching
            Dashboard.tsx and the platform's link-button pattern — and avoiding
            a <button> nested inside an <a>. */}
        {hasCreatePermission ? (
          <Link
            className={buttonVariants({
              // `sm` is the design system's 32px height. The default size adds
              // 8px of vertical padding to a 24px line box, which read as
              // oversized next to the controls row below it.
              size: 'sm',
              className: 'shrink-0 no-underline',
            })}
            href={newDocumentURL}
          >
            <Icon icon={PlusIcon} size="sm" aria-hidden />
            Create New
          </Link>
        ) : null}
      </header>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon
            aria-hidden
            className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            icon={SearchIcon}
            size="sm"
          />
          <Input
            aria-label={`Search ${title}`}
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={search}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns
              <Icon icon={ChevronDownIcon} size="sm" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {columns?.map((column) => (
              <DropdownMenuCheckboxItem
                checked={column.active}
                key={column.accessor}
                // Radix closes the menu on select by default; toggling several
                // columns in a row is the normal interaction here.
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => void toggleColumn(column.accessor)}
              >
                {/* `ClientField` is a union; presentational members (row,
                    collapsible) carry no `label`, so narrow before reading it
                    and fall back to the accessor. */}
                {column.CustomLabel ??
                  labelToString(
                    column.field && 'label' in column.field
                      ? column.field.label
                      : undefined,
                    column.accessor,
                  )}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          aria-expanded={showFilters}
          onClick={() => setShowFilters((open) => !open)}
          variant="outline"
        >
          <Icon icon={ListFilterIcon} size="sm" aria-hidden />
          Filters
        </Button>
      </div>

      {showFilters ? (
        <div className="mb-4">
          <WhereBuilder
            collectionPluralLabel={collectionConfig?.labels?.plural}
            collectionSlug={collectionSlug}
            fields={collectionConfig?.fields}
            renderedFilters={renderedFilters}
            resolvedFilterOptions={resolvedFilterOptions}
          />
        </div>
      ) : null}

      <KiteTable enableRowSelections={enableRowSelections} />

      {totalDocs > 0 ? (
        <footer className="mt-4 flex items-center justify-between gap-4">
          {/* `ListSelection` renders nothing until at least one row is ticked,
              so it costs no layout when idle. It is what turns the row
              checkboxes above into actions — count, "select all N", Edit,
              Publish/Unpublish and Delete — and is skinned in admin-skin.css
              rather than rebuilt, because bulk delete is a destructive action
              whose modal and selectAll-across-pages semantics are Payload's. */}
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-fg-subtle shrink-0 text-sm">
              {rangeStart}-{rangeEnd} of {totalDocs}
            </span>
            {enableRowSelections ? (
              <ListSelection
                collectionConfig={collectionConfig}
                disableBulkDelete={disableBulkDelete}
                disableBulkEdit={disableBulkEdit}
                hasDeletePermission={hasDeletePermission}
                label={title}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Per Page: {limit}
                  <Icon icon={SlidersHorizontalIcon} size="sm" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PER_PAGE_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    checked={option === limit}
                    key={option}
                    onCheckedChange={() =>
                      void refineListData({ limit: option, page: 1 })
                    }
                  >
                    {option}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => void refineListData({ page: page - 1 })}
              size="icon"
              variant="outline"
            >
              <Icon icon={ChevronLeftIcon} size="sm" aria-hidden />
            </Button>
            <Button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => void refineListData({ page: page + 1 })}
              size="icon"
              variant="outline"
            >
              <Icon icon={ChevronRightIcon} size="sm" aria-hidden />
            </Button>
          </div>
        </footer>
      ) : null}
    </Gutter>
  );
};
