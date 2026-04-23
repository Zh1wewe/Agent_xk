/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeEvent, useState, useEffect, useRef } from 'react';
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
  User as UserIcon,
  Settings as SettingsIcon,
  X,
  Globe,
  Key,
  Box,
  Paperclip,
  FileText,
  Trash2,
  File as FileIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECT_CONFIG } from './core/config';
import { AgentState } from './core/state';
import { retrieveExperiences } from './memory/router';
import { translations, Language } from './lib/i18n';

// --- Types ---

interface AgentConfig {
  selectedProvider: string;
  selectedModel: string;
}

interface ProviderConfig {
  apiKey: string;
  apiEndpoint: string;
}

interface AppSettings {
  lang: Language;
  agentConfigs: Record<string, AgentConfig>;
  providerConfigs: Record<string, ProviderConfig>;
  prompts: {
    master: string;
    design: string;
    dev: string;
    reflect: string;
    creative: string;
  };
  initSettings: {
    projectName: string;
    targetPath: string;
    autoDeploy: boolean;
  };
}

const AI_PROVIDERS = [
  {
    id: 'google',
    name: 'Google Gemini',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-pro-exp-0205', name: 'Gemini 2.0 Pro Exp' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'o1', name: 'o1' },
      { id: 'o3-mini', name: 'o3-mini' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' }
    ]
  },
  {
    id: 'zhipu',
    name: 'Zhipu (GLM)',
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
      { id: 'glm-4-0520', name: 'GLM-4' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash' }
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot 8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot 32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot 128K' }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultEndpoint: 'http://localhost:11434/v1',
    models: [
      { id: 'llama3', name: 'Llama 3' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'qwen2.5', name: 'Qwen 2.5' }
    ]
  }
];


// --- Dashboard Sub-components ---

const AgentStatusCard = ({ label, status, t, active, onClick }: { label: string; status: 'idle' | 'ready' | 'working'; t: any; active: boolean; onClick: () => void }) => {
  const statusColors = {
    idle: 'bg-zinc-700 text-zinc-500 border-zinc-800',
    ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    working: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const statusLabel = {
    idle: t.statusIdle,
    ready: t.statusReady,
    working: t.statusWorking
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col gap-1.5 p-3 rounded-lg border transition-all text-left w-full cursor-pointer hover:ring-1 hover:ring-zinc-700 ${
        active ? 'ring-2 ring-emerald-500 border-emerald-500/50' : ''
      } ${statusColors[status]}`} 
      id={`agent-${label.toLowerCase()}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'ready' ? 'bg-emerald-500 animate-pulse' : status === 'working' ? 'bg-blue-400 animate-spin' : 'bg-zinc-600'}`} />
      </div>
      <span className="text-[9px] font-mono font-bold">{statusLabel[status]}</span>
    </button>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'prompts' | 'init' | 'help'>('general');
  const [initFeedback, setInitFeedback] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string, size: number, type: string }[]>([]);
  const [activeAgent, setActiveAgent] = useState<'master' | 'creative' | 'design' | 'dev' | 'reflect'>('master');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messageHistories, setMessageHistories] = useState<Record<string, { id: string, role: 'user' | 'agent' | 'system', content: string, timestamp: string }[]>>({
    master: [{ id: 'm1', role: 'system', content: 'Master Nexus: Integrated. Waiting for Project Directives.', timestamp: new Date().toLocaleTimeString() }],
    creative: [{ id: 'c1', role: 'system', content: 'Creative Studio: Listening for Visionary Inputs.', timestamp: new Date().toLocaleTimeString() }],
    design: [{ id: 'd1', role: 'system', content: 'Design Core: Ready for Architectural Blueprints.', timestamp: new Date().toLocaleTimeString() }],
    dev: [{ id: 'v1', role: 'system', content: 'Dev Node: Initialized. Repository scan complete.', timestamp: new Date().toLocaleTimeString() }],
    reflect: [{ id: 'r1', role: 'system', content: 'Reflection Sub-system: Active. Monitoring entropy.', timestamp: new Date().toLocaleTimeString() }]
  });
  
  // Settings initialization from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agent_xk_settings');
    
    const defaultConfigs: Record<string, ProviderConfig> = {};
    AI_PROVIDERS.forEach(p => {
      defaultConfigs[p.id] = { apiKey: '', apiEndpoint: p.defaultEndpoint };
    });

    const defaultAgentConfigs: Record<string, AgentConfig> = {
      master: { selectedProvider: 'openai', selectedModel: 'gpt-4o' },
      creative: { selectedProvider: 'google', selectedModel: 'gemini-2.0-pro-exp-0205' },
      design: { selectedProvider: 'anthropic', selectedModel: 'claude-3-5-sonnet-latest' },
      dev: { selectedProvider: 'deepseek', selectedModel: 'deepseek-coder' },
      reflect: { selectedProvider: 'openai', selectedModel: 'o1' }
    };

    const defaultSettings: AppSettings = {
      lang: 'zh',
      agentConfigs: defaultAgentConfigs,
      providerConfigs: defaultConfigs,
      prompts: {
        master: "You are the project manager agent. Efficiently schedule DAG tasks and manage the state.",
        design: "You are the software designer agent. Create optimized schemas and architectures.",
        dev: "You are the developer agent. Write clean, modular, and idiomatic code.",
        reflect: "You are the reflection agent. Analyze failures and output updated meta-instructions.",
        creative: "You are the Creative Director. Focus on enhancing user experience and visual aesthetic using natural dialogue."
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
      // Migrate old config if necessary
      if (!parsed.agentConfigs && parsed.selectedProvider) {
         parsed.agentConfigs = {
            master: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel },
            creative: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel },
            design: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel },
            dev: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel },
            reflect: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel }
         };
      }
      return { 
        ...defaultSettings, 
        ...parsed, 
        providerConfigs: { ...defaultConfigs, ...(parsed.providerConfigs || {}) },
        agentConfigs: { ...defaultAgentConfigs, ...(parsed.agentConfigs || {}) }
      };
    } catch {
      return defaultSettings;
    }
  });

  const [settingsActiveAgent, setSettingsActiveAgent] = useState<'master' | 'creative' | 'design' | 'dev' | 'reflect'>('master');
  const activeAgentConfig = settings.agentConfigs[settingsActiveAgent] || settings.agentConfigs['master'];
  
  const currentProviderConfig = settings.providerConfigs[activeAgentConfig.selectedProvider] || { apiKey: '', apiEndpoint: '' };
  const currentProviderData = AI_PROVIDERS.find(p => p.id === activeAgentConfig.selectedProvider) || AI_PROVIDERS[0];
  const [testConnectionState, setTestConnectionState] = useState<{status: 'idle' | 'testing' | 'success' | 'error', message: string}>({status: 'idle', message: ''});


  const t = translations[settings.lang];

  const [state, setState] = useState<AgentState>({
    user_input: "",
    project_spec: {},
    task_dag: {},
    task_list: [
      { id: 'T1', description: t.taskInit, status: 'completed', is_critical: true },
      { id: 'T2', description: t.taskDesign, status: 'running', is_critical: true, parallel_group: 'Group_A' },
      { id: 'T3', description: t.taskDb, status: 'pending', is_critical: false, parallel_group: 'Group_A' },
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

  // Handle task localization separately and accurately
  useEffect(() => {
    setState(prev => ({
      ...prev,
      task_list: prev.task_list.map(task => {
        const localizedDesc = {
          T1: translations[settings.lang].taskInit,
          T2: translations[settings.lang].taskDesign,
          T3: translations[settings.lang].taskDb,
        }[task.id as 'T1' | 'T2' | 'T3'];
        
        return localizedDesc ? { ...task, description: localizedDesc } : task;
      })
    }));
  }, [settings.lang]);

  useEffect(() => {
    // Simulate system stabilization
    const timer = setTimeout(() => {
      setLoading(false);
      refreshMemory();
    }, 800);
    return () => clearTimeout(timer);
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
      setMessageHistories(prev => ({
        ...prev,
        master: [...prev.master, {
          id: Math.random().toString(36).substr(2, 9),
          role: 'system',
          content: `New project initialized: ${settings.initSettings.projectName}`,
          timestamp: new Date().toLocaleTimeString()
        }]
      }));
    }, 1500);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const newFiles = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const activityFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activityFeedRef.current) {
      activityFeedRef.current.scrollTop = activityFeedRef.current.scrollHeight;
    }
  }, [messageHistories, activeAgent]);

  const handleSubmit = () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    
    const time = new Date().toLocaleTimeString();
    const newUserMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user' as const,
      content: inputMessage,
      timestamp: time
    };

    setMessageHistories(prev => ({
      ...prev,
      [activeAgent]: [...prev[activeAgent], newUserMessage]
    }));
    
    const trace = `[USER] ${inputMessage} ${uploadedFiles.length > 0 ? `(Files: ${uploadedFiles.map(f => f.name).join(', ')})` : ''}`;
    
    setState(prev => ({
      ...prev,
      execution_trace_summary: trace,
      user_input: inputMessage
    }));

    // Real AI Agent Response
    const currentAgent = activeAgent;
    
    // Asynchronous AI Call
    (async () => {
      // 1. Get Agent Persona
      const systemInstruction = settings.prompts[currentAgent];

      // 2. Retrieve Experience Context
      const relevantMemories = await retrieveExperiences(inputMessage);
      const memoryContext = relevantMemories && relevantMemories.length > 0
        ? "\n\n[EXPERIENCE_POOL_SYNC]:\n" + relevantMemories.map(m => `(Type: ${m.type}) ${m.content}`).join("\n")
        : "";

      // 3. Prepare Multi-modal Parts (if any files are uploaded)
      // Note: For simplicity, we mostly handle text context here. 
      // Image support could be added if files include base64 data.
      const fileContext = uploadedFiles.length > 0 
        ? `\n\n[FILE_CONTEXT_LOCKED]: ${uploadedFiles.map(f => f.name).join(', ')}`
        : "";

      const finalPrompt = `
[AGENT_ROLE]: ${systemInstruction}
${memoryContext}
${fileContext}

[USER_DIRECTIVE]: ${inputMessage}

Please process this based on your specialty. Output a concise response.
`.trim();

      try {
        const dynamicAgentConfig = settings.agentConfigs[currentAgent] || settings.agentConfigs['master'];
        const dynamicProviderConfig = settings.providerConfigs[dynamicAgentConfig.selectedProvider];

        if (!dynamicProviderConfig?.apiEndpoint) {
           throw new Error(`API Endpoint not configured for the selected provider: ${dynamicAgentConfig.selectedProvider}`);
        }
        const response = await fetch(`${dynamicProviderConfig.apiEndpoint.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dynamicProviderConfig.apiKey || ''}`
          },
          body: JSON.stringify({
            model: dynamicAgentConfig.selectedModel || "gpt-4o",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: finalPrompt }
            ],
            stream: true
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream returned from API.");

        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let buffer = "";

        const agentMsgId = Math.random().toString(36).substr(2, 9);
        
        // Initial empty message for streaming
        setMessageHistories(prev => ({
          ...prev,
          [currentAgent]: [...prev[currentAgent], {
            id: agentMsgId,
            role: 'agent',
            content: "",
            timestamp: new Date().toLocaleTimeString()
          }]
        }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          let chunkAdded = false;
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "") continue;
            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6);
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const contentChunk = parsed.choices?.[0]?.delta?.content || "";
                if (contentChunk) {
                  fullText += contentChunk;
                  chunkAdded = true;
                }
              } catch (e) {
                console.warn("Stream parse error:", e, trimmedLine);
              }
            }
          }
          
          if (chunkAdded) {
            setMessageHistories(prev => ({
              ...prev,
              [currentAgent]: prev[currentAgent].map(m => 
                m.id === agentMsgId ? { ...m, content: fullText } : m
              )
            }));
          }
        }

      } catch (error: any) {
        console.error("Agent Critical Error:", error);
        setMessageHistories(prev => ({
          ...prev,
          [currentAgent]: [...prev[currentAgent], {
            id: Math.random().toString(36).substr(2, 9),
            role: 'agent',
            content: `[CRITICAL_FAILURE] ${currentAgent.toUpperCase()} lost connection to neural core: ${error.message}`,
            timestamp: new Date().toLocaleTimeString()
          }]
        }));
      }
    })();

    setInputMessage("");
    setUploadedFiles([]);
  };

  const handleTestConnection = async () => {
    if (!currentProviderConfig?.apiEndpoint) {
      setTestConnectionState({ status: 'error', message: 'API Endpoint is not configured.' });
      return;
    }
    setTestConnectionState({ status: 'testing', message: 'Testing connection...' });
    try {
      const config = currentProviderConfig;
      const response = await fetch(`${config.apiEndpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey || ''}`
        },
        body: JSON.stringify({
          model: activeAgentConfig.selectedModel,
          messages: [{ role: "user", content: "print('hello')" }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errMsg = await response.text();
        setTestConnectionState({ status: 'error', message: `HTTP ${response.status}: ${errMsg}` });
      } else {
        const data = await response.json();
        setTestConnectionState({ 
          status: 'success', 
          message: data.choices?.[0]?.message?.content ? 'Connection successful!' : 'Connection OK, but invalid response format.' 
        });
      }
    } catch (e: any) {
      setTestConnectionState({ status: 'error', message: e.message || 'Network error' });
    }
  };

  const isApiConnected = Boolean(currentProviderConfig?.apiKey && currentProviderConfig.apiKey.length > 5);
  const canExecute = isApiConnected;

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
                    
                    {/* Agent Target Selector */}
                    <div className="space-y-3 pb-4 border-b border-zinc-800">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <UserIcon className="w-3 h-3" /> {settings.lang === 'zh' ? '目标智能体 (配置独立模型)' : 'Target Agent (Independent Config)'}
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {['master', 'creative', 'design', 'dev', 'reflect'].map((agent) => (
                          <button
                            key={agent}
                            onClick={() => {
                              setSettingsActiveAgent(agent as any);
                              setTestConnectionState({ status: 'idle', message: '' });
                            }}
                            className={`py-2 px-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all truncate ${
                              settingsActiveAgent === agent 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            {agent}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {/* Provider Select */}
                      <div className="flex-1 space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          <Network className="w-3 h-3" /> {settings.lang === 'zh' ? '核心服务商' : 'Provider'}
                        </label>
                        <select 
                          value={activeAgentConfig.selectedProvider}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            const provObj = AI_PROVIDERS.find(p => p.id === newProv);
                            setSettings(s => ({ 
                              ...s, 
                              agentConfigs: {
                                ...s.agentConfigs,
                                [settingsActiveAgent]: {
                                  ...s.agentConfigs[settingsActiveAgent],
                                  selectedProvider: newProv,
                                  selectedModel: provObj ? provObj.models[0].id : s.agentConfigs[settingsActiveAgent].selectedModel
                                }
                              }
                            }));
                            setTestConnectionState({ status: 'idle', message: '' });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 appearance-none transition-colors"
                        >
                          {AI_PROVIDERS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Model Select */}
                      <div className="flex-1 space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          <Box className="w-3 h-3" /> {t.model}
                        </label>
                        <select 
                          value={activeAgentConfig.selectedModel}
                          onChange={(e) => {
                            setSettings(s => ({
                              ...s,
                              agentConfigs: {
                                ...s.agentConfigs,
                                [settingsActiveAgent]: {
                                  ...s.agentConfigs[settingsActiveAgent],
                                  selectedModel: e.target.value
                                }
                              }
                            }));
                            setTestConnectionState({ status: 'idle', message: '' });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 appearance-none transition-colors"
                        >
                          {currentProviderData.models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Key className="w-3 h-3" /> {t.apiKey}
                      </label>
                      <input 
                        type="password"
                        value={currentProviderConfig?.apiKey || ''}
                        onChange={(e) => setSettings(s => ({ 
                          ...s, 
                          providerConfigs: {
                            ...s.providerConfigs,
                            [activeAgentConfig.selectedProvider]: { 
                              ...s.providerConfigs[activeAgentConfig.selectedProvider], 
                              apiKey: e.target.value 
                            }
                          }
                        }))}
                        placeholder={`sk-... (${currentProviderData.name} API Key)`}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <Network className="w-3 h-3" /> {t.apiEndpoint}
                      </label>
                      <input 
                        type="text"
                        value={currentProviderConfig?.apiEndpoint || ''}
                        onChange={(e) => setSettings(s => ({ 
                          ...s, 
                          providerConfigs: {
                            ...s.providerConfigs,
                            [activeAgentConfig.selectedProvider]: { 
                              ...s.providerConfigs[activeAgentConfig.selectedProvider], 
                              apiEndpoint: e.target.value 
                            }
                          }
                        }))}
                        placeholder={currentProviderData.defaultEndpoint}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      <p className="text-[9px] text-zinc-600 italic">
                        * {settings.lang === 'zh' ? '每个大模型平台隔离保存接口地址与 Key。跨智能体共用同一平台配额。' : 'Keys and endpoints are isolated per provider. Shared across agents using the same provider.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleTestConnection}
                          disabled={testConnectionState.status === 'testing'}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                            testConnectionState.status === 'testing' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' :
                            'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          {testConnectionState.status === 'testing' ? (settings.lang === 'zh' ? '测试中...' : 'Testing...') : (settings.lang === 'zh' ? '测试连接' : 'Test Connection')}
                        </button>
                        
                        {testConnectionState.status === 'success' && (
                           <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20 flex-1">
                             <ShieldCheck className="w-3.5 h-3.5" /> 
                             {testConnectionState.message}
                           </div>
                        )}
                        
                        {testConnectionState.status === 'error' && (
                           <div className="flex items-center gap-2 text-rose-500 text-xs font-mono bg-rose-500/10 px-3 py-2 rounded flex-1 overflow-hidden">
                             <AlertCircle className="w-3.5 h-3.5 shrink-0" /> 
                             <span className="truncate" title={testConnectionState.message}>{testConnectionState.message}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'prompts' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {([
                        { id: 'master', label: t.masterPrompt },
                        { id: 'creative', label: t.creativePrompt },
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
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-all"
              title={t.settings}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Status Section */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className={`w-3.5 h-3.5 ${isApiConnected ? 'text-emerald-500' : 'text-zinc-600'}`} />
              <span className="text-[11px] font-bold text-white uppercase tracking-tight">{t.apiKeyStatus}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${isApiConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
          </div>
          <p className={`text-[10px] font-mono ${isApiConnected ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
            {isApiConnected ? `[CONNECTED] ${settings.selectedModel}` : `[DISCONNECTED]`}
          </p>
        </div>

        <div className="space-y-4" id="agent-status-cluster">
          <div className="grid grid-cols-1 gap-2">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">{t.agentCluster}</h2>
            <AgentStatusCard label="Master" status="ready" t={t} active={activeAgent === 'master'} onClick={() => setActiveAgent('master')} />
            <AgentStatusCard label={t.creativeDirector} status={canExecute ? 'working' : 'idle'} t={t} active={activeAgent === 'creative'} onClick={() => setActiveAgent('creative')} />
            <AgentStatusCard label="Design" status={canExecute ? 'ready' : 'idle'} t={t} active={activeAgent === 'design'} onClick={() => setActiveAgent('design')} />
            <AgentStatusCard label="Dev" status="idle" t={t} active={activeAgent === 'dev'} onClick={() => setActiveAgent('dev')} />
            <AgentStatusCard label="Reflect" status="idle" t={t} active={activeAgent === 'reflect'} onClick={() => setActiveAgent('reflect')} />
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-800" id="system-metrics">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">{t.metrics}</h2>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">{t.iterations}</span>
              <span className="text-zinc-200">{state.global_iteration_count}/3</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${state.global_iteration_count > 0 ? (state.global_iteration_count / 3) * 100 : 0}%` }}
              />
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

        <section 
          ref={activityFeedRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" 
          id="activity-feed"
        >
          {messageHistories[activeAgent].map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'border-zinc-700 bg-zinc-900 shadow-inner' 
                  : msg.role === 'agent' 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-zinc-800 bg-zinc-950'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-zinc-400" /> : <Activity className="w-4 h-4 text-emerald-500" />}
              </div>
              <div className={`flex-1 space-y-1.5 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 text-[10px] ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span className="font-bold text-zinc-500 uppercase tracking-wider">
                    {msg.role === 'user' ? 'Human' : msg.role === 'agent' ? `Agent_${activeAgent.toUpperCase()}` : 'System'}
                  </span>
                  <span className="text-zinc-700 font-mono tracking-tighter">{msg.timestamp}</span>
                </div>
                <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900/80 border-zinc-700 text-zinc-200 rounded-tr-none' 
                    : msg.role === 'agent'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-50/90 rounded-tl-none'
                      : 'bg-zinc-950/20 border-zinc-800 text-zinc-500 border-dashed rounded-tl-none italic'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </section>

        <footer className="p-4 border-t border-zinc-800 bg-zinc-950" id="input-footer">
          <div className="max-w-4xl mx-auto space-y-4">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg group">
                    <FileIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-white truncate max-w-[120px]">{file.name}</p>
                      <p className="text-[8px] text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="p-1 text-zinc-600 hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-stretch gap-3">
              <div className="flex-1 relative flex flex-col gap-2">
                <textarea 
                  id="hitl-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={canExecute ? t.inputPlaceholder : t.noMemory}
                  disabled={!canExecute}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500/50 resize-none h-24 text-zinc-200 disabled:opacity-50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                
                <div className="flex items-center gap-2">
                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                    canExecute 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' 
                      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-50'
                  }`}>
                    <Paperclip className="w-3 h-3" />
                    {t.uploadFile}
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      disabled={!canExecute}
                      onChange={handleFileChange}
                      accept=".md,.json,.pdf,.txt,.png"
                    />
                  </label>
                  <span className="text-[9px] text-zinc-600 font-mono">
                    {settings.lang === 'zh' ? '支持 md, json, pdf, txt, png' : 'Supports md, json, pdf, txt, png'}
                  </span>
                </div>
              </div>
              <button 
                id="btn-submit-hitl" 
                onClick={handleSubmit}
                disabled={!canExecute || (!inputMessage.trim() && uploadedFiles.length === 0)} 
                className="px-8 bg-white text-black font-bold text-xs rounded-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed grow-0 shrink-0"
                style={{ height: 'calc(24 * 4px)' }} // Roughly match textarea height or use flex-stretch
              >
                {settings.lang === 'zh' ? '提交' : 'SUBMIT'}
              </button>
            </div>
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
            <motion.button 
              key={task.id}
              onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
              id={`task-card-${task.id}`}
              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all text-left w-full cursor-pointer hover:ring-1 hover:ring-zinc-700 ${
                selectedTaskId === task.id ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : ''
              } ${
                task.status === 'running' 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : task.status === 'completed'
                    ? 'bg-zinc-900/20 border-emerald-500/10 opacity-80'
                    : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start w-full">
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
              
              <AnimatePresence>
                {selectedTaskId === task.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3 pt-2 border-t border-zinc-800/50 mt-1"
                  >
                    {task.id === 'T3' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Workspace Explorer</span>
                          <button className="p-1 hover:bg-zinc-800 rounded transition-colors">
                            <Plus className="w-3 h-3 text-zinc-400" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {uploadedFiles.length > 0 ? uploadedFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-zinc-800/50 group">
                              <FileText className="w-3 h-3 text-blue-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-zinc-300 truncate">{file.name}</p>
                                <p className="text-[8px] text-zinc-600 uppercase">{file.type.split('/').pop() || 'File'}</p>
                              </div>
                            </div>
                          )) : (
                            <div className="p-4 text-center border border-dashed border-zinc-800 rounded bg-zinc-900/10">
                              <p className="text-[9px] text-zinc-600 italic">No files available in data pool.</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                            <Layers className="w-3 h-3 text-emerald-500/50" />
                            <p className="text-[10px] text-emerald-500/60 font-mono">/custom_directory_v1</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/20 p-2 rounded border border-zinc-800/50 space-y-2">
                        <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                          Task context isolated. Executing dependency chain analysis...
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600">
                           <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                           Ready for bridge verification.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {task.parallel_group && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] font-mono text-zinc-500">{task.parallel_group}</span>
                </div>
              )}
            </motion.button>
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



