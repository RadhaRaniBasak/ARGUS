import React, { useState } from 'react';
import { 
  Terminal, 
  Key, 
  Code2, 
  Database, 
  Cpu, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { CALL_SCRIPTS, MCP_TOOLS_SPEC } from '../../data/scripts';
import { CallType } from '../../types';

interface CalleAgentStudioProps {
  onResetDemoData: () => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export const CalleAgentStudio: React.FC<CalleAgentStudioProps> = ({
  onResetDemoData,
  apiKey,
  onUpdateApiKey
}) => {
  const [activeSkill, setActiveSkill] = useState<CallType>('confirmation');
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [savedKey, setSavedKey] = useState(false);

  const script = CALL_SCRIPTS[activeSkill];

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiKey(localApiKey);
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  return (
    <div id="calle-agent-studio-container" className="space-y-5">
      <div className="bg-gradient-to-r from-sky-50 via-blue-50/50 to-slate-50 border border-sky-100/90 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              CALL-E AI Agent Architecture & Telephony Studio
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Configure conversational parameters, Model Context Protocol (MCP) live electronic health record tool bindings, and structured clinical outcome extraction schemas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Conversation Skill Scripts</h3>
                <p className="text-xs text-slate-500">Pre-built adaptive conversation flows across the 4 healthcare skill sets</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
                {(['confirmation', 'recall', 'medication', 'feedback'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveSkill(type)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      activeSkill === type
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                  Skill Title & Activation Trigger
                </span>
                <p className="font-bold text-slate-900 text-sm">{script.title}</p>
                <p className="text-slate-600 text-xs font-medium">{script.triggerCondition}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  Empathetic Opener & Greeting Prompt
                </label>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed">
                  "{script.greetingPrompt}"
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  Adaptive Conversation Branches & Core Dialogue
                </label>
                <div className="space-y-2">
                  {script.coreQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-slate-800 text-xs flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  Structured Result Schema (CALL-E JSON Return)
                </label>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300">
                  {script.outputSchemaDescription}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Model Context Protocol (MCP) Tool Bindings
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              CALL-E invokes these local tools mid-call to check provider schedule availability and write back structured records.
            </p>

            <div className="space-y-2.5 pt-1">
              {MCP_TOOLS_SPEC.map((tool) => (
                <div key={tool.name} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-700">{tool.name}</span>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                      Local MCP Tool
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSaveKey} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">CALL-E Platform Auth</h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-700 font-semibold">CALL-E API Key / Bearer Secret</label>
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-sky-500 shadow-2xs"
                placeholder="calle_live_..."
              />
              <p className="text-[11px] text-slate-500">
                Loaded from <code className="text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">CALLE_API_KEY</code> environment variable or dashboard override.
              </p>
            </div>

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Webhook Receiver</span>
                <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60" title="HMAC SHA-256 cryptographically verified">/api/calle/webhook (HMAC)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Rate Limit Protection</span>
                <span className="text-slate-900 font-mono font-bold text-[11px]">Max 5 calls / 5 min</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Telephony Sanitization</span>
                <span className="text-sky-700 font-mono font-bold text-[11px]">E.164 Enforced</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {savedKey ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{savedKey ? 'Credentials Updated' : 'Update Credentials'}</span>
            </button>
          </form>

          <div className="bg-gradient-to-b from-sky-50/70 to-blue-50/30 border border-sky-100 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">CALL-E Hackathon Integration</h4>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>SDK:</strong> Programmatic call initiation and structured response listener</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>MCP:</strong> Calendar slot lookups mid-call</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>API:</strong> Real-time status polling & batch triggers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>4 Skills:</strong> Confirmation, Recall, Medication, CSAT</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
