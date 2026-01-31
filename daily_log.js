const { useState, useEffect } = React;

// Helper functions for track filtering
function getCreationDate(track) {
  const parts = track.objectId.split('_');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[1]);
    return new Date(timestamp);
  }
  return new Date(0);
}

function isTrackDueOnDate(track, date) {
  const freq = track.objectData.frequency || 'daily'; // Default to daily
  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    const dayOfWeek = track.objectData.day_of_week;
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      return date.getDay() === dayOfWeek;
    }
    return date.getDay() === 0; // Default Sunday
  }

  if (freq === 'monthly') {
    const dayOfMonth = track.objectData.day_of_month;
    if (dayOfMonth !== null && dayOfMonth !== undefined) {
      return date.getDate() === Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
    }
    return date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); // Default last day
  }

  return false;
}

function isTrackActive(track) {
  return !track.objectData.deleted_at;
}

// ErrorBoundary same as before
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <div className="icon-triangle-alert text-2xl"></div>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6 text-sm">
              We encountered an issue while loading your data. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 font-medium"
            >
              <div className="icon-refresh-cw"></div>
              Refresh Page
            </button>
            <div className="mt-4 p-2 bg-slate-50 rounded text-left overflow-auto max-h-32 text-xs text-slate-400 font-mono">
              {this.state.error && this.state.error.toString()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function QuickLogItem({ track, category, existingLog, onLog }) {
  const [value, setValue] = useState(existingLog ? existingLog.objectData.value : (track.objectData.type === 'checkbox' ? 0 : ''));
  const [note, setNote] = useState(existingLog ? existingLog.objectData.note || '' : '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = existingLog && (track.objectData.type === 'checkbox' ? value === 1 : value > 0);

  const handleQuickLog = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const logValue = track.objectData.type === 'checkbox' ? 1 : (value || 1);
      await onLog(track, logValue, note);
      if (track.objectData.type === 'checkbox') {
        setValue(1);
      }
    } catch (error) {
      console.error('Failed to log:', error);
    }
    setIsSubmitting(false);
  };

  const handleValueChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <div className={`log-item ${isCompleted ? 'completed' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: category.objectData.color }}
          >
            <div className={`${category.objectData.icon} text-lg`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 truncate">{track.objectData.name}</h4>
            <p className="text-sm text-slate-500 truncate">{category.objectData.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
              ✓
            </div>
          )}

          {track.objectData.type !== 'checkbox' && isExpanded && (
            <input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm border border-slate-200 rounded"
              min="0"
              placeholder="0"
            />
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className={`icon-chevron-${isExpanded ? 'up' : 'down'} text-sm`}></div>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {track.objectData.type === 'checkbox' ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value === 1}
                onChange={(e) => setValue(e.target.checked ? 1 : 0)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm text-slate-700">Mark as completed</span>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {track.objectData.type === 'minutes' ? 'Minutes spent' : 'Count'}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => handleValueChange(parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
                placeholder="Enter value..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Add a quick note..."
            />
          </div>

          <button
            onClick={handleQuickLog}
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LoadingSpinner /> : (
              <>
                <div className="icon-plus"></div>
                {existingLog ? 'Update Log' : 'Log Activity'}
              </>
            )}
          </button>
        </div>
      )}

      {!isExpanded && !isCompleted && (
        <div className="mt-3">
          <button
            onClick={handleQuickLog}
            className="btn-secondary w-full"
          >
            <div className="icon-plus"></div>
            Quick Log
          </button>
        </div>
      )}
    </div>
  );
}

function DailyLog() {
  const [categories, setCategories] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  const today = formatDate(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, tracksData, logsData] = await Promise.all([
        getCategories(),
        getTracks(),
        getLogs(today, today)
      ]);

      // Filter tracks to only active ones due today
      const todayDate = new Date();
      const filteredTracks = tracksData.filter(track =>
        isTrackActive(track) && isTrackDueOnDate(track, todayDate)
      );

      setCategories(categoriesData);
      setTracks(filteredTracks);
      setTodayLogs(logsData);

      // Count completed logs
      const completed = logsData.filter(log => {
        const track = tracksData.find(t => t.objectId === log.objectData.track_id);
        return track && (track.objectData.type === 'checkbox' ? log.objectData.value === 1 : log.objectData.value > 0);
      }).length;
      setCompletedCount(completed);

    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleLog = async (track, value, note) => {
    try {
      // Check if log already exists
      const existingLog = todayLogs.find(log => log.objectData.track_id === track.objectId);

      if (existingLog) {
        // Update existing log
        await updateLog(existingLog.objectId, { value, note });
      } else {
        // Create new log
        await createLog(today, track.objectId, value, note);
      }

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Failed to save log:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  // Group tracks by category
  const tracksByCategory = {};
  tracks.forEach(track => {
    const categoryId = track.objectData.category_id;
    if (!tracksByCategory[categoryId]) {
      tracksByCategory[categoryId] = [];
    }
    tracksByCategory[categoryId].push(track);
  });

  const totalTracks = tracks.length;
  const progressPercent = totalTracks > 0 ? Math.round((completedCount / totalTracks) * 100) : 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Daily Log</h1>
          <p className="text-slate-500 mb-4">
            {getMonthName(new Date().getMonth())} {new Date().getDate()}, {new Date().getFullYear()}
          </p>

          {/* Progress */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Today's Progress</span>
              <span className="text-sm text-slate-500">{completedCount} / {totalTracks}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{progressPercent}% complete</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.location.href = 'index.html'}
            className="btn-secondary"
          >
            <div className="icon-home"></div>
            Dashboard
          </button>
          <button
            onClick={() => window.location.href = `day_detail.html?date=${today}`}
            className="btn-secondary"
          >
            <div className="icon-calendar"></div>
            View Details
          </button>
        </div>

        {/* Tracks by Category */}
        <div className="space-y-6">
          {categories
            .filter(cat => tracksByCategory[cat.objectId] && tracksByCategory[cat.objectId].length > 0)
            .map(category => (
            <div key={category.objectId}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.objectData.color }}
                >
                  <div className={`${category.objectData.icon}`}></div>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{category.objectData.name}</h2>
              </div>

              <div className="space-y-3">
                {tracksByCategory[category.objectId].map(track => {
                  const existingLog = todayLogs.find(log => log.objectData.track_id === track.objectId);
                  return (
                    <QuickLogItem
                      key={track.objectId}
                      track={track}
                      category={category}
                      existingLog={existingLog}
                      onLog={handleLog}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <div className="icon-plus-circle text-2xl"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Tracks Set Up Yet</h3>
            <p className="text-slate-500 mb-4 max-w-md mx-auto">
              Create categories first, then add specific tracks for each goal you want to track daily.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = 'index.html'}
                className="btn-secondary"
              >
                Add Categories
              </button>
              <button
                onClick={() => window.location.href = 'records.html'}
                className="btn-primary"
              >
                View Records
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DailyLog />
    </ErrorBoundary>
  </React.StrictMode>
);