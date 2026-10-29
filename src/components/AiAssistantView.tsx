import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { api } from '../lib/api';
import {
  Bot,
  Send,
  User,
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const { user, language } = useAuth();
  const tr = t[language];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'ai',
      text:
        language === 'hi'
          ? `नमस्ते ${user ? user.name : 'बेटा'}! 🙏\nमैं आपका 'लाला एआई गुरु' हूँ। राजस्थान बोर्ड (RBSE) व सीबीएसई कक्षा ${
              user?.classGrade || '10'
            } के किसी भी विषय (विज्ञान, गणित, भौतिकी, रसायन, सामाजिक) का कोई भी सवाल या सूत्र यहाँ पूछें। मैं आपको सरल हिन्दी में समझाऊँगा!`
          : `Hello ${user ? user.name : 'Student'}! 🙏\nI am your 'Lala AI Guru'. Ask me any question, derivation, or formula from your Class ${
              user?.classGrade || '10'
            } syllabus. I will explain it step by step!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const suggestedQuestions = [
    {
      hi: 'रासायनिक समीकरण संतुलित करने की सबसे आसान विधि क्या है?',
      en: 'What is the easiest method to balance a chemical equation?',
    },
    {
      hi: 'ओम का नियम (Ohm’s Law) क्या है और इसका सूत्र क्या है?',
      en: 'What is Ohm’s Law and its mathematical formula?',
    },
    {
      hi: 'राजस्थान के 6 प्रमुख पहाड़ी दुर्ग कौन-कौन से हैं?',
      en: 'What are the 6 major Hill Forts of Rajasthan in Class 9-10 syllabus?',
    },
    {
      hi: 'गॉस का नियम (Gauss Law) एवं इसका गणितीय रूप समझाइए।',
      en: 'Explain Gauss Law and its mathematical expression in electrostatics.',
    },
  ];

  const handleSend = async (qText?: string) => {
    const textToSend = (qText || inputQuestion).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.askAi({
        question: textToSend,
        language,
        classGrade: user?.classGrade || '10',
        subject: 'All Subjects',
      });

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text:
          language === 'hi'
            ? 'क्षमा करें, उत्तर प्राप्त करने में अस्थायी बाधा आई है। कृपया पुनः प्रयास करें।'
            : 'Sorry, could not fetch answer at this moment. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-10 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-base">
                {tr.aiTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                सक्रिय (Online)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {tr.aiSub}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 overflow-y-auto shadow-xs space-y-4">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-slate-50 border border-slate-200/80 text-slate-800'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-medium ${
                    isAi ? 'text-slate-400' : 'text-blue-100'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold p-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>{tr.thinking}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="shrink-0 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 px-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{tr.suggestedQTitle}</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestedQuestions.map((q, idx) => {
            const label = language === 'hi' ? q.hi : q.en;
            return (
              <button
                key={idx}
                onClick={() => handleSend(label)}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 text-xs font-medium transition-colors shadow-2xs"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 relative flex items-center bg-white rounded-2xl border border-slate-200 p-2 shadow-xs focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={tr.aiPlaceholder}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs sm:text-sm focus:outline-none bg-transparent"
        />

        <button
          type="submit"
          disabled={!inputQuestion.trim() || loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tr.askBtn}</span>
        </button>
      </form>
    </div>
  );
};
