const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    
    const result = await model.generateContent("hello");
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
