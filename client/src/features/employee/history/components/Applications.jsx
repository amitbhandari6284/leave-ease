import ApplicationItem, { GRID_COLUMNS } from "../../../../components/ui/ApplicationItem.jsx";
import Pagination from "../../../../components/ui/Pagination.jsx";
import EmptyState from "../../../../components/ui/EmptyState.jsx";

export default function Applications({
  filteredApplications,
  pagination,
  hasActiveFilters,
  openMenuId,
  currentPage,
  handleViewDetails,
  cancelMutation,
  setCurrentPage,
  setOpenMenuId,
  handleCancelApplication,
  handleClearFilters,
}) {
  // While a client-side filter is active, we only know about matches on
  // the current server page — cross-page navigation would be misleading,
  // so pagination collapses to "this page's filtered results" only.
  const totalPages = hasActiveFilters ? 1 : pagination?.totalPages || 1;
  const totalRequests = hasActiveFilters ? filteredApplications.length : (pagination?.totalRequests ?? filteredApplications.length);
  const pageSize = pagination?.limit || filteredApplications.length;

  const firstVisibleEntry = filteredApplications.length === 0 ? 0 : hasActiveFilters ? 1 : (currentPage - 1) * pageSize + 1;
  const lastVisibleEntry = filteredApplications.length === 0 ? 0 : firstVisibleEntry + filteredApplications.length - 1;

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="border-b border-violet-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-950">Application History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Showing {filteredApplications.length} request{filteredApplications.length === 1 ? "" : "s"}
          {hasActiveFilters ? " matching your filters on this page." : " on this page."}
        </p>
      </header>

      <div role="table" aria-label="Leave application history">
        <div
          role="row"
          className={`hidden border-b border-violet-200 bg-violet-50 px-6 py-4 text-xs tracking-wide text-slate-600 uppercase md:grid md:items-center md:gap-4 ${GRID_COLUMNS}`}
        >
          <span role="columnheader">Leave Type</span>
          <span role="columnheader">Duration</span>
          <span role="columnheader">Days</span>
          <span role="columnheader">Applied On</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="text-right">
            Actions
          </span>
        </div>

        <div className="divide-y divide-violet-100">
          {filteredApplications.map((application, index) => (
            <ApplicationItem
              key={application.id}
              application={application}
              isMenuOpen={openMenuId === application.id}
              openUpward={index === filteredApplications.length - 1}
              isCancelling={cancelMutation.isPending}
              onToggleMenu={() =>
                setOpenMenuId((currentId) => (currentId === application.id ? null : application.id))
              }
              onViewDetails={() => handleViewDetails(application)}
              onCancel={() => handleCancelApplication(application.id)}
            />
          ))}
        </div>
      </div>

      {filteredApplications.length === 0 && (
        <EmptyState
          title="No leave requests found"
          message="Try changing or clearing the selected filters."
          onClearFilters={handleClearFilters}
        />
      )}

      {filteredApplications.length > 0 && totalPages > 1 && (
        <footer className="flex flex-col gap-4 border-t border-violet-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {firstVisibleEntry} to {lastVisibleEntry} of {totalRequests} entries
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </footer>
      )}
    </section>
  );
}
