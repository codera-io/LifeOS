const { useState, useEffect } = React;

// Define ErrorBoundary here to avoid scope issues in Babel standalone
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

function getCreationDate(track) {
  // Extract timestamp from objectId: track_${timestamp}_${random}
  const parts = track.objectId.split('_');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[1]);
    return new Date(timestamp);
  }
  return new Date(0); // fallback
}

function isTrackDueOnDate(track, date) {
  const freq = track.objectData.frequency || 'daily'; // Default to daily
  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    const dayOfWeek = track.objectData.day_of_week;
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      return date.getDay() === dayOfWeek;
    }
    // Default to Sunday if not set
    return date.getDay() === 0;
  }

  if (freq === 'monthly') {
    const dayOfMonth = track.objectData.day_of_month;
    if (dayOfMonth !== null && dayOfMonth !== undefined) {
      return date.getDate() === Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
    }
    // Default to last day of month
    return date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  return false;
}

function isTrackActiveOnDate(track, date) {
  const created = getCreationDate(track);
  const deleted = track.objectData.deleted_at ? new Date(track.objectData.deleted_at) : null;
  return created <= date && (!deleted || deleted > date);
}

function CalendarCell({ day, month, year, intensity, onClick, isToday }) {
  if (!day) return <div className="aspect-square bg-transparent"></div>;

  // Intensity levels: 0 (none) -> 4 (high)
  const intensityColors = {
    0: 'bg-white hover:bg-slate-50',
    1: 'bg-slate-100 hover:bg-slate-200',
    2: 'bg-blue-100 hover:bg-blue-200',
    3: 'bg-blue-300 hover:bg-blue-400',
    4: 'bg-blue-500 text-white hover:bg-blue-600'
  };

  const bgClass = intensityColors[intensity] || intensityColors[0];
  const textClass = intensity >= 3 ? 'text-white' : 'text-slate-700';
  const todayRing = isToday ? 'ring-2 ring-slate-900 ring-offset-2 z-10' : '';

  return (
    <div
      onClick={() => onClick(year, month, day)}
      className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm font-medium ${bgClass} ${textClass} ${todayRing}`}
    >
      {day}
    </div>
  );
}

function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMonthData();
  }, [year, month]);

  const loadData = async () => {
    try {
      const fetchedTracks = await window.getTracks(null, true); // include deleted
      setTracks(fetchedTracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setTracks([]);
    }
  };

  const loadMonthData = async () => {
    setIsLoading(true);
    const startStr = formatDate(new Date(year, month, 1));
    const endStr = formatDate(new Date(year, month + 1, 0));

    try {
      // Uses global window.getLogs if defined, or local scope
      const fetchedLogs = await window.getLogs(startStr, endStr);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      // For demo purposes, show empty logs if Trickle is not available
      setLogs([]);
    }
    setIsLoading(false);
  };

  const handleDayClick = (y, m, d) => {
    const dateStr = formatDate(new Date(y, m, d));
    window.location.href = `day_detail.html?date=${dateStr}`;
  };

  const getDayIntensity = (d) => {
    if (!tracks.length) return 0;

    const date = new Date(year, month, d);
    const dateStr = formatDate(date);

    // Tracks due on this date and active
    const dueTracks = tracks.filter(track =>
      isTrackActiveOnDate(track, date) && isTrackDueOnDate(track, date)
    );

    if (dueTracks.length === 0) return 0;

    // Logs for this date
    const dayLogs = logs.filter(log => log.objectData.date === dateStr);

    // Completed tracks
    const completedTrackIds = new Set();
    dayLogs.forEach(log => {
      const track = tracks.find(t => t.objectId === log.objectData.track_id);
      if (track && (track.objectData.type === 'checkbox' ? log.objectData.value === 1 : log.objectData.value > 0)) {
        completedTrackIds.add(log.objectData.track_id);
      }
    });

    const completed = completedTrackIds.size;
    const percentage = completed / dueTracks.length;
    const intensity = Math.floor(percentage * 4);
    console.log(`Day ${d}: due=${dueTracks.length}, completed=${completed}, intensity=${intensity}`);
    return intensity;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {getMonthName(month)} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = 'daily_log.html'}
            className="btn-primary text-sm"
          >
            <div className="icon-plus"></div>
            Log Today
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <div className="icon-chevron-left"></div>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium px-3 hover:bg-slate-100 rounded-md">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <div className="icon-chevron-right"></div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <CalendarCell key={`empty-${i}`} />
          ))}
          
          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
            return (
              <CalendarCell 
                key={d} 
                day={d} 
                month={month} 
                year={year} 
                intensity={getDayIntensity(d)}
                isToday={isToday}
                onClick={handleDayClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategorySummary({ categories, onCategoryAdded }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'icon-star',
    color: '#64748b'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Show only first 3 categories on dashboard
  const displayedCategories = categories.slice(0, 3);
  const hasMoreCategories = categories.length > 3;

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`Delete category "${categoryName}"? This will also delete all tracks and logs in this category.`)) return;

    try {
      await window.deleteCategory(categoryId);
      onCategoryAdded();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.objectData.name,
      icon: category.objectData.icon,
      color: category.objectData.color
    });
    setShowAddForm(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setIsCreating(true);
    try {
      if (editingCategory) {
        // Edit existing category
        await window.updateCategory(editingCategory.objectId, {
          name: newCategory.name,
          icon: newCategory.icon,
          color: newCategory.color
        });
      } else {
        // Create new category
        await createCategory(newCategory.name, newCategory.icon, newCategory.color, 5);
      }

      setNewCategory({ name: '', icon: 'icon-star', color: '#64748b' });
      setShowAddForm(false);
      setEditingCategory(null);
      onCategoryAdded();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
    setIsCreating(false);
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <div className="icon-layers text-xl"></div>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Categories Yet</h3>
        <p className="text-slate-500 mb-4 text-sm max-w-xs">
          Create categories for different areas of your life like Career, Finance, Learning, etc.
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <div className="icon-plus"></div> Add Your First Category
        </button>

        {showAddForm && (
          <div className="mt-6 w-full max-w-sm">
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="input-field"
                placeholder="e.g., Career, Finance, Learning..."
                required
              />
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isCreating ? <LoadingSpinner /> : 'Create Category'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const navigateToCategory = (id) => {
    window.location.href = `category_detail.html?id=${id}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Life Categories</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <div className="icon-plus text-sm"></div>
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-medium text-slate-900 mb-3">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h4>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="input-field"
              placeholder="Category name..."
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isCreating ? <LoadingSpinner /> : (editingCategory ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                  setNewCategory({ name: '', icon: 'icon-star', color: '#64748b' });
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {displayedCategories.map(cat => (
          <div
            key={cat.objectId}
            className="glass-panel p-4 hover:shadow-md transition-shadow flex items-center gap-4 group"
          >
            <div
              onClick={() => navigateToCategory(cat.objectId)}
              className="cursor-pointer flex items-center gap-4 flex-1"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${cat.objectData.color}20`, color: cat.objectData.color }}
              >
                <div className={`${cat.objectData.icon} text-xl`}></div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{cat.objectData.name}</h4>
              </div>
              <div className="icon-chevron-right text-slate-300 group-hover:text-slate-400"></div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(cat);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                title="Edit category"
              >
                <div className="icon-edit-2 text-sm"></div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.objectId, cat.objectData.name);
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete category"
              >
                <div className="icon-trash-2 text-sm"></div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMoreCategories && (
        <div className="text-center pt-4">
          <button
            onClick={() => window.location.href = 'categories.html'}
            className="btn-secondary"
          >
            <div className="icon-layers"></div>
            View All Categories
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      // Uses global window.getCategories
      let cats = await window.getCategories();
      console.log('Categories loaded:', cats);

      // If no categories exist, create defaults
      if (cats.length === 0) {
        console.log('No categories found, creating defaults...');
        await createDefaultCategories();
        cats = await window.getCategories();
        console.log('Default categories created:', cats);
      }

      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to empty state
      setCategories([]);
    } finally {
      // Always set loading to false
      setLoading(false);
    }
  };

  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'Career', icon: 'icon-briefcase', color: '#3b82f6', weight: 10 },
      { name: 'Finance', icon: 'icon-wallet', color: '#10b981', weight: 9 },
      { name: 'Learning', icon: 'icon-book-open', color: '#f59e0b', weight: 7 },
      { name: 'Self', icon: 'icon-user', color: '#ef4444', weight: 6 },
      { name: 'Coding / Content', icon: 'icon-code', color: '#8b5cf6', weight: 8 },
      { name: 'Volunteering / Contribution', icon: 'icon-heart', color: '#ec4899', weight: 4 },
      { name: 'Experiments & Opportunities', icon: 'icon-flask', color: '#06b6d4', weight: 5 }
    ];

    for (const cat of defaultCategories) {
      try {
        await window.createCategory(cat.name, cat.icon, cat.color, cat.weight);
      } catch (error) {
        console.error('Failed to create default category:', cat.name, error);
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);


  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Life Dashboard</h1>
        <a 
          href="monthly_report.html" 
          className="btn-secondary text-sm"
        >
          <div className="icon-bar-chart-2"></div>
          Monthly Report
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardCalendar />
        </div>
        <div className="lg:col-span-1">
          {loading ? <LoadingSpinner /> : <CategorySummary categories={categories} onCategoryAdded={loadCategories} />}
        </div>
      </div>
    </PageContainer>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);