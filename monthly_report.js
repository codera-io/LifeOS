const { useState, useEffect, useRef } = React;

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ icon, value, label, trend, trendValue, color = 'slate' }) {
  const colorClasses = {
    slate: 'bg-slate-50 text-slate-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <div className={icon}></div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

// Progress Line Chart Component
function ProgressLineChart({ dailyStats, title }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !dailyStats.length) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = dailyStats.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const values = dailyStats.map(d => d.completionRate);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Completion Rate %',
          data: values,
          borderColor: '#0f172a',
          backgroundColor: 'rgba(15, 23, 42, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#0f172a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y.toFixed(1)}% complete`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 10,
              color: '#94a3b8'
            }
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              callback: (value) => value + '%',
              color: '#94a3b8'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dailyStats]);

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// Multi-Track Line Chart Component
function MultiTrackChart({ trackStats, title }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !trackStats.length) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Color palette for tracks
    const colors = [
      '#0f172a', '#3b82f6', '#10b981', '#f59e0b', 
      '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
      '#84cc16', '#f97316'
    ];

    // For now, show top 10 tracks by completion rate
    const topTracks = trackStats
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);

    const datasets = topTracks.map((item, index) => ({
      label: item.track.objectData.name,
      data: [item.completionRate], // Single value for bar-like display
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.4
    }));

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: topTracks.map(t => t.track.objectData.name),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              callback: (value) => value + '%',
              color: '#94a3b8'
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
  }, [trackStats]);

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// Track Progress Bar Component
function TrackProgressBar({ trackStats }) {
  const sortedTracks = [...trackStats].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Track Progress</h3>
      <div className="space-y-3">
        {sortedTracks.slice(0, 15).map((item, index) => {
          const percentage = item.completionRate;
          const colorClass = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-slate-300';
          
          return (
            <div key={item.track.objectId} className="flex items-center gap-3">
              <div className="w-32 text-sm text-slate-600 truncate" title={item.track.objectData.name}>
                {item.track.objectData.name}
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${colorClass} transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-12 text-sm font-medium text-slate-700 text-right">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
      {trackStats.length > 15 && (
        <div className="mt-4 text-center text-sm text-slate-500">
          +{trackStats.length - 15} more tracks
        </div>
      )}
    </div>
  );
}

// Monthly Overview Summary Component
function MonthlyOverviewSummary({ dailyStats, trackStats }) {
  const avgCompletion = dailyStats.length > 0 
    ? dailyStats.reduce((sum, d) => sum + d.completionRate, 0) / dailyStats.length 
    : 0;
  
  const perfectDays = dailyStats.filter(d => d.completionRate === 100).length;
  const missedDays = dailyStats.filter(d => d.completionRate === 0 && d.dueCount > 0).length;
  
  const topTrack = trackStats.length > 0 
    ? trackStats.sort((a, b) => b.completionRate - a.completionRate)[0] 
    : null;
  
  const strugglingTrack = trackStats.length > 0 
    ? trackStats.sort((a, b) => a.completionRate - b.completionRate)[0] 
    : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <SummaryCard 
        icon="icon-check-circle" 
        value={`${avgCompletion.toFixed(1)}%`} 
        label="Avg. Completion" 
        color="blue"
      />
      <SummaryCard 
        icon="icon-calendar" 
        value={perfectDays} 
        label="Perfect Days" 
        color="green"
      />
      <SummaryCard 
        icon="icon-target" 
        value={trackStats.length} 
        label="Active Tracks" 
        color="purple"
      />
      <SummaryCard 
        icon="icon-trending-up" 
        value={missedDays} 
        label="Missed Days" 
        color="orange"
        trend={missedDays === 0 ? 'down' : null}
        trendValue={missedDays === 0 ? 'Great!' : ''}
      />
    </div>
  );
}

// Month Selector Component
function MonthSelector({ currentDate, onMonthChange }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onMonthChange(newDate);
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-slate-900">
        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
      </h2>
      <div className="flex gap-2">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <div className="icon-chevron-left"></div>
        </button>
        <button onClick={handleToday} className="px-3 py-2 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">
          Today
        </button>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <div className="icon-chevron-right"></div>
        </button>
      </div>
    </div>
  );
}

// Main Monthly Report Component
function MonthlyReport() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [currentDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const data = await window.getMonthlyReportData(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setReportData(data);
    } catch (error) {
      console.error('Failed to load monthly report:', error);
    }
    setLoading(false);
  };

  const navigateToDashboard = () => {
    window.location.href = 'index.html';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <div className="icon-alert-circle text-2xl"></div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Data Available</h2>
          <p className="text-slate-500 mb-4">Start tracking to see your monthly report</p>
          <button onClick={navigateToDashboard} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { dailyStats, trackStats, year, month } = reportData;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={navigateToDashboard} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="icon-arrow-left"></div>
            </button>
            <h1 className="text-xl font-bold text-slate-900">Monthly Report</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tracks' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tracks
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />

        {activeTab === 'overview' && (
          <>
            <MonthlyOverviewSummary dailyStats={dailyStats} trackStats={trackStats} />
            <ProgressLineChart 
              dailyStats={dailyStats} 
              title="Daily Progress Throughout the Month" 
            />
          </>
        )}

        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiTrackChart 
              trackStats={trackStats} 
              title="Track Performance Comparison" 
            />
            <TrackProgressBar trackStats={trackStats} />
          </div>
        )}
      </main>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MonthlyReport />);
