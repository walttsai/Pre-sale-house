import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

const getAiClient = () => {
    // Usually we shouldn't create this repeatedly but for this stateless service it's fine.
    // In a real app, use a singleton or context.
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeMarketTrends = async (transactions: Transaction[]): Promise<string> => {
    if (transactions.length === 0) {
        return "尚無資料可供分析。請嘗試放寬搜尋條件。";
    }

    // Limit context size - take top 30 relevant transactions to avoid token limits on free tier or latency
    const sampleData = transactions.slice(0, 30).map(t => ({
        date: t.date,
        address: t.address,
        price: t.totalPrice,
        unitPrice: t.unitPrice,
        project: t.project
    }));

    const prompt = `
    你是一位專業的台灣房地產分析師。請根據以下提供的實價登錄交易資料 (JSON 格式)，進行簡短但深入的市場分析。
    
    資料重點：
    1. 價格趨勢 (Price Trend)
    2. 最高與最低單價的案例 (High/Low)
    3. 區域或建案的觀察 (Location/Project insights)
    4. 給買家的建議 (Buyer advice)

    請用繁體中文回答，使用條列式 Markdown 格式。語氣專業且客觀。

    交易資料:
    ${JSON.stringify(sampleData)}
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2, // Low temperature for factual analysis
            }
        });

        return response.text || "無法生成分析報告。";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "AI 分析服務目前暫時無法使用，請稍後再試 (請確認 API Key 是否正確)。";
    }
};
