import React, { useState } from 'react';
import { processStudyMaterial } from '../services/geminiService';
import { NoteSummary } from '../types';
import { FileUp, Link as LinkIcon, FileText, ChevronRight, Loader2, Copy, Check } from 'lucide-react';

const SmartNotes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link' | 'text' | 'file'>('link');
  const [inputLink, setInputLink] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NoteSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    setLoading(true);
    setResult(null);
    try {
      let fileData;
      if (activeTab === 'file' && selectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            // Remove data url prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(selectedFile);
        const base64 = await base64Promise;
        fileData = { mimeType: selectedFile.type, data: base64 };
      }

      const summary = await processStudyMaterial(
        activeTab === 'text' ? inputText : null,
        activeTab === 'link' ? inputLink : null,
        fileData
      );
      setResult(summary);
    } catch (err) {
      console.error(err);
      alert("Failed to process content. Ensure it's a valid format.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `
${result.title}

Summary:
${result.summary}

Key Points:
${result.keyPoints.map(k => `- ${k}`).join('\n')}

Formulas:
${result.formulas?.join('\n') || 'None'}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
      {/* Input Section */}
      <div className="space-y-6 overflow-y-auto pr-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Smart Notes</h2>
          <p className="text-slate-500 dark:text-slate-400">Paste a YouTube link, upload a PDF, or paste text. AI will extract key points and formulas.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 inline-flex w-full">
          <button 
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'link' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <LinkIcon size={16} className="inline mr-2" /> Link
          </button>
          <button 
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'file' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <FileUp size={16} className="inline mr-2" /> PDF/Image
          </button>
          <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'text' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <FileText size={16} className="inline mr-2" /> Text
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[300px] flex flex-col">
          {activeTab === 'link' && (
             <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">YouTube or Article URL</label>
                <input 
                  type="url" 
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">Note: For YouTube, the AI will use the title/description and its internal knowledge or search grounding to summarize.</p>
             </div>
          )}
          
          {activeTab === 'file' && (
            <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <FileUp className="text-slate-300 dark:text-slate-600 w-12 h-12 mb-3" />
              {selectedFile ? (
                <div>
                  <p className="font-medium text-indigo-600 dark:text-indigo-400">{selectedFile.name}</p>
                  <button onClick={() => setSelectedFile(null)} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, PNG, JPG (Max 5MB)</p>
                  <input 
                    type="file" 
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your notes or article text here..."
              className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
            />
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
             <button 
               onClick={handleProcess}
               disabled={loading || (!inputLink && !inputText && !selectedFile)}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex justify-center items-center gap-2"
             >
               {loading ? <Loader2 className="animate-spin" /> : 'Generate Summary & MCQs'}
             </button>
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-full">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Generated notes and key points will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 relative">
            <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 pr-12">{result.title || "Study Summary"}</h3>
              <div className="prose prose-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.summary}
              </div>
            </div>

            {result.keyPoints && result.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-500 rounded-full"></span> Key Points
                </h4>
                <ul className="space-y-2">
                  {result.keyPoints.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <ChevronRight size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.formulas && result.formulas.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Formulas to Remember</h4>
                <div className="grid gap-2">
                  {result.formulas.map((f, i) => (
                    <div key={i} className="font-mono text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.potentialQuestions && result.potentialQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Self Check</h4>
                <div className="space-y-4">
                  {result.potentialQuestions.map((q, i) => (
                    <div key={i} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <p className="font-medium text-slate-900 dark:text-white text-sm mb-2">Q: {q.question}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">A: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotes;