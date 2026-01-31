/**
 * Utility functions for Trickle Database interactions
 */

// Check if Trickle functions are available
const hasTrickle = typeof trickleListObjects !== 'undefined';

if (!hasTrickle) {
  console.warn('Trickle database not available, using mock data');
}

const DB_TABLES = {
  CATEGORIES: 'categories',
  TRACKS: 'tracks',
  LOGS: 'logs',
  FINANCE: 'finance',
  RECORDS: 'records'
};

// Helper functions for export
function getCategoryName(categoryId) {
  const cat = mockCategories.find(c => c.objectId === categoryId);
  return cat ? cat.objectData.name : 'Unknown Category';
}

function getTrackName(trackId) {
  const track = mockTracks.find(t => t.objectId === trackId);
  return track ? track.objectData.name : 'Unknown Track';
}

// Cache for categories to reduce API calls
let categoriesCache = null;

// Mock persistent storage for demo (using localStorage)
const loadMockData = () => {
  try {
    const rawCategories = localStorage.getItem('lifeos_mock_categories') || btoa('[]');
    console.log('Raw categories length:', rawCategories.length);
    let parsedCategories = [];
    try {
      parsedCategories = JSON.parse(atob(rawCategories));
      console.log('Parsed categories successfully:', parsedCategories.length);
    } catch (e) {
      console.error('JSON parse error for categories:', e);
      parsedCategories = [];
    }

    let parsedTracks = [];
    try {
      parsedTracks = JSON.parse(atob(localStorage.getItem('mock_tracks') || btoa('[]')));
    } catch (e) {
      console.error('JSON parse error for tracks:', e);
      parsedTracks = [];
    }

    let parsedLogs = [];
    try {
      parsedLogs = JSON.parse(atob(localStorage.getItem('mock_logs') || btoa('[]')));
    } catch (e) {
      console.error('JSON parse error for logs:', e);
      parsedLogs = [];
    }

    let parsedRecords = [];
    try {
      parsedRecords = JSON.parse(atob(localStorage.getItem('mock_records') || btoa('[]')));
    } catch (e) {
      console.error('JSON parse error for records:', e);
      parsedRecords = [];
    }

    let parsedFinance = [];
    try {
      parsedFinance = JSON.parse(atob(localStorage.getItem('mock_finance') || btoa('[]')));
    } catch (e) {
      console.error('JSON parse error for finance:', e);
      parsedFinance = [];
    }

    const data = {
      categories: parsedCategories,
      tracks: parsedTracks,
      logs: parsedLogs,
      records: parsedRecords,
      finance: parsedFinance
    };

    // Validate data integrity - ensure all items have unique IDs
    const validateAndFix = (items, type) => {
      const seen = new Set();
      const valid = [];
      items.forEach(item => {
        if (item.objectId && !seen.has(item.objectId)) {
          seen.add(item.objectId);
          valid.push(item);
        } else {
          console.warn(`Duplicate or invalid ${type} ID found, skipping:`, item);
        }
      });
      return valid;
    };

    console.log('Parsed categories:', data.categories.length);
    return {
      categories: data.categories, // validateAndFix(data.categories, 'category'),
      tracks: data.tracks, // validateAndFix(data.tracks, 'track'),
      logs: data.logs, // validateAndFix(data.logs, 'log'),
      records: data.records, // validateAndFix(data.records, 'record'),
      finance: data.finance // validateAndFix(data.finance, 'finance')
    };
  } catch (error) {
    console.warn('Error loading mock data, starting fresh');
    return { categories: [], tracks: [], logs: [], records: [], finance: [] };
  }
};

const saveMockData = (data) => {
  try {
    const catStr = btoa(JSON.stringify(data.categories));
    localStorage.setItem('lifeos_mock_categories', catStr);
    localStorage.setItem('mock_tracks', btoa(JSON.stringify(data.tracks)));
    localStorage.setItem('mock_logs', btoa(JSON.stringify(data.logs)));
    localStorage.setItem('mock_records', btoa(JSON.stringify(data.records)));
    localStorage.setItem('mock_finance', btoa(JSON.stringify(data.finance)));
    console.log('Saved mock data for categories:', data.categories.length, 'encoded length:', catStr.length);
  } catch (error) {
    console.error('Failed to save mock data:', error);
  }
};

let mockData = loadMockData();
let mockCategories = mockData.categories;
let mockTracks = mockData.tracks;
let mockLogs = mockData.logs;
let mockRecords = mockData.records;
let mockFinance = mockData.finance;

async function getCategories() {
  let trickleCategories = [];
  if (hasTrickle) {
    try {
      // Add timeout to prevent hanging
      const result = await Promise.race([
        trickleListObjects(DB_TABLES.CATEGORIES, 100, true),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      trickleCategories = result?.items || [];
    } catch (error) {
      console.error('Failed to fetch categories from Trickle:', error);
    }
  }

  // Merge Trickle and mock data, preferring Trickle for duplicates
  const allCategories = [...mockCategories];
  const mockIds = new Set(mockCategories.map(c => c.objectId));

  // Add Trickle categories that aren't in mock
  trickleCategories.forEach(tc => {
    if (!mockIds.has(tc.objectId)) {
      allCategories.push(tc);
    }
  });

  // Sort by weight descending
  return allCategories.sort((a, b) => (b.objectData.weight || 0) - (a.objectData.weight || 0));
}

async function getTracks(categoryId = null, includeDeleted = false) {
  if (hasTrickle) {
    try {
      const result = await trickleListObjects(DB_TABLES.TRACKS, 100, true);
      let tracks = result?.items || [];
      if (categoryId) {
        tracks = tracks.filter(t => t.objectData.category_id === categoryId);
      }
      if (!includeDeleted) {
        tracks = tracks.filter(t => !t.objectData.deleted_at);
      }
      return tracks;
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    }
  }

  // Return mock data
  let tracks = mockTracks.slice();
  if (categoryId) {
    tracks = tracks.filter(t => t.objectData.category_id === categoryId);
  }
  if (!includeDeleted) {
    tracks = tracks.filter(t => !t.objectData.deleted_at);
  }
  return tracks;
}

async function getLogs(startDate, endDate) {
  if (hasTrickle) {
    try {
      const result = await trickleListObjects(DB_TABLES.LOGS, 500, true);
      const items = result?.items || [];

      return items.filter(item => {
        const logDate = item.objectData.date;
        return logDate >= startDate && logDate <= endDate;
      });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }

  // Return mock data
  return mockLogs.filter(item => {
    const logDate = item.objectData.date;
    return logDate >= startDate && logDate <= endDate;
  });
}

async function createLog(date, trackId, value, note = '') {
  if (hasTrickle) {
    try {
      return await trickleCreateObject(DB_TABLES.LOGS, {
        date,
        track_id: trackId,
        value,
        note
      });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }

  // Mock create - add to mock storage
  const newLog = {
    objectId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    objectData: {
      date,
      track_id: trackId,
      value,
      note
    }
  };
  mockLogs.push(newLog);
  saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords });
  console.log('Mock log created:', newLog);
  return newLog;
}

async function createTrack(categoryId, name, type, frequency, day_of_week = null, day_of_month = null) {
  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleCreateObject(DB_TABLES.TRACKS, {
          category_id: categoryId,
          name,
          type,
          frequency,
          day_of_week,
          day_of_month
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to create track:', error);
      throw error;
    }
  }

  // Mock create - add to mock storage
  const newTrack = {
    objectId: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    objectData: {
      category_id: categoryId,
      name,
      type,
      frequency,
      day_of_week,
      day_of_month,
      deleted_at: null
    }
  };
  mockTracks.push(newTrack);
  saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords });
  console.log('Mock track created:', newTrack);
  return newTrack;
}

async function updateLog(logId, data) {
  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleUpdateObject(DB_TABLES.LOGS, logId, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to update log:', error);
      throw error;
    }
  }

  // Mock update - modify in mock storage
  const index = mockLogs.findIndex(l => l.objectId === logId);
  if (index > -1) {
    mockLogs[index] = {
      ...mockLogs[index],
      objectData: { ...mockLogs[index].objectData, ...data }
    };
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
    console.log('Mock log updated:', logId, data);
  }
  return true;
}

async function deleteLog(logId) {
  return await trickleDeleteObject(DB_TABLES.LOGS, logId);
}

async function deleteTrack(trackId) {
  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleDeleteObject(DB_TABLES.TRACKS, trackId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to delete track:', error);
      throw error;
    }
  }

  // Mock soft delete - set deleted_at
  const index = mockTracks.findIndex(t => t.objectId === trackId);
  if (index > -1) {
    mockTracks[index].objectData.deleted_at = new Date().toISOString();
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords });
    console.log('Mock track soft deleted:', trackId);
  }
  return true;
}

async function updateCategory(categoryId, updates) {
  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleUpdateObject(DB_TABLES.CATEGORIES, categoryId, updates),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  // Mock update - modify in mock storage
  const index = mockCategories.findIndex(c => c.objectId === categoryId);
  if (index > -1) {
    mockCategories[index] = {
      ...mockCategories[index],
      objectData: { ...mockCategories[index].objectData, ...updates }
    };
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords });
    console.log('Mock category updated:', categoryId, updates);
  }
  return true;
}

async function deleteCategory(categoryId) {
  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleDeleteObject(DB_TABLES.CATEGORIES, categoryId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  // Mock delete - remove from mock storage
  const index = mockCategories.findIndex(c => c.objectId === categoryId);
  if (index > -1) {
    mockCategories.splice(index, 1);
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
    console.log('Mock category deleted:', categoryId);
  }
  return true;
}

async function getFinance(month) {
  if (hasTrickle) {
    try {
      const result = await trickleListObjects(DB_TABLES.FINANCE, 100, true);
      const items = result?.items || [];
      return month ? items.filter(item => item.objectData.month === month) : items;
    } catch (error) {
      console.error('Failed to fetch finance from Trickle, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Return mock data
  return month ? mockFinance.filter(item => item.objectData.month === month) : mockFinance.slice();
}

async function createFinanceRecord(month, income, expense, sipStarted, learningSessions) {
  console.log('createFinanceRecord called with:', { month, income, expense, sipStarted, learningSessions });
  console.log('hasTrickle:', hasTrickle);
  if (hasTrickle) {
    try {
      const result = await trickleCreateObject(DB_TABLES.FINANCE, {
        month,
        income,
        expense,
        sip_started: sipStarted,
        learning_sessions: learningSessions
      });
      console.log('createFinanceRecord success:', result);
      return result;
    } catch (error) {
      console.error('createFinanceRecord Trickle failed, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Mock create - add to mock storage
  const newFinance = {
    objectId: `finance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    objectData: {
      month,
      income,
      expense,
      sip_started: sipStarted,
      learning_sessions: learningSessions
    }
  };
  mockFinance.push(newFinance);
  saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
  console.log('Mock finance created:', newFinance);
  return newFinance;
}

async function updateFinanceRecord(financeId, data) {
  console.log('updateFinanceRecord called, hasTrickle:', hasTrickle, 'financeId:', financeId, 'data:', data);
  if (hasTrickle) {
    try {
      const result = await trickleUpdateObject(DB_TABLES.FINANCE, financeId, data);
      console.log('updateFinanceRecord success:', result);
      return result;
    } catch (error) {
      console.error('updateFinanceRecord Trickle failed, falling back to mock:', error);
      // Fall back to mock
    }
  }
  console.log('updateFinanceRecord using mock');
  // Mock update - modify in mock storage
  const index = mockFinance.findIndex(f => f.objectId === financeId);
  if (index > -1) {
    mockFinance[index] = {
      ...mockFinance[index],
      objectData: { ...mockFinance[index].objectData, ...data }
    };
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
    console.log('Mock finance updated:', financeId, data);
  }
  return true;
}


async function createCategory(name, icon, color, weight) {

  if (hasTrickle) {
    try {
      return await Promise.race([
        trickleCreateObject(DB_TABLES.CATEGORIES, {
          name,
          icon,
          color,
          weight,
          status: 'active'
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Trickle create category failed, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Mock create - add to mock storage
  const newCategory = {
    objectId: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    objectData: {
      name,
      icon,
      color,
      weight,
      status: 'active'
    }
  };
  mockCategories.push(newCategory);
  saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords });
  console.log('Mock category created:', newCategory);
  return newCategory;
}

async function getRecords(categoryId = null) {
  if (hasTrickle) {
    try {
      const result = await trickleListObjects(DB_TABLES.RECORDS, 500, true);
      let records = result?.items || [];
      if (categoryId) {
        records = records.filter(r => r.objectData.category_id === categoryId);
      }
      return records.sort((a, b) => new Date(b.objectData.date) - new Date(a.objectData.date));
    } catch (error) {
      console.error('Failed to fetch records from Trickle, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Return mock data
  let records = mockRecords.slice();
  if (categoryId) {
    records = records.filter(r => r.objectData.category_id === categoryId);
  }
  return records.sort((a, b) => new Date(b.objectData.date) - new Date(a.objectData.date));
}

async function createRecord(type, title, description, date, categoryId, tags = '') {
  console.log('createRecord called with:', { type, title, description, date, categoryId, tags });
  console.log('hasTrickle:', hasTrickle);
  if (hasTrickle) {
    try {
      const result = await trickleCreateObject(DB_TABLES.RECORDS, {
        type,
        title,
        description,
        date,
        category_id: categoryId,
        tags
      });
      console.log('createRecord success:', result);
      return result;
    } catch (error) {
      console.error('createRecord Trickle failed, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Mock create - add to mock storage
  const newRecord = {
    objectId: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    objectData: {
      type,
      title,
      description,
      date,
      category_id: categoryId,
      tags
    }
  };
  mockRecords.push(newRecord);
  saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
  console.log('Mock record created:', newRecord);
  return newRecord;
}

async function updateRecord(recordId, data) {
  if (hasTrickle) {
    try {
      return await trickleUpdateObject(DB_TABLES.RECORDS, recordId, data);
    } catch (error) {
      console.error('updateRecord Trickle failed, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Mock update - modify in mock storage
  const index = mockRecords.findIndex(r => r.objectId === recordId);
  if (index > -1) {
    mockRecords[index] = {
      ...mockRecords[index],
      objectData: { ...mockRecords[index].objectData, ...data }
    };
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
    console.log('Mock record updated:', recordId, data);
  }
  return true;
}

async function deleteRecord(recordId) {
  if (hasTrickle) {
    try {
      return await trickleDeleteObject(DB_TABLES.RECORDS, recordId);
    } catch (error) {
      console.error('deleteRecord Trickle failed, falling back to mock:', error);
      // Fall back to mock
    }
  }

  // Mock delete - remove from mock storage
  const index = mockRecords.findIndex(r => r.objectId === recordId);
  if (index > -1) {
    mockRecords.splice(index, 1);
    saveMockData({ categories: mockCategories, tracks: mockTracks, logs: mockLogs, records: mockRecords, finance: mockFinance });
    console.log('Mock record deleted:', recordId);
  }
  return true;
}

async function exportData() {
  try {
    const [categories, tracks, logs, finance, records] = await Promise.all([
      getCategories(),
      getTracks(),
      getLogs('2000-01-01', '2099-12-31'), // Get all logs
      hasTrickle ? trickleListObjects(DB_TABLES.FINANCE, 1000, true) : Promise.resolve({ items: [] }),
      getRecords()
    ]);

    return {
      categories: categories.map(c => c.objectData),
      tracks: tracks.map(t => t.objectData),
      logs: logs.map(l => l.objectData),
      finance: (finance?.items || []).map(f => f.objectData),
      records: records.map(r => r.objectData)
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
}

function downloadCSV(data, filename) {
  const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportToCSV() {
  try {
    const data = await exportData();

    // Export logs
    if (data.logs.length > 0) {
      const logHeaders = ['date', 'track_id', 'value', 'note'];
      const logRows = [logHeaders, ...data.logs.map(log => [
        log.date, log.track_id, log.value, log.note || ''
      ])];
      downloadCSV(logRows, 'lifeos_logs.csv');
    }

    // Export categories
    if (data.categories.length > 0) {
      const catHeaders = ['name', 'icon', 'color', 'weight', 'status'];
      const catRows = [catHeaders, ...data.categories.map(cat => [
        cat.name, cat.icon, cat.color, cat.weight, cat.status
      ])];
      downloadCSV(catRows, 'lifeos_categories.csv');
    }

    // Export tracks
    if (data.tracks.length > 0) {
      const trackHeaders = ['category_id', 'name', 'type', 'frequency'];
      const trackRows = [trackHeaders, ...data.tracks.map(track => [
        track.category_id, track.name, track.type, track.frequency
      ])];
      downloadCSV(trackRows, 'lifeos_tracks.csv');
    }

    // Export finance
    if (data.finance.length > 0) {
      const financeHeaders = ['month', 'income', 'expense', 'sip_started', 'learning_sessions'];
      const financeRows = [financeHeaders, ...data.finance.map(f => [
        f.month, f.income, f.expense, f.sip_started, f.learning_sessions
      ])];
      downloadCSV(financeRows, 'lifeos_finance.csv');
    }

    // Export records
    if (data.records.length > 0) {
      const recordHeaders = ['type', 'title', 'description', 'date', 'category_id', 'tags'];
      const recordRows = [recordHeaders, ...data.records.map(r => [
        r.type, r.title, r.description || '', r.date, r.category_id || '', r.tags || ''
      ])];
      downloadCSV(recordRows, 'lifeos_records.csv');
    }

    alert('Data exported successfully!');

  } catch (error) {
    console.error('Failed to export to CSV:', error);
    alert('Failed to export data. Please try again.');
  }
}

// Expose to window to ensure visibility across Babel scripts
window.getCategories = getCategories;
window.getTracks = getTracks;
window.getLogs = getLogs;
window.createLog = createLog;
window.createTrack = createTrack;
window.updateLog = updateLog;
window.deleteLog = deleteLog;
window.deleteTrack = deleteTrack;
window.updateCategory = updateCategory;
window.deleteCategory = deleteCategory;
window.getFinance = getFinance;
window.createFinanceRecord = createFinanceRecord;
window.createCategory = createCategory;
window.getRecords = getRecords;
window.createRecord = createRecord;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.exportToCSV = exportToCSV;
window.DB_TABLES = DB_TABLES;
window.updateFinanceRecord = updateFinanceRecord;

// Monthly Report Utility Functions
/**
 * Get all data needed for monthly report
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (0-11, where 0 = January)
 * @returns {Object} { tracks, logs, categories, dailyStats }
 */
async function getMonthlyReportData(year, month) {
  const startDate = formatDate(new Date(year, month, 1));
  const endDate = formatDate(new Date(year, month + 1, 0));
  
  const [tracks, logs, categories] = await Promise.all([
    getTracks(null, true), // include deleted to check status
    getLogs(startDate, endDate),
    getCategories()
  ]);
  
  // Filter active tracks only
  const activeTracks = tracks.filter(t => !t.objectData.deleted_at);
  
  // Calculate daily statistics
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyStats = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    
    // Get tracks due on this date
    const dueTracks = activeTracks.filter(track => {
      const freq = track.objectData.frequency || 'daily';
      if (freq === 'daily') return true;
      if (freq === 'weekly') {
        const dayOfWeek = track.objectData.day_of_week;
        return dayOfWeek !== null && dayOfWeek !== undefined ? date.getDay() === dayOfWeek : date.getDay() === 0;
      }
      if (freq === 'monthly') {
        const dayOfMonth = track.objectData.day_of_month;
        return dayOfMonth !== null && dayOfMonth !== undefined ? day === Math.min(dayOfMonth, daysInMonth) : day === daysInMonth;
      }
      return false;
    });
    
    // Get logs for this date
    const dayLogs = logs.filter(log => log.objectData.date === dateStr);
    
    // Calculate completion
    const completedTrackIds = new Set();
    dayLogs.forEach(log => {
      const track = activeTracks.find(t => t.objectId === log.objectData.track_id);
      if (track) {
        if (track.objectData.type === 'checkbox') {
          if (log.objectData.value === 1) completedTrackIds.add(log.objectData.track_id);
        } else if (log.objectData.value > 0) {
          completedTrackIds.add(log.objectData.track_id);
        }
      }
    });
    
    dailyStats.push({
      date: dateStr,
      day: day,
      dueCount: dueTracks.length,
      completedCount: completedTrackIds.size,
      completionRate: dueTracks.length > 0 ? (completedTrackIds.size / dueTracks.length) * 100 : 0
    });
  }
  
  // Calculate per-track statistics
  const trackStats = activeTracks.map(track => {
    const trackLogs = logs.filter(log => log.objectData.track_id === track.objectId);
    const category = categories.find(c => c.objectId === track.objectData.category_id);
    
    // Calculate completion rate for this track
    let completedDays = 0;
    let totalDueDays = 0;
    
    dailyStats.forEach(dayStat => {
      const dayNum = dayStat.day;
      const checkDate = new Date(year, month, dayNum);
      
      // Check if this track is due on this day
      const freq = track.objectData.frequency || 'daily';
      let isDue = false;
      
      if (freq === 'daily') {
        isDue = true;
      } else if (freq === 'weekly') {
        const dayOfWeek = track.objectData.day_of_week;
        isDue = dayOfWeek !== null && dayOfWeek !== undefined ? checkDate.getDay() === dayOfWeek : checkDate.getDay() === 0;
      } else if (freq === 'monthly') {
        const dayOfMonth = track.objectData.day_of_month;
        const lastDay = new Date(year, month + 1, 0).getDate();
        isDue = dayOfMonth !== null && dayOfMonth !== undefined ? dayNum === Math.min(dayOfMonth, lastDay) : dayNum === lastDay;
      }
      
      if (isDue) {
        totalDueDays++;
        const hasLog = trackLogs.some(log => {
          if (track.objectData.type === 'checkbox') return log.objectData.value === 1;
          return log.objectData.value > 0;
        });
        if (hasLog) completedDays++;
      }
    });
    
    return {
      track,
      category: category ? category.objectData.name : 'Unknown',
      totalLogs: trackLogs.length,
      completedDays,
      totalDueDays,
      completionRate: totalDueDays > 0 ? (completedDays / totalDueDays) * 100 : 0
    };
  });
  
  return {
    tracks: activeTracks,
    logs,
    categories,
    dailyStats,
    trackStats,
    year,
    month
  };
}

window.getMonthlyReportData = getMonthlyReportData;