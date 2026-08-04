
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getCulturalInsight(topic: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Hãy chia sẻ thông tin chi tiết và ngắn gọn về phong tục "${topic}" của Việt Nam. Tập trung vào ý nghĩa tâm linh và cách bảo tồn phong tục này trong thời hiện đại. Trả lời bằng tiếng Việt.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
    return response.text || "Thông tin hiện chưa sẵn sàng. Vui lòng thử lại sau.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể kết nối với trí tuệ nhân tạo để lấy thông tin.";
  }
}
