import { useEffect, useState } from "react";
import SettingSelect from "./SettingSelect";
import SettingRow from "./SettingRow";
import Toggle from "../../shared/components/Toggle";

export default function GlobalSettings({ settings, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftSettings, setDraftSettings] = useState(settings);

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  function updateDraftSetting(key, value) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function handleCancel() {
    setDraftSettings(settings);
    setIsEditing(false);
  }

  function handleSave() {
    onSave(draftSettings);
    setIsEditing(false);
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-950">
          Global Settings
        </h2>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-indigo-600"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </header>

      <div className="mt-6 divide-y divide-violet-200">
        {isEditing ? (
          <>
            <SettingSelect
              title="Leave Year Starts"
              subtitle="Default financial year"
              value={draftSettings.leaveYearStart}
              options={["Jan 1st", "Apr 1st"]}
              onChange={(value) =>
                updateDraftSetting("leaveYearStart", value)
              }
            />

            <SettingSelect
              title="Weekend Policy"
              subtitle="Count as leave days"
              value={draftSettings.weekendPolicy}
              options={["Excluded", "Included"]}
              onChange={(value) =>
                updateDraftSetting("weekendPolicy", value)
              }
            />
          </>
        ) : (
          <>
            <SettingRow
              title="Leave Year Starts"
              subtitle="Default financial year"
              value={settings.leaveYearStart}
            />

            <SettingRow
              title="Weekend Policy"
              subtitle="Count as leave days"
              value={settings.weekendPolicy}
            />
          </>
        )}

        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-bold text-slate-900">Half-Day Requests</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Allow partial days
            </p>
          </div>

          <Toggle
            enabled={
              isEditing
                ? draftSettings.halfDayRequests
                : settings.halfDayRequests
            }
            disabled={!isEditing}
            onClick={() =>
              updateDraftSetting(
                "halfDayRequests",
                !draftSettings.halfDayRequests,
              )
            }
          />
        </div>
      </div>
    </section>
  );
}
