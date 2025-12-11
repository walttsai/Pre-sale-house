import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, FilterState, LoadingState } from './types';
import { fetchTransactionData } from './services/dataService';
import { analyzeMarketTrends } from './services/geminiService';
import { PriceChart } from './components/PriceChart';
import { TotalPriceChart } from './components/TotalPriceChart';
import { StatCard } from './components/StatCard';
import Markdown from 'react-markdown';

// Icons
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const ExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const ITEMS_PER_PAGE = 20;

const App: React.FC = () => {
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [isFallback, setIsFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // UI State
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [chartType, setChartType] = useState<'unit' | 'total'>('unit');
  
  // Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filters State (Form inputs)
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    project: '',
    startMonth: '',
    endMonth: '',
    minPrice: '',
    maxPrice: ''
  });

  // Load Initial Data (Background fetch)
  const initData = useCallback(async () => {
      setLoadingState(LoadingState.LOADING);
      setErrorMessage('');
      try {
        const { data: result, isFallback: fallback, error } = await fetchTransactionData();
        
        if (result.length === 0 && error) {
             throw new Error(error);
        }

        setRawData(result);
        setIsFallback(fallback);
        setLoadingState(LoadingState.SUCCESS);
      } catch (e: any) {
        console.error(e);
        setErrorMessage(e.message || "Unknown error occurred");
        setLoadingState(LoadingState.ERROR);
      }
    }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // Handle Input Changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Execute Search
  const handleSearch = () => {
    if (loadingState !== LoadingState.SUCCESS) return;

    const result = rawData.filter(item => {
      // Region Search (Checks address or region containing the search string)
      const searchRegion = filters.region.toLowerCase().trim();
      const matchRegion = filters.region === '' || 
        (item.region && item.region.toLowerCase().includes(searchRegion)) ||
        (item.address && item.address.toLowerCase().includes(searchRegion));

      // Project Search
      const searchProject = filters.project.toLowerCase().trim();
      const matchProject = filters.project === '' || 
        (item.project && item.project.toLowerCase().includes(searchProject));
      
      // Date Logic: Compare YYYY-MM strings
      const itemMonth = item.date.substring(0, 7);
      const matchStart = filters.startMonth ? itemMonth >= filters.startMonth : true;
      const matchEnd = filters.endMonth ? itemMonth <= filters.endMonth : true;

      const minP = filters.minPrice !== '' ? Number(filters.minPrice) * 10000 : 0;
      const maxP = filters.maxPrice !== '' ? Number(filters.maxPrice) * 10000 : Infinity;
      const matchPrice = item.unitPrice >= minP && item.unitPrice <= maxP;

      return matchRegion && matchProject && matchStart && matchEnd && matchPrice;
    });

    setFilteredData(result);
    setHasSearched(true);
    setCurrentPage(1); // Reset to first page
    setAiAnalysis(''); // Reset previous analysis
  };

  // Sorting Logic
  const sortedData = useMemo(() => {
      let sortableItems = [...filteredData];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
          const key = sortConfig.key;
          let aValue = a[key];
          let bValue = b[key];
          
          // Handle string comparisons case-insensitively
          if (typeof aValue === 'string' && typeof bValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
          }

          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction) => {
      if (sortConfig?.key === key) {
          return sortConfig.direction === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />;
      }
      return <SortIcon />;
  };

  // AI Analysis Handler
  const handleAnalyze = async () => {
    if (filteredData.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const result = await analyzeMarketTrends(filteredData);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { count: 0, avgPrice: 0, maxPrice: 0 };
    const count = filteredData.length;
    const totalUnit = filteredData.reduce((acc, curr) => acc + curr.unitPrice, 0);
    const maxUnit = Math.max(...filteredData.map(d => d.unitPrice));
    
    return {
      count,
      avgPrice: Math.round((totalUnit / count) / 10000), // Wan
      maxPrice: Math.round(maxUnit / 10000)
    };
  }, [filteredData]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return sortedData.slice(start, start + ITEMS_PER_PAGE); // Use sortedData
  }, [sortedData, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        // Smooth scroll to results
        const element = document.getElementById('results-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Professional Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                    新北市預售屋
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide"實價登錄分析平台</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            {isFallback && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs rounded-full font-semibold flex items-center gap-1">
                   <ExclamationIcon /> 範例模式
                </span>
            )}
            <div className="hidden md:flex items-center space-x-2 text-sm">
               <span className={`h-2.5 w-2.5 rounded-full ${loadingState === LoadingState.SUCCESS ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></span>
               <span className="text-slate-500 font-medium">{loadingState === LoadingState.LOADING ? '同步資料中...' : '系統就緒'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Search & Filters Section - Floating Card Style */}
        <section className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 transition-all duration-300">
          <div className="mb-6 pb-4 border-b border-slate-100">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <SearchIcon /> 搜尋條件
             </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
            
            {/* Region Search */}
            <div className="relative col-span-1 md:col-span-1 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">所在區域</label>
              <div className="relative group">
                <input
                  type="text"
                  name="region"
                  placeholder="例如：板橋、新莊"
                  value={filters.region}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium text-slate-700"
                />
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <MapIcon />
                </div>
              </div>
            </div>

            {/* Project Search */}
            <div className="relative col-span-1 md:col-span-1 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">建案名稱</label>
              <div className="relative group">
                <input
                  type="text"
                  name="project"
                  placeholder="例如：國泰曦"
                  value={filters.project}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium text-slate-700"
                />
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <BuildingIcon />
                </div>
              </div>
            </div>
            
            {/* Month Range */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">交易月份區間</label>
               <div className="flex items-center space-x-2">
                 <input
                    type="month"
                    name="startMonth"
                    value={filters.startMonth}
                    onChange={handleFilterChange}
                    className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                 />
                 <span className="text-slate-300 font-light">|</span>
                 <input
                    type="month"
                    name="endMonth"
                    value={filters.endMonth}
                    onChange={handleFilterChange}
                    className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                 />
               </div>
            </div>

            {/* Price Range */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">單價區間 (萬)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <span className="text-slate-300 font-light">|</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Search Button (Full row on lg to prevent crowding) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-12 flex justify-end mt-2">
                <button
                    onClick={handleSearch}
                    disabled={loadingState !== LoadingState.SUCCESS}
                    className={`w-full lg:w-auto min-w-[200px] py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transform active:scale-95
                        ${loadingState === LoadingState.SUCCESS 
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300' 
                            : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                >
                    <SearchIcon />
                    開始查詢
                </button>
            </div>
          </div>
        </section>

        {/* Global Loading/Error State */}
        {loadingState === LoadingState.LOADING && (
           <div className="flex flex-col items-center justify-center py-24 space-y-6">
             <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-indigo-600"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                   <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                </div>
             </div>
             <p className="text-slate-500 font-medium text-lg animate-pulse">正在同步實價登錄資料庫...</p>
           </div>
        )}

        {loadingState === LoadingState.ERROR && (
           <div className="bg-red-50 border border-red-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
             <div className="bg-red-100 p-4 rounded-full ring-8 ring-red-50">
                <ExclamationIcon />
             </div>
             <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">資料讀取失敗</h3>
                <p className="text-red-700 max-w-lg mx-auto">{errorMessage}</p>
             </div>
             <button 
               onClick={initData}
               className="px-6 py-2.5 bg-white border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-50 transition-colors shadow-sm"
             >
               重新嘗試連線
             </button>
           </div>
        )}

        {/* Results Area */}
        {loadingState === LoadingState.SUCCESS && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="bg-slate-50 p-6 rounded-full mb-6 ring-1 ring-slate-100">
                    <SearchIcon />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">準備查詢</h3>
                <p className="max-w-md text-center text-slate-500">請在上方輸入區域或建案名稱，並點擊「開始查詢」按鈕。</p>
            </div>
        )}

        {loadingState === LoadingState.SUCCESS && hasSearched && (
          <div id="results-section" className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="符合筆數" 
                value={`${stats.count.toLocaleString()} 筆`} 
                subtext="查詢結果總計"
              />
              <StatCard 
                title="平均單價" 
                value={`${stats.avgPrice.toLocaleString()} 萬/坪`} 
                subtext="範圍內加權平均"
              />
              <StatCard 
                title="最高單價" 
                value={`${stats.maxPrice.toLocaleString()} 萬/坪`} 
                subtext="範圍內最高成交"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: List & Table */}
              <div className="lg:col-span-2 flex flex-col h-full">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">交易明細列表</h2>
                        <p className="text-xs text-slate-400 mt-1">點擊欄位標題可進行排序</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">{filteredData.length} 筆資料</span>
                  </div>
                  
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                          <th className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('date')}>
                            <div className="flex items-center gap-1">交易日期 {getSortIcon('date')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('region')}>
                            <div className="flex items-center gap-1">區域 {getSortIcon('region')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('project')}>
                            <div className="flex items-center gap-1">建案名稱 {getSortIcon('project')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('floor')}>
                            <div className="flex items-center gap-1">樓層 {getSortIcon('floor')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('unitPrice')}>
                             <div className="flex items-center justify-end gap-1">單價 <span className="text-[10px] text-slate-400">(萬/坪)</span> {getSortIcon('unitPrice')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('totalPrice')}>
                             <div className="flex items-center justify-end gap-1">總價 <span className="text-[10px] text-slate-400">(萬)</span> {getSortIcon('totalPrice')}</div>
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('area')}>
                             <div className="flex items-center justify-end gap-1">坪數 {getSortIcon('area')}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedData.length > 0 ? (
                          paginatedData.map((row) => (
                            <tr key={row.id} className="hover:bg-indigo-50/50 hover:shadow-sm transition-all duration-200 group border-l-2 border-transparent hover:border-indigo-500">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">{row.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                                {row.region || '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{row.project || '—'}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                                {row.floor || '-'}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-700 font-mono">
                                {Math.round(row.unitPrice / 10000).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 font-mono">
                                {Math.round(row.totalPrice / 10000).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 font-mono">
                                {row.area}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                               <div className="flex flex-col items-center">
                                  <span className="mb-2 text-2xl">🔍</span>
                                  沒有符合條件的資料
                               </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="text-xs font-medium text-slate-500">
                            顯示 {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} 
                            <span className="mx-1 text-slate-300">|</span> 
                            共 {filteredData.length} 筆
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:bg-slate-50 hover:border-indigo-200 transition-all"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <span className="text-sm text-slate-700 font-bold px-3 py-1 bg-white rounded-md border border-slate-200 shadow-sm">
                                {currentPage} <span className="text-slate-400 font-normal mx-1">/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:bg-slate-50 hover:border-indigo-200 transition-all"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Chart & AI Analysis */}
              <div className="space-y-8">
                
                {/* Chart Section with Tabs */}
                <div>
                  <div className="flex items-center space-x-1 mb-3 bg-slate-200/50 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setChartType('unit')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${chartType === 'unit' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ChartBarIcon /> 單價分析
                    </button>
                    <button
                        onClick={() => setChartType('total')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${chartType === 'total' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CashIcon /> 總價分析
                    </button>
                  </div>

                  <div className="transition-all duration-300">
                    {chartType === 'unit' ? (
                       <PriceChart data={filteredData} />
                    ) : (
                       <TotalPriceChart data={filteredData} />
                    )}
                  </div>
                </div>

                {/* AI Analysis Widget */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl shadow-2xl text-white overflow-hidden relative ring-1 ring-white/10">
                  <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
                        <SparklesIcon />
                        AI 市場透視
                      </h3>
                      {!aiAnalysis && !isAnalyzing && filteredData.length > 0 && (
                         <button 
                           onClick={handleAnalyze}
                           className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full transition-all backdrop-blur-md active:scale-95"
                         >
                           ✨ 開始分析
                         </button>
                      )}
                    </div>
                    
                    <div className="min-h-[200px] text-indigo-100 text-sm leading-7">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                           <div className="w-8 h-8 border-2 border-indigo-300/30 border-t-white rounded-full animate-spin"></div>
                           <span className="text-xs font-medium tracking-wider opacity-80 animate-pulse">Gemini 正在讀取市場數據...</span>
                        </div>
                      ) : aiAnalysis ? (
                        <div className="prose prose-invert prose-sm max-h-[450px] overflow-y-auto pr-2 custom-scrollbar-dark">
                           <Markdown>{aiAnalysis}</Markdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-60 border-2 border-dashed border-white/10 rounded-xl">
                          {filteredData.length > 0 ? (
                              <p className="max-w-[200px]">點擊上方按鈕，讓 AI 為您解讀這 {filteredData.length} 筆交易的市場趨勢。</p>
                          ) : (
                              <p>請先進行查詢以啟用分析功能。</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-40"></div>
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-violet-600 rounded-full blur-[80px] opacity-40"></div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} EstateVista. 資料來源：內政部實價登錄 (模擬數據).</p>
        </div>
      </footer>
    </div>
  );
};

export default App;