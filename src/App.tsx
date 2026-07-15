import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  UploadCloud, 
  FileAudio, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileText, 
  Search, 
  Users, 
  Clock, 
  Volume2, 
  HelpCircle,
  FileDown,
  ArrowRight,
  Filter,
  ShieldAlert,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProcessingResult, DialogueTurn } from "./types";
import { exampleCalls } from "./exampleData";
import { downloadDocx } from "./docxExport";

const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".mp4"];
const MAX_UPLOAD_MB = 200;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'russian' | 'uzbek' | 'bilingual'>('russian');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Drag and Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Validate and start processing
  const handleFileSelection = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Неподдерживаемый формат: ${ext}. Пожалуйста, загрузите mp3, wav, m4a, ogg или mp4.`);
      setStatus('error');
      return;
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setErrorMessage(`Файл слишком большой. Максимальный размер файла — ${MAX_UPLOAD_MB} МБ.`);
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  // Upload file via XMLHttpRequest to track progress
  const uploadFile = (selectedFile: File) => {
    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/transcribe", true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
        if (percentComplete === 100) {
          // Transition to processing status once upload reaches 100%
          setStatus('processing');
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = JSON.parse(xhr.responseText);
          setResult(responseData);
          setStatus('done');
        } catch (e) {
          setErrorMessage("Не удалось разобрать ответ от сервера. Пожалуйста, попробуйте снова.");
          setStatus('error');
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          setErrorMessage(errorData.error || `Ошибка сервера: ${xhr.statusText}`);
        } catch (e) {
          setErrorMessage(`Произошла ошибка при обработке файла (Код: ${xhr.status}).`);
        }
        setStatus('error');
      }
    };

    xhr.onerror = () => {
      setErrorMessage("Сетевая ошибка. Убедитесь, что сервер запущен и вы подключены к интернету.");
      setStatus('error');
    };

    xhr.send(formData);
  };

  // Quick launch with pre-packaged examples
  const loadExample = (example: ProcessingResult) => {
    setFile(null);
    setStatus('processing');
    setErrorMessage(null);
    
    // Simulate short loader for realistic premium feel
    setTimeout(() => {
      setResult(example);
      setStatus('done');
    }, 1200);
  };

  // Copy active text to clipboard
  const handleCopyText = async () => {
    if (!result) return;
    
    let textToCopy = "";
    
    if (activeTab === "russian") {
      textToCopy = result.dialogue
        .map(t => `${t.speaker}${t.timestamp ? ` [${t.timestamp}]` : ""}:\n${t.russianText}`)
        .join("\n\n");
    } else if (activeTab === "uzbek") {
      textToCopy = result.dialogue
        .map(t => `${t.speaker}${t.timestamp ? ` [${t.timestamp}]` : ""}:\n${t.uzbekText}`)
        .join("\n\n");
    } else {
      textToCopy = result.dialogue
        .map(t => `${t.speaker}${t.timestamp ? ` [${t.timestamp}]` : ""}:\nРусский: ${t.russianText}\nO'zbekcha: ${t.uzbekText}`)
        .join("\n\n");
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Download TXT report
  const handleDownloadTxt = () => {
    if (!result) return;

    let content = `==================================================\n`;
    content += `${result.summary.title.toUpperCase()}\n`;
    content += `==================================================\n\n`;
    content += `Файл: ${result.fileName} (${result.fileSize})\n`;
    content += `Время обработки: ${(result.processingTimeMs / 1000).toFixed(2)} сек\n`;
    content += `Количество спикеров: ${result.metadata.speakersCount}\n`;
    content += `Уверенность ИИ: ${result.metadata.languageConfidence === "high" ? "Высокая" : result.metadata.languageConfidence === "medium" ? "Средняя" : "Низкая"}\n\n`;
    
    content += `=== КРАТКОЕ РЕЗЮМЕ ===\n`;
    content += `${result.summary.description}\n\n`;
    
    content += `=== КЛЮЧЕВЫЕ МОМЕНТЫ ===\n`;
    result.summary.keyPoints.forEach((point) => {
      content += `- ${point}\n`;
    });
    content += `\n`;
    
    content += `=== ТРАНСКРИПТ И ПЕРЕВОД ===\n\n`;
    result.dialogue.forEach((turn) => {
      const timestamp = turn.timestamp ? ` [${turn.timestamp}]` : "";
      content += `${turn.speaker}${timestamp}:\n`;
      content += `  РУС: ${turn.russianText}\n`;
      content += `  UZB: ${turn.uzbekText}\n\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.summary.title.replace(/[\s/\\:*?"<>|]+/g, "_")}_транскрипт.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset state to clear dashboard
  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setUploadProgress(0);
    setErrorMessage(null);
    setResult(null);
    setSearchQuery("");
    setSelectedSpeaker("all");
  };

  // Get unique list of speakers for filters
  const getUniqueSpeakers = () => {
    if (!result) return [];
    return Array.from(new Set(result.dialogue.map(t => t.speaker)));
  };

  // Filter dialogue turns by speaker and search keywords
  const getFilteredDialogue = () => {
    if (!result) return [];
    return result.dialogue.filter(turn => {
      const matchesSpeaker = selectedSpeaker === "all" || turn.speaker === selectedSpeaker;
      const cleanSearch = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanSearch || 
        turn.russianText.toLowerCase().includes(cleanSearch) || 
        turn.uzbekText.toLowerCase().includes(cleanSearch) ||
        turn.speaker.toLowerCase().includes(cleanSearch);
      return matchesSpeaker && matchesSearch;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between">
      
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 font-display">Uzbek Call Transcriber</h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  AI v3.5
                </span>
              </div>
              <p className="text-xs text-slate-500">Интеллектуальная транскрибация звонков на узбекском с переводом на русский</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Языки:</span>
            <span>O'zbekcha 🇺🇿</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <span>Русский 🇷🇺</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* STATE: IDLE */}
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Promo Banner / Introduction */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
                <div className="relative z-10 max-w-3xl space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
                    Мгновенный перевод и смысловой анализ узбекских аудиозвонков
                  </h2>
                  <p className="text-indigo-200 text-base sm:text-lg leading-relaxed">
                    Загрузите аудиозапись телефонного разговора или встречи на узбекском языке. ИИ распознает голоса спикеров, сформирует точный транскрипт диалога, сделает красивый русский перевод, выделит краткую суть и подготовит отчет в Word.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs font-medium text-indigo-100">
                    <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Разделение спикеров</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Смысловой перевод</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Готовый отчет (DOCX)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>100% In-Memory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone Container */}
              <div 
                id="file-dropzone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`bg-white rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 relative group flex flex-col items-center justify-center min-h-[340px] ${
                  isDragActive 
                    ? "border-indigo-600 bg-indigo-50/50 shadow-inner" 
                    : "border-slate-300 hover:border-indigo-400 hover:shadow-lg hover:shadow-slate-100"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".mp3,.wav,.m4a,.ogg,.mp4"
                  className="hidden" 
                />

                <div className={`p-5 rounded-2xl bg-slate-50 text-slate-400 mb-6 transition-colors duration-300 ${
                  isDragActive ? "bg-indigo-100 text-indigo-600 animate-bounce" : "group-hover:bg-indigo-50 group-hover:text-indigo-500"
                }`}>
                  <UploadCloud className="h-10 w-10" />
                </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Перетащите аудиофайл сюда или <span className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">выберите на диске</span>
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Поддерживаются аудио и видео форматы: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">mp3</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">wav</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">m4a</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">ogg</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">mp4</code>
                  </p>
                  <p className="text-xs text-slate-400 pt-1">
                    Максимальный размер файла: {MAX_UPLOAD_MB} МБ • Временный файл удаляется сразу после обработки
                  </p>
                </div>
              </div>

              {/* Sample Files / Quick Start Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase px-4 bg-slate-50">или начните мгновенно с готовым примером</span>
                  <span className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exampleCalls.map((example, i) => (
                    <div 
                      key={i}
                      id={`example-card-${i}`}
                      onClick={() => loadExample(example)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-300 cursor-pointer flex items-start gap-4 group"
                    >
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <FileAudio className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm sm:text-base">
                            {example.summary.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                            {example.fileSize}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {example.summary.description}
                        </p>
                        <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            Спикеров: {example.metadata.speakersCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Демонстрация
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE: UPLOADING / PROCESSING */}
          {(status === 'uploading' || status === 'processing') && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-lg flex flex-col items-center justify-center space-y-8 min-h-[420px]"
            >
              {/* Pulsing AI Wave Circles */}
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse" />
                <div className="relative h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <RefreshCw className="h-7 w-7 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  {status === 'uploading' ? "Загрузка файла..." : "Анализ разговора искусственным интеллектом"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {status === 'uploading' 
                    ? "Файл передается на сервер для подготовки к распознаванию..." 
                    : "Gemini AI распознает узбекскую речь, разделяет реплики говорящих, находит неразборчивые фрагменты и выполняет смысловой перевод."}
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full max-w-md space-y-2">
                <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: status === 'uploading' ? `${uploadProgress}%` : "95%" 
                    }}
                    transition={{ duration: status === 'uploading' ? 0.1 : 5 }}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>
                    {status === 'uploading' ? `Загружено ${uploadProgress}%` : "Транскрибация и перевод..."}
                  </span>
                  <span className="font-mono">
                    {status === 'uploading' ? `${(uploadProgress)}%` : "Идет обработка..."}
                  </span>
                </div>
              </div>

              {/* Loading Steps Checklist */}
              <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status === 'uploading' ? 'bg-indigo-600 animate-pulse' : 'bg-green-500'}`} />
                  <span className={`font-medium ${status !== 'uploading' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    1. Загрузка файла в память
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status === 'processing' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={`font-medium ${status === 'processing' ? 'text-slate-800' : 'text-slate-400'}`}>
                    2. Распознавание узбекской речи (Speech-to-Text)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="font-medium text-slate-400">
                    3. Смысловой перевод на русский язык
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="font-medium text-slate-400">
                    4. Генерация краткого резюме звонка
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE: ERROR */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg mx-auto bg-white border border-red-100 rounded-3xl p-8 text-center shadow-lg shadow-red-50/50 flex flex-col items-center justify-center space-y-6"
            >
              <div className="p-4 rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 font-display">Произошла ошибка</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {errorMessage || "Что-то пошло не так во время обработки аудиозаписи. Проверьте правильность файла и настройки ключа API."}
                </p>
              </div>

              {/* Informative tips box */}
              <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-indigo-500" /> 
                  Возможные причины ошибки:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Отсутствует переменная окружения <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">GEMINI_API_KEY</code> в панели Secrets.</li>
                  <li>Аудиофайл поврежден или имеет неверный формат.</li>
                  <li>Превышен лимит времени запроса или размер файла (макс. {MAX_UPLOAD_MB} МБ).</li>
                </ul>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  id="error-reset-btn"
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
                >
                  Вернуться
                </button>
                <button
                  id="error-retry-btn"
                  onClick={() => file ? uploadFile(file) : handleReset()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                >
                  Повторить попытку
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE: DONE */}
          {status === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* SUCCESS NOTIFICATION & TOP DETAILS BAR */}
              <div className="lg:col-span-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Обработка успешно завершена</h4>
                    <p className="text-xs text-slate-500">Аудиозапись проанализирована и транскрибирована в режиме Real-time</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    id="upload-new-btn"
                    onClick={handleReset}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Загрузить новый
                  </button>
                </div>
              </div>

              {/* LEFT COLUMN: CALL METADATA & SUMMARY VIEW (5/12 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Summary Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold font-mono">Анализ разговора</span>
                    <h3 className="text-xl font-bold text-slate-900 font-display leading-snug">
                      {result.summary.title}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150 italic">
                    « {result.summary.description} »
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Ключевые моменты звонка:</h4>
                    <ul className="space-y-2.5">
                      {result.summary.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-700">
                          <span className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Metrics Info Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Технические метрики:</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Имя файла</span>
                      <p className="text-xs font-bold text-slate-800 truncate" title={result.fileName}>
                        {result.fileName}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Размер файла</span>
                      <p className="text-sm font-bold text-slate-800 font-mono">
                        {result.fileSize}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Спикеров на записи</span>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <p className="text-sm font-bold text-slate-800">
                          {result.metadata.speakersCount}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Скорость обработки</span>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {(result.processingTimeMs / 1000).toFixed(2)} сек
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Качество транскрибации ИИ</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        result.metadata.languageConfidence === "high"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : result.metadata.languageConfidence === "medium"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-rose-50 border-rose-200 text-rose-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          result.metadata.languageConfidence === "high" ? "bg-emerald-500" : result.metadata.languageConfidence === "medium" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                        {result.metadata.languageConfidence === "high" ? "Высокое" : result.metadata.languageConfidence === "medium" ? "Среднее" : "Низкое"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-indigo-50/50 rounded-xl p-3 text-[11px] text-indigo-800 border border-indigo-100">
                    <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Файл не покидал пределы вашего браузера и API шлюза. Запись обработана конфиденциально.</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: DETAILED DIALOGUE THREAD & EXPORTS (7/12 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Dialogue Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[500px]">
                  
                  {/* Dialogue Filters Bar */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 sm:flex-row sm:items-center">
                    
                    {/* Search bar inside dialogues */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Поиск по диалогу..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* Speaker filter dropdown */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                      <select
                        value={selectedSpeaker}
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition cursor-pointer max-w-[150px] sm:max-w-none text-slate-700 font-medium"
                      >
                        <option value="all">Все спикеры</option>
                        {getUniqueSpeakers().map((sp, idx) => (
                          <option key={idx} value={sp}>{sp}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Tab Selector buttons */}
                  <div className="flex border-b border-slate-150 p-2 gap-1 bg-white">
                    <button
                      id="tab-russian-btn"
                      onClick={() => setActiveTab('russian')}
                      className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'russian'
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      Русский перевод
                    </button>
                    <button
                      id="tab-uzbek-btn"
                      onClick={() => setActiveTab('uzbek')}
                      className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'uzbek'
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      Исходный текст (UZB)
                    </button>
                    <button
                      id="tab-bilingual-btn"
                      onClick={() => setActiveTab('bilingual')}
                      className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'bilingual'
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      Двуязычный вид
                    </button>
                  </div>

                  {/* Active Transcript Dialogue Thread */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[500px]">
                    <AnimatePresence mode="popLayout">
                      {getFilteredDialogue().length > 0 ? (
                        getFilteredDialogue().map((turn, idx) => {
                          const isOperator = turn.speaker.toLowerCase().includes("оператор") || turn.speaker.toLowerCase().includes("менеджер");
                          
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex gap-3 max-w-[90%] ${isOperator ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                            >
                              {/* Small speaker avatar icon */}
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                                isOperator 
                                  ? "bg-sky-100 text-sky-700" 
                                  : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {turn.speaker.charAt(0)}
                              </div>

                              <div className="space-y-1.5">
                                {/* Header with Speaker Name & Timestamp */}
                                <div className={`flex items-center gap-2 text-xs font-semibold ${isOperator ? "justify-start text-sky-800" : "justify-end text-emerald-800"}`}>
                                  <span>{turn.speaker}</span>
                                  {turn.timestamp && (
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {turn.timestamp}
                                    </span>
                                  )}
                                </div>

                                {/* Dialogue Speech bubble */}
                                <div className={`p-4 rounded-2xl shadow-xs border text-xs sm:text-sm leading-relaxed ${
                                  isOperator 
                                    ? "bg-sky-50/50 border-sky-150 rounded-tl-none text-slate-800" 
                                    : "bg-emerald-50/40 border-emerald-150 rounded-tr-none text-slate-800"
                                }`}>
                                  
                                  {/* Russian Text */}
                                  {(activeTab === "russian" || activeTab === "bilingual") && (
                                    <p className="font-medium text-slate-900">
                                      {turn.russianText}
                                    </p>
                                  )}

                                  {/* Uzbek Text Spacer */}
                                  {activeTab === "bilingual" && <div className="h-2 border-t border-slate-200/60 my-2" />}

                                  {/* Uzbek Original Text */}
                                  {(activeTab === "uzbek" || activeTab === "bilingual") && (
                                    <p className={`italic ${activeTab === "bilingual" ? "text-xs text-slate-500 font-medium" : "text-slate-800"}`}>
                                      {turn.uzbekText}
                                    </p>
                                  )}

                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-slate-400 space-y-2">
                          <HelpCircle className="h-8 w-8 mx-auto stroke-1 text-slate-300" />
                          <p className="text-xs font-semibold">Реплик не найдено</p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Измените ключевые слова в поисковой строке или выберите другого спикера.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions / Export Bar at the bottom of the Dialogue container */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      {/* Copy Button */}
                      <button
                        id="copy-transcript-btn"
                        onClick={handleCopyText}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                          copied 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Скопировать текущую вкладку в буфер"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Скопировано!" : "Копировать"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {/* Download TXT */}
                      <button
                        id="download-txt-btn"
                        onClick={handleDownloadTxt}
                        className="px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Скачать TXT
                      </button>

                      {/* Download DOCX */}
                      <button
                        id="download-docx-btn"
                        onClick={() => downloadDocx(result)}
                        className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                      >
                        <FileDown className="h-3.5 w-3.5 text-indigo-200" />
                        Скачать DOCX (Word)
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Branding & Disclaimer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Uzbek Call Transcriber. Все права защищены.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>In-Memory Storage</span>
            <span>•</span>
            <span>Gemini AI v3.5 Flash</span>
            <span>•</span>
            <span>Word DOCX Export</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
