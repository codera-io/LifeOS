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

function CategorySummary({ categories, onCategoryAdded }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'icon-star',
    color: '#64748b'
  });
  const [isCreating, setIsCreating] = useState(false);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Life Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <div className="icon-plus"></div>
          Add Category
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="input-field"
              placeholder="Category name..."
              required
            />
            <div className="flex gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div
            key={cat.objectId}
            className="glass-panel p-6 hover:shadow-md transition-shadow group"
          >
            <div
              onClick={() => navigateToCategory(cat.objectId)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.objectData.color}20`, color: cat.objectData.color }}
                >
                  <div className={`${cat.objectData.icon} text-xl`}></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{cat.objectData.name}</h3>
                  <p className="text-sm text-slate-500">Click to view tracks</p>
                </div>
                <div className="icon-chevron-right text-slate-300 group-hover:text-slate-400"></div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(cat);
                }}
                className="flex-1 btn-secondary text-sm"
                title="Edit category"
              >
                <div className="icon-edit-2"></div>
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.objectId, cat.objectData.name);
                }}
                className="flex-1 btn-secondary text-sm text-red-600 hover:bg-red-50"
                title="Delete category"
              >
                <div className="icon-trash-2"></div>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
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
      setCategories([]);
    } finally {
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

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <CategorySummary categories={categories} onCategoryAdded={loadCategories} />
    </PageContainer>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Categories />
    </ErrorBoundary>
  </React.StrictMode>
);