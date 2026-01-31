const { useState, useEffect } = React;

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

function RecordCard({ record, category, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = (type) => {
    const icons = {
      book: 'icon-book',
      skill: 'icon-zap',
      project: 'icon-code',
      application: 'icon-send',
      volunteering: 'icon-heart',
      achievement: 'icon-trophy',
      other: 'icon-star'
    };
    return icons[type] || 'icon-star';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="glass-panel p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
               style={{ backgroundColor: category?.objectData.color || '#64748b' }}>
            <div className={`${getTypeIcon(record.objectData.type)} text-lg`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{record.objectData.title}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span className="capitalize">{record.objectData.type}</span>
              <span>•</span>
              <span>{formatDate(record.objectData.date)}</span>
              {category && (
                <>
                  <span>•</span>
                  <span>{category.objectData.name}</span>
                </>
              )}
            </div>
            {record.objectData.description && (
              <p className={`text-slate-600 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {record.objectData.description}
              </p>
            )}
            {record.objectData.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {record.objectData.tags.split(',').map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className={`icon-chevron-${isExpanded ? 'up' : 'down'} text-sm`}></div>
          </button>
          <button
            onClick={() => onEdit(record)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="icon-edit-2 text-sm"></div>
          </button>
          <button
            onClick={() => onDelete(record)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <div className="icon-trash-2 text-sm"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordForm({ record, categories, onSave, onCancel }) {
  const [type, setType] = useState(record?.objectData.type || 'book');
  const [title, setTitle] = useState(record?.objectData.title || '');
  const [description, setDescription] = useState(record?.objectData.description || '');
  const [date, setDate] = useState(record?.objectData.date || formatDate(new Date()));
  const [categoryId, setCategoryId] = useState(record?.objectData.category_id || '');
  const [tags, setTags] = useState(record?.objectData.tags || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        type,
        title,
        description,
        date,
        category_id: categoryId,
        tags
      });
    } catch (error) {
      console.error('Failed to save record:', error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">
        {record ? 'Edit Record' : 'Add New Record'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
              required
            >
              <option value="book">Book</option>
              <option value="skill">Skill Learned</option>
              <option value="project">Project Built</option>
              <option value="application">Application/Experiment</option>
              <option value="volunteering">Volunteering Event</option>
              <option value="achievement">Achievement</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Enter title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            rows="3"
            placeholder="Describe this record..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category (optional)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field"
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.objectId} value={cat.objectId}>{cat.objectData.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LoadingSpinner /> : <><div className="icon-save"></div> {record ? 'Update' : 'Add'} Record</>}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Records() {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsData, categoriesData] = await Promise.all([
        getRecords(),
        getCategories()
      ]);
      setRecords(recordsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load records:', error);
    }
    setLoading(false);
  };

  const handleSave = async (recordData) => {
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.objectId, recordData);
      } else {
        await createRecord(
          recordData.type,
          recordData.title,
          recordData.description,
          recordData.date,
          recordData.category_id,
          recordData.tags
        );
      }
      setShowForm(false);
      setEditingRecord(null);
      await loadData();
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please try again.');
    }
  };

  const handleDelete = async (record) => {
    if (!confirm(`Delete "${record.objectData.title}"?`)) return;

    try {
      await deleteRecord(record.objectId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record. Please try again.');
    }
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    return record.objectData.type === filter;
  });

  const getCategoryById = (id) => {
    return categories.find(cat => cat.objectId === id);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Memory Vault</h1>
            <p className="text-slate-500 mt-1">Your collection of achievements and experiences</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <div className="icon-plus"></div>
            Add Record
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Records' },
            { value: 'book', label: 'Books' },
            { value: 'skill', label: 'Skills' },
            { value: 'project', label: 'Projects' },
            { value: 'achievement', label: 'Achievements' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <RecordForm
            record={editingRecord}
            categories={categories}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingRecord(null);
            }}
          />
        )}

        {/* Records */}
        {filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords.map(record => (
              <RecordCard
                key={record.objectId}
                record={record}
                category={getCategoryById(record.objectData.category_id)}
                onEdit={(record) => {
                  setEditingRecord(record);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <div className="icon-library text-2xl"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {filter === 'all' ? 'No Records Yet' : `No ${filter} Records`}
            </h3>
            <p className="text-slate-500 mb-4">
              Start building your memory vault by adding your first {filter === 'all' ? 'record' : filter}.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <div className="icon-plus"></div>
              Add Your First Record
            </button>
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
      <Records />
    </ErrorBoundary>
  </React.StrictMode>
);