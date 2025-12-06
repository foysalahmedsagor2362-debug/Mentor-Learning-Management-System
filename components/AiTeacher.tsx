import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Image as ImageIcon, FileText, Loader2, Bot, User, Paperclip, Trash2 } from 'lucide-react';
import { incrementUsage, hasUsageRemaining } from '../services/usageService';

const AiTeacher: React.FC = () => {
  const [language, setLanguage] = useState<'bengali' | 'english'>('bengali');
  
  // Initialize messages from localStorage or default
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      return JSON.parse(saved);
    }
    return [{
      id: '1',
      role: 'model',
      text: "নমস্কার! আমি তোমার এইমার্স এআই শিক্ষক। আমি তোমাকে পদার্থবিজ্ঞান, রসায়ন, গণিত এবং জীববিজ্ঞান বিষয়ে সাহায্য করতে পারি। তোমার প্রশ্ন আমাকে বলো বা কোনো সমস্যার ছবি/পিডিএফ আপলোড করো, আমি সমাধান করে দেবো।",
      timestamp: Date.now()
    }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{data: string, type: 'image' | 'pdf', mimeType: string, name: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history:", e);
      // Fallback: If quota exceeded, maybe just don't save or try to save only last 10
    }
  }, [messages]);

  // Update greeting when language changes IF no other messages exist
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'model') {
      const bengaliGreeting = "নমস্কার! আমি তোমার এইমার্স এআই শিক্ষক। আমি তোমাকে পদার্থবিজ্ঞান, রসায়ন, গণিত এবং জীববিজ্ঞান বিষয়ে সাহায্য করতে পারি। তোমার প্রশ্ন আমাকে বলো বা কোনো সমস্যার ছবি/পিডিএফ আপলোড করো, আমি সমাধান করে দেবো।";
      const englishGreeting = "Hello! I am your Aimers AI Teacher. I can help you with Physics, Chemistry, Math, and Biology. Ask me a question or upload a photo/PDF of a problem, and I'll help you solve it.";
      
      setMessages([{
        ...messages[0],
        text: language === 'bengali' ? bengaliGreeting : englishGreeting
      }]);
    }
  }, [language, messages.length]);

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      const defaultText = language === 'bengali' 
        ? "নমস্কার! আমি তোমার এইমার্স এআই শিক্ষক। আমি তোমাকে পদার্থবিজ্ঞান, রসায়ন, গণিত এবং জীববিজ্ঞান বিষয়ে সাহায্য করতে পারি। তোমার প্রশ্ন আমাকে বলো বা কোনো সমস্যার ছবি/পিডিএফ আপলোড করো, আমি সমাধান করে দেবো।"
        : "Hello! I am your Aimers AI Teacher. I can help you with Physics, Chemistry, Math, and Biology. Ask me a question or upload a photo/PDF of a problem, and I'll help you solve it.";

      const initialMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: defaultText,
        timestamp: Date.now()
      };
      setMessages([initialMsg]);
      localStorage.removeItem('chatHistory');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        alert("Please upload an image or PDF.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedFile({
          data: result,
          type: isPdf ? 'pdf' : 'image',
          mimeType: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;

    if (!hasUsageRemaining()) {
      alert("Daily limit reached! Please upgrade to continue.");
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachment: selectedFile ? { 
        type: selectedFile.type, 
        url: selectedFile.data, 
        name: selectedFile.name 
      } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Extract base64 and use correct mime type
    const attachmentToSend = selectedFile ? { 
      data: selectedFile.data.split(',')[1], 
      mimeType: selectedFile.mimeType
    } : undefined;
    
    setSelectedFile(null);
    setLoading(true);

    try {
      incrementUsage(); // Deduct usage
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text, attachmentToSend, language);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: language === 'bengali' 
          ? "দুঃখিত, সার্ভারের সাথে সংযোগে সমস্যা হচ্ছে। আপনার ইন্টারনেট বা এপিআই কী পরীক্ষা করুন।" 
          : "Sorry, there is an issue connecting to the server. Please check your internet or API key.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-900/50 dark:border-b dark:border-indigo-800 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold">Ask Aimers</h2>
            <p className="text-xs text-indigo-100 dark:text-indigo-300">Always online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex bg-indigo-800/60 dark:bg-slate-900/50 p-1 rounded-lg">
             <button 
               onClick={() => setLanguage('bengali')}
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'bengali' ? 'bg-white text-indigo-700 dark:text-indigo-900 shadow-sm' : 'text-indigo-200 hover:text-white hover:bg-white/10'}`}
             >
               বাংলা
             </button>
             <button 
               onClick={() => setLanguage('english')}
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'english' ? 'bg-white text-indigo-700 dark:text-indigo-900 shadow-sm' : 'text-indigo-200 hover:text-white hover:bg-white/10'}`}
             >
               English
             </button>
          </div>

          {/* Clear Chat Button */}
          <button 
            onClick={handleClearChat}
            className="p-2 bg-indigo-800/60 dark:bg-slate-900/50 hover:bg-red-500/80 rounded-lg text-indigo-200 hover:text-white transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className={`p-4 rounded-2xl ${isUser ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-800 rounded-tl-none'}`}>
                  {msg.attachment && (
                    <div className="mb-3 bg-white/10 p-2 rounded-lg border border-white/20">
                      {msg.attachment.type === 'image' ? (
                        <img src={msg.attachment.url} alt="User upload" className="max-w-full h-auto rounded-lg" />
                      ) : (
                         <div className="flex items-center gap-2 text-sm">
                           <FileText size={16} />
                           <span className="truncate max-w-[150px]">{msg.attachment.name}</span>
                         </div>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[70%]">
               <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot size={16} />
               </div>
               <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                 <Loader2 className="animate-spin text-indigo-500" size={16} />
                 <span className="text-sm text-slate-500 dark:text-slate-400">Thinking... ({language === 'bengali' ? 'এআই চিন্তা করছে' : 'AI is thinking'})</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        {selectedFile && (
          <div className="mb-2 inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg text-xs text-indigo-700 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-900/30">
             {selectedFile.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
             <span className="max-w-[200px] truncate">{selectedFile.name}</span>
             <button onClick={() => setSelectedFile(null)} className="ml-1 hover:text-red-500 p-0.5 rounded-full hover:bg-white dark:hover:bg-slate-800">×</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <label className="p-3 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <Paperclip size={20} />
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={language === 'bengali' ? "প্রশ্ন লিখুন..." : "Ask your question..."}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || loading}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTeacher;