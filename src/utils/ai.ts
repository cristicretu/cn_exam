import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function getExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  allAnswers: string[] = []
) {
  const answerOptions = allAnswers
    .map((answer, index) => `${String.fromCharCode(97 + index)}) ${answer}`)
    .join("\n");

  const prompt = `Question: ${question}

Available answers:
${answerOptions}

User selected: ${userAnswer}
Correct answer: ${correctAnswer}

Please explain why the user's answer was incorrect and why the correct answer is right. Reference the specific options in your explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting explanation:", error);
    return "Unable to generate explanation at this time.";
  }
}
