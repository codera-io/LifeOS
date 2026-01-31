const { useState, useEffect } = React;

// ErrorBoundary same as in app.js
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

function LogEntry({ log, track, category, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(log.objectData.value);
  const [note, setNote] = useState(log.objectData.note || '');

  const handleSave = async () => {
    // Update log
    await trickleUpdateObject('logs', log.objectId, { value, note });
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (confirm('Delete this log entry?')) {
      await trickleDeleteObject('logs', log.objectId);
      onUpdate();
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: category.objectData.color }}
          >
            <div className={`${category.objectData.icon}`}></div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-900">{track.objectData.name}</h4>
            <p className="text-sm text-slate-500">{category.objectData.name}</p>
          </div>
        </div>
        <div className="space-y-3">
          {track.objectData.type === 'checkbox' ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value === 1}
                onChange={(e) => setValue(e.target.checked ? 1 : 0)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm text-slate-700">Completed</span>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {track.objectData.type === 'minutes' ? 'Minutes' : 'Count'}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
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
              placeholder="Add a note..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex-1">
              <div className="icon-save"></div>
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ backgroundColor: category.objectData.color }}
        >
          <div className={`${category.objectData.icon}`}></div>
        </div>
        <div>
          <h4 className="font-medium text-slate-900">{track.objectData.name}</h4>
          <p className="text-sm text-slate-500">
            {track.objectData.type === 'checkbox'
              ? (value === 1 ? '✓ Completed' : 'Not completed')
              : `${value} ${track.objectData.type === 'minutes' ? 'min' : 'count'}`
            }
            {note && ` • ${note}`}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <div className="icon-edit-2 text-sm"></div>
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <div className="icon-trash-2 text-sm"></div>
        </button>
      </div>
    </div>
  );
}

function LoggingForm({ date, categories, tracks, onLogAdded }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [value, setValue] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryTracks = tracks.filter(t => t.objectData.category_id === selectedCategory);
  const currentTrack = tracks.find(t => t.objectId === selectedTrack);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrack) return;

    setIsSubmitting(true);
    try {
      await createLog(date, selectedTrack, value, note);
      setSelectedCategory('');
      setSelectedTrack('');
      setValue(1);
      setNote('');
      onLogAdded();
    } catch (error) {
      console.error('Failed to create log:', error);
      alert('Failed to save log. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Log Activity</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedTrack('');
            }}
            className="input-field"
            required
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.objectId} value={cat.objectId}>{cat.objectData.name}</option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Track</label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select track...</option>
              {categoryTracks.map(track => (
                <option key={track.objectId} value={track.objectId}>{track.objectData.name}</option>
              ))}
            </select>
          </div>
        )}

        {currentTrack && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {currentTrack.objectData.type === 'checkbox' ? 'Completed?' :
               currentTrack.objectData.type === 'minutes' ? 'Minutes' : 'Count'}
            </label>
            {currentTrack.objectData.type === 'checkbox' ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value === 1}
                  onChange={(e) => setValue(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">Yes, completed</span>
              </div>
            ) : (
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
                required
              />
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-field"
            rows="2"
            placeholder="Add a note about this activity..."
          />
        </div>

        <button
          type="submit"
          disabled={!selectedTrack || isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <LoadingSpinner /> : <><div className="icon-plus"></div> Add Log</>}
        </button>
      </form>
    </div>
  );
}

function DayDetail() {
  const [date, setDate] = useState('');
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      setDate(dateParam);
      loadData(dateParam);
    }
  }, []);

  const loadData = async (dateStr) => {
    setLoading(true);
    try {
      const [logsData, categoriesData, tracksData] = await Promise.all([
        getLogs(dateStr, dateStr),
        getCategories(),
        getTracks()
      ]);
      setLogs(logsData);
      setCategories(categoriesData);
      setTracks(tracksData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const refreshLogs = () => {
    loadData(date);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  const dateObj = new Date(date);
  const isToday = formatDate(new Date()) === date;
  const isPast = dateObj < new Date() && !isToday;

  // Group logs by category
  const logsByCategory = {};
  logs.forEach(log => {
    const track = tracks.find(t => t.objectId === log.objectData.track_id);
    if (track) {
      const categoryId = track.objectData.category_id;
      if (!logsByCategory[categoryId]) {
        logsByCategory[categoryId] = [];
      }
      logsByCategory[categoryId].push({ log, track });
    }
  });

  const categoriesWithLogs = categories.filter(cat => logsByCategory[cat.objectId]);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getMonthName(dateObj.getMonth())} {dateObj.getDate()}, {dateObj.getFullYear()}
            </h1>
            <p className="text-slate-500 mt-1">
              {isToday ? 'Today' : isPast ? 'Past day' : 'Future day'}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <div className="icon-arrow-left"></div>
            Back
          </button>
        </div>

        {/* Existing Logs */}
        {categoriesWithLogs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Activities Logged</h2>
            {categoriesWithLogs.map(category => (
              <div key={category.objectId} className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: category.objectData.color }}
                  >
                    <div className={`${category.objectData.icon} text-lg`}></div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{category.objectData.name}</h3>
                </div>
                <div className="space-y-3">
                  {logsByCategory[category.objectId].map(({ log, track }) => (
                    <LogEntry
                      key={log.objectId}
                      log={log}
                      track={track}
                      category={category}
                      onUpdate={refreshLogs}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logging Form - only for today or past */}
        {(isToday || isPast) && (
          <LoggingForm
            date={date}
            categories={categories}
            tracks={tracks}
            onLogAdded={refreshLogs}
          />
        )}

        {logs.length === 0 && !(isToday || isPast) && (
          <div className="glass-panel p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <div className="icon-calendar text-2xl"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Future Day</h3>
            <p className="text-slate-500">You can only log activities for today or past days.</p>
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
      <DayDetail />
    </ErrorBoundary>
  </React.StrictMode>
);