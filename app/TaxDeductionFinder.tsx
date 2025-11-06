'use client';

import React, { useState, useRef } from 'react';
import { Search, DollarSign, CheckCircle, AlertCircle, FileText, Download, Camera, Link, Users, Navigation, Globe, History, Archive, FileCheck, Smartphone, RefreshCw, Calculator, TrendingUp, BarChart3 } from 'lucide-react';

export default function TaxDeductionFinder() {
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

  const taxBrackets2024 = {
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

  const deductionRules = {
    'Office Supplies': { deductible: 100, notes: 'Fully deductible', examples: 'Pens, paper', irs_reference: 'IRS Pub 535', scheduleCLine: '18' },
    'Travel': { deductible: 100, notes: 'Business travel fully deductible', examples: 'Airfare, hotels', irs_reference: 'IRS Pub 463', scheduleCLine: '24a' },
    'Meals & Entertainment': { deductible: 50, notes: '50% deductible', examples: 'Client dinners', irs_reference: 'IRS Pub 463', warnings: 'Must be business-related', scheduleCLine: '24b' },
    'Vehicle': { deductible: 'varies', notes: 'Standard mileage or actual', examples: 'Gas, maintenance', irs_reference: 'IRS Pub 463', warnings: 'Keep logs', scheduleCLine: '9' },
    'Home Office': { deductible: 'varies', notes: 'Regular and exclusive use', examples: 'Rent, utilities', irs_reference: 'IRS Pub 587', warnings: 'Strict requirements', scheduleCLine: '30' },
    'Professional Services': { deductible: 100, notes: 'Fully deductible', examples: 'CPA fees', irs_reference: 'IRS Pub 535', scheduleCLine: '17' },
    'Marketing & Advertising': { deductible: 100, notes: 'Fully deductible', examples: 'Ads, website', irs_reference: 'IRS Pub 535', scheduleCLine: '8' },
    'Technology & Software': { deductible: 100, notes: 'Fully deductible', examples: 'Software subscriptions', irs_reference: 'IRS Pub 535', scheduleCLine: '18' },
    'Education & Training': { deductible: 100, notes: 'Maintain current skills', examples: 'Conferences', irs_reference: 'IRS Pub 970', warnings: 'Not for new trade', scheduleCLine: '27a' },
    'Insurance': { deductible: 100, notes: 'Fully deductible', examples: 'Liability insurance', irs_reference: 'IRS Pub 535', scheduleCLine: '15' },
    'Other': { deductible: 'review', notes: 'Individual assessment', examples: 'Various', irs_reference: 'IRS Pub 535', scheduleCLine: '27a' }
  };

  const addToAuditLog = (action, details) => {
    setAuditLog([{ id: Date.now(), timestamp: new Date().toISOString(), action, details, user: 'Current User' }, ...auditLog]);
  };

  const convertToUSD = (amount, currency) => amount / exchangeRates[currency];

  const calculateTaxBracket = () => {
    const income = parseFloat(taxBracketData.income) || 0;
    const seIncome = parseFloat(taxBracketData.selfEmploymentIncome) || 0;
    const otherDeductions = parseFloat(taxBracketData.otherDeductions) || 0;
    const businessDeductions = analysis ? analysis.totalDeductible : 0;
    const totalIncome = income + seIncome;
    const totalDeductions = businessDeductions + otherDeductions;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const brackets = taxBrackets2024[taxBracketData.filingStatus];
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
    const seTax = seIncome > 0 ? (seIncome - businessDeductions) * 0.9235 * 0.153 : 0;
    const taxWithoutDeductions = calculateTaxOnIncome(totalIncome, taxBracketData.filingStatus);
    const taxSavings = (taxWithoutDeductions - totalTax) + (businessDeductions * 0.153 * 0.9235);
    const quarterlyTax = (totalTax + seTax) / 4;

    return { totalIncome, taxableIncome, totalDeductions, businessDeductions, totalTax, seTax, totalTaxLiability: totalTax + seTax, effectiveRate, marginalRate, taxSavings, quarterlyTax };
  };

  const calculateTaxOnIncome = (income, status) => {
    const brackets = taxBrackets2024[status];
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
      'office': { description: 'Office Depot - Paper', amount: '45.99', category: 'Office Supplies', currency: 'USD' },
      'restaurant': { description: 'Client Dinner', amount: '127.50', category: 'Meals & Entertainment', currency: 'USD' }
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
      case 'yearly': return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      default: return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    }
  };

  const addExpense = () => {
    if (currentExpense.description && currentExpense.amount) {
      const amountUSD = convertToUSD(parseFloat(currentExpense.amount), currentExpense.currency);
      const newExpense = { ...currentExpense, id: Date.now(), amount: parseFloat(currentExpense.amount), amountUSD, dateAdded: new Date().toISOString(), year: new Date().getFullYear() };
      setExpenses([...expenses, newExpense]);
      if (currentExpense.isRecurring) {
        setRecurringExpenses([...recurringExpenses, { ...newExpense, nextDue: calculateNextDue(currentExpense.frequency) }]);
      }
      addToAuditLog('Expense Added', `${currentExpense.description} - $${currentExpense.amount}`);
      setCurrentExpense({ description: '', amount: '', currency: 'USD', category: 'Office Supplies', client: '', receipt: null, isRecurring: false, frequency: 'monthly' });
      setAnalysis(null);
    }
  };

  const addMileage = () => {
    if (currentMileage.miles && currentMileage.purpose) {
      const deduction = parseFloat(currentMileage.miles) * 0.67;
      const newMileage = { ...currentMileage, id: Date.now(), miles: parseFloat(currentMileage.miles), deduction, dateAdded: new Date().toISOString(), year: new Date().getFullYear() };
      setMileageEntries([...mileageEntries, newMileage]);
      addToAuditLog('Mileage Added', `${currentMileage.miles} miles`);
      setCurrentMileage({ date: new Date().toISOString().split('T')[0], miles: '', purpose: '', client: '', startLocation: '', endLocation: '' });
    }
  };

  const addClient = () => {
    if (currentClient.name) {
      const newClient = { ...currentClient, id: Date.now(), dateAdded: new Date().toISOString() };
      setClients([...clients, newClient]);
      addToAuditLog('Client Added', currentClient.name);
      setCurrentClient({ name: '', businessType: '', email: '', taxId: '' });
    }
  };

  const removeExpense = (id) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(expenses.filter(e => e.id !== id));
    addToAuditLog('Expense Deleted', expense.description);
    setAnalysis(null);
  };

  const removeMileage = (id) => {
    const mileage = mileageEntries.find(m => m.id === id);
    setMileageEntries(mileageEntries.filter(m => m.id !== id));
    addToAuditLog('Mileage Deleted', mileage.purpose);
  };

  const removeClient = (id) => {
    const client = clients.find(c => c.id === id);
    setClients(clients.filter(c => c.id !== id));
    addToAuditLog('Client Deleted', client.name);
  };

  const analyzeDeductions = () => {
    const expenseResults = expenses.map(expense => {
      const rule = deductionRules[expense.category];
      let deductibleAmount = 0;
      if (rule.deductible === 100) deductibleAmount = expense.amountUSD;
      else if (rule.deductible === 50) deductibleAmount = expense.amountUSD * 0.5;
      else if (rule.deductible === 'varies') deductibleAmount = expense.amountUSD * 0.7;
      return { ...expense, rule, deductibleAmount, nonDeductibleAmount: expense.amountUSD - deductibleAmount };
    });

    const mileageDeduction = mileageEntries.reduce((sum, m) => sum + m.deduction, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amountUSD, 0);
    const totalDeductible = expenseResults.reduce((sum, r) => sum + r.deductibleAmount, 0) + mileageDeduction;
    const potentialSavings = totalDeductible * 0.25;

    const clientBreakdown = clients.map(client => {
      const clientExpenses = expenses.filter(e => e.client === client.name);
      const clientMileage = mileageEntries.filter(m => m.client === client.name);
      const clientTotal = clientExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
      const clientMileageTotal = clientMileage.reduce((sum, m) => sum + m.deduction, 0);
      return { ...client, expenses: clientExpenses.length, totalExpenses: clientTotal, mileageEntries: clientMileage.length, totalMileage: clientMileageTotal, total: clientTotal + clientMileageTotal };
    });

    const scheduleCBreakdown = {};
    expenseResults.forEach(result => {
      const line = result.rule.scheduleCLine;
      if (!scheduleCBreakdown[line]) scheduleCBreakdown[line] = { category: result.category, total: 0 };
      scheduleCBreakdown[line].total += result.deductibleAmount;
    });

    const yearlyComparison = [2024, 2023, 2022].map(year => {
      const yearExpenses = expenses.filter(e => new Date(e.dateAdded).getFullYear() === year);
      const yearMileage = mileageEntries.filter(m => new Date(m.dateAdded).getFullYear() === year);
      const yearTotal = yearExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
      const yearMileageTotal = yearMileage.reduce((sum, m) => sum + m.deduction, 0);
      return { year, expenses: yearExpenses.length, totalExpenses: yearTotal, mileage: yearMileage.length, totalMileage: yearMileageTotal, totalDeductions: yearTotal + yearMileageTotal };
    });

    setAnalysis({ results: expenseResults, mileageDeduction, totalMileageEntries: mileageEntries.length, totalExpenses, totalDeductible, potentialSavings, clientBreakdown, scheduleCBreakdown, yearlyComparison });
    addToAuditLog('Analysis Generated', `$${totalDeductible.toFixed(2)}`);
  };

  const exportToCSV = () => {
    if (!analysis) return;
    const csv = [['Type', 'Description', 'Amount', 'Deductible'], ...analysis.results.map(r => ['Expense', r.description, r.amountUSD.toFixed(2), r.deductibleAmount.toFixed(2)])].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deductions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addToAuditLog('CSV Exported', 'Success');
  };

  const exportToPDF = () => {
    if (!analysis) return;
    const content = `TAX REPORT\nTotal: $${analysis.totalDeductible.toFixed(2)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    addToAuditLog('Report Exported', 'Success');
  };

  const taxCalc = taxBracketData.income ? calculateTaxBracket() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Tax Deduction Finder Pro</h1>
                <p className="text-sm text-gray-600">Complete Tax Solution</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowIntegrations(true)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Link className="w-5 h-5" />
              </button>
              <button onClick={() => setShowTaxForms(true)} className="px-4 py-2 bg-indigo-100 rounded-lg hover:bg-indigo-200">
                <FileCheck className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b overflow-x-auto">
            {[
              { id: 'expenses', label: 'Expenses' },
              { id: 'mileage', label: 'Mileage', icon: Navigation },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'recurring', label: 'Recurring', icon: RefreshCw },
              { id: 'calculator', label: 'Tax Calc', icon: Calculator },
              { id: 'comparison', label: 'Trends', icon: TrendingUp },
              { id: 'receipts', label: 'Receipts', icon: Archive },
              { id: 'audit', label: 'Audit', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'expenses' && (
            <div>
              <button onClick={() => fileInputRef.current?.click()} disabled={ocrProcessing} className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {ocrProcessing ? 'Processing...' : 'Scan Receipt'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" value={currentExpense.description} onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})} placeholder="Description" className="px-4 py-2 border rounded-lg" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={currentExpense.amount} onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})} placeholder="Amount" className="px-4 py-2 border rounded-lg" />
                  <select value={currentExpense.currency} onChange={(e) => setCurrentExpense({...currentExpense, currency: e.target.value})} className="px-4 py-2 border rounded-lg">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <select value={currentExpense.category} onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})} className="px-4 py-2 border rounded-lg">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={currentExpense.client} onChange={(e) => setCurrentExpense({...currentExpense, client: e.target.value})} className="px-4 py-2 border rounded-lg">
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={currentExpense.isRecurring} onChange={(e) => setCurrentExpense({...currentExpense, isRecurring: e.target.checked})} />
                  Recurring
                </label>
                {currentExpense.isRecurring && (
                  <select value={currentExpense.frequency} onChange={(e) => setCurrentExpense({...currentExpense, frequency: e.target.value})} className="px-3 py-1 border rounded">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>

              <button onClick={addExpense} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Expense</button>
            </div>
          )}

          {activeTab === 'mileage' && (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">2024 IRS Rate: $0.67/mile ($0.42/km)</p>
              </div>
              
              <div className="mb-4 flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Distance Unit:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="unit" 
                    value="km" 
                    checked={currentMileage.unit === 'km'}
                    onChange={(e) => setCurrentMileage({...currentMileage, unit: e.target.value})}
                    className="text-indigo-600"
                  />
                  <span className="text-sm">Kilometers (km)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="unit" 
                    value="mi" 
                    checked={currentMileage.unit === 'mi'}
                    onChange={(e) => setCurrentMileage({...currentMileage, unit: e.target.value})}
                    className="text-indigo-600"
                  />
                  <span className="text-sm">Miles (mi)</span>
                </label>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input type="date" value={currentMileage.date} onChange={(e) => setCurrentMileage({...currentMileage, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
                <input type="number" value={currentMileage.miles} onChange={(e) => setCurrentMileage({...currentMileage, miles: e.target.value})} placeholder={currentMileage.unit === 'km' ? 'Kilometers' : 'Miles'} className="px-4 py-2 border rounded-lg" />
                <select value={currentMileage.client} onChange={(e) => setCurrentMileage({...currentMileage, client: e.target.value})} className="px-4 py-2 border rounded-lg">
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" value={currentMileage.startLocation} onChange={(e) => setCurrentMileage({...currentMileage, startLocation: e.target.value})} placeholder="Start" className="px-4 py-2 border rounded-lg" />
                <input type="text" value={currentMileage.endLocation} onChange={(e) => setCurrentMileage({...currentMileage, endLocation: e.target.value})} placeholder="End" className="px-4 py-2 border rounded-lg" />
              </div>
              <input type="text" value={currentMileage.purpose} onChange={(e) => setCurrentMileage({...currentMileage, purpose: e.target.value})} placeholder="Purpose" className="w-full px-4 py-2 border rounded-lg mb-4" />
              
              {currentMileage.miles && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Deduction:</strong> ${(currentMileage.unit === 'km' ? parseFloat(currentMileage.miles) * 0.621371 * 0.67 : parseFloat(currentMileage.miles) * 0.67).toFixed(2)} 
                    <span className="text-gray-600 ml-2">({currentMileage.miles} {currentMileage.unit})</span>
                  </div>
                </div>
              )}
              
              <button onClick={addMileage} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Mileage</button>
            </div>
          )}

          {activeTab === 'clients' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" value={currentClient.name} onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})} placeholder="Client Name" className="px-4 py-2 border rounded-lg" />
                <input type="text" value={currentClient.businessType} onChange={(e) => setCurrentClient({...currentClient, businessType: e.target.value})} placeholder="Business Type" className="px-4 py-2 border rounded-lg" />
                <input type="email" value={currentClient.email} onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})} placeholder="Email" className="px-4 py-2 border rounded-lg" />
                <input type="text" value={currentClient.taxId} onChange={(e) => setCurrentClient({...currentClient, taxId: e.target.value})} placeholder="Tax ID" className="px-4 py-2 border rounded-lg" />
              </div>
              <button onClick={addClient} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Client</button>
            </div>
          )}

          {activeTab === 'recurring' && (
            <div>
              {recurringExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4" />
                  <p>No recurring expenses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurringExpenses.map(exp => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{exp.description}</h3>
                          <p className="text-sm text-gray-600">{exp.frequency}</p>
                        </div>
                        <div className="text-lg font-bold">${exp.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div>
              <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-indigo-900">Tax Bracket Calculator</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-2">Filing Status</label>
                  <select value={taxBracketData.filingStatus} onChange={(e) => setTaxBracketData({...taxBracketData, filingStatus: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="head">Head of Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Total Income</label>
                  <input type="number" value={taxBracketData.income} onChange={(e) => setTaxBracketData({...taxBracketData, income: e.target.value})} placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Self-Employment Income</label>
                  <input type="number" value={taxBracketData.selfEmploymentIncome} onChange={(e) => setTaxBracketData({...taxBracketData, selfEmploymentIncome: e.target.value})} placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Other Deductions</label>
                  <input type="number" value={taxBracketData.otherDeductions} onChange={(e) => setTaxBracketData({...taxBracketData, otherDeductions: e.target.value})} placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>

              {taxCalc && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">Total Income</div>
                      <div className="text-xl font-bold">${taxCalc.totalIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">Taxable Income</div>
                      <div className="text-xl font-bold">${taxCalc.taxableIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">Deductions</div>
                      <div className="text-xl font-bold text-green-600">${taxCalc.totalDeductions.toLocaleString()}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-1">Tax Savings</div>
                      <div className="text-xl font-bold text-green-600">${taxCalc.taxSavings.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-sm text-red-800 mb-1">Income Tax</div>
                      <div className="text-2xl font-bold text-red-600">${taxCalc.totalTax.toLocaleString()}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm text-orange-800 mb-1">SE Tax</div>
                      <div className="text-2xl font-bold text-orange-600">${taxCalc.seTax.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-800 mb-1">Quarterly</div>
                      <div className="text-2xl font-bold text-purple-600">${taxCalc.quarterlyTax.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comparison' && (
            <div>
              {analysis && analysis.yearlyComparison ? (
                <div className="grid grid-cols-3 gap-4">
                  {analysis.yearlyComparison.map(year => (
                    <div key={year.year} className="bg-white border rounded-lg p-6">
                      <div className="text-2xl font-bold mb-4">{year.year}</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Expenses:</span>
                          <span className="font-semibold">${year.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mileage:</span>
                          <span className="font-semibold">${year.totalMileage.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-medium">Total:</span>
                          <span className="text-xl font-bold text-indigo-600">${year.totalDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'receipts' && (
            <div>
              {receipts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-4" />
                  <p>No receipts uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {receipts.map(r => (
                    <div key={r.id} className="border rounded-lg p-4">
                      <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                      <h3 className="font-semibold text-sm truncate">{r.filename}</h3>
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
                    <button onClick={() => removeExpense(e.id)} className="text-red-600 text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={analyzeDeductions} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Analyze Deductions
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Expenses</div>
                <div className="text-2xl font-bold">${analysis.totalExpenses.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Mileage</div>
                <div className="text-2xl font-bold text-blue-600">${analysis.mileageDeduction.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Deductions</div>
                <div className="text-2xl font-bold text-green-600">${analysis.totalDeductible.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-4">
                <div className="text-xs text-gray-600 mb-1">Savings</div>
                <div className="text-2xl font-bold text-indigo-600">${analysis.potentialSavings.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Export</h2>
                <div className="flex gap-3">
                  <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showIntegrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Integrations</h2>
              <button onClick={() => setShowIntegrations(false)} className="text-2xl">×</button>
            </div>
            <div className="space-y-4">
              {['QuickBooks', 'Xero', 'Bank Feeds'].map(name => (
                <div key={name} className="border rounded-lg p-4 flex justify-between items-center">
                  <h3 className="font-semibold">{name}</h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Connect</button>
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
              <h2 className="text-2xl font-bold">Tax Forms</h2>
              <button onClick={() => setShowTaxForms(false)} className="text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" value={taxFormData.businessName} onChange={(e) => setTaxFormData({...taxFormData, businessName: e.target.value})} placeholder="Business Name" className="px-4 py-2 border rounded-lg" />
              <input type="text" value={taxFormData.ein} onChange={(e) => setTaxFormData({...taxFormData, ein: e.target.value})} placeholder="EIN" className="px-4 py-2 border rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button disabled={!analysis} className="px-6 py-4 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300">
                <div className="font-semibold">Schedule C</div>
              </button>
              <button disabled={!analysis} className="px-6 py-4 bg-green-600 text-white rounded-lg disabled:bg-gray-300">
                <div className="font-semibold">1099-MISC</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
              