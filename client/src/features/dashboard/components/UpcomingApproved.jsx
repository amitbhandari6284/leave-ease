import { useEffect, useState } from "react";
import { Link } from "react-router";


import ApplicationDetailsDialog from "../../../components/ui/ApplicationDetailsDialog.jsx";
import ApplicationItem, { GRID_COLUMNS } from "../../../components/ui/ApplicationItem.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

export function UpcomingApprovedApplications({ upcomingApprovedApplications }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest("[data-leave-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  function handleViewDetails(application) {
    setSelectedApplication(application);
    setOpenMenuId(null);
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-950">Upcoming Approved Applications</h2>

        <Link to="/my-leaves" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View All
        </Link>
      </header>

      <div role="table" aria-label="Upcoming approved applications">
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
        {upcomingApprovedApplications ?
          <div className="divide-y divide-violet-100">
            {upcomingApprovedApplications.map((application, index) => (
              <ApplicationItem
                key={application.id}
                application={application}
                isMenuOpen={openMenuId === application.id}
                openUpward={index === upcomingApprovedApplications.length - 1}
                allowCancel={false}
                onToggleMenu={() => setOpenMenuId((currentId) => (currentId === application.id ? null : application.id))}
                onViewDetails={() => handleViewDetails(application)}
              />
            ))}
          </div>
          :
          <>
            <EmptyState title="No approved applications" />
          </>}
      </div>

      {selectedApplication && (
        <ApplicationDetailsDialog application={selectedApplication} allowCancel={false} onClose={() => setSelectedApplication(null)} />
      )}
    </section>
  );
}
