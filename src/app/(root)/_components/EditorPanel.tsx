"use client";

import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useEffect, useState } from "react";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../_constants";
import { Editor } from "@monaco-editor/react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  LoaderCircle,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  ShareIcon,
  SparklesIcon,
  TypeIcon,
  X,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { EditorPanelSkeleton } from "./EditorPanelSkeleton";
import useMounted from "@/hooks/useMounted";
import ShareSnippetDialog from "./ShareSnippetDialog";
import { chatSession } from "@/utils/GeminiModel";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

function EditorPanel() {
  const clerk = useClerk();
  const { user } = useUser();

  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    _creationTime: number;
    proSince?: number;
    lemonSqueezyCustomerId?: string;
    lemonSqueezyOrderId?: string;
    userId: string;
    email: string;
    name: string;
    isPro: boolean;
  } | null>(null);

  useEffect(() => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const getCurrentUser = async () => {
      const convexUser = await convex.query(api.users.getUser, {
        userId: user?.id || "",
      });
      setCurrentUser(convexUser);
    };

    getCurrentUser();
  }, [user]);

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { language, theme, fontSize, editor, setFontSize, setEditor } =
    useCodeEditorStore();

  const [editorValue, setEditorValue] = useState("");
  const [question, setQuestion] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [aiResponse, setAiResponse] = useState("");

  const mounted = useMounted();

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(newCode);
  }, [language, editor]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) localStorage.setItem(`editor-code-${language}`, value);
    setEditorValue(value || "");
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  const generateAiResponse = async (editorValue: string) => {
    setLoading(true);
    try {
      const PROMPT = `existing code: ${editorValue}, if there is an existing code, help to debug or improve it further. Answer the question of the user which is: ${question}. Provide a answer based on the question or a personalized suggestion based on the existing code if any. Provide a code snippet if necessary to help. Generate the response in html format without the DOCTYPE, html, head, title, meta, and body tags, only the content.`;

      const result = await chatSession.sendMessage(PROMPT);
      if (result) {
        const aiResult = result.response.text();
        const cleanedResponse = aiResult.replace(/```html|```/g, "");
        setAiResponse(cleanedResponse);
        console.log("ai response: ", aiResult);
      } else {
        console.log("ai response error internal");
      }
    } catch (error) {
      console.log("ai response error external: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className="relative">
        <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
                <Image
                  src={"/" + language + ".png"}
                  alt="Logo"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <h2 className="text-sm font-medium text-white">Code Editor</h2>
                <p className="text-xs text-gray-500">
                  Write and execute your code
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              {/* Font Size Slider */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fontSize > 12 && setFontSize(fontSize - 1)}
                  disabled={fontSize <= 12}
                  className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors"
                  aria-label="Reset to default code"
                >
                  <MinusIcon className="size-4 text-gray-400" />
                </motion.button>
                <div className="flex items-center gap-3 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5">
                  <TypeIcon className="size-4 text-gray-400" />
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) =>
                        handleFontSizeChange(parseInt(e.target.value))
                      }
                      className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                      {fontSize}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fontSize < 24 && setFontSize(fontSize + 1)}
                  disabled={fontSize >= 24}
                  className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors"
                  aria-label="Reset to default code"
                >
                  <PlusIcon className="size-4 text-gray-400" />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors"
                aria-label="Reset to default code"
              >
                <RotateCcwIcon className="size-4 text-gray-400" />
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsShareDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden bg-gradient-to-r
               from-blue-500 to-blue-600 opacity-90 hover:opacity-100 transition-opacity"
              >
                <ShareIcon className="size-4 text-white" />
                <span className="text-sm font-medium text-white ">Share</span>
              </motion.button>
            </div>
          </div>

          {/* Editor  */}
          <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
            {clerk.loaded && (
              <Editor
                height="600px"
                language={LANGUAGE_CONFIG[language].monacoLanguage}
                onChange={handleEditorChange}
                theme={theme}
                beforeMount={defineMonacoThemes}
                onMount={(editor) => setEditor(editor)}
                options={{
                  minimap: { enabled: false },
                  fontSize,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  renderWhitespace: "selection",
                  fontFamily:
                    '"Fira Code", "Cascadia Code", Consolas, monospace',
                  fontLigatures: true,
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  contextmenu: true,
                  renderLineHighlight: "all",
                  lineHeight: 1.6,
                  letterSpacing: 0.5,
                  roundedSelection: true,
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                }}
              />
            )}

            {!clerk.loaded && <EditorPanelSkeleton />}
          </div>
        </div>
        {isShareDialogOpen && (
          <ShareSnippetDialog onClose={() => setIsShareDialogOpen(false)} />
        )}
      </div>
      {/* ai code helper */}
      {user && currentUser?.isPro ? (
        <div className="fixed bottom-5 left-4 z-50">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setModalOpen((prev) => !prev)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#60a5fa] ring-1 ring-white/5 p-2 text-gray-800">
              <SparklesIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Ask ZenAI</h2>
              <p className="text-xs text-gray-500">
                Chat with AI and ask for assistance
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`${modalOpen ? "flex" : "hidden"} absolute inset-0 items-center justify-center bg-black bg-opacity-50`}
      >
        <div className="w-[80%] h-auto rounded-lg bg-[#12121a]/90 backdrop-blur border border-white/[0.05] p-6 relative">
          <div
            className="absolute top-3 right-3 cursor-pointer p-1 rounded-lg bg-red-400 hover:bg-red-300 transition-all"
            onClick={() => setModalOpen(false)}
          >
            <X className=" w-4 h-4  text-red-600" />
          </div>
          <div className="w-full flex flex-col gap-1">
            <label className="text-xs text-gray-400">How can I help you?</label>
            <div className="flex items-center justify-center gap-3">
              <input
                type="text"
                className="w-full bg-[#1e1e2e] text-white p-2 rounded-lg ring-1 ring-white/5"
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-[#3b82f6] to-[#3b82f6] p-2 px-5 rounded-lg"
                onClick={() => generateAiResponse(editorValue)}
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    <p className="text-sm">Ask</p>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ai output */}
          <div className="w-full bg-[#1e1e2e] text-white p-2 rounded-lg min-h-52 max-h-52 mt-5 overflow-auto card-scroll">
            <div dangerouslySetInnerHTML={{ __html: aiResponse }} />
          </div>
        </div>
      </div>
    </div>
  );
}
export default EditorPanel;
