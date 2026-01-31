function Header({ title }) {
  const currentPath = window.location.pathname;
  
  const navItems = [
    { name: 'Dashboard', path: 'index.html', icon: 'icon-layout-grid' },
    { name: 'Categories', path: 'categories.html', icon: 'icon-layers' },
    { name: 'Records', path: 'records.html', icon: 'icon-library' },
    { name: 'Finance', path: 'finance.html', icon: 'icon-wallet' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => window.location.href = 'index.html'}>
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white cursor-pointer">
            <div className="icon-activity text-lg"></div>
          </div>
          <h1 className="font-semibold text-slate-900 text-lg hidden sm:block">LifeOS</h1>
        </div>
        
        <nav className="flex items-center gap-1">
           {navItems.map(item => {
              // Simple active check
              const isActive = currentPath.endsWith(item.path) || (item.path === 'index.html' && (currentPath === '/' || currentPath.endsWith('/')));

              return (
                <a
                  key={item.name}
                  href={item.path}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`${item.icon} text-lg`}></div>
                  <span className="hidden sm:inline">{item.name}</span>
                </a>
              );
           })}
        </nav>
      </div>
    </header>
  );
}

function PageContainer({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>
  );
}

// Expose to window
window.PageContainer = PageContainer;
window.LoadingSpinner = LoadingSpinner;
window.Header = Header;