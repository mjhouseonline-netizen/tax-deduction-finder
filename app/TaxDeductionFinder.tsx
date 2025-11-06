'use client';

import React, { useState, useRef } from 'react';
import { Search, DollarSign, CheckCircle, AlertCircle, FileText, Download, Camera, Link, Users, Navigation, Globe, History, Archive, FileCheck, Smartphone, RefreshCw, Calculator, TrendingUp, BarChart3 } from 'lucide-react';

export default function TaxDeductionFinder() {
  const [taxSystem, setTaxSystem] = useState('US'); // 'US' or 'AU'
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [mileageEntries, setMileageEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [currentExpense, setCurrentExpense] = useState({
    description: '', amount: '', currency: 'USD', category: 'Office Supplies',
    client: '', receipt: null, isRecurring: false, frequency: 'monthly'
  });
  const [currentMileage, setCurrentMileage] = useState({
    date: new Date().toISOString().split('T')[0], miles: '', purpose: '',
    client: '', startLocation: '', endLocation: ''
  });
  const [currentClient, setCurrentClient] = useState({
    name: '', businessType: '', email: '', taxId: ''
  });
  const [taxFormData, setTaxFormData] = useState({
    businessName: '', ein: '', address: '', taxYear: new Date().getFullYear()
  });
  const [taxBracketData, setTaxBracketData] = useState({
    filingStatus: 'single', income: '', selfEmploymentIncome: '', otherDeductions: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showTaxForms, setShowTaxForms] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];
  const exchangeRates = { 'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'CAD': 1.36, 'AUD': 1.53, 'JPY': 149.50, 'CNY': 7.24, 'INR': 83.12 };
  
  const categories = ['Office Supplies', 'Travel', 'Meals & Entertainment', 'Vehicle', 'Home Office', 'Professional Services', 'Marketing & Advertising', 'Technology & Software', 'Education & Training', 'Insurance', 'Other'];

  // US Tax Brackets 2024
  const taxBracketsUS = {
    single: [
      { min: 0, max: 11600, rate: 10 }, { min: 11600, max: 47150, rate: 12 },
      { min: 47150, max: 100525, rate: 22 }, { min: 100525, max: 191950, rate: 24 },
      { min: 191950, max: 243725, rate: 32 }, { min: 243725, max: 609350, rate: 35 },
      { min: 609350, max: Infinity, rate: 37 }
    ],
    married: [
      { min: 0, max: 23200, rate: 10 }, { min: 23200, max: 94300, rate: 12 },
      { min: 94300, max: 201050, rate: 22 }, { min: 201050, max: 383900, rate: 24 },
      { min: 383900, max: 487450, rate: 32 }, { min: 487450, max: 731200, rate: 35 },
      { min: 731200, max: Infinity, rate: 37 }
    ],
    head: [
      { min: 0, max: 16550, rate: 10 }, { min: 16550, max: 63100, rate: 12 },
      { min: 63100, max: 100500, rate: 22 }, { min: 100500, max: 191950, rate: 24 },
      { min: 191950, max: 243700, rate: 32 }, { min: 243700, max: 609350, rate: 35 },
      { min: 609350, max: Infinity, rate: 37 }
    ]
  };

  // Australian Tax Brackets 2024-25
  const taxBracketsAU = {
    single: [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 19 },
      { min: 45000, max: 135000, rate: 30 },
      { min: 135000, max: 190000, rate: 37 },
      { min: 190000, max: Infinity, rate: 45 }
    ]
  };
  // US Deduction Rules (IRS)
  const deductionRulesUS = {
    'Office Supplies': { deductible: 100, notes: 'Fully deductible', examples: 'Pens, paper, stationery', reference: 'IRS Pub 535', scheduleCLine: '18' },
    'Travel': { deductible: 100, notes: 'Business travel fully deductible', examples: 'Airfare, hotels, car rental', reference: 'IRS Pub 463', scheduleCLine: '24a' },
    'Meals & Entertainment': { deductible: 50, notes: '50% deductible', examples: 'Client dinners, business meals', reference: 'IRS Pub 463', warnings: 'Must be business-related', scheduleCLine: '24b' },
    'Vehicle': { deductible: 'varies', notes: 'Standard mileage ($0.67/mile) or actual expenses', examples: 'Gas, maintenance, insurance', reference: 'IRS Pub 463', warnings: 'Keep detailed logs', scheduleCLine: '9' },
    'Home Office': { deductible: 'varies', notes: 'Regular and exclusive business use required', examples: 'Rent, utilities, internet', reference: 'IRS Pub 587', warnings: 'Strict requirements apply', scheduleCLine: '30' },
    'Professional Services': { deductible: 100, notes: 'Fully deductible', examples: 'Accountant, lawyer, consultant fees', reference: 'IRS Pub 535', scheduleCLine: '17' },
    'Marketing & Advertising': { deductible: 100, notes: 'Fully deductible', examples: 'Ads, website, social media', reference: 'IRS Pub 535', scheduleCLine: '8' },
    'Technology & Software': { deductible: 100, notes: 'Fully deductible', examples: 'Software subscriptions, computers', reference: 'IRS Pub 535', scheduleCLine: '18' },
    'Education & Training': { deductible: 100, notes: 'Must maintain or improve current skills', examples: 'Conferences, courses, books', reference: 'IRS Pub 970', warnings: 'Cannot be for new trade', scheduleCLine: '27a' },
    'Insurance': { deductible: 100, notes: 'Fully deductible', examples: 'Liability, professional indemnity', reference: 'IRS Pub 535', scheduleCLine: '15' },
    'Other': { deductible: 'review', notes: 'Individual assessment required', examples: 'Various business expenses', reference: 'IRS Pub 535', scheduleCLine: '27a' }
  };

  // Australian Deduction Rules (ATO)
  const deductionRulesAU = {
    'Office Supplies': { deductible: 100, notes: 'Fully deductible', examples: 'Pens, paper, stationery', reference: 'ATO - Work Expenses', section: 'D5' },
    'Travel': { deductible: 100, notes: 'Work-related travel fully deductible', examples: 'Airfare, accommodation, taxis', reference: 'ATO - Travel Expenses', section: 'D1' },
    'Meals & Entertainment': { deductible: 50, notes: '50% deductible for entertainment', examples: 'Client meals, business functions', reference: 'ATO - Meal Entertainment', warnings: 'Must be incidental to business', section: 'D2' },
    'Vehicle': { deductible: 'varies', notes: 'Cents per km (88¢/km up to 5,000km) or logbook method', examples: 'Fuel, maintenance, registration', reference: 'ATO - Car Expenses', warnings: 'Keep logbook for >5,000km', section: 'D2' },
    'Home Office': { deductible: 'varies', notes: 'Fixed rate (67¢/hour) or actual cost method', examples: 'Electricity, internet, phone', reference: 'ATO - Home Office', warnings: 'Must have dedicated workspace', section: 'D4' },
    'Professional Services': { deductible: 100, notes: 'Fully deductible', examples: 'Accountant, solicitor fees', reference: 'ATO - Other Expenses', section: 'D5' },
    'Marketing & Advertising': { deductible: 100, notes: 'Fully deductible', examples: 'Advertising, website costs', reference: 'ATO - Other Expenses', section: 'D5' },
    'Technology & Software': { deductible: 100, notes: 'Fully deductible if <$300, depreciate if >$300', examples: 'Software subscriptions, computers', reference: 'ATO - Depreciating Assets', section: 'D5' },
    'Education & Training': { deductible: 100, notes: 'Must have sufficient connection to current income', examples: 'Courses, seminars, books', reference: 'ATO - Self-Education', warnings: 'Cannot be for new employment', section: 'D4' },
    'Insurance': { deductible: 100, notes: 'Fully deductible', examples: 'Professional indemnity, public liability', reference: 'ATO - Other Expenses', section: 'D5' },
    'Other': { deductible: 'review', notes: 'Individual assessment required', examples: 'Various work-related expenses', reference: 'ATO - Other Expenses', section: 'D5' }
  };

  const deductionRules = taxSystem === 'US' ? deductionRulesUS : deductionRulesAU;
  const taxBrackets = taxSystem === 'US' ? taxBracketsUS : taxBracketsAU;
  const mileageRate = taxSystem === 'US' ? 0.67 : 0.88;
  const mileageUnit = taxSystem === 'US' ? 'miles' : 'km';
  const taxAuthority = taxSystem === 'US' ? 'IRS' : 'ATO';
  const mainCurrency = taxSystem === 'US' ? 'USD' : 'AUD';

  const addToAuditLog = (action, details) => {
    setAuditLog([{ id: Date.now(), timestamp: new Date().toISOString(), action, details, user: 'Current User' }, ...auditLog]);
  };

  const convertToMainCurrency = (amount, currency) => {
    const toUSD = amount / exchangeRates[currency];
    if (taxSystem === 'AU') {
      return toUSD * exchangeRates['AUD'];
    }
    return toUSD;
  };

  const calculateTaxBracket = () => {
    const income = parseFloat(taxBracketData.income) || 0;
    const seIncome = parseFloat(taxBracketData.selfEmploymentIncome) || 0;
    const otherDeductions = parseFloat(taxBracketData.otherDeductions) || 0;
    const businessDeductions = analysis ? analysis.totalDeductible : 0;
    const totalIncome = income + seIncome;
    const totalDeductions = businessDeductions + otherDeductions;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const brackets = taxBrackets[taxBracketData.filingStatus] || taxBrackets.single;
    let totalTax = 0;
    let marginalRate = 0;

    for (let bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        totalTax += taxableInBracket * (bracket.rate / 100);
        marginalRate = bracket.rate;
      }
    }

    const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
    const medicareLevy = taxSystem === 'AU' ? taxableIncome * 0.02 : 0;
    const seTax = taxSystem === 'US' && seIncome > 0 ? (seIncome - businessDeductions) * 0.9235 * 0.153 : 0;
    const taxWithoutDeductions = calculateTaxOnIncome(totalIncome, taxBracketData.filingStatus);
    const taxSavings = taxSystem === 'US' 
      ? (taxWithoutDeductions - totalTax) + (businessDeductions * 0.153 * 0.9235)
      : (taxWithoutDeductions - totalTax);
    const quarterlyTax = taxSystem === 'US' 
      ? (totalTax + seTax) / 4
      : (totalTax + medicareLevy) / 4;

    return { 
      totalIncome, taxableIncome, totalDeductions, businessDeductions, totalTax, 
      seTax: taxSystem === 'US' ? seTax : 0,
      medicareLevy: taxSystem === 'AU' ? medicareLevy : 0,
      totalTaxLiability: totalTax + (taxSystem === 'US' ? seTax : medicareLevy), 
      effectiveRate, marginalRate, taxSavings, quarterlyTax 
    };
  };

  const calculateTaxOnIncome = (income, status) => {
    const brackets = taxBrackets[status] || taxBrackets.single;
    let tax = 0;
    for (let bracket of brackets) {
      if (income > bracket.min) {
        const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
        tax += taxableInBracket * (bracket.rate / 100);
      }
    }
    return tax;
  };

  const processReceiptOCR = async (file) => {
    setOcrProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockResults = {
      'office': { description: 'Office Depot - Paper', amount: '45.99', category: 'Office Supplies', currency: mainCurrency },
      'restaurant': { description: 'Client Dinner', amount: '127.50', category: 'Meals & Entertainment', currency: mainCurrency }
    };
    const keys = Object.keys(mockResults);
    const result = mockResults[keys[Math.floor(Math.random() * keys.length)]];
    const receiptEntry = { id: Date.now(), filename: file.name, uploadDate: new Date().toISOString(), size: file.size, type: file.type, linkedTo: result.description };
    setReceipts([receiptEntry, ...receipts]);
    setCurrentExpense({ ...currentExpense, description: result.description, amount: result.amount, category: result.category, currency: result.currency, receipt: file.name });
    addToAuditLog('Receipt Scanned', `OCR: ${file.name}`);
    setOcrProcessing(false);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processReceiptOCR(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const calculateNextDue = (frequency) => {
    const now = new Date();
    switch(frequency) {
      case 'weekly': return new Date(now.setDate(now.getDate() + 7)).toISOString();
      case 'biweekly': return new Date(now.setDate(now.getDate() + 14)).toISOString();
      case 'monthly': return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      case 'quarterly': return new Date(now.setMonth(now.getMonth() + 3)).toISOString();
      case 'annually': return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      default: return now.toISOString();
    }
  };

  const addExpense = () => {
    if (currentExpense.description && currentExpense.amount && parseFloat(currentExpense.amount) > 0) {
      const newExpense = { ...currentExpense, id: Date.now(), amount: parseFloat(currentExpense.amount), date: new Date().toISOString() };
      setExpenses([newExpense, ...expenses]);
      if (currentExpense.isRecurring) {
        setRecurringExpenses([...recurringExpenses, { ...newExpense, nextDue: calculateNextDue(currentExpense.frequency) }]);
      }
      setCurrentExpense({ description: '', amount: '', currency: mainCurrency, category: 'Office Supplies', client: '', receipt: null, isRecurring: false, frequency: 'monthly' });
      addToAuditLog('Expense Added', `${newExpense.description} - ${newExpense.amount} ${newExpense.currency}`);
    }
  };

  const addMileage = () => {
    if (currentMileage.miles && parseFloat(currentMileage.miles) > 0) {
      const newMileage = { ...currentMileage, id: Date.now(), miles: parseFloat(currentMileage.miles) };
      setMileageEntries([newMileage, ...mileageEntries]);
      setCurrentMileage({ date: new Date().toISOString().split('T')[0], miles: '', purpose: '', client: '', startLocation: '', endLocation: '' });
      addToAuditLog('Mileage Added', `${newMileage.miles} ${mileageUnit} - ${newMileage.purpose}`);
    }
  };

  const addClient = () => {
    if (currentClient.name) {
      const newClient = { ...currentClient, id: Date.now() };
      setClients([newClient, ...clients]);
      setCurrentClient({ name: '', businessType: '', email: '', taxId: '' });
      addToAuditLog('Client Added', newClient.name);
    }
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
    addToAuditLog('Expense Removed', `ID: ${id}`);
  };

  const analyzeDeductions = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + convertToMainCurrency(e.amount, e.currency), 0);
    const mileageDeduction = mileageEntries.reduce((sum, m) => sum + (m.miles * mileageRate), 0);
    
    let deductibleByCategory = {};
    let totalDeductible = 0;

    expenses.forEach(e => {
      const amountInMain = convertToMainCurrency(e.amount, e.currency);
      const rule = deductionRules[e.category];
      const deductiblePercent = typeof rule.deductible === 'number' ? rule.deductible : 100;
      const deductible = amountInMain * (deductiblePercent / 100);
      
      if (!deductibleByCategory[e.category]) {
        deductibleByCategory[e.category] = { total: 0, deductible: 0, count: 0 };
      }
      deductibleByCategory[e.category].total += amountInMain;
      deductibleByCategory[e.category].deductible += deductible;
      deductibleByCategory[e.category].count += 1;
      totalDeductible += deductible;
    });

    totalDeductible += mileageDeduction;
    const estimatedTaxRate = taxSystem === 'US' ? 0.22 : 0.30;
    const potentialSavings = totalDeductible * estimatedTaxRate;

    setAnalysis({ totalExpenses, mileageDeduction, totalDeductible, deductibleByCategory, potentialSavings, totalEntries: expenses.length + mileageEntries.length });
    addToAuditLog('Analysis Completed', `${expenses.length + mileageEntries.length} entries analyzed`);
  };

  const exportToCSV = () => {
    let csv = `Description,Amount,Currency,Category,Date,Client,${taxAuthority} Reference\n`;
    expenses.forEach(e => {
      const rule = deductionRules[e.category];
      csv += `"${e.description}",${e.amount},${e.currency},${e.category},${new Date(e.date).toLocaleDateString()},${e.client || 'N/A'},${rule.reference || ''}\n`;
    });
    mileageEntries.forEach(m => {
      csv += `"${m.purpose}",${(m.miles * mileageRate).toFixed(2)},${mainCurrency},Vehicle - Mileage,${new Date(m.date).toLocaleDateString()},${m.client || 'N/A'},${taxSystem === 'US' ? 'IRS Pub 463' : 'ATO - Car Expenses'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deductions-${taxSystem}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToAuditLog('CSV Export', `${expenses.length + mileageEntries.length} entries`);
  };

  const exportToPDF = () => {
    alert(`PDF Report generation would create a detailed ${taxSystem === 'US' ? 'IRS' : 'ATO'}-compliant report with:\n\n- Complete expense breakdown\n- Mileage logs\n- Tax calculations\n- Supporting documentation\n- ${taxSystem === 'US' ? 'Schedule C' : 'Tax Return'} categories`);
    addToAuditLog('PDF Export Requested', 'Report generation');
  };

  const handleTaxSystemChange = (system) => {
    setTaxSystem(system);
    setCurrentExpense({...currentExpense, currency: system === 'US' ? 'USD' : 'AUD'});
    addToAuditLog('Tax System Changed', `Switched to ${system === 'US' ? 'United States (IRS)' : 'Australia (ATO)'}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Tax Deduction Finder
              </h1>
              <p className="text-gray-600 mt-2">Track expenses, maximize deductions, save thousands</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Tax System:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleTaxSystemChange('US')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    taxSystem === 'US'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  🇺🇸 United States
                </button>
                <button
                  onClick={() => handleTaxSystemChange('AU')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    taxSystem === 'AU'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  🇦🇺 Australia
                </button>
              </div>
            </div>
          </div>
          
          <div className={`mt-4 p-4 rounded-lg ${taxSystem === 'US' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {taxSystem === 'US' ? 'IRS Compliant (United States)' : 'ATO Compliant (Australia)'}
                </p>
                <p className="text-sm mt-1">
                  {taxSystem === 'US' 
                    ? `Using US tax law, Schedule C format, standard mileage rate $${mileageRate}/mile, and IRS publications.`
                    : `Using Australian tax law, ATO guidelines, cents per km method (${mileageRate}¢/km), financial year July 1 - June 30.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'mileage', label: `Mileage (${mileageUnit})`, icon: Navigation },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'recurring', label: 'Recurring', icon: RefreshCw },
              { id: 'receipts', label: 'Receipts', icon: FileText },
              { id: 'audit', label: 'Audit Log', icon: History }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'expenses' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <input
                      type="text"
                      value={currentExpense.description}
                      onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Office supplies, client dinner..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={currentExpense.amount}
                        onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
                        className="flex-1 px-4 py-2 border rounded-lg"
                        placeholder="0.00"
                      />
                      <select
                        value={currentExpense.currency}
                        onChange={(e) => setCurrentExpense({...currentExpense, currency: e.target.value})}
                        className="px-4 py-2 border rounded-lg"
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={currentExpense.category}
                      onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {deductionRules[currentExpense.category] && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <div className="font-semibold">
                          {typeof deductionRules[currentExpense.category].deductible === 'number'
                            ? `${deductionRules[currentExpense.category].deductible}% Deductible`
                            : 'Varies - See Notes'}
                        </div>
                        <div className="text-xs mt-1">{deductionRules[currentExpense.category].notes}</div>
                        <div className="text-xs mt-1 text-indigo-600">{deductionRules[currentExpense.category].reference}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client (Optional)</label>
                    <select
                      value={currentExpense.client}
                      onChange={(e) => setCurrentExpense({...currentExpense, client: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">No Client</option>
                      {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentExpense.isRecurring}
                      onChange={(e) => setCurrentExpense({...currentExpense, isRecurring: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Recurring Expense</span>
                  </label>
                  {currentExpense.isRecurring && (
                    <select
                      value={currentExpense.frequency}
                      onChange={(e) => setCurrentExpense({...currentExpense, frequency: e.target.value})}
                      className="px-4 py-2 border rounded-lg text-sm"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={addExpense}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold"
                  >
                    <DollarSign className="w-5 h-5" />
                    Add Expense
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    disabled={ocrProcessing}
                  >
                    <Camera className="w-5 h-5" />
                    {ocrProcessing ? 'Scanning...' : 'Scan Receipt'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {activeTab === 'mileage' && (
              <div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900">
                        {taxSystem === 'US' 
                          ? `Standard Mileage Rate: $${mileageRate} per mile`
                          : `Cents per Kilometre: ${mileageRate}¢ per km (up to 5,000km)`
                        }
                      </div>
                      <div className="text-sm text-blue-700">
                        {taxSystem === 'US'
                          ? 'IRS standard business mileage rate for 2024. Keep detailed logs.'
                          : 'ATO cents per kilometre method. Logbook required over 5,000km.'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={currentMileage.date}
                      onChange={(e) => setCurrentMileage({...currentMileage, date: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{mileageUnit === 'miles' ? 'Miles' : 'Kilometres'}</label>
                    <input
                      type="number"
                      value={currentMileage.miles}
                      onChange={(e) => setCurrentMileage({...currentMileage, miles: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder={`0 ${mileageUnit}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Business Purpose</label>
                    <input
                      type="text"
                      value={currentMileage.purpose}
                      onChange={(e) => setCurrentMileage({...currentMileage, purpose: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Meeting with client, site visit..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Location</label>
                    <input
                      type="text"
                      value={currentMileage.startLocation}
                      onChange={(e) => setCurrentMileage({...currentMileage, startLocation: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Office, home..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Location</label>
                    <input
                      type="text"
                      value={currentMileage.endLocation}
                      onChange={(e) => setCurrentMileage({...currentMileage, endLocation: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Client site..."
                    />
                  </div>
                </div>

                <button
                  onClick={addMileage}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Navigation className="w-5 h-5" />
                  Add Mileage Entry
                </button>

                {mileageEntries.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-bold">Recent Entries ({mileageEntries.length})</h3>
                    {mileageEntries.slice(0, 5).map(m => (
                      <div key={m.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{m.purpose}</div>
                            <div className="text-sm text-gray-600">{m.miles} {mileageUnit} × {mainCurrency}${mileageRate} = {mainCurrency}${(m.miles * mileageRate).toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-1">{m.startLocation} → {m.endLocation}</div>
                          </div>
                          <div className="text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'clients' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Name</label>
                    <input
                      type="text"
                      value={currentClient.name}
                      onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="ABC Corporation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Type</label>
                    <input
                      type="text"
                      value={currentClient.businessType}
                      onChange={(e) => setCurrentClient({...currentClient, businessType: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Tech, Retail, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={currentClient.email}
                      onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="contact@client.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{taxSystem === 'US' ? 'Tax ID / EIN' : 'ABN'}</label>
                    <input
                      type="text"
                      value={currentClient.taxId}
                      onChange={(e) => setCurrentClient({...currentClient, taxId: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder={taxSystem === 'US' ? '12-3456789' : '12 345 678 901'}
                    />
                  </div>
                </div>

                <button
                  onClick={addClient}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Users className="w-5 h-5" />
                  Add Client
                </button>

                {clients.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {clients.map(c => (
                      <div key={c.id} className="border rounded-lg p-4 bg-white">
                        <div className="font-bold">{c.name}</div>
                        <div className="text-sm text-gray-600">{c.businessType}</div>
                        <div className="text-xs text-gray-500 mt-2">{c.email}</div>
                        {c.taxId && <div className="text-xs text-gray-500">{taxSystem === 'US' ? 'EIN' : 'ABN'}: {c.taxId}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recurring' && (
              <div>
                {recurringExpenses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4" />
                    <p>No recurring expenses yet</p>
                    <p className="text-sm mt-2">Mark expenses as recurring when adding them</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recurringExpenses.map(e => (
                      <div key={e.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{e.description}</div>
                            <div className="text-sm text-gray-600">{e.category} • {e.frequency}</div>
                            <div className="text-lg font-bold mt-2">{e.amount} {e.currency}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Next Due</div>
                            <div className="text-sm font-medium">{new Date(e.nextDue).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'receipts' && (
              <div>
                {receipts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4" />
                    <p>No receipts uploaded yet</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                    >
                      Upload First Receipt
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {receipts.map(r => (
                      <div key={r.id} className="border rounded-lg p-4">
                        <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                        <h3 className="font-semibold text-sm truncate">{r.filename}</h3>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(r.uploadDate).toLocaleDateString()}
                        </div>
                        {r.linkedTo && (
                          <div className="text-xs text-indigo-600 mt-1">→ {r.linkedTo}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                {auditLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLog.map(log => (
                      <div key={log.id} className="border-l-4 border-indigo-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-semibold text-sm">{log.action}</div>
                            <div className="text-xs text-gray-600">{log.details}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {expenses.length > 0 && activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Expenses ({expenses.length})</h2>
            <div className="space-y-3 mb-6">
              {expenses.map(e => (
                <div key={e.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="font-medium">{e.description}</div>
                    <div className="text-sm text-gray-600">{e.category}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold">{e.amount} {e.currency}</div>
                    <button onClick={() => removeExpense(e.id)} className="text-red-600 text-sm hover:text-red-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={analyzeDeductions} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold">
              <Search className="w-5 h-5" />
              Analyze Deductions
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Total Expenses</div>
                <div className="text-2xl font-bold">{mainCurrency}${analysis.totalExpenses.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Mileage Deduction</div>
                <div className="text-2xl font-bold text-blue-600">{mainCurrency}${analysis.mileageDeduction.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Total Deductible</div>
                <div className="text-2xl font-bold text-green-600">{mainCurrency}${analysis.totalDeductible.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Est. Tax Savings</div>
                <div className="text-2xl font-bold text-indigo-600">{mainCurrency}${analysis.potentialSavings.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4">Deduction Breakdown by Category</h2>
              <div className="space-y-3">
                {Object.entries(analysis.deductibleByCategory).map(([category, data]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">{category}</div>
                      <div className="text-sm text-gray-600">{data.count} entries</div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total: {mainCurrency}${data.total.toFixed(2)}</span>
                      <span className="text-green-600 font-semibold">Deductible: {mainCurrency}${data.deductible.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {deductionRules[category]?.reference}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Export Reports</h2>
                <div className="flex gap-3">
                  <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    CSV Export
                  </button>
                  <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700">
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Currently using {taxSystem === 'US' ? '🇺🇸 United States (IRS)' : '🇦🇺 Australia (ATO)'} tax rules</p>
          <p className="mt-1">
            {taxSystem === 'US' 
              ? 'Schedule C compliant • Standard mileage method • Tax year: January-December'
              : 'ATO compliant • Cents per km method • Financial year: July-June'
            }
          </p>
        </div>
      </div>

      {showIntegrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Integrations</h2>
              <button onClick={() => setShowIntegrations(false)} className="text-2xl hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              {['QuickBooks', 'Xero', 'Bank Feeds', taxSystem === 'AU' ? 'myGov' : 'Tax Software'].map(name => (
                <div key={name} className="border rounded-lg p-4 flex justify-between items-center hover:border-indigo-500 transition">
                  <h3 className="font-semibold">{name}</h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Connect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTaxForms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{taxSystem === 'US' ? 'Tax Forms (IRS)' : 'Tax Forms (ATO)'}</h2>
              <button onClick={() => setShowTaxForms(false)} className="text-2xl hover:text-gray-600">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={taxFormData.businessName}
                onChange={(e) => setTaxFormData({...taxFormData, businessName: e.target.value})}
                placeholder="Business Name"
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={taxFormData.ein}
                onChange={(e) => setTaxFormData({...taxFormData, ein: e.target.value})}
                placeholder={taxSystem === 'US' ? 'EIN' : 'ABN'}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={!analysis}
                className="px-6 py-4 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-indigo-700"
              >
                <div className="font-semibold">{taxSystem === 'US' ? 'Schedule C' : 'Business Income'}</div>
                <div className="text-xs mt-1">{taxSystem === 'US' ? 'Profit or Loss' : 'Individual Tax Return'}</div>
              </button>
              <button
                disabled={!analysis}
                className="px-6 py-4 bg-green-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-green-700"
              >
                <div className="font-semibold">{taxSystem === 'US' ? '1099-MISC' : 'Payment Summary'}</div>
                <div className="text-xs mt-1">{taxSystem === 'US' ? 'Miscellaneous Income' : 'Annual Summary'}</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
