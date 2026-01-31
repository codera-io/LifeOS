const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date) {
  // YYYY-MM-DD
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function getTodayStr() {
  return formatDate(new Date());
}

function getMonthName(monthIndex) {
  return MONTH_NAMES[monthIndex];
}

// Expose to window
window.getDaysInMonth = getDaysInMonth;
window.getFirstDayOfMonth = getFirstDayOfMonth;
window.formatDate = formatDate;
window.getTodayStr = getTodayStr;
window.getMonthName = getMonthName;
window.DAYS_OF_WEEK = DAYS_OF_WEEK;