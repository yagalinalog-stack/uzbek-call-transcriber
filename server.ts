import express, { NextFunction, Request, Response } from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs/promises";
import * as fsSync from "fs";
import os from "os";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".mp4"];
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 200);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 32768);
const GEMINI_FILE_PROCESSING_ATTEMPTS = Number(process.env.GEMINI_FILE_PROCESSING_ATTEMPTS || 150);
const uploadDir = path.join(os.tmpdir(), "uzbek-call-transcriber-uploads");

function getSupportedMimeType(fileName: string, fallback?: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".m4a":
      return "audio/mp4";
    case ".ogg":
      return "audio/ogg";
    case ".mp4":
      return "video/mp4";
    default:
      return fallback && fallback !== "application/octet-stream" ? fallback : "audio/mpeg";
  }
}

// Store uploads on disk so larger files do not consume process memory twice.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fsSync.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      cb(new Error(`Unsupported file format: ${ext}. Allowed formats: mp3, wav, m4a, ogg, mp4.`));
      return;
    }
    cb(null, true);
  },
});

// Configure Google GenAI Client
let ai: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Serve API routes first
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Main transcription & translation endpoint
app.post("/api/transcribe", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Файл не предоставлен. Пожалуйста, загрузите аудиофайл." });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      res.status(400).json({
        error: `Неподдерживаемый формат файла: ${ext}. Разрешены форматы: mp3, wav, m4a, ogg, mp4.`,
      });
      return;
    }

    const mimeType = getSupportedMimeType(file.originalname, file.mimetype);

    const client = getAIClient();

    const promptText = `
      Ты — профессиональный переводчик и эксперт по анализу телефонных звонков на узбекском языке.
      Перед тобой аудиозапись звонка/разговора на узбекском языке.

      Выполни следующие задачи с максимальной точностью:
      1. Прослушай аудиозапись. Определи количество спикеров (например, Спикер 1, Спикер 2, или Оператор и Клиент).
      2. Транскрибируй весь разговор в хронологическом порядке на оригинальном узбекском языке (раздели реплики по спикерам).
         - Если один и тот же спикер говорит непрерывно в течение нескольких предложений, сгруппируй их в один логический абзац/реплику (turn) с указанием таймкода начала этого абзаца. Не разделяй речь одного спикера на множество мелких реплик по 2-3 секунды. Это сделает транскрипт лаконичным, читаемым, предотвратит обрезку текста из-за лимитов модели и ускорит обработку в разы.
         - Если слова/фразы неразборчивы, отметь их строго как "[неразборчиво]". Не выдумывай слова!
         - Игнорируй фоновый шум, вздохи, музыку и не-речевые фрагменты.
      3. Сделай качественный, естественный и смысловой перевод каждой реплики на русский язык.
         - Перевод должен звучать профессионально, сохраняя смысл, интонацию и контекст исходного разговора.
         - Не делай дословный сухой перевод — обеспечь красивую русскую речь.
      4. Сделай краткое резюме звонка на русском языке: придумай лаконичный заголовок (title), напиши краткое описание сути звонка (description) в одно предложение, и выдели ключевые моменты/выводы (keyPoints) в виде списка.
      5. Укажи приблизительные таймкоды для реплик (например, "00:02", "00:15"), если они понятны по структуре записи, либо просто распредели их логически.

      Верни ответ строго в формате JSON, соответствующем предоставленной схеме.
    `;

    // Define response schema to force JSON format
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        metadata: {
          type: Type.OBJECT,
          properties: {
            speakersCount: {
              type: Type.INTEGER,
              description: "Количество обнаруженных говорящих на записи (например, 2).",
            },
            languageConfidence: {
              type: Type.STRING,
              description: "Уверенность в распознавании речи. Допустимые значения: 'high', 'medium', 'low'.",
            },
          },
          required: ["speakersCount", "languageConfidence"],
        },
        summary: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Краткий заголовок сути звонка на русском языке (например, 'Заказ доставки пиццы').",
            },
            description: {
              type: Type.STRING,
              description: "Одно предложение, описывающее цель звонка на русском языке.",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Ключевые выводы или договоренности на русском языке.",
            },
          },
          required: ["title", "description", "keyPoints"],
        },
        dialogue: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: {
                type: Type.STRING,
                description: "Имя спикера, например, 'Спикер 1', 'Спикер 2' или роли, например, 'Оператор', 'Клиент'.",
              },
              uzbekText: {
                type: Type.STRING,
                description: "Оригинальный узбекский текст реплики. Неразборчивые места помечай как '[неразборчиво]'.",
              },
              russianText: {
                type: Type.STRING,
                description: "Смысловой перевод реплики на русский язык.",
              },
              timestamp: {
                type: Type.STRING,
                description: "Примерное время начала реплики в формате 'ММ:СС'.",
              },
            },
            required: ["speaker", "uzbekText", "russianText"],
          },
          description: "Список реплик диалога в хронологическом порядке.",
        },
      },
      required: ["metadata", "summary", "dialogue"],
    };

    const tempFilePath = file.path;

    let fileUpload: any = null;
    try {
      console.log(`Uploading file ${file.originalname} (${(file.size / 1024).toFixed(1)} KB) to Gemini Files API...`);
      fileUpload = await client.files.upload({
        file: tempFilePath,
        config: {
          mimeType: mimeType,
        },
      });
      console.log(`Uploaded successfully. File URI: ${fileUpload.uri}`);

      // Polling to make sure the file is active and processed before generating content
      let fileState = String(fileUpload.state || "").toUpperCase();
      let checkAttempts = 0;
      while (fileState === "PROCESSING" && checkAttempts < GEMINI_FILE_PROCESSING_ATTEMPTS) {
        console.log(`File ${file.originalname} is still processing, waiting 2 seconds (Attempt ${checkAttempts + 1}/${GEMINI_FILE_PROCESSING_ATTEMPTS})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const fileInfo = await client.files.get({ name: fileUpload.name });
        fileState = String(fileInfo.state || "").toUpperCase();
        checkAttempts++;
      }

      if (fileState === "FAILED") {
        throw new Error("Не удалось обработать аудиофайл в Gemini Files API (Ошибка обработки файла).");
      } else if (fileState === "PROCESSING") {
        throw new Error("Аудиофайл обрабатывается слишком долго. Пожалуйста, попробуйте отправить его ещё раз.");
      }

      console.log(`File ${file.originalname} is ready for processing. State: ${fileState}`);

      // Call Gemini Model using Files API reference
      const geminiResponse = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            fileData: {
              fileUri: fileUpload.uri,
              mimeType: fileUpload.mimeType || mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2, // Low temperature for higher accuracy in transcription
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        },
      });

      const responseText = geminiResponse.text;
      if (!responseText) {
        throw new Error("Модель вернула пустой ответ.");
      }

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(responseText.trim());
      } catch (parseError) {
        console.error("Failed to parse Gemini JSON response:", parseError, responseText.slice(0, 1000));
        throw new Error("Модель вернула неполный или некорректный JSON. Обычно это происходит на длинных записях, когда ответ транскрипции не помещается в лимит модели.");
      }
      const durationMs = Date.now() - startTime;

      // Format human-readable file size
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      res.json({
        fileName: file.originalname,
        fileSize: `${sizeInMB} MB`,
        processingTimeMs: durationMs,
        ...parsedResult,
      });
    } finally {
      // Clean up local temp file asynchronously
      try {
        await fs.unlink(tempFilePath);
        console.log(`Cleaned up local temp file: ${tempFilePath}`);
      } catch (unlinkErr) {
        console.error("Failed to delete local temp file:", unlinkErr);
      }

      // Clean up Gemini Files API file asynchronously
      if (fileUpload) {
        try {
          await client.files.delete({ name: fileUpload.name });
          console.log(`Cleaned up Gemini file: ${fileUpload.name}`);
        } catch (deleteErr) {
          console.error("Failed to delete Gemini file:", deleteErr);
        }
      }
    }
  } catch (error: any) {
    console.error("Transcription error:", error);
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
    const details = error.message || String(error);
    res.status(500).json({
      error: details || "Произошла ошибка при обработке аудиофайла.",
      details,
    });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api/")) {
    next(err);
    return;
  }

  console.error("API middleware error:", err);
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      error: `Файл слишком большой. Максимальный размер файла - ${MAX_UPLOAD_MB} МБ.`,
      details: err.message,
    });
    return;
  }

  res.status(400).json({
    error: err.message || "Не удалось принять загруженный файл.",
    details: err.message || String(err),
  });
});

// Configure Vite or production static files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Увеличиваем таймауты до 15 минут для долгой обработки аудиозаписей
  server.timeout = 900000;
  server.headersTimeout = 901000;
  server.keepAliveTimeout = 900000;
}

initServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
