import React, { useState } from 'react';
import { generateMockTest } from '../services/geminiService';
import { MOCK_TEST_TOPICS, SUBJECTS_LIST } from '../constants';
import { MockQuestion, MockTestResult, User } from '../types';
import { Loader2, CheckCircle, XCircle, Trophy, ArrowRight, FileUp, Sparkles } from 'lucide-react';
import { incrementUsage, hasUsageRemaining } from '../services/usageService';

const MockTest: React.FC<{user: User | null}> = ({ user }) => {
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [subject, setSubject] = useState(SUBJECTS_LIST[0]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [pdfFile, setPdfFile] = useState<{name: string, data: string} | null>(null);

  const availableTopics = MOCK_TEST_TOPICS[subject] || ['General'];

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64 = (reader.result as string).split(',')[1];
         setPdfFile({ name: file.name, data: base64 });
       };
       reader.readAsDataURL(file);
    }
  };

  const handleStart = async () => {
    if (!hasUsageRemaining(user?.id)) {
      alert("Daily limit reached! Please upgrade.");
      return;
    }
    
    setLoading(true);
    try {
      incrementUsage(user?.id);
      const goal = user?.goal || "HSC Exam";

      const selectedTopic = topic || availableTopics[0];
      const result = await generateMockTest(subject, selectedTopic, goal, pdfFile?.data);
      
      if (result.questions && Array.isArray(result.questions)) {
        setQuestions(result.questions);
        setStep('quiz');
        setAnswers({});
      } else {
        alert("Could not generate questions. Try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating test. Check API config.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    
    if (user) {
      // Save Result with userId
      const newResult: MockTestResult = {
        userId: user.id,
        subject: pdfFile ? 'Mixed/PDF' : subject,
        score: correctCount,
        totalQuestions: questions.length,
        date: new Date().toISOString()
      };
      
      const prev = JSON.parse(localStorage.getItem('mockResults') || '[]');
      localStorage.setItem('mockResults', JSON.stringify([newResult, ...prev]));
    }
    
    setStep('result');
  };

  if (step === 'setup') {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6">
          <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Take a Mock Test</h2>
          <p className="text-slate-500 dark:text-slate-400">Test your knowledge with AI-generated questions.</p>
          
          <div className="space-y-4 text-left">
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${pdfFile ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <label className="cursor-pointer block w-full h-full">
                      <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                      {pdfFile ? (
                        <div className="flex flex-col items-center">
                          <FileUp className="text-indigo-600 dark:text-indigo-400 mb-2" size={24} />
                          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-[200px]">{pdfFile.name}</div>
                          <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">AI will detect subject & questions from this PDF</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                          <FileUp className="text-slate-400 mb-2" size={24} />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload PDF to generate questions</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">or leave empty to select subject below</span>
                        </div>
                      )}
                  </label>
                </div>
                {pdfFile && (
                  <button 
                    onClick={() => setPdfFile(null)} 
                    className="absolute top-8 right-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-red-500 dark:text-slate-400"
                    title="Remove PDF"
                  >
                    <XCircle size={16} />
                  </button>
                )}
            </div>

            <div className={`transition-opacity duration-300 ${pdfFile ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">Random / General</option>
                    {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              </div>
            </div>
            
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
               {pdfFile ? <><Sparkles size={12} className="text-indigo-500 dark:text-indigo-400"/> AI will analyze PDF content</> : "Generates questions based on curriculum"}
            </p>
          </div>

          <button 
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{pdfFile ? 'PDF Generated Quiz' : `${subject} Quiz`}</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{Object.keys(answers).length}/{questions.length} Answered</span>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex gap-3 mb-4">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-medium text-lg">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                    className={`
                      text-left px-4 py-3 rounded-lg border transition-all
                      ${answers[q.id] === optIdx 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 pb-20">
          <button 
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
          >
            Submit Test <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-block p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
           <Trophy className="text-indigo-600 dark:text-indigo-400 w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Quiz Completed!</h2>
        <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 my-4">
          {score} <span className="text-2xl text-slate-400 font-normal">/ {questions.length}</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Keep practicing to improve your admission chances!</p>
        <button 
          onClick={() => setStep('setup')}
          className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
        >
          Take Another Test
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Detailed Review</h3>
        {questions.map((q, idx) => {
          const isCorrect = answers[q.id] === q.correctAnswer;
          return (
            <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10'}`}>
              <div className="flex gap-3 mb-2">
                 {isCorrect ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                 <p className="font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
              </div>
              <div className="pl-8 space-y-2">
                 <p className="text-sm text-slate-600 dark:text-slate-300">
                   <span className="font-semibold">Correct Answer:</span> {q.options[q.correctAnswer]}
                 </p>
                 {!isCorrect && (
                   <p className="text-sm text-red-600 dark:text-red-400">
                     <span className="font-semibold">You selected:</span> {answers[q.id] !== undefined ? q.options[answers[q.id]] : 'Skipped'}
                   </p>
                 )}
                 <div className="mt-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                   <span className="font-semibold text-indigo-600 dark:text-indigo-400">Explanation:</span> {q.explanation}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MockTest;