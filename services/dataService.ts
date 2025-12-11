import { Transaction } from '../types';

const SHEET_ID = '1obKJ7DT__0MeclJGJc7cNzQ8eYLz6T2kX5JdcrVsINs';
// Use Google Visualization API endpoint for better reliability with public sheets
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const FALLBACK_DATA: Transaction[] = [
  { id: '1', date: '1121015', region: '大安區', address: '信義路三段', project: '信義聯勤', totalPrice: 150000000, unitPrice: 2500000, area: 200, floor: '15', type: '住宅大樓', age: 2 },
  { id: '2', date: '1121102', region: '信義區', address: '松高路', project: '陶朱隱園', totalPrice: 300000000, unitPrice: 3000000, area: 300, floor: '8', type: '住宅大樓', age: 1 },
  { id: '3', date: '1121205', region: '板橋區', address: '文化路', project: '新巨蛋', totalPrice: 25000000, unitPrice: 650000, area: 40, floor: '22', type: '住宅大樓', age: 10 },
  { id: '4', date: '1130110', region: '西屯區', address: '惠來路', project: '寶輝秋紅谷', totalPrice: 80000000, unitPrice: 700000, area: 150, floor: '12', type: '住宅大樓', age: 5 },
  { id: '5', date: '1130120', region: '鼓山區', address: '美術東二路', project: '國賓', totalPrice: 35000000, unitPrice: 400000, area: 90, floor: '10', type: '住宅大樓', age: 3 },
  { id: '6', date: '1130201', region: '內湖區', address: '民權東路六段', project: '文心AIT', totalPrice: 45000000, unitPrice: 800000, area: 60, floor: '5', type: '華廈', age: 12 },
  { id: '7', date: '1130215', region: '竹北市', address: '文興路', project: '若山', totalPrice: 50000000, unitPrice: 600000, area: 85, floor: '18', type: '住宅大樓', age: 4 },
];

// Cache variable
let cachedResult: { data: Transaction[], isFallback: boolean } | null = null;

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let startValueIndex = 0;
  let quote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      quote = !quote;
    } else if (line[i] === ',' && !quote) {
      let val = line.substring(startValueIndex, i);
      if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
      result.push(val.trim());
      startValueIndex = i + 1;
    }
  }
  let lastVal = line.substring(startValueIndex);
  if (lastVal.startsWith('"') && lastVal.endsWith('"')) lastVal = lastVal.substring(1, lastVal.length - 1);
  result.push(lastVal.trim());
  return result;
};

// Helper to convert ROC year (e.g., 1120101) or standard date to standard format
const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return 'Unknown';
    const cleanStr = dateStr.trim().replace(/\//g, '').replace(/-/g, '');
    
    // Check if it looks like ROC year (e.g., 1120520 - 7 digits, or 990101 - 6 digits)
    if (/^\d{6,7}$/.test(cleanStr)) {
       let yearPart = parseInt(cleanStr.length === 7 ? cleanStr.substring(0, 3) : cleanStr.substring(0, 2));
       let monthPart = cleanStr.length === 7 ? cleanStr.substring(3, 5) : cleanStr.substring(2, 4);
       let dayPart = cleanStr.length === 7 ? cleanStr.substring(5) : cleanStr.substring(4);
       return `${yearPart + 1911}-${monthPart}-${dayPart}`;
    }
    
    // Attempt to handle YYYY/MM/DD or YYYY-MM-DD directly
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return dateStr;
};

// Calculate age from completion date (ROC format often)
const calculateAge = (completionDateStr: string, transactionDateStr: string): number => {
    if (!completionDateStr) return 0;
    
    const getYear = (str: string) => {
       const clean = str.replace(/\//g, '').replace(/-/g, '');
       if (/^\d{6,7}$/.test(clean)) {
         return parseInt(clean.length === 7 ? clean.substring(0, 3) : clean.substring(0, 2)) + 1911;
       }
       // Try standard JS date parse for 2023-01-01
       const d = new Date(str);
       if (!isNaN(d.getTime())) return d.getFullYear();
       return 0;
    };

    const buildYear = getYear(completionDateStr);
    const transYear = getYear(transactionDateStr) || new Date().getFullYear();
    
    if (buildYear > 0 && transYear > 0) {
        return Math.max(0, transYear - buildYear);
    }
    return 0;
};

export const fetchTransactionData = async (forceRefresh = false): Promise<{ data: Transaction[], isFallback: boolean, error?: string }> => {
  // Return cached data if available and not forced to refresh
  if (cachedResult && !forceRefresh) {
      console.log("Returning cached data");
      return cachedResult;
  }

  try {
    const response = await fetch(DATA_URL);
    
    // Check if response is valid
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
       console.warn("Received HTML instead of CSV. Sheet likely not published to web.");
       return { data: FALLBACK_DATA, isFallback: true, error: "Sheet not public" };
    }
    
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return { data: [], isFallback: false };

    // Header Detection
    const headers = parseCSVLine(lines[0]);
    console.log("Detected Headers:", headers);

    const getIndex = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

    // Expanded keywords for better matching custom sheets
    const idxDate = getIndex(['交易年月日', '日期', 'date', '年月日', '成交日', '交易日']);
    
    // District / Region detection
    const idxDistrict = getIndex(['鄉鎮市區', '行政區', 'district', 'area_zone', '區域']);

    const idxAddress = getIndex(['土地區段位置建物區段門牌', '建物門牌', '地址', 'address', 'location', '門牌']);
    const idxProject = getIndex(['建案名稱', '建案', '社區', 'project', '名稱']); 
    
    // Price related keywords
    const idxTotal = getIndex(['總價元', '總價', 'total price', 'total_price', '總價(萬)', '成交總價']);
    const idxUnit = getIndex(['單價元平方公尺', '單價', 'unit price', 'unit_price', '單價(萬/坪)', '每坪單價', '成交單價']);
    
    // Area related keywords
    const idxArea = getIndex(['建物移轉總面積平方公尺', '建物移轉總面積', '面積', 'area', '坪數', '總坪數', '建坪']);
    
    // Other attributes
    const idxFloor = getIndex(['移轉層次', '層次', 'floor', '樓層']);
    const idxType = getIndex(['建物型態', '型態', 'type', '類型']);
    const idxAge = getIndex(['屋齡', 'age']);
    const idxCompletionDate = getIndex(['建築完成年月', '完工日', 'completion', '完工日期']);

    // Unit Detection Helpers
    const isHeaderWan = (idx: number) => idx >= 0 && headers[idx].includes('萬');
    const isHeaderM2 = (idx: number) => idx >= 0 && (headers[idx].includes('平方公尺') || headers[idx].toLowerCase().includes('m2'));
    
    const isTotalInWan = isHeaderWan(idxTotal);
    const isUnitInWan = isHeaderWan(idxUnit);
    const isAreaInM2 = isHeaderM2(idxArea);

    const transactions: Transaction[] = lines.slice(1).map((line, index) => {
      const cols = parseCSVLine(line);
      const rawDate = idxDate >= 0 ? cols[idxDate] : '';
      const rawDistrict = idxDistrict >= 0 ? cols[idxDistrict] : '';
      const rawAddress = idxAddress >= 0 ? cols[idxAddress] : 'Unknown';
      const rawProject = idxProject >= 0 ? cols[idxProject] : '';
      
      // Cleanup Price: remove commas, $, etc. keep digits, dot, minus
      const parsePrice = (val: string) => {
          if (!val) return 0;
          const cleanVal = val.replace(/[^0-9.-]/g, '');
          return parseFloat(cleanVal) || 0;
      };
      
      let totalPrice = idxTotal >= 0 ? parsePrice(cols[idxTotal]) : 0;
      let unitPrice = idxUnit >= 0 ? parsePrice(cols[idxUnit]) : 0;
      let area = idxArea >= 0 ? parsePrice(cols[idxArea]) : 0;

      // Normalize Units to Standard (Total: Yuan, Unit: Yuan/Unit, Area: Ping)
      // If header says 'Wan', multiply by 10000 to get Yuan.
      if (isTotalInWan) totalPrice = totalPrice * 10000;
      if (isUnitInWan) unitPrice = unitPrice * 10000;

      // If area header says 'm2' or '平方公尺', convert to Ping (1 m2 = 0.3025 Ping)
      // Standard Taiwan open data is m2. Custom sheets might be Ping.
      if (isAreaInM2) {
          area = parseFloat((area * 0.3025).toFixed(2));
      } else {
          // Assume Ping if not specified as m2, or if explicitly Ping
          area = parseFloat(area.toFixed(2));
      }
      
      // Heuristic fallback: If Unit Price is very small (< 2000), it's likely Wan/Ping
      // Standard Unit Price in Taipei is > 500,000 (Yuan/Ping) or > 150,000 (Yuan/m2)
      // If we see "60", it's definitely 60 Wan.
      if (unitPrice > 0 && unitPrice < 10000) {
          unitPrice = unitPrice * 10000;
      }
      
      // Heuristic fallback: If Total Price is very small (< 10000), it's likely Wan
      // Real estate is rarely < 100,000 Yuan.
      if (totalPrice > 0 && totalPrice < 100000) {
          totalPrice = totalPrice * 10000;
      }

      // Calculate Age Logic
      let age = 0;
      if (idxAge >= 0 && cols[idxAge]) {
          age = parseFloat(cols[idxAge]) || 0;
      } else if (idxCompletionDate >= 0 && cols[idxCompletionDate]) {
          age = calculateAge(cols[idxCompletionDate], rawDate);
      }

      return {
        id: `row-${index}`,
        date: normalizeDate(rawDate),
        region: rawDistrict,
        address: rawAddress,
        project: rawProject,
        totalPrice,
        unitPrice,
        area,
        floor: idxFloor >= 0 ? cols[idxFloor] : '',
        type: idxType >= 0 ? cols[idxType] : '',
        age
      };
    });

    // Filter out rows that are likely empty or invalid
    const validTransactions = transactions.filter(t => t.totalPrice > 0 || t.address !== 'Unknown');
    
    console.log(`Parsed ${validTransactions.length} valid rows from ${lines.length} lines.`);
    
    // Cache the result
    cachedResult = { data: validTransactions, isFallback: false };
    
    return cachedResult;

  } catch (error: any) {
    console.warn("Error fetching data, using fallback.", error);
    return { data: FALLBACK_DATA, isFallback: true, error: error.message };
  }
};