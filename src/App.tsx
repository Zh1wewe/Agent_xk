/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  Layers, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle,
  Search,
  Network,
  Cpu,
  LogIn,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  X,
  Globe,
  Key,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { PROJECT_CONFIG } from './core/config';
import { AgentState } from './core/state';
import { auth } from './lib/firebase';
import { retrieveExperiences } from './memory/router';
import { translations, Language } from './lib/i18n';

// --- Types ---

interface AppSettings {
  lang: Language;
  apiKey: string;
  apiEndpoint: string;
  selectedModel: string;
  prompts: {
    master: string;
    design: string;
    dev: string;
    reflect: string;
  };
  initSettings: {
    projectName: string;
    targetPath: string;
    autoDeploy: boolean;
  };
}

const MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'moonshot-v1-8k', name: 'Kimi (moonshot-v1)', provider: 'Moonshot' },
  { id: 'glm-4', name: 'GLM-4', provider: 'Zhipu' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'ollama', name: 'Ollama (Local LLM)', provider: 'Ollama' }
];

// --- Dashboard Sub-components ---

const StatusLight = ({ active, label }: { active: boolean; label: string }) => (
  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-md" id={`status-${label.toLowerCase()}`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">{label}</span>
  </div>
);

const ExperiencePill = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    Pattern: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
    Fix_Trace: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    Preference: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
    Negative: 'text-rose-400 border-rose-400/30 bg-rose-400/5'
  };
  return (
    <span className={`px-2 py-0.5 border rounded text-[9px] font-mono ${colors[type] || 'text-zinc-500'}`}>
      {type}
    </span>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'prompts' | 'init' | 'help'>('general');
  const [initFeedback, setInitFeedback] = useState("");
  
  // Settings initialization from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agent_xk_settings');
    const defaultSettings: AppSettings = {
      lang: 'zh',
      apiKey: '',
      apiEndpoint: 'https://api.openai.com/v1',
      selectedModel: 'gemini-2.0-flash',
      prompts: {
        master: "You are the project manager agent. Efficiently schedule DAG tasks and manage the state.",
        design: "You are the software designer agent. Create optimized schemas and architectures.",
        dev: "You are the developer agent. Write clean, modular, and idiomatic code.",
        reflect: "You are the reflection agent. Analyze failures and output updated meta-instructions."
      },
      initSettings: {
        projectName: "xk_alpha",
        targetPath: "/workspace/agent_xk/projects",
        autoDeploy: true
      }
    };

    if (!saved) return defaultSettings;
    
    try {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new keys (prompts, etc.)
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  });

  const t = translations[settings.lang];

  const [state, setState] = useState<AgentState>({
    user_input: "",
    project_spec: {},
    task_dag: {},
    task_list: [
      { id: 'T1', description: 'Initialize Repository', status: 'completed', is_critical: true },
      { id: 'T2', description: 'Design API Schema', status: 'running', is_critical: true, parallel_group: 'Group_A' },
      { id: 'T3', description: 'Setup Database', status: 'pending', is_critical: false, parallel_group: 'Group_A' },
    ],
    current_task_index: 1,
    source_code_path: "/workspace/agent_xk",
    retrieved_experiences: [],
    negative_feedback: [],
    test_report: "System Ready. Persistence Layer: Offline.",
    error_info: "",
    hitl_feedback: "",
    last_stable_snapshot: "xk_v0.2_init",
    auto_retry_count: 0,
    global_iteration_count: 0,
    execution_trace_summary: "Agent_xk Workbench initialized."
  });

  useEffect(() => {
    localStorage.setItem('agent_xk_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        refreshMemory();
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshMemory = async () => {
    const memory = await retrieveExperiences("general");
    if (memory) {
      const formatted = memory.map(m => ({
        type: m.type as any,
        content: m.content,
        score: 1.0
      }));
      setState(prev => ({ ...prev, retrieved_experiences: formatted }));
    }
  };

  const handleInitProject = () => {
    const fullPath = `${settings.initSettings.targetPath}/${settings.initSettings.projectName}`;
    setInitFeedback("ISOLATING STORAGE...");
    
    setTimeout(() => {
      setInitFeedback(t.initSuccess);
      setState(prev => ({
        ...prev,
        source_code_path: fullPath,
        last_stable_snapshot: `${settings.initSettings.projectName}_v0.1`,
        execution_trace_summary: `[INIT] Isolated project '${settings.initSettings.projectName}' initialized at ${fullPath}. Workspace environment switched.`
      }));
    }, 1500);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const canExecute = !!user || !!settings.apiKey;

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center font-mono text-zinc-500 text-xs">
        INITIALIZING CORE STATE BUS...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-300 font-sans overflow-hidden" id="app-workbench">
      {/* --- Settings Modal --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.settings}</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-zinc-800 bg-zinc-900/20 px-2 flex-shrink-0">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'general' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.tabGeneral}
                </button>
                <button onClick={() => setActiveTab('models')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'models' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.tabModels}
                </button>
                <button onClick={() => setActiveTab('prompts')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'prompts' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.tabPrompts}
                </button>
                <button onClick={() => setActiveTab('init')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'init' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.tabInit}
                </button>
                <button onClick={() => setActiveTab('help')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'help' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {t.tabHelp}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Globe className="w-3 h-3" /> {t.language}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['zh', 'en'] as const).map(l => (
                          <button
                            key={l}
                            onClick={() => setSettings(s => ({ ...s, lang: l }))}
                            className={`py-2 px-4 rounded-lg border text-xs font-medium transition-all ${
                              settings.lang === l 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            {l === 'zh' ? '中文 (简体)' : 'English (US)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'models' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Box className="w-3 h-3" /> {t.model}
                      </label>
                      <select 
                        value={settings.selectedModel}
                        onChange={(e) => setSettings(s => ({ ...s, selectedModel: e.target.value }))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 appearance-none transition-colors"
                      >
                        {MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Key className="w-3 h-3" /> {t.apiKey}
                      </label>
                      <input 
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Network className="w-3 h-3" /> {t.apiEndpoint}
                      </label>
                      <input 
                        type="text"
                        value={settings.apiEndpoint}
                        onChange={(e) => setSettings(s => ({ ...s, apiEndpoint: e.target.value }))}
                        placeholder="https://api.openai.com/v1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      <p className="text-[9px] text-zinc-600 italic">
                        * {settings.lang === 'zh' ? '支持 OpenAI、DeepSeek、GLM、Kimi 等兼容接口。' : 'Compatible with OpenAI-style endpoints.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'prompts' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {([
                        { id: 'master', label: t.masterPrompt },
                        { id: 'design', label: t.designPrompt },
                        { id: 'dev', label: t.devPrompt },
                        { id: 'reflect', label: t.reflectPrompt }
                      ] as const).map(p => (
                        <div key={p.id} className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{p.label}</label>
                          <textarea 
                            value={settings.prompts[p.id]}
                            onChange={(e) => setSettings(s => ({ 
                              ...s, 
                              prompts: { ...s.prompts, [p.id]: e.target.value }
                            }))}
                            placeholder={t.placeholderPrompt}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors h-32 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'init' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Box className="w-3 h-3" /> {t.projectNameField}
                      </label>
                      <input 
                        type="text"
                        value={settings.initSettings.projectName}
                        onChange={(e) => setSettings(s => ({ 
                          ...s, 
                          initSettings: { ...s.initSettings, projectName: e.target.value } 
                        }))}
                        placeholder="e.g. smart_contract_v1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Terminal className="w-3 h-3" /> {t.targetPath}
                      </label>
                      <input 
                        type="text"
                        value={settings.initSettings.targetPath}
                        onChange={(e) => setSettings(s => ({ 
                          ...s, 
                          initSettings: { ...s.initSettings, targetPath: e.target.value } 
                        }))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={settings.initSettings.autoDeploy}
                          onChange={(e) => setSettings(s => ({ 
                            ...s, 
                            initSettings: { ...s.initSettings, autoDeploy: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-xs text-zinc-300">{t.autoDeploy}</span>
                    </div>

                    <button 
                      onClick={handleInitProject}
                      className="w-full py-4 bg-emerald-500 text-black font-bold text-sm rounded-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <Network className="w-4 h-4" /> {t.initProject}
                    </button>

                    {initFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center"
                      >
                        <p className="text-xs text-emerald-500 font-mono italic">{initFeedback}</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeTab === 'help' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <section className="space-y-2">
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <Network className="w-3 h-3 text-emerald-500" /> {t.docDagTitle}
                        </h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                          {t.docDagDesc}
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <RotateCcw className="w-3 h-3 text-emerald-500" /> {t.docSnapshotTitle}
                        </h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                          {t.docSnapshotDesc}
                        </p>
                      </section>

                      <section className="space-y-2 pt-2">
                        <h3 className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> {t.docSettingsTitle}
                        </h3>
                        <div className="space-y-2 font-mono text-[10px] text-zinc-400 bg-zinc-950 p-4 rounded-lg border border-emerald-500/10">
                          <p>{t.docStep1}</p>
                          <p>{t.docStep2}</p>
                          <p>{t.docStep3}</p>
                          <p>{t.docStep4}</p>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-2 flex-shrink-0">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Left Sidebar: Status & Controls --- */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-4 gap-6 bg-zinc-950/50" id="sidebar-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" id="brand-header">
            <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
              <Cpu className="text-black w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">{t.projectName}</h1>
              <div className="flex items-center gap-1.5 min-w-0">
                 <p className="text-[10px] text-zinc-500 font-mono italic shrink-0">v0.2_STABLE</p>
                 {state.source_code_path && (
                   <>
                     <span className="text-zinc-700 font-mono text-[9px] shrink-0">|</span>
                     <span className="text-emerald-500/80 font-mono text-[9px] truncate tracking-tighter">
                       {state.source_code_path.split('/').pop()}
                     </span>
                   </>
                 )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-all"
            title={t.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        {/* User Auth Section */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><UserIcon className="w-4 h-4 text-zinc-500" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{user.displayName}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-1.5 border border-zinc-800 text-[10px] font-bold rounded flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-3 h-3" /> {t.signOut}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={handleLogin}
                className="w-full py-2 bg-zinc-100 text-black text-[11px] font-bold rounded flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> {t.signIn}
              </button>
              {settings.apiKey && (
                <div className="flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <Key className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-[9px] font-mono text-emerald-500/80 uppercase">Local API Active</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4" id="agent-status-cluster">
          <div className="space-y-2">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-3">{t.agentCluster}</h2>
            <StatusLight active={true} label="Master" />
            <StatusLight active={canExecute} label="Design" />
            <StatusLight active={false} label="Dev" />
            <StatusLight active={false} label="Reflect" />
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-800" id="system-metrics">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-3">{t.metrics}</h2>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">{t.iterations}</span>
              <span className="text-zinc-200">{state.global_iteration_count}/3</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[10%]" />
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2" id="global-actions">
          <button id="btn-execute-dag" className="w-full py-2 bg-white text-black text-xs font-bold rounded flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50" disabled={!canExecute}>
            <Play className="w-3 h-3 fill-current" /> {t.executeDag}
          </button>
          <button id="btn-rollback" className="w-full py-2 border border-zinc-800 text-zinc-400 text-xs font-bold rounded flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50" disabled={!canExecute}>
            <RotateCcw className="w-3 h-3" /> {t.rollback}
          </button>
        </div>
      </aside>

      {/* --- Middle Content: Execution Flow --- */}
      <main className="flex-1 flex flex-col min-w-0" id="main-execution-flow">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/20" id="main-header">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Terminal className="w-3 h-3 text-emerald-500" />
              <span className="font-mono text-zinc-500">{t.snapshot}:</span>
              <span className="font-mono text-zinc-100">{state.last_stable_snapshot}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-500/80 uppercase">{t.sandboxSecured}</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 space-y-6" id="activity-feed">
          <div className="space-y-4">
            <div className="flex gap-4" id="log-system-init">
              <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-white uppercase tracking-wider">System</span>
                  <span className="text-zinc-600 font-mono italic">SYNCED</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800 p-3 rounded-lg text-xs leading-relaxed text-zinc-400 border-l-2 border-l-emerald-500">
                  {canExecute ? "Bridge active via " + (user ? "Google Auth" : "Custom API Key") : state.execution_trace_summary}
                </div>
              </div>
            </div>

            <div className="flex gap-4" id="log-experience-router">
              <div className="w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-emerald-500 uppercase tracking-wider">{settings.lang === 'zh' ? '经验路由' : 'Experience Router'}</span>
                  <span className="text-zinc-600 font-mono italic">{canExecute ? (user ? "PULLING CLOUD MEMORY" : "USING LOCAL CACHE") : t.authRequired}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {state.retrieved_experiences.length > 0 ? (
                    state.retrieved_experiences.map((exp, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg max-w-xs"
                        id={`exp-pill-${i}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <ExperiencePill type={exp.type} />
                          <span className="text-[9px] font-mono text-zinc-600">{user ? "DB_CLOUD" : "LOCAL"}</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">{exp.content}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[10px] text-zinc-600 italic font-mono p-4 border border-zinc-800 border-dashed rounded-lg w-full text-center">
                      {canExecute ? "No memory patterns found in target region." : t.noMemory}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="p-4 border-t border-zinc-800 bg-zinc-950" id="input-footer">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea 
                id="hitl-input"
                placeholder={canExecute ? t.inputPlaceholder : t.noMemory}
                disabled={!canExecute}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500/50 resize-none h-20 text-zinc-200 disabled:opacity-50"
              />
            </div>
            <button id="btn-submit-hitl" disabled={!canExecute} className="h-20 px-6 bg-zinc-100 text-black font-bold text-xs rounded hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all cursor-pointer disabled:opacity-50">
              {settings.lang === 'zh' ? '提交' : 'SUBMIT'}
            </button>
          </div>
        </footer>
      </main>

      {/* --- Right Sidebar: Task DAG & Details --- */}
      <aside className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-950/50" id="sidebar-right">
        <div className="p-4 border-b border-zinc-800" id="dag-header">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-zinc-400" /> DYNAMIC DAG
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" id="task-list">
          {state.task_list.map((task) => (
            <motion.div 
              key={task.id}
              id={`task-card-${task.id}`}
              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                task.status === 'running' 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : task.status === 'completed'
                    ? 'bg-zinc-900/20 border-emerald-500/10 opacity-60'
                    : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    task.status === 'running' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}>{task.id}</span>
                  {task.is_critical && (
                    <AlertCircle className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
                <span className={`text-[10px] font-mono ${
                  task.status === 'running' ? 'text-emerald-500' : 'text-zinc-600'
                } uppercase tracking-tighter`}>{task.status}</span>
              </div>
              <p className="text-[11px] font-medium text-zinc-200">{task.description}</p>
              {task.parallel_group && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] font-mono text-zinc-500">{task.parallel_group}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-3" id="active-report">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t.activeReport}</h3>
          <div className="bg-black/40 border border-zinc-800 rounded p-3 font-mono text-[10px] text-emerald-500/80 max-h-32 overflow-y-auto" id="report-terminal">
            {canExecute ? "Persistence Layer: Connected (" + settings.selectedModel + ")" : "Persistence Layer: Disconnected"}
          </div>
        </div>
      </aside>
    </div>
  );
}



