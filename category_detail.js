const { useState, useEffect, useRef } = React;

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

function ProgressChart({ logs, tracks, timeRange }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Filter logs by time range
  const filteredLogs = React.useMemo(() => {
    const now = new Date();
    let cutoffDate;
    
    if (timeRange === 'week') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (timeRange === 'year') {
      cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
      // all time - return all logs
      return logs;
    }
    
    return logs.filter(log => new Date(log.objectData.date) >= cutoffDate);
  }, [logs, timeRange]);

  useEffect(() => {
    if (!filteredLogs.length || !tracks.length) return;

    const ctx = chartRef.current.getContext('2d');

    // Calculate daily effort over time
    const effortByDate = {};
    filteredLogs.forEach(log => {
      const date = log.objectData.date;
      const track = tracks.find(t => t.objectId === log.objectData.track_id);
      if (!track) return;

      if (!effortByDate[date]) effortByDate[date] = 0;

      // Normalize effort: checkbox = 1, minutes/count = value / 10 (to keep scale reasonable)
      const value = track.objectData.type === 'checkbox' ? log.objectData.value : log.objectData.value / 10;
      effortByDate[date] += value;
    });

    // Get date range
    const dates = Object.keys(effortByDate).sort();
    if (!dates.length) return;

    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Fill in missing dates with 0
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const data = allDates.map(date => effortByDate[date] || 0);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: allDates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
          label: 'Daily Effort',
          data: data,
          borderColor: '#0f172a',
          backgroundColor: '#0f172a20',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f5f9'
            }
          },
          x: {
            grid: {
              color: '#f1f5f9'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredLogs, tracks]);

  if (!filteredLogs.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No data for this time range
      </div>
    );
  }

  return (
    <div className="h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

function TrackBreakdown({ tracks, logs, timeRange, onTrackDeleted }) {
  const getTrackStats = (track) => {
    const trackLogs = logs.filter(log => log.objectData.track_id === track.objectId);

    // Filter by time range
    const filteredLogs = trackLogs.filter(log => {
      const logDate = new Date(log.objectData.date);
      const now = new Date();

      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return logDate >= monthAgo;
      } else if (timeRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return logDate >= yearAgo;
      }
      return true; // all time
    });

    const totalEffort = filteredLogs.reduce((sum, log) => sum + log.objectData.value, 0);
    const daysActive = new Set(filteredLogs.map(log => log.objectData.date)).size;

    // Frequency adherence (simplified)
    let adherence = 0;
    if (track.objectData.frequency === 'daily') {
      const totalDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'year' ? 365 : 90;
      adherence = Math.min((daysActive / totalDays) * 100, 100);
    } else if (track.objectData.frequency === 'weekly') {
      const totalWeeks = timeRange === 'month' ? 4 : timeRange === 'year' ? 52 : 12;
      adherence = Math.min((daysActive / totalWeeks) * 100, 100);
    } else if (track.objectData.frequency === 'monthly') {
      const totalMonths = timeRange === 'year' ? 12 : 12;
      adherence = Math.min((daysActive / totalMonths) * 100, 100);
    }

    return { totalEffort, daysActive, adherence: Math.round(adherence) };
  };

  const handleDeleteTrack = async (trackId, trackName) => {
    if (!confirm(`Delete track "${trackName}"? This will hide the track but preserve historical logs for calendar streaks.`)) return;

    try {
      await deleteTrack(trackId);
      onTrackDeleted();
    } catch (error) {
      console.error('Failed to delete track:', error);
      alert('Failed to delete track. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Track Breakdown</h3>
      <div className="grid gap-4">
        {tracks.map(track => {
          const stats = getTrackStats(track);
          return (
            <div key={track.objectId} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">{track.objectData.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 capitalize">{track.objectData.frequency}</span>
                  <button
                    onClick={() => handleDeleteTrack(track.objectId, track.objectData.name)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete track"
                  >
                    <div className="icon-trash-2 text-sm"></div>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {track.objectData.type === 'checkbox' ? stats.totalEffort :
                     track.objectData.type === 'minutes' ? `${stats.totalEffort}m` :
                     stats.totalEffort}
                  </div>
                  <div className="text-xs text-slate-500">Total Effort</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.daysActive}</div>
                  <div className="text-xs text-slate-500">Days Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.adherence}%</div>
                  <div className="text-xs text-slate-500">Adherence</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceInputs({ category, onUpdate }) {
  const [month, setMonth] = useState('');
  const [income, setIncome] = useState('');
  const [expense, setExpense] = useState('');
  const [sipStarted, setSipStarted] = useState(false);
  const [learningSessions, setLearningSessions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMonth(currentMonth);

    // Load existing finance data for current month
    loadFinanceData(currentMonth);
  }, []);

  const loadFinanceData = async (monthStr) => {
    try {
      const financeData = await getFinance(monthStr);
      if (financeData.length > 0) {
        const data = financeData[0].objectData;
        setIncome(data.income || '');
        setExpense(data.expense || '');
        setSipStarted(data.sip_started || false);
        setLearningSessions(data.learning_sessions || '');
      } else {
        setIncome('');
        setExpense('');
        setSipStarted(false);
        setLearningSessions('');
      }
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    loadFinanceData(newMonth);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if record exists
      const existing = await getFinance(month);
      if (existing.length > 0) {
        // Update existing
        await trickleUpdateObject('finance', existing[0].objectId, {
          income: parseFloat(income) || 0,
          expense: parseFloat(expense) || 0,
          sip_started: sipStarted,
          learning_sessions: parseInt(learningSessions) || 0
        });
      } else {
        // Create new
        await createFinanceRecord(
          month,
          parseFloat(income) || 0,
          parseFloat(expense) || 0,
          sipStarted,
          parseInt(learningSessions) || 0
        );
      }
      onUpdate();
      alert('Finance data saved successfully!');
    } catch (error) {
      console.error('Failed to save finance data:', error);
      alert('Failed to save finance data. Please try again.');
    }

    setIsSubmitting(false);
  };

  const savings = (parseFloat(income) || 0) - (parseFloat(expense) || 0);
  const savingsRate = income ? ((savings / parseFloat(income)) * 100).toFixed(1) : 0;

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Finance Input</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Income</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="input-field"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Expenses</label>
            <input
              type="number"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              className="input-field"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SIP/Index Fund Started</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={sipStarted}
                onChange={(e) => setSipStarted(e.target.checked)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm text-slate-700">Yes</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Learning Sessions</label>
            <input
              type="number"
              value={learningSessions}
              onChange={(e) => setLearningSessions(e.target.value)}
              className="input-field"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {income && expense && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  ${savings >= 0 ? savings.toFixed(2) : `(${Math.abs(savings).toFixed(2)})`}
                </div>
                <div className="text-xs text-slate-500">Monthly Savings</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">{savingsRate}%</div>
                <div className="text-xs text-slate-500">Savings Rate</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <LoadingSpinner /> : <><div className="icon-save"></div> Save Finance Data</>}
        </button>
      </form>
    </div>
  );
}

function CategoryDetail() {
  const [categoryId, setCategoryId] = useState('');
  const [category, setCategory] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [newTrack, setNewTrack] = useState({ name: '', type: 'checkbox', frequency: 'daily' });
  const [isCreatingTrack, setIsCreatingTrack] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    console.log('Category detail page loaded with ID:', id);
    if (id) {
      setCategoryId(id);
      loadData(id);
    } else {
      console.error('No category ID provided in URL');
    }
  }, []);

  // Reload logs when timeRange changes
  useEffect(() => {
    if (!tracks.length) return;
    
    const loadLogsForTimeRange = async () => {
      const trackIds = tracks.map(t => t.objectId);
      const now = new Date();
      let startDate, endDate = formatDate(now);
      
      if (timeRange === 'week') {
        startDate = formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      } else if (timeRange === 'month') {
        startDate = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
      } else if (timeRange === 'year') {
        startDate = formatDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
      } else {
        // all time - get 2 years of data
        startDate = formatDate(new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()));
      }
      
      try {
        const logsData = await getLogs(startDate, endDate);
        const relevantLogs = logsData.filter(log => trackIds.includes(log.objectData.track_id));
        setLogs(relevantLogs);
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    };
    
    loadLogsForTimeRange();
  }, [timeRange, tracks.length]);

  const loadData = async (id) => {
    setLoading(true);
    try {
      const [categoriesData, tracksData] = await Promise.all([
        getCategories(),
        getTracks(id)
      ]);

      console.log('All categories:', categoriesData);
      console.log('Looking for category ID:', id);
      const cat = categoriesData.find(c => c.objectId === id);
      console.log('Found category:', cat);

      setCategory(cat);
      setTracks(tracksData);

      // Load logs for all tracks in this category
      if (tracksData.length > 0) {
        const trackIds = tracksData.map(t => t.objectId);
        // Get logs for last 3 months to show progress
        const endDate = formatDate(new Date());
        const startDate = formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

        const logsData = await getLogs(startDate, endDate);
        const relevantLogs = logsData.filter(log => trackIds.includes(log.objectData.track_id));
        setLogs(relevantLogs);
      }
    } catch (error) {
      console.error('Failed to load category data:', error);
    }
    setLoading(false);
  };

  const refreshData = () => {
    loadData(categoryId);
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    setIsCreatingTrack(true);

    try {
      await createTrack(categoryId, newTrack.name, newTrack.type, newTrack.frequency, newTrack.day_of_week, newTrack.day_of_month);
      setShowTrackForm(false);
      setNewTrack({ name: '', type: 'checkbox', frequency: 'daily', day_of_week: null, day_of_month: null });
      await loadData(categoryId);
    } catch (error) {
      console.error('Failed to create track:', error);
      alert('Failed to create track. Please try again.');
    }

    setIsCreatingTrack(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!category) {
    console.error('Category not found for ID:', categoryId);
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Category Not Found</h1>
          <p className="text-slate-500 mb-4">ID: {categoryId}</p>
          <button onClick={() => window.location.href = 'index.html'} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  console.log('Category found:', category ? category.objectData.name : 'null');

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: category.objectData.color }}
            >
              <div className={`${category.objectData.icon} text-xl`}></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{category.objectData.name}</h1>
              <p className="text-slate-500">Track your progress and effort over time</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <div className="icon-arrow-left"></div>
            Back
          </button>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 flex-wrap">
          {['week', 'month', 'year', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {range === 'week' ? 'This Week' :
               range === 'month' ? 'This Month' :
               range === 'year' ? 'This Year' :
               'All Time'}
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        {tracks.length > 0 && (
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Progress Overview</h2>
            <ProgressChart logs={logs} tracks={tracks} timeRange={timeRange} />
          </div>
        )}

        {/* Track Breakdown */}
        {tracks.length > 0 ? (
          <TrackBreakdown tracks={tracks} logs={logs} timeRange={timeRange} onTrackDeleted={refreshData} />
        ) : (
          <div className="glass-panel p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <div className="icon-target text-xl"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Tracks Yet</h3>
            <p className="text-slate-500 mb-4">
              Add specific goals and habits you want to track in this category.
            </p>
          </div>
        )}

        {/* Add Track Button */}
        {(
          <div className="text-center">
            <button
              onClick={() => setShowTrackForm(true)}
              className="btn-secondary"
            >
              <div className="icon-plus"></div>
              Add New Track
            </button>
          </div>
        )}

        {/* Track Form Modal */}
        {showTrackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Add New Track</h2>
                <form onSubmit={handleCreateTrack} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Track Name</label>
                    <input
                      type="text"
                      value={newTrack.name}
                      onChange={(e) => setNewTrack({...newTrack, name: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Read articles"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      value={newTrack.type}
                      onChange={(e) => setNewTrack({...newTrack, type: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="checkbox">Checkbox (done/not done)</option>
                      <option value="minutes">Minutes</option>
                      <option value="count">Count</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                    <select
                      value={newTrack.frequency}
                      onChange={(e) => setNewTrack({...newTrack, frequency: e.target.value, day_of_week: e.target.value === 'weekly' ? (newTrack.day_of_week || 0) : null, day_of_month: e.target.value === 'monthly' ? (newTrack.day_of_month || 1) : null})}
                      className="input-field"
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {newTrack.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Day of Week</label>
                      <select
                        value={newTrack.day_of_week || 0}
                        onChange={(e) => setNewTrack({...newTrack, day_of_week: parseInt(e.target.value)})}
                        className="input-field"
                        required
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  )}

                  {newTrack.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Day of Month</label>
                      <input
                        type="number"
                        value={newTrack.day_of_month || 1}
                        onChange={(e) => setNewTrack({...newTrack, day_of_month: parseInt(e.target.value)})}
                        className="input-field"
                        min="1"
                        max="31"
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isCreatingTrack}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingTrack ? <LoadingSpinner /> : <><div className="icon-plus"></div> Create Track</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTrackForm(false);
                        setNewTrack({ name: '', type: 'checkbox', frequency: 'daily', day_of_week: null, day_of_month: null });
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
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
      <CategoryDetail />
    </ErrorBoundary>
  </React.StrictMode>
);