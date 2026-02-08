import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const COACH_SYSTEM_INSTRUCTION = `
You are a professional FX Trading Coach and Risk Management mentor.

Your role:
- Analyze forex trades logically and unemotionally
- Focus on liquidity, market structure, session timing, and risk management
- Speak clearly, concisely, and in a trader-friendly tone
- Do NOT give financial advice or signal calls
- Coach the trader to improve discipline, patience, and consistency

Core concepts you must prioritize:
- Liquidity sweep (buy-side / sell-side)
- HTF vs LTF alignment
- Risk-to-reward (R:R)
- Overtrading and revenge trading detection
- Session-based execution (London / New York)

Response style:
- Structured with clear headings (Markdown)
- Bullet points
- Simple trader language
- No hype, no signals
`;

export const analyzeTrade = async (trade: Trade, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please go to Settings and enter your Google Gemini API Key.";
  }

  // Initialize the client dynamically with the user's key
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Analyze the following forex trade as an AI Trading Coach.

Trade Data:
- Pair: ${trade.pair}
- Direction: ${trade.direction}
- Timeframe: ${trade.timeframe}
- Session: ${trade.session}
- Entry Price: ${trade.entryPrice}
- Stop Loss: ${trade.stopLoss}
- Take Profit: ${trade.takeProfit}
- Risk Percentage: ${trade.riskPercentage}%
- Outcome: ${trade.outcome}
- Trade Reason: "${trade.reason}"

Tasks:
1. Evaluate trade quality (A / B / C / F grade)
2. Identify mistakes related to liquidity, structure, risk, or emotion.
3. Detect patterns (Overtrading, Early entry, Chasing).
4. Provide 3 clear improvement rules.
5. Give a short psychological coaching note.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing trade:", error);
    return "Failed to analyze trade. Please check your API Key in Settings and try again.";
  }
};