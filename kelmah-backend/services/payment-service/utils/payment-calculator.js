/**
 * Payment Calculator Utility
 * Provides functions for calculating fees, taxes, and totals for payments
 */

/**
 * Calculate fees for a payment or payout transaction
 * @param {Object} options Options for fee calculation
 * @param {number} options.amount - The base amount of the transaction
 * @param {string} options.type - Type of transaction (payment, escrow, payout)
 * @param {string} options.method - Payment/payout method (card, mobile_money, bank_transfer, etc.)
 * @param {string} [options.currency='GHS'] - Currency code
 * @param {boolean} [options.isInternational=false] - Whether the transaction is international
 * @returns {Object} Calculated fees and totals
 */
exports.calculateFees = (options) => {
  const { 
    amount, 
    type, 
    method, 
    currency = 'GHS', 
    isInternational = false 
  } = options;
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (!type) {
    throw new Error('Transaction type is required');
  }
  
  if (!method) {
    throw new Error('Payment/payout method is required');
  }
  
  let processingFee = 0;
  let platformFee = 0;
  let tax = 0;
  
  // Calculate processing fee based on method
  switch (method) {
    case 'card':
      processingFee = amount * 0.025; // 2.5%
      break;
    case 'mobile_money':
      processingFee = amount * 0.015; // 1.5%
      break;
    case 'bank_transfer':
      processingFee = amount * 0.010; // 1.0%
      break;
    case 'paystack':
    case 'flutterwave':
      processingFee = amount * 0.015; // 1.5%
      break;
    case 'cash_pickup':
      processingFee = amount * 0.020; // 2.0%
      break;
    default:
      processingFee = amount * 0.020; // 2.0% default
  }
  
  // Additional fee for international transactions
  if (isInternational) {
    processingFee += amount * 0.01; // Additional 1%
  }
  
  // Calculate platform fee based on transaction type
  switch (type) {
    case 'payment':
      platformFee = amount * 0.05; // 5% platform fee
      break;
    case 'escrow':
      platformFee = amount * 0.03; // 3% platform fee
      break;
    case 'payout':
      platformFee = amount * 0.01; // 1% platform fee
      break;
    default:
      platformFee = amount * 0.02; // 2% default
  }
  
  // Calculate tax (Ghana VAT is 12.5%)
  if (currency === 'GHS') {
    tax = (processingFee + platformFee) * 0.125;
  }
  
  // Calculate total
  const totalFees = processingFee + platformFee + tax;
  const totalAmount = type === 'payout' ? amount - totalFees : amount + totalFees;
  
  return {
    amount,
    currency,
    processingFee: parseFloat(processingFee.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

/**
 * Calculate escrow release amount after fees
 * @param {Object} options Options for calculation
 * @param {number} options.amount - The base amount of the escrow
 * @param {string} [options.currency='GHS'] - Currency code
 * @param {number} [options.platformFeePercent=5] - Platform fee percentage (default 5%)
 * @returns {Object} Calculated amounts and fees
 */
exports.calculateEscrowRelease = (options) => {
  const { 
    amount, 
    currency = 'GHS', 
    platformFeePercent = 5 
  } = options;
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  const platformFee = amount * (platformFeePercent / 100);
  const tax = platformFee * 0.125; // 12.5% VAT on platform fee
  const totalDeductions = platformFee + tax;
  const workerAmount = amount - totalDeductions;
  
  return {
    amount,
    currency,
    platformFee: parseFloat(platformFee.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalDeductions: parseFloat(totalDeductions.toFixed(2)),
    workerAmount: parseFloat(workerAmount.toFixed(2))
  };
};

/**
 * Calculate milestone payments for a contract
 * @param {Object} options Options for calculation
 * @param {number} options.totalAmount - Total contract amount
 * @param {number} options.milestoneCount - Number of milestones
 * @param {string} [options.distribution='equal'] - Distribution method (equal, front_loaded, back_loaded, custom)
 * @param {number[]} [options.customDistribution] - Custom distribution percentages (must sum to 100)
 * @param {string} [options.currency='GHS'] - Currency code
 * @returns {Array} Array of milestone payment amounts
 */
exports.calculateMilestones = (options) => {
  const { 
    totalAmount, 
    milestoneCount, 
    distribution = 'equal', 
    customDistribution = [],
    currency = 'GHS'
  } = options;
  
  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Total amount must be greater than 0');
  }
  
  if (!milestoneCount || milestoneCount < 1) {
    throw new Error('Milestone count must be at least 1');
  }
  
  let milestoneAmounts = [];
  
  switch (distribution) {
    case 'equal':
      // Equal distribution
      const equalAmount = totalAmount / milestoneCount;
      milestoneAmounts = Array(milestoneCount).fill(parseFloat(equalAmount.toFixed(2)));
      break;
    
    case 'front_loaded':
      // Front-loaded distribution (first milestone gets more)
      const frontLoadedPercents = calculateFrontLoadedDistribution(milestoneCount);
      milestoneAmounts = frontLoadedPercents.map(percent => 
        parseFloat((totalAmount * (percent / 100)).toFixed(2))
      );
      break;
    
    case 'back_loaded':
      // Back-loaded distribution (last milestone gets more)
      const backLoadedPercents = calculateFrontLoadedDistribution(milestoneCount).reverse();
      milestoneAmounts = backLoadedPercents.map(percent => 
        parseFloat((totalAmount * (percent / 100)).toFixed(2))
      );
      break;
    
    case 'custom':
      // Custom distribution
      if (!customDistribution || customDistribution.length !== milestoneCount) {
        throw new Error('Custom distribution must have same length as milestone count');
      }
      
      // Validate custom percentages sum to 100
      const sum = customDistribution.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) { // Allow small rounding error
        throw new Error('Custom distribution percentages must sum to 100');
      }
      
      milestoneAmounts = customDistribution.map(percent => 
        parseFloat((totalAmount * (percent / 100)).toFixed(2))
      );
      break;
    
    default:
      throw new Error('Invalid distribution method');
  }
  
  // Ensure the sum of milestone amounts equals the total amount (adjust last milestone if needed)
  const sum = milestoneAmounts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - totalAmount) > 0.01) {
    const diff = totalAmount - sum;
    milestoneAmounts[milestoneAmounts.length - 1] = parseFloat((milestoneAmounts[milestoneAmounts.length - 1] + diff).toFixed(2));
  }
  
  // Format milestone data
  return milestoneAmounts.map((amount, index) => ({
    milestoneNumber: index + 1,
    amount,
    currency,
    percentage: parseFloat(((amount / totalAmount) * 100).toFixed(2))
  }));
};

/**
 * Helper function to calculate front-loaded distribution percentages
 * @param {number} count - Number of milestones
 * @returns {Array} Array of percentage values
 */
function calculateFrontLoadedDistribution(count) {
  // For front-loaded distribution, we use a descending formula
  // First milestone gets more, and then it decreases
  const factor = 2 / (count * (count + 1)); // This ensures percentages sum to 100
  
  const percents = [];
  for (let i = count; i >= 1; i--) {
    percents.push(i * factor * 100);
  }
  
  return percents.reverse();
} 