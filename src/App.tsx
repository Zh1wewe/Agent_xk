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
  Plus,
  UploadCloud
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
  customModel?: string;
}

interface ProviderConfig {
  apiKey: string;
  apiEndpoint: string;
}

interface CustomModelConfig {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  modelString: string;
}

interface AppSettings {
  lang: Language;
  agentConfigs: Record<string, AgentConfig>;
  providerConfigs: Record<string, ProviderConfig>;
  customModels: CustomModelConfig[];
  prompts: {
    master: string;
    design: string;
    dev: string;
    reflect: string;
    creative: string;
    recorder: string;
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
  },
  {
    id: 'custom',
    name: 'Custom (自定义/兼容接口)',
    defaultEndpoint: 'https://api.example.com/v1',
    models: []
  }
];


// --- Dashboard Sub-components ---

const AgentStatusCard = ({ label, status, t, active, onClick }: { label: string; status: 'idle' | 'ready' | 'working'; t: any; active: boolean; onClick: () => void }) => {
  const statusColors = {
    idle: 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800',
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
    Negative: 'text-rose-500 dark:text-rose-400 border-rose-400/30 bg-rose-400/5'
  };
  return (
    <span className={`px-2 py-0.5 border rounded text-[9px] font-mono ${colors[type] || 'text-slate-500 dark:text-zinc-500'}`}>
      {type}
    </span>
  );
};

interface VirtualFile {
  id: string;
  name: string;
  type: string;
  size: number;
  readOnly: boolean;
  directory: string;
  source: 'user' | 'agent';
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'prompts' | 'init' | 'help'>('general');
  const [initFeedback, setInitFeedback] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: number; type: string }[]>([]);
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>(() => {
    try {
      const saved = localStorage.getItem('agent_xk_vfiles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('agent_xk_vfiles', JSON.stringify(virtualFiles));
  }, [virtualFiles]);

  const [showExplorer, setShowExplorer] = useState(false);
  const [currentDir, setCurrentDir] = useState('/');
  const [explorerContextMenu, setExplorerContextMenu] = useState<{x: number, y: number, fileId: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [activeAgent, setActiveAgent] = useState<'master' | 'creative' | 'design' | 'dev' | 'reflect' | 'recorder'>('master');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messageHistories, setMessageHistories] = useState<Record<string, { id: string, role: 'user' | 'agent' | 'system', content: string, timestamp: string }[]>>(() => {
    // Attempt to inject experience upon project start
    let baseExp = "";
    try {
      const saved = localStorage.getItem('agent_xk_vfiles');
      if (saved) {
        const vfs: VirtualFile[] = JSON.parse(saved);
        const expFile = vfs.find(f => f.name === 'Core_Experience_Memory.md');
        if (expFile && 'content' in expFile && expFile.content) {
          baseExp = `\n\n[INJECTED EXPERIENCE ARCHIVE]\n${(expFile as any).content}\n`;
        }
      }
    } catch {}

    return {
      master: [{ id: 'm1', role: 'system', content: 'Master Nexus: Integrated. Waiting for Project Directives.' + baseExp, timestamp: new Date().toLocaleTimeString() }],
      creative: [{ id: 'c1', role: 'system', content: 'Creative Studio: Listening for Visionary Inputs.' + baseExp, timestamp: new Date().toLocaleTimeString() }],
      design: [{ id: 'd1', role: 'system', content: 'Design Core: Ready for Architectural Blueprints.' + baseExp, timestamp: new Date().toLocaleTimeString() }],
      dev: [{ id: 'v1', role: 'system', content: 'Dev Node: Initialized. Repository scan complete.' + baseExp, timestamp: new Date().toLocaleTimeString() }],
      reflect: [{ id: 'r1', role: 'system', content: 'Reflection Sub-system: Active. Monitoring entropy.' + baseExp, timestamp: new Date().toLocaleTimeString() }],
      recorder: [{ id: 'rc1', role: 'system', content: 'Recorder Agent: Online. Monitoring interaction logs.', timestamp: new Date().toLocaleTimeString() }]
    };
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
      reflect: { selectedProvider: 'openai', selectedModel: 'o1' },
      recorder: { selectedProvider: 'google', selectedModel: 'gemini-2.5-flash' }
    };

    const defaultSettings: AppSettings = {
      lang: 'zh',
      agentConfigs: defaultAgentConfigs,
      providerConfigs: defaultConfigs,
      customModels: [],
      prompts: {
        master: "You are the project manager agent. Efficiently schedule DAG tasks and manage the state.",
        design: "You are the software designer agent. Create optimized schemas and architectures.",
        dev: "You are the developer agent. Write clean, modular, and idiomatic code.",
        reflect: "You are the reflection agent. Analyze failures and output updated meta-instructions.",
        creative: "You are the Creative Director. Focus on enhancing user experience and visual aesthetic using natural dialogue.",
        recorder: "You are the Data Recorder Agent. Your explicit task is to observe the interaction history between the user and other agents, distill this into structured 'experience', and maintain an evolving context archive. Extract what works, what fails, user preferences, and generate a robust summary to be saved in the database."
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
            reflect: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel },
            recorder: { selectedProvider: parsed.selectedProvider, selectedModel: parsed.selectedModel }
         };
      }
      
      if (!parsed.customModels) {
        parsed.customModels = [];
      }
      if (!parsed.prompts?.recorder) {
        if (!parsed.prompts) parsed.prompts = { ...defaultSettings.prompts };
        parsed.prompts.recorder = defaultSettings.prompts.recorder;
      }
      if (!parsed.agentConfigs?.recorder) {
        if (!parsed.agentConfigs) parsed.agentConfigs = { ...defaultAgentConfigs };
        parsed.agentConfigs.recorder = defaultAgentConfigs.recorder;
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

  const [settingsActiveAgent, setSettingsActiveAgent] = useState<'master' | 'creative' | 'design' | 'dev' | 'reflect' | 'recorder'>('master');
  const activeAgentConfig = settings.agentConfigs[settingsActiveAgent] || settings.agentConfigs['master'];
  
  const ALL_PROVIDERS = [
    ...AI_PROVIDERS,
    {
      id: 'user_custom_models',
      name: settings.lang === 'zh' ? '⭐ 自定义模型库' : '⭐ Custom Models',
      defaultEndpoint: '',
      models: settings.customModels.length > 0 
        ? settings.customModels.map(m => ({ id: m.id, name: m.name })) 
        : [{ id: 'no_models_yet', name: settings.lang === 'zh' ? '暂无模型 (请在下方添加)' : 'No models added' }]
    }
  ];

  const currentProviderData = ALL_PROVIDERS.find(p => p.id === activeAgentConfig.selectedProvider) || ALL_PROVIDERS[0];
  
  // Resolve actual API settings dynamically based on custom model or standard provider
  let currentProviderConfig = settings.providerConfigs[activeAgentConfig.selectedProvider] || { apiKey: '', apiEndpoint: currentProviderData.defaultEndpoint };
  let activeModelString = activeAgentConfig.selectedModel;

  if (activeAgentConfig.selectedProvider === 'user_custom_models') {
    const customizedModel = settings.customModels.find(m => m.id === activeAgentConfig.selectedModel);
    if (customizedModel) {
      currentProviderConfig = { apiKey: customizedModel.apiKey, apiEndpoint: customizedModel.apiEndpoint };
      activeModelString = customizedModel.modelString;
    }
  } else if (activeAgentConfig.selectedModel === 'custom') {
    activeModelString = activeAgentConfig.customModel || "gpt-4o";
  }

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

  const processFiles = (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    
    const newFiles = files.map(file => {
      const id = 'file_' + Math.random().toString(36).substr(2, 9);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'unknown/file'
      };
    });

    setUploadedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });

    setVirtualFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newVFs = newFiles.filter(f => !existingNames.has(f.name)).map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        readOnly: true, // Default read-only for user-uploaded data
        directory: '/',
        source: 'user' as const
      }));
      return [...prev, ...newVFs];
    });
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        processFiles(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
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
        
        let endpointUrl = dynamicProviderConfig.apiEndpoint.trim();
        if (!endpointUrl.endsWith('/chat/completions')) {
           endpointUrl = endpointUrl.replace(/\/$/, '') + '/chat/completions';
        }
        
        const resolvedModel = dynamicAgentConfig.selectedModel === 'custom' 
          ? (dynamicAgentConfig.customModel || "gpt-4o") 
          : (dynamicAgentConfig.selectedModel || "gpt-4o");

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dynamicProviderConfig.apiKey || ''}`
          },
          body: JSON.stringify({
            model: resolvedModel,
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

  const handleRecordExperience = async () => {
    try {
      const recAgentConfig = settings.agentConfigs['recorder'] || { selectedProvider: 'google', selectedModel: 'gemini-2.5-flash' };
      
      let recProviderConfig = settings.providerConfigs[recAgentConfig.selectedProvider] || { apiKey: '', apiEndpoint: '' };
      let recModelStr = recAgentConfig.selectedModel;
      
      if (recAgentConfig.selectedProvider === 'user_custom_models') {
        const customizedModel = settings.customModels.find(m => m.id === recAgentConfig.selectedModel);
        if (customizedModel) {
            recProviderConfig = { apiKey: customizedModel.apiKey, apiEndpoint: customizedModel.apiEndpoint };
            recModelStr = customizedModel.modelString;
        }
      } else if (recAgentConfig.selectedModel === 'custom') {
          recModelStr = recAgentConfig.customModel || 'gpt-4o';
      }

      if (!recProviderConfig.apiEndpoint || !recProviderConfig.apiKey || recProviderConfig.apiKey.length < 5) {
        alert("Recorder Agent is not properly configured. Please check AI Model Settings.");
        return;
      }
      
      let recEndpointUrl = recProviderConfig.apiEndpoint.trim();
      if (!recEndpointUrl.endsWith('/chat/completions')) recEndpointUrl = recEndpointUrl.replace(/\/$/, '') + '/chat/completions';

      // Gather last few messages from active agent history for context context
      const currentHistory = messageHistories[activeAgent] || [];
      const recentChat = currentHistory.slice(-5).map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');

      // Look for the existing unified experience file
      const existingExpFile = virtualFiles.find(f => f.name === 'Core_Experience_Memory.md');
      const oldExpContent = existingExpFile && 'content' in existingExpFile ? (existingExpFile as any).content : "No prior experience recorded.";

      const recPrompt = `Please analyze the latest interaction and update the Core Experience Memory.
Wait, keep it very modular. 
[EXISTING EXPERIENCE]
${oldExpContent}

[LATEST CHAT CONTEXT]
${recentChat}

Task:
Extract any new reusable knowledge, failure summaries, user preferences, or configurations from the 'LATEST CHAT CONTEXT'. 
Merge this seamlessly into 'EXISTING EXPERIENCE' and return ONLY the completely updated markdown content. DO NOT wrap it in JSON, just output the raw markdown. Use well-structured categories like # Preferences, # Troubleshooting, etc.`;

      const recResp = await fetch(recEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recProviderConfig.apiKey}` },
        body: JSON.stringify({
          model: recModelStr,
          messages: [
            { role: "system", content: settings.prompts.recorder || "You are the Data Recorder Agent." },
            { role: "user", content: recPrompt }
          ]
        })
      });

      if (recResp.ok) {
        const recData = await recResp.json();
        const updatedSummary = recData.choices?.[0]?.message?.content || "";
        if (updatedSummary) {
          setVirtualFiles(prev => {
            const filtered = prev.filter(f => f.name !== 'Core_Experience_Memory.md');
            return [...filtered, {
              id: 'exp_' + Date.now(),
              name: 'Core_Experience_Memory.md',
              type: 'text/markdown',
              size: updatedSummary.length,
              readOnly: true,
              directory: '/agent_records',
              source: 'agent',
              content: updatedSummary
            }];
          });
          // Alert user or provide feedback successfully
          alert("Experience successfully pooled and merged into Core_Experience_Memory.md!");
        }
      } else {
         const err = await recResp.text();
         alert("Experience Recorder Failed: " + err);
      }
    } catch(err: any) {
      alert("Recorder Background Error: " + err.message);
    }
  };

  const handleTestConnection = async () => {
    if (!currentProviderConfig?.apiEndpoint) {
      setTestConnectionState({ status: 'error', message: 'API Endpoint is not configured.' });
      return;
    }
    setTestConnectionState({ status: 'testing', message: 'Testing connection...' });
    try {
      const config = currentProviderConfig;
      const resolvedModel = activeModelString;
        
      let endpointUrl = config.apiEndpoint.trim();
      if (!endpointUrl.endsWith('/chat/completions')) {
         endpointUrl = endpointUrl.replace(/\/$/, '') + '/chat/completions';
      }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey || ''}`
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [{ role: "user", content: "print('hello')" }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        let errMsg = await response.text();
        try {
          const errJson = JSON.parse(errMsg);
          errMsg = errJson.error?.message || errJson.message || errMsg;
        } catch { /* ignore parsing errors */ }
        setTestConnectionState({ status: 'error', message: `HTTP ${response.status}: ${errMsg}`.substring(0, 150) });
      } else {
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          setTestConnectionState({ 
            status: 'success', 
            message: `OK! Reply: "${data.choices[0].message.content.substring(0, 40)}"` 
          });
        } else if (data.error) {
          setTestConnectionState({ status: 'error', message: `API Error: ${data.error.message || 'Unknown provider error'}` });
        } else {
          setTestConnectionState({ status: 'error', message: 'Connected, but invalid response format.' });
        }
      }
    } catch (e: any) {
      setTestConnectionState({ status: 'error', message: `Network/CORS Error: ${e.message}` });
    }
  };

  const isApiConnected = Boolean(currentProviderConfig?.apiKey && currentProviderConfig.apiKey.length > 5);
  const canExecute = isApiConnected;

  if (loading) {
    return (
      <div className="h-screen bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center font-mono text-slate-500 dark:text-zinc-500 text-xs">
        INITIALIZING CORE STATE BUS...
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen bg-slate-100 dark:bg-[#0a0a0a] text-slate-700 dark:text-zinc-300 font-sans overflow-hidden relative" 
      id="app-workbench"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-emerald-500/10 border-2 border-dashed border-emerald-500/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4 bg-slate-50 dark:bg-zinc-950 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800">
              <UploadCloud className="w-12 h-12 text-emerald-500 animate-bounce" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-widest uppercase pb-1">Drop files to upload</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">Supports any documents or images</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Explorer Modal --- */}
      <AnimatePresence>
        {showExplorer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => {
              if (explorerContextMenu) setExplorerContextMenu(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col w-[800px] h-[600px] max-w-full max-h-full"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 cursor-default">
                <div className="flex items-center gap-2">
                  <span className="text-slate-800 dark:text-zinc-200 font-bold text-sm">部署数据库 (Deployment Data Pool)</span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 rounded">EXP. LAYER</span>
                </div>
                <button 
                  onClick={() => setShowExplorer(false)}
                  className="p-1 hover:bg-slate-100 dark:bg-zinc-800 rounded-lg transition-colors text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Left pane: Directories */}
                <div className="w-48 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-2 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-2 mb-2 pt-2">Directories</div>
                  {Array.from(new Set(virtualFiles.map(f => f.directory).concat(['/', '/agent_records']))).map(dir => (
                    <button
                      key={dir}
                      onClick={() => { setCurrentDir(dir); setExplorerContextMenu(null); }}
                      className={`w-full text-left px-2 py-1.5 text-[11px] font-mono rounded flex items-center gap-2 transition-colors ${
                        currentDir === dir ? 'bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/30' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="truncate">{dir}</span>
                    </button>
                  ))}
                </div>

                {/* Right pane: Files */}
                <div className="flex-1 bg-black p-4 overflow-y-auto relative" onContextMenu={(e) => { e.preventDefault(); setExplorerContextMenu(null); }}>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 mb-4 flex items-center gap-2">
                    <span className="text-emerald-500/70">{currentDir}</span> 
                    <span className="text-zinc-700">|</span> 
                    {virtualFiles.filter(f => f.directory === currentDir).length} files
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {virtualFiles.filter(f => f.directory === currentDir).map((f) => (
                      <div 
                        key={f.id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExplorerContextMenu({ x: e.clientX, y: e.clientY, fileId: f.id });
                        }}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white dark:bg-zinc-900 cursor-pointer border border-transparent hover:border-slate-200 dark:border-zinc-800 transition-all select-none relative group"
                      >
                        <FileIcon className={`w-8 h-8 ${f.source === 'agent' ? 'text-purple-500' : 'text-emerald-500'}`} />
                        <div className="text-center w-full">
                          <p className="text-[11px] text-slate-700 dark:text-zinc-300 truncate" title={f.name}>{f.name}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {f.readOnly ? (
                              <span className="text-[8px] px-1 bg-rose-600 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-mono rounded border border-rose-500/10">R/O</span>
                            ) : (
                              <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 font-mono rounded border border-blue-500/10">R/W</span>
                            )}
                            <span className="text-[8px] text-slate-400 dark:text-zinc-600 font-mono">{(f.size / 1024).toFixed(1)}K</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {virtualFiles.filter(f => f.directory === currentDir).length === 0 && (
                      <div className="col-span-4 text-center py-12 text-slate-400 dark:text-zinc-600 text-xs italic font-mono">
                        Directory is empty
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Context Menu */}
            <AnimatePresence>
              {explorerContextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="fixed z-[70] bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded shadow-xl min-w-[160px] overflow-hidden"
                  style={{ top: explorerContextMenu.y, left: explorerContextMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 border-b border-slate-200 dark:border-zinc-800 bg-black/20 text-[9px] text-slate-500 dark:text-zinc-500 font-mono uppercase tracking-widest">
                    Properties
                  </div>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:bg-zinc-800 hover:text-slate-900 dark:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      setVirtualFiles(prev => prev.map(vf => vf.id === explorerContextMenu.fileId ? { ...vf, readOnly: true } : vf));
                      setExplorerContextMenu(null);
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 flex-none" /> Set Read-Only
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:bg-zinc-800 hover:text-slate-900 dark:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      setVirtualFiles(prev => prev.map(vf => vf.id === explorerContextMenu.fileId ? { ...vf, readOnly: false } : vf));
                      setExplorerContextMenu(null);
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-none" /> Set Read / Write
                  </button>
                  <div className="border-t border-slate-200 dark:border-zinc-800 mt-1" />
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-rose-500 dark:text-rose-400 hover:bg-rose-600 dark:bg-rose-500 hover:text-slate-900 dark:text-white transition-colors font-bold flex items-center justify-between"
                    onClick={() => {
                      setVirtualFiles(prev => prev.filter(vf => vf.id !== explorerContextMenu.fileId));
                      setExplorerContextMenu(null);
                    }}
                  >
                    Delete File <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t.settings}</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 px-2 flex-shrink-0">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'general' ? 'border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'}`}>
                  {t.tabGeneral}
                </button>
                <button onClick={() => setActiveTab('models')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'models' ? 'border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'}`}>
                  {t.tabModels}
                </button>
                <button onClick={() => setActiveTab('prompts')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'prompts' ? 'border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'}`}>
                  {t.tabPrompts}
                </button>
                <button onClick={() => setActiveTab('init')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'init' ? 'border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'}`}>
                  {t.tabInit}
                </button>
                <button onClick={() => setActiveTab('help')} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'help' ? 'border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300'}`}>
                  {t.tabHelp}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
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
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:border-zinc-700'
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
                    <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
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
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:border-slate-300 dark:border-zinc-700'
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
                        <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                          <Network className="w-3 h-3" /> {settings.lang === 'zh' ? '核心服务商' : 'Provider'}</label><select 
                          value={activeAgentConfig.selectedProvider}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            const provObj = ALL_PROVIDERS.find(p => p.id === newProv);
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
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 appearance-none transition-colors"
                        >
                          {ALL_PROVIDERS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Model Select */}
                      <div className="flex-1 space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
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
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 appearance-none transition-colors"
                        >
                          {currentProviderData.models.map(m => (
                            <option key={m.id} value={m.id} disabled={m.id === 'no_models_yet'}>{m.name}</option>
                          ))}
                          {activeAgentConfig.selectedProvider !== 'user_custom_models' && (
                            <option value="custom">✏️ {settings.lang === 'zh' ? '临时自定义结构 (Legacy Custom)' : 'Legacy Custom String'}</option>
                          )}
                        </select>

                        <AnimatePresence>
                          {activeAgentConfig.selectedModel === 'custom' && (
                            <motion.input
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              type="text"
                              value={activeAgentConfig.customModel || ''}
                              onChange={(e) => setSettings(s => ({
                                ...s,
                                agentConfigs: {
                                  ...s.agentConfigs,
                                  [settingsActiveAgent]: {
                                    ...s.agentConfigs[settingsActiveAgent],
                                    customModel: e.target.value
                                  }
                                }
                              }))}
                              placeholder={settings.lang === 'zh' ? "输入模型名称 (如: gpt-4.5)" : "Enter model string"}
                              className="w-full bg-white dark:bg-zinc-900 border border-emerald-500/50 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                        <Key className="w-3 h-3" /> {t.apiKey}
                      </label>
                      <div className="relative">
                        <input 
                          type={showApiKey ? "text" : "password"}
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
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          {showApiKey ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                        <Network className="w-3 h-3" /> {t.apiEndpoint}
                      </label>
                      <input 
                        type="text"
                        value={currentProviderConfig?.apiEndpoint || ''}
                        disabled={activeAgentConfig.selectedProvider === 'user_custom_models'}
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
                        className={`w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors ${activeAgentConfig.selectedProvider === 'user_custom_models' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {activeAgentConfig.selectedProvider !== 'user_custom_models' && (
                        <p className="text-[9px] text-slate-400 dark:text-zinc-600 italic">
                          * {settings.lang === 'zh' ? '每个大模型平台隔离保存接口地址与 Key。跨智能体共用同一平台配额。' : 'Keys and endpoints are isolated per provider. Shared across agents using the same provider.'}
                        </p>
                      )}
                    </div>

                    {activeAgentConfig.selectedProvider === 'user_custom_models' && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
                        {settings.lang === 'zh' ? '您正在使用[自定义模型库]中的模型。配置将被该模型自身的 API Key 和 Endpoint 覆盖，请在下方的【模型管理】内添加和编辑。' : 'You are using a custom model from the Custom Models Library. Endpoint and API key are overriden by the specific model config.'}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleTestConnection}
                          disabled={testConnectionState.status === 'testing'}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                            testConnectionState.status === 'testing' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 cursor-not-allowed' :
                            'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:bg-zinc-700 hover:text-slate-900 dark:text-white border border-slate-300 dark:border-zinc-700'
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
                           <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 text-xs font-mono bg-rose-600 dark:bg-rose-500/10 px-3 py-2 rounded flex-1 overflow-hidden">
                             <AlertCircle className="w-3.5 h-3.5 shrink-0" /> 
                             <span className="truncate" title={testConnectionState.message}>{testConnectionState.message}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'models' && (
                  <div className="mt-8 pt-8 border-t border-slate-200 dark:border-zinc-800 border-dashed animate-in fade-in duration-500 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-slate-800 dark:text-zinc-200 text-sm font-bold flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-emerald-500" />
                          {settings.lang === 'zh' ? '自定义模型管理 (Custom Model Library)' : 'Custom Model Library'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                          {settings.lang === 'zh' 
                            ? '添加支持 OpenAI API 标准格式的各种本地/私有/第三方大模型。添加后可在任何 Agent 的【⭐ 用户自定义模型】分类中直接选用。' 
                            : 'Manage custom AI models supporting OpenAI chat-completion format. Models will be available across all agents.'}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setSettings(s => ({
                            ...s,
                            customModels: [...s.customModels, { id: 'model_' + Date.now(), name: 'New Model', modelString: 'gpt-4', apiKey: '', apiEndpoint: 'https://api.openai.com/v1' }]
                          }));
                        }}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 text-xs rounded border border-emerald-500/30 hover:text-black font-bold transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {settings.lang === 'zh' ? '新增配置' : 'New Config'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {settings.customModels.map((cm, idx) => (
                        <div key={cm.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 space-y-4 relative group">
                          <div className="absolute right-4 top-4 hidden group-hover:flex items-center gap-2">
                             <button
                               onClick={() => {
                                 setSettings(s => ({
                                   ...s,
                                   customModels: s.customModels.filter(m => m.id !== cm.id)
                                 }));
                               }}
                               className="p-1.5 text-slate-400 dark:text-zinc-600 hover:bg-rose-600 dark:bg-rose-500/10 hover:text-rose-600 dark:text-rose-500 rounded transition-all"
                               title="Delete model"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">1. {settings.lang === 'zh' ? '显示名称' : 'Alias / Display Name'}</label>
                              <input 
                                value={cm.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings(s => ({
                                    ...s, customModels: s.customModels.map(m => m.id === cm.id ? { ...m, name: val } : m)
                                  }));
                                }}
                                placeholder="Local Llama3 8B"
                                className="w-full bg-black border border-slate-200 dark:border-zinc-800 rounded p-2 text-xs text-slate-700 dark:text-zinc-300 focus:border-emerald-500/50"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">2. {settings.lang === 'zh' ? '真实模型ID' : 'Backend Model String'}</label>
                              <input 
                                value={cm.modelString}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings(s => ({
                                    ...s, customModels: s.customModels.map(m => m.id === cm.id ? { ...m, modelString: val } : m)
                                  }));
                                }}
                                placeholder="llama3-8b-instruct"
                                className="w-full bg-black border border-slate-200 dark:border-zinc-800 rounded p-2 text-xs text-slate-700 dark:text-zinc-300 focus:border-emerald-500/50"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">3. API Endpoint</label>
                              <input 
                                value={cm.apiEndpoint}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings(s => ({
                                    ...s, customModels: s.customModels.map(m => m.id === cm.id ? { ...m, apiEndpoint: val } : m)
                                  }));
                                }}
                                placeholder="Base URL of OpenAI-compatible API"
                                className="w-full bg-black border border-slate-200 dark:border-zinc-800 rounded p-2 text-xs text-slate-700 dark:text-zinc-300 focus:border-emerald-500/50"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase">4. API Key</label>
                              <input 
                                type="password"
                                value={cm.apiKey}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings(s => ({
                                    ...s, customModels: s.customModels.map(m => m.id === cm.id ? { ...m, apiKey: val } : m)
                                  }));
                                }}
                                placeholder="sk-..."
                                className="w-full bg-black border border-slate-200 dark:border-zinc-800 rounded p-2 text-xs text-slate-700 dark:text-zinc-300 focus:border-emerald-500/50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {settings.customModels.length === 0 && (
                        <div className="text-center py-8 text-slate-400 dark:text-zinc-600 text-xs italic border border-slate-200 dark:border-zinc-800 border-dashed rounded-lg">
                          {settings.lang === 'zh' ? '暂无自定义模型。点击右上角添加。' : 'No custom models added yet. Click New Config above.'}
                        </div>
                      )}
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
                        { id: 'reflect', label: t.reflectPrompt },
                        { id: 'recorder', label: settings.lang === 'zh' ? '经验记录员' : 'Data Recorder' }
                      ] as const).map(p => (
                        <div key={p.id} className="space-y-2">
                          <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">{p.label}</label>
                          <textarea 
                            value={settings.prompts[p.id]}
                            onChange={(e) => setSettings(s => ({ 
                              ...s, 
                              prompts: { ...s.prompts, [p.id]: e.target.value }
                            }))}
                            placeholder={t.placeholderPrompt}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-[11px] text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors h-32 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'init' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
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
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                        <Terminal className="w-3 h-3" /> {t.targetPath}
                      </label>
                      <input 
                        type="text"
                        value={settings.initSettings.targetPath}
                        onChange={(e) => setSettings(s => ({ 
                          ...s, 
                          initSettings: { ...s.initSettings, targetPath: e.target.value } 
                        }))}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={settings.initSettings.autoDeploy}
                          onChange={(e) => setSettings(s => ({ 
                            ...s, 
                            initSettings: { ...s.initSettings, autoDeploy: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-xs text-slate-700 dark:text-zinc-300">{t.autoDeploy}</span>
                    </div>

                    <button 
                      onClick={handleInitProject}
                      className="w-full py-4 bg-emerald-500 text-black font-bold text-sm rounded-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
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
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Network className="w-3 h-3 text-emerald-500" /> {t.docDagTitle}
                        </h3>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                          {t.docDagDesc}
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <RotateCcw className="w-3 h-3 text-emerald-500" /> {t.docSnapshotTitle}
                        </h3>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                          {t.docSnapshotDesc}
                        </p>
                      </section>

                      <section className="space-y-2 pt-2">
                        <h3 className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> {t.docSettingsTitle}
                        </h3>
                        <div className="space-y-2 font-mono text-[10px] text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 p-4 rounded-lg border border-emerald-500/10">
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

              <div className="p-4 bg-white dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 flex-shrink-0">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Left Sidebar: Status & Controls --- */}
      <aside className="w-64 border-r border-slate-200 dark:border-zinc-800 flex flex-col p-4 gap-6 bg-slate-50 dark:bg-zinc-950/50" id="sidebar-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" id="brand-header">
            <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
              <Cpu className="text-black w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">{t.projectName}</h1>
              <div className="flex items-center gap-1.5 min-w-0">
                 <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono italic shrink-0">v0.2_STABLE</p>
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
              className="p-2 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-zinc-900 rounded-lg transition-all"
              title={t.settings}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Status Section */}
        <div className="p-3 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className={`w-3.5 h-3.5 ${isApiConnected ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-600'}`} />
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.apiKeyStatus}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${isApiConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-600 dark:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
          </div>
          <p className={`text-[10px] font-mono ${isApiConnected ? 'text-emerald-500/70' : 'text-rose-600 dark:text-rose-500/70'}`}>
            {isApiConnected ? `[CONNECTED] ${settings.selectedModel}` : `[DISCONNECTED]`}
          </p>
        </div>

        <div className="space-y-4" id="agent-status-cluster">
          <div className="grid grid-cols-1 gap-2">
            <h2 className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{t.agentCluster}</h2>
            <AgentStatusCard label="Master" status="ready" t={t} active={activeAgent === 'master'} onClick={() => setActiveAgent('master')} />
            <AgentStatusCard label={t.creativeDirector} status={canExecute ? 'working' : 'idle'} t={t} active={activeAgent === 'creative'} onClick={() => setActiveAgent('creative')} />
            <AgentStatusCard label="Design" status={canExecute ? 'ready' : 'idle'} t={t} active={activeAgent === 'design'} onClick={() => setActiveAgent('design')} />
            <AgentStatusCard label="Dev" status="idle" t={t} active={activeAgent === 'dev'} onClick={() => setActiveAgent('dev')} />
            <AgentStatusCard label="Reflect" status="idle" t={t} active={activeAgent === 'reflect'} onClick={() => setActiveAgent('reflect')} />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-zinc-800" id="system-metrics">
            <h2 className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{t.metrics}</h2>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500 dark:text-zinc-500">{t.iterations}</span>
              <span className="text-slate-800 dark:text-zinc-200">{state.global_iteration_count}/3</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
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
          <button id="btn-rollback" className="w-full py-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded flex items-center justify-center gap-2 hover:bg-white dark:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50" disabled={!canExecute}>
            <RotateCcw className="w-3 h-3" /> {t.rollback}
          </button>
        </div>
      </aside>

      {/* --- Middle Content: Execution Flow --- */}
      <main className="flex-1 flex flex-col min-w-0" id="main-execution-flow">
        <header className="h-14 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-zinc-950/20" id="main-header">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Terminal className="w-3 h-3 text-emerald-500" />
              <span className="font-mono text-slate-500 dark:text-zinc-500">{t.snapshot}:</span>
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
                  ? 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-inner' 
                  : msg.role === 'agent' 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-slate-600 dark:text-zinc-400" /> : <Activity className="w-4 h-4 text-emerald-500" />}
              </div>
              <div className={`flex-1 space-y-1.5 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 text-[10px] ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span className="font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                    {msg.role === 'user' ? 'Human' : msg.role === 'agent' ? `Agent_${activeAgent.toUpperCase()}` : 'System'}
                  </span>
                  <span className="text-zinc-700 font-mono tracking-tighter">{msg.timestamp}</span>
                </div>
                <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-zinc-900/80 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-tr-none' 
                    : msg.role === 'agent'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-50/90 rounded-tl-none'
                      : 'bg-slate-50 dark:bg-zinc-950/20 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 border-dashed rounded-tl-none italic'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </section>

        <footer className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950" id="input-footer">
          <div className="max-w-4xl mx-auto space-y-4">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg group">
                    <FileIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-900 dark:text-white truncate max-w-[120px]">{file.name}</p>
                      <p className="text-[8px] text-slate-500 dark:text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="p-1 text-slate-400 dark:text-zinc-600 hover:text-rose-600 dark:text-rose-500 rounded transition-colors"
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
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500/50 resize-none h-24 text-slate-800 dark:text-zinc-200 disabled:opacity-50 transition-all"
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
                      ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:bg-zinc-800 hover:text-slate-900 dark:text-white' 
                      : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                  }`}>
                    <Paperclip className="w-3 h-3" />
                    {t.uploadFile}
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      disabled={!canExecute}
                      onChange={(e) => processFiles(e.target.files)}
                      accept=".md,.json,.pdf,.txt,.png"
                    />
                  </label>
                  
                  <button
                    onClick={handleRecordExperience}
                    disabled={!canExecute}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] font-bold transition-all ${
                      canExecute 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-slate-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    经验池+1
                  </button>

                  <span className="text-[9px] text-slate-400 dark:text-zinc-600 font-mono ml-2 border-l border-slate-200 dark:border-zinc-800 pl-4">
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
      <aside className="w-80 border-l border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50 dark:bg-zinc-950/50" id="sidebar-right">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800" id="dag-header">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-600 dark:text-zinc-400" /> DYNAMIC DAG
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
                    ? 'bg-white dark:bg-zinc-900/20 border-emerald-500/10 opacity-80'
                    : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    task.status === 'running' ? 'bg-emerald-500 text-black' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}>{task.id}</span>
                  {task.is_critical && (
                    <AlertCircle className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
                <span className={`text-[10px] font-mono ${
                  task.status === 'running' ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-600'
                } uppercase tracking-tighter`}>{task.status}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-800 dark:text-zinc-200">{task.description}</p>
              
              <AnimatePresence>
                {selectedTaskId === task.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800/50 mt-1"
                  >
                    {task.id === 'T3' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Workspace Explorer</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowExplorer(true);
                            }}
                            className="px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-bold text-[9px] uppercase tracking-wider rounded transition-colors border border-emerald-500/30"
                          >
                            Open Explorer
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {virtualFiles.length > 0 ? virtualFiles.slice(0, 3).map((file, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-slate-200 dark:border-zinc-800/50 group">
                              <FileText className="w-3 h-3 text-blue-400" />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <p className="text-[10px] text-slate-700 dark:text-zinc-300 truncate">{file.name}</p>
                                <span className={`text-[8px] px-1 rounded ${file.readOnly ? 'bg-rose-600 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {file.readOnly ? 'R/O' : 'R/W'}
                                </span>
                              </div>
                            </div>
                          )) : (
                            <div className="p-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900/10">
                              <p className="text-[9px] text-slate-400 dark:text-zinc-600 italic">No files available in data pool.</p>
                            </div>
                          )}
                          {virtualFiles.length > 3 && (
                            <div className="text-center text-[9px] text-slate-500 dark:text-zinc-500 font-mono">
                              + {virtualFiles.length - 3} more files...
                            </div>
                          )}
                          <div className="flex items-center gap-2 p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                            <Layers className="w-3 h-3 text-emerald-500/50" />
                            <p className="text-[10px] text-emerald-500/60 font-mono">/custom_directory_v1</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/20 p-2 rounded border border-slate-200 dark:border-zinc-800/50 space-y-2">
                        <p className="text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed italic">
                          Task context isolated. Executing dependency chain analysis...
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 dark:text-zinc-600">
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
                  <Layers className="w-3 h-3 text-slate-400 dark:text-zinc-600" />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">{task.parallel_group}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-3" id="active-report">
          <h3 className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{t.activeReport}</h3>
          <div className="bg-black/40 border border-slate-200 dark:border-zinc-800 rounded p-3 font-mono text-[10px] text-emerald-500/80 max-h-32 overflow-y-auto" id="report-terminal">
            {canExecute ? "Persistence Layer: Connected (" + settings.selectedModel + ")" : "Persistence Layer: Disconnected"}
          </div>
        </div>
      </aside>
    </div>
  );
}



