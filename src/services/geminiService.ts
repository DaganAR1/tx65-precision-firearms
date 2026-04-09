import { GoogleGenAI, Type } from "@google/genai";
import { Product, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseProductFromText(text: string): Promise<Partial<Product>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract product information from the following text (likely from a gun shop website). 
    If you find multiple products, only extract the main one.
    
    Text:
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The product name" },
          description: { type: Type.STRING, description: "A detailed description" },
          price: { type: Type.NUMBER, description: "The price as a number" },
          category: { 
            type: Type.STRING, 
            description: "One of: Rifles, Pistols, Optics, Accessories, Ammunition" 
          },
          image_url: { type: Type.STRING, description: "The main product image URL if found" },
          stock_quantity: { type: Type.NUMBER, description: "Stock quantity if found, default to 10" },
          specs: { 
            type: Type.OBJECT, 
            description: "A key-value map of technical specifications (e.g., Caliber, Capacity, Barrel Length)",
            additionalProperties: { type: Type.STRING }
          }
        },
        required: ["name", "price", "category"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text);
    // Ensure category is valid
    const validCategories: Category[] = ['Rifles', 'Pistols', 'Optics', 'Accessories', 'Ammunition'];
    if (!validCategories.includes(result.category)) {
      result.category = 'Accessories';
    }
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not extract product data from the text provided.");
  }
}

export async function extractProductUrls(text: string, baseUrl: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract all product page URLs from the following text (which is a listing/category page from a gun shop).
    Return only the absolute URLs. If they are relative, prepend ${baseUrl}.
    
    Text:
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          urls: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of absolute product page URLs"
          }
        },
        required: ["urls"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text);
    return result.urls || [];
  } catch (error) {
    console.error("Failed to extract URLs:", error);
    return [];
  }
}
