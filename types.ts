export interface Transaction {
  id: string;
  date: string; // 交易年月日 YYYY-MM-DD
  region: string; // 鄉鎮市區
  address: string; // 土地區段位置建物區段門牌
  project: string; // 建案名稱
  totalPrice: number; // 總價元
  unitPrice: number; // 單價元平方公尺
  area: number; // 建物移轉總面積平方公尺
  floor: string; // 移轉層次
  type: string; // 建物型態
  age: number; // 屋齡
}

export interface FilterState {
  region: string;   // 所在區域 (e.g. 台北市大安區)
  project: string;  // 建案名稱
  startMonth: string; // YYYY-MM
  endMonth: string;   // YYYY-MM
  minPrice: number | '';
  maxPrice: number | '';
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  summary: string;
  trend: string;
  recommendation: string;
}