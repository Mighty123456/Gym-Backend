const formatIndianPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const getPlanAmount = (plan) => {
  const planPrices = {
    '1month': 1500,
    'quarterly': 5000,
    'yearly': 8000
  };
  return planPrices[plan] || 0;
};

const getPlanDisplayName = (plan) => {
  const planNames = {
    '1month': '1 Month',
    'quarterly': '6 Months',
    'yearly': '1 Year'
  };
  return planNames[plan] || plan;
};

module.exports = {
  formatIndianPrice,
  getPlanAmount,
  getPlanDisplayName
}; 