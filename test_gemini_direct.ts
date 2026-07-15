import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        speakersCount: { type: Type.INTEGER },
        languageConfidence: { type: Type.STRING },
      },
      required: ["speakersCount", "languageConfidence"],
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["title", "description", "keyPoints"],
    },
    dialogue: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING },
          uzbekText: { type: Type.STRING },
          russianText: { type: Type.STRING },
          timestamp: { type: Type.STRING },
        },
        required: ["speaker", "uzbekText", "russianText"],
      },
    },
  },
  required: ["metadata", "summary", "dialogue"],
};

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return;
  }

  const client = new GoogleGenAI({ apiKey });
  const filePath = path.join(process.cwd(), "test_audio.wav");

  try {
    console.log("1. Uploading file to Gemini Files API...");
    const fileUpload = await client.files.upload({
      file: filePath,
      config: {
        mimeType: "audio/wav",
      },
    });
    console.log("Uploaded! Name:", fileUpload.name, "URI:", fileUpload.uri, "State:", fileUpload.state);

    let fileState = fileUpload.state;
    let checkAttempts = 0;
    while (fileState === "PROCESSING" && checkAttempts < 10) {
      console.log(`Polling state (Attempt ${checkAttempts + 1}). Current state: ${fileState}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fileInfo = await client.files.get({ name: fileUpload.name });
      fileState = fileInfo.state;
      checkAttempts++;
    }

    console.log("2. Final file state:", fileState);

    if (fileState === "FAILED") {
      throw new Error("File processing failed on Gemini side.");
    }

    console.log("3. Generating content with gemini-flash-latest...");
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          fileData: {
            fileUri: fileUpload.uri,
            mimeType: fileUpload.mimeType || "audio/wav",
          },
        },
        "Прослушай аудио и верни JSON согласно схеме."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    console.log("4. Received response successfully!");
    console.log("Response text:", response.text);

    console.log("5. Cleaning up file from Gemini...");
    await client.files.delete({ name: fileUpload.name });
    console.log("Deleted!");
  } catch (err: any) {
    console.error("Error occurred in test:", err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

test();
