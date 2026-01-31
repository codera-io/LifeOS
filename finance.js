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

function FinanceChart({ financeData }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!financeData.length) return;

    const ctx = chartRef.current.getContext('2d');

    // Sort by month
    const sortedData = financeData.sort((a, b) => a.objectData.month.localeCompare(b.objectData.month));

    const labels = sortedData.map(d => {
      const [year, month] = d.objectData.month.split('-');
      return `${getMonthName(parseInt(month) - 1)} ${year}`;
    });

    const savingsData = sortedData.map(d => {
      const income = d.objectData.income || 0;
      const expense = d.objectData.expense || 0;
      return income - expense;
    });

    const savingsRateData = sortedData.map(d => {
      const income = d.objectData.income || 0;
      const expense = d.objectData.expense || 0;
      return income > 0 ? ((income - expense) / income) * 100 : 0;
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monthly Savings',
            data: savingsData,
            borderColor: '#10b981',
            backgroundColor: '#10b98120',
            yAxisID: 'y',
            tension: 0.4
          },
          {
            label: 'Savings Rate (%)',
            data: savingsRateData,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f620',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Savings ($)'
            },
            grid: {
              color: '#f1f5f9'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Savings Rate (%)'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false,
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
  }, [financeData]);

  return (
    <div className="h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

function FinanceForm({ currentMonth, existingData, onSave }) {
  const [income, setIncome] = useState(existingData?.objectData.income || '');
  const [expense, setExpense] = useState(existingData?.objectData.expense || '');
  const [sipStarted, setSipStarted] = useState(existingData?.objectData.sip_started || false);
  const [learningSessions, setLearningSessions] = useState(existingData?.objectData.learning_sessions || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        income: parseFloat(income) || 0,
        expense: parseFloat(expense) || 0,
        sip_started: sipStarted,
        learning_sessions: parseInt(learningSessions) || 0
      });
    } catch (error) {
      console.error('Failed to save finance data:', error);
    }

    setIsSubmitting(false);
  };

  const savings = (parseFloat(income) || 0) - (parseFloat(expense) || 0);
  const savingsRate = income ? ((savings / parseFloat(income)) * 100).toFixed(1) : 0;

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">
        {getMonthName(new Date(currentMonth + '-01').getMonth())} {new Date(currentMonth + '-01').getFullYear()} Finance
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Finance Learning Sessions</label>
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
                <div className={`text-lg font-semibold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${savings >= 0 ? savings.toFixed(2) : `(${Math.abs(savings).toFixed(2)})`}
                </div>
                <div className="text-xs text-slate-500">Monthly Savings</div>
              </div>
              <div>
                <div className={`text-lg font-semibold ${parseFloat(savingsRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {savingsRate}%
                </div>
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

function Finance() {
  const [financeData, setFinanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(monthStr);
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // Get all finance records
      const data = await getFinance();
      setFinanceData(data);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
    setLoading(false);
  };

  const handleSave = async (data) => {
    try {
      const existing = financeData.find(f => f.objectData.month === selectedMonth);
      if (existing) {
        await updateFinanceRecord(existing.objectId, data);
      } else {
        await createFinanceRecord(selectedMonth, data.income, data.expense, data.sip_started, data.learning_sessions);
      }
      await loadFinanceData();
      alert('Finance data saved successfully!');
    } catch (error) {
      console.error('Failed to save finance data:', error);
      alert('Failed to save finance data. Please try again.');
    }
  };

  const selectedMonthData = financeData.find(f => f.objectData.month === selectedMonth);

  // Generate available months (last 12 months + current if needed)
  const generateAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
    }
    // Add any months from data that are not in the list
    financeData.forEach(f => {
      if (!months.includes(f.objectData.month)) {
        months.push(f.objectData.month);
      }
    });
    return months.sort().reverse(); // Most recent first
  };

  const availableMonths = generateAvailableMonths();

  // Calculate year-to-date totals
  const currentYear = new Date().getFullYear();
  const ytdData = financeData.filter(f => f.objectData.month.startsWith(currentYear.toString()));
  const ytdIncome = ytdData.reduce((sum, f) => sum + (f.objectData.income || 0), 0);
  const ytdExpense = ytdData.reduce((sum, f) => sum + (f.objectData.expense || 0), 0);
  const ytdSavings = ytdIncome - ytdExpense;
  const ytdSavingsRate = ytdIncome > 0 ? ((ytdSavings / ytdIncome) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Tracker</h1>
          <p className="text-slate-500 mt-1">Monitor your financial progress and habits</p>
        </div>

        {/* Year-to-Date Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">${ytdIncome.toFixed(2)}</div>
            <div className="text-sm text-slate-500">YTD Income</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">${ytdExpense.toFixed(2)}</div>
            <div className="text-sm text-slate-500">YTD Expenses</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className={`text-2xl font-bold ${ytdSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${ytdSavings >= 0 ? ytdSavings.toFixed(2) : `(${Math.abs(ytdSavings).toFixed(2)})`}
            </div>
            <div className="text-sm text-slate-500">YTD Savings</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className={`text-2xl font-bold ${parseFloat(ytdSavingsRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ytdSavingsRate}%
            </div>
            <div className="text-sm text-slate-500">YTD Savings Rate</div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="glass-panel p-4 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Month to Edit</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {getMonthName(new Date(month + '-01').getMonth())} {new Date(month + '-01').getFullYear()}
              </option>
            ))}
          </select>
        </div>

        {/* Month Input */}
        <FinanceForm
          currentMonth={selectedMonth}
          existingData={selectedMonthData}
          onSave={handleSave}
        />

        {/* Progress Chart */}
        {financeData.length > 0 && (
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Financial Progress</h2>
            <FinanceChart financeData={financeData} />
          </div>
        )}

        {/* Insights */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Insights</h2>
          <div className="space-y-3">
            {ytdSavingsRate >= 20 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  ✓
                </div>
                <span className="text-green-800">Great job maintaining a high savings rate!</span>
              </div>
            )}
            {financeData.length >= 3 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  📊
                </div>
                <span className="text-blue-800">You've been tracking finances for {financeData.length} months. Keep it up!</span>
              </div>
            )}
            {selectedMonthData?.objectData.sip_started && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                  🎯
                </div>
                <span className="text-purple-800">Long-term investing habit established this month!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Finance />
    </ErrorBoundary>
  </React.StrictMode>
);