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
function SummaryCard({ icon, value, label, color = 'slate' }) {
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
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

// Progress Line Chart Component - Shows daily completion rate
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
          legend: { display: false },
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
            grid: { display: false },
            ticks: { maxTicksLimit: 10, color: '#94a3b8' }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => value + '%',
              color: '#94a3b8'
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [dailyStats]);

  if (!dailyStats.length) {
    return (
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No data for this month
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// Track Comparison Bar Chart - Horizontal bar chart for comparing tracks
function TrackComparisonChart({ trackStats, title }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Sort tracks and prepare data outside useEffect
  const sortedTracks = React.useMemo(() => {
    if (!trackStats || trackStats.length === 0) return [];
    return [...trackStats]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 12);
  }, [trackStats]);

  useEffect(() => {
    if (!chartRef.current || !sortedTracks.length) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedTracks.map(t => t.track.objectData.name),
        datasets: [{
          label: 'Completion %',
          data: sortedTracks.map(t => t.completionRate),
          backgroundColor: sortedTracks.map(t => {
            const pct = t.completionRate;
            if (pct >= 80) return '#10b981';
            if (pct >= 60) return '#3b82f6';
            if (pct >= 40) return '#f59e0b';
            return '#94a3b8';
          }),
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: 2,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.x.toFixed(1)}% completion`
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => value + '%',
              color: '#94a3b8'
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 11, family: 'system-ui' },
              padding: 20,
              autoSkip: false
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [sortedTracks]);

  if (!sortedTracks.length) {
    return (
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No tracks found
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div 
        className="h-auto overflow-visible"
        style={{ 
          minHeight: Math.max(sortedTracks.length * 40, 300) + 'px',
          minWidth: '100%'
        }}
      >
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

// Track Progress List Component
function TrackProgressList({ trackStats }) {
  const sortedTracks = [...trackStats].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Track Progress ({trackStats.length})</h3>
      <div className="space-y-3">
        {sortedTracks.map((item) => {
          const percentage = item.completionRate;
          const colorClass = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-slate-300';
          
          return (
            <div key={item.track.objectId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 truncate" title={item.track.objectData.name}>
                  {item.track.objectData.name}
                </div>
                <div className="text-xs text-slate-400">
                  {item.completedDays}/{item.totalDueDays} days • {item.totalLogs} logs
                </div>
              </div>
              <div className="w-20">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${colorClass} transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-slate-700 text-right">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Monthly Overview Summary Component
function MonthlyOverviewSummary({ dailyStats, trackStats, monthYear }) {
  const avgCompletion = dailyStats.length > 0 
    ? dailyStats.reduce((sum, d) => sum + d.completionRate, 0) / dailyStats.length 
    : 0;
  
  const perfectDays = dailyStats.filter(d => d.completionRate === 100).length;
  const missedDays = dailyStats.filter(d => d.completionRate === 0 && d.dueCount > 0).length;
  const daysWithLogs = dailyStats.filter(d => d.completedCount > 0).length;
  const totalDays = dailyStats.filter(d => d.dueCount > 0).length;

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{monthYear}</h2>
        <p className="text-slate-500">Monthly Progress Report</p>
      </div>
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
          value={`${daysWithLogs}/${totalDays}`} 
          label="Days Active" 
          color="purple"
        />
        <SummaryCard 
          icon="icon-alert-circle" 
          value={missedDays} 
          label="Missed Days" 
          color="orange"
        />
      </div>
    </>
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

  // Check if current view is current month
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <div className="icon-chevron-left"></div>
        </button>
        <h2 className="text-xl font-bold text-slate-900 min-w-[160px] text-center">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <div className="icon-chevron-right"></div>
        </button>
      </div>
      {!isCurrentMonth && (
        <button onClick={handleToday} className="btn-secondary text-sm">
          <div className="icon-calendar"></div>
          Current Month
        </button>
      )}
    </div>
  );
}

// Main Monthly Report Component
function MonthlyReport() {
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to current month
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data when month changes
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

  const exportReport = async () => {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    
    // Store original styles
    const originalWidth = reportContent.style.width;
    const originalOverflow = reportContent.style.overflow;
    
    try {
      // Temporarily expand for better capture
      reportContent.style.width = '100%';
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(reportContent, {
        backgroundColor: '#f8fafc',
        scale: 3,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: reportContent.offsetWidth,
        height: reportContent.offsetHeight,
        onclone: (clonedDoc) => {
          const clonedContent = clonedDoc.getElementById('report-content');
          if (clonedContent) {
            clonedContent.style.width = '100%';
          }
        }
      });
      
      const link = document.createElement('a');
      link.download = `monthly-report-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      // Restore original styles
      reportContent.style.width = originalWidth;
    }
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

  const { dailyStats, trackStats } = reportData;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYear = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

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
              onClick={exportReport}
              className="btn-secondary text-sm"
              title="Export as PNG"
            >
              <div className="icon-download"></div>
              Export
            </button>
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
              All Tracks
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6" id="report-content">
        <MonthSelector currentDate={currentDate} onMonthChange={setCurrentDate} />

        {activeTab === 'overview' && (
          <>
            <MonthlyOverviewSummary dailyStats={dailyStats} trackStats={trackStats} monthYear={monthYear} />
            <ProgressLineChart 
              dailyStats={dailyStats} 
              title="Daily Completion Rate" 
            />
          </>
        )}

        {activeTab === 'tracks' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">All Tracks - {monthYear}</h2>
              <p className="text-slate-500">Track-by-track progress breakdown</p>
            </div>
            <TrackComparisonChart 
              trackStats={trackStats} 
              title="Track Comparison" 
            />
            <TrackProgressList trackStats={trackStats} />
          </div>
        )}
      </main>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MonthlyReport />);
