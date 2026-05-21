/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  Activity,
  AlertCircle,
  Code2,
  Terminal,
  RefreshCcw,
  Command,
  Box,
  FlaskConical,
  Copy,
  Maximize2,
  Info,
  Sun,
  Moon,
  Key,
  Pin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RuleResult {
  passed: boolean;
  rule: string;
  detail: string;
}

interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
}

interface TestResult {
  fixture_id: string;
  label: string;
  output: string;
  passed: boolean;
  error: string;
  usage: Usage;
  rule_results: RuleResult[];
  pass_count: number;
  fail_count: number;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [model, setModel] = useState("gpt-4o-mini");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState<string>(() => {
    return localStorage.getItem('bench_custom_json') || JSON.stringify({
      context_type: "simulation_report",
      language: "en",
      score: 129,
      percentile: 80,
      target_score: 135,
      focus_categories: ["Assumptions"],
      simulation_type: "full",
      explanations_available: true,
      next_session: {
        type: "adaptive_learning",
        category: "Assumptions"
      },
      progress_data: [118, 123, 129],
      exam_ai_description: "The Watson-Glaser Critical Thinking Appraisal measures the ability to analyze arguments, evaluate assumptions, and draw logical conclusions.",
      category_ai_descriptions: {
        "Assumptions": "Tests the ability to identify unstated assumptions that underlie an argument or conclusion."
      }
    }, null, 2);
  });
  const [contextType, setContextType] = useState<string>("simulation");
  const [logs, setLogs] = useState<string[]>([]);
  const [systemState, setSystemState] = useState<{ anthropic: boolean; openai: boolean } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorTab, setEditorTab] = useState<"context" | "prompts" | "keys">("context");
  const [maximizedResult, setMaximizedResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem('bench_anthropic_key') || "");
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('bench_openai_key') || "");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState<Record<string, boolean>>({});
  const [expandedPrompt, setExpandedPrompt] = useState<Record<string, boolean>>({});
  const [pinnedPromptKey, setPinnedPromptKey] = useState<string | null>(null);
  const [maximizedPromptContent, setMaximizedPromptContent] = useState<{ title: string, content: string } | null>(null);
  const [guideLang, setGuideLang] = useState<"en" | "he">("en");
  const [freeTestPrompt, setFreeTestPrompt] = useState("You are a sarcastic pirate captain who gives life advice. Every response must include at least one nautical metaphor and end with 'Arrr!' You speak in a mix of old English and modern slang.");
  const [freeTestContext, setFreeTestContext] = useState("I just got rejected from my dream job. What should I do next?");
  const [freeTestModel, setFreeTestModel] = useState("gpt-4o");
  const [freeTestResult, setFreeTestResult] = useState<{ output: string; usage: any; model: string; duration: number } | null>(null);
  const [freeTestRunning, setFreeTestRunning] = useState(false);
  const [freeTestError, setFreeTestError] = useState<string | null>(null);
  const [showFreeTest, setShowFreeTest] = useState(false);
  const [freeTestMainResult, setFreeTestMainResult] = useState<{ output: string; usage: any; model: string; duration: number } | null>(null);
  const [freeTestViewTab, setFreeTestViewTab] = useState<"output" | "prompt">("output");
  const [freeTestPromptExpanded, setFreeTestPromptExpanded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem('bench_theme') as "dark" | "light") || "dark"
  );
  const [prompts, setPrompts] = useState<{
    base: string;
    simulation: string;
    adaptive: string;
    deep_learning: string;
    guardrails: string;
  } | null>(null);

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      setPrompts(data);
    } catch (e) {
      addLog("Failed to fetch default prompts.");
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const saveKeys = (a: string, o: string) => {
    setAnthropicKey(a);
    setOpenaiKey(o);
    localStorage.setItem('bench_anthropic_key', a);
    localStorage.setItem('bench_openai_key', o);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem('bench_theme', newTheme);
  };

  const templates: Record<string, string> = {
    simulation: JSON.stringify({
      context_type: "simulation_report",
      language: "en",
      score: 129,
      percentile: 80,
      target_score: 135,
      focus_categories: ["Assumptions"],
      simulation_type: "full",
      explanations_available: true,
      next_session: {
        type: "adaptive_learning",
        category: "Assumptions"
      },
      progress_data: [118, 123, 129],
      exam_ai_description: "The Watson-Glaser Critical Thinking Appraisal measures the ability to analyze arguments, evaluate assumptions, and draw logical conclusions.",
      category_ai_descriptions: {
        "Assumptions": "Tests the ability to identify unstated assumptions that underlie an argument or conclusion."
      }
    }, null, 2),
    adaptive: JSON.stringify({
      context_type: "adaptive_report",
      language: "en",
      category: "Deduction",
      questions_answered: 12,
      accuracy_rate: 67,
      starting_difficulty: 4,
      highest_difficulty: 6,
      ending_difficulty: 5,
      performance_summary: "improved",
      topic_mastery_status: "not_mastered",
      next_session: {
        type: "adaptive_learning",
        category: "Deduction"
      },
      category_ai_description: "Tests the ability to identify what must logically follow from given statements, without adding assumptions."
    }, null, 2),
    deep_learning: JSON.stringify({
      context_type: "deep_learning",
      language: "en",
      category: "Interpretation",
      question_result: "incorrect",
      explanation_mode: "ai_simplified",
      difficulty_level: 4,
      question: "A research team studied 800 office workers in Berlin who switched from sitting desks to standing desks for 3 months. After the trial, 62% reported reduced lower back pain and 58% reported feeling more energetic during the workday. Which conclusion is most strongly supported by this study?",
      answer_choices: [
        "A. Standing desks eliminate lower back pain.",
        "B. Office workers in Berlin who use standing desks may experience some health benefits.",
        "C. Sitting desks cause lower back pain.",
        "D. Standing desks are the best workplace investment companies can make."
      ],
      user_answer: "A",
      correct_answer: "B",
      question_explanation: "The correct answer is B. The study measured self-reported outcomes among office workers in Berlin who switched to standing desks, finding that a majority reported reduced back pain and increased energy. Answer B accurately limits the conclusion to this specific group and uses cautious language ('may experience some'), which matches the strength of the evidence. Answer A overstates the finding — '62% reported reduced pain' does not mean pain is 'eliminated,' nor does it apply to everyone. Answer C makes a causal claim the study didn't test (the study didn't compare against a control group still using sitting desks). Answer D goes beyond the study's scope entirely.",
      category_ai_description: "Tests the ability to weigh evidence and determine the most supported conclusion from a given passage, without overstating or going beyond the data."
    }, null, 2)
  };

  const loadTemplate = (type: string) => {
    setCustomContext(templates[type]);
    setContextType(type);
    localStorage.setItem('bench_custom_json', templates[type]);
    addLog(`Template loaded: ${type.toUpperCase()}`);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMaximizedResult(null);
        setMaximizedPromptContent(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetch("/api/system-check")
      .then(res => res.json())
      .then(setSystemState)
      .catch(() => addLog("System check failed."));
  }, []);

  const copyFailureDiagnosis = (test: TestResult) => {
    const failedRules = test.rule_results.filter((r) => !r.passed);
    if (failedRules.length === 0 && !test.error) {
      addLog(`No explicit failures found for ${test.fixture_id}.`);
      return;
    }

    const report = [
      `### FAILURE DIAGNOSIS: ${test.fixture_id}`,
      `LABEL: ${test.label}`,
      `--------------------------------------------------`,
      `FAILED RULES:`,
      ...failedRules.map((r, i) => `${i + 1}. [${r.rule}] - ${r.detail}`),
      test.error ? `\nSYSTEM ERROR: ${test.error}` : '',
      `--------------------------------------------------`,
      `RAW OUTPUT TO IMPROVE:`,
      test.output,
      `--------------------------------------------------`,
      `GOAL: Analyze the output above against the failed rules and suggest a prompt optimization to fix the violation.`
    ].join('\n');

    navigator.clipboard.writeText(report);
    addLog(`Copied failure diagnosis for ${test.fixture_id}`);
  };

  const runTests = async (filter?: string, isCustom = false, includeIds?: string[]) => {
    setIsRunning(true);
    setError(null);
    
    // Only clear results if it's a full run OR if we don't have existing results
    if (!includeIds && !isCustom) {
      setResults(null);
    }
    
    setMetadata(null);
    if (!includeIds) {
      setSelectedFilter(filter || (isCustom ? "custom" : null));
    }
    
    addLog(`Initiating benchmark for type: ${includeIds ? `SPECIFIC_IDS (${includeIds.length})` : (filter || (isCustom ? "CUSTOM" : "ALL"))}`);

    try {
      let body: any = { 
        model, 
        prompts,
        anthropicKey,
        openaiKey
      };
      if (includeIds) {
        body.include = includeIds.join(",");
      } else if (isCustom) {
        try {
          body.customContext = JSON.parse(customContext);
          body.contextType = contextType;
        } catch (e) {
          throw new Error("Invalid JSON in custom context field.");
        }
      } else {
        body.filter = filter;
      }

      const response = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Execution failed");
      }
      
      if (includeIds && results) {
        // Merge results: replace old items with new ones, keep others
        const newResults = [...results];
        data.results.forEach((newRes: TestResult) => {
          const idx = newResults.findIndex(r => r.fixture_id === newRes.fixture_id);
          if (idx !== -1) {
            newResults[idx] = newRes;
          } else {
            newResults.push(newRes);
          }
        });
        setResults(newResults);
      } else {
        setResults(data.results);
      }
      
      setMetadata(data.metadata);
      addLog(`Execution completed in ${data.metadata.duration}ms`);
    } catch (err: any) {
      setError(err.message);
      addLog(`CRITICAL: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runFailedTests = () => {
    if (!results) return;
    const failedIds = results.filter(r => !r.passed).map(r => r.fixture_id);
    if (failedIds.length > 0) {
      runTests(undefined, false, failedIds);
    }
  };

  const runFreeTest = async () => {
    if (!freeTestPrompt.trim()) return;
    setFreeTestRunning(true);
    setFreeTestError(null);
    setFreeTestResult(null);
    setFreeTestMainResult(null);
    addLog(`Prompt test: ${model}`);

    try {
      const response = await fetch("/api/free-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: freeTestPrompt,
          context: freeTestContext || undefined,
          model: model,
          anthropicKey,
          openaiKey
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prompt test failed");
      }

      setFreeTestResult(data);
      setFreeTestMainResult(data);
      addLog(`Prompt test completed in ${data.duration}ms`);
    } catch (err: any) {
      setFreeTestError(err.message);
      addLog(`Prompt test error: ${err.message}`);
    } finally {
      setFreeTestRunning(false);
    }
  };

  const stats = useMemo(() => {
    if (!results) return { total: 0, passed: 0, failed: 0, totalCost: 0, totalTokens: 0 };
    return {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      totalCost: results.reduce((acc, r) => acc + (r.usage?.cost || 0), 0),
      totalTokens: results.reduce((acc, r) => acc + (r.usage?.total_tokens || 0), 0)
    };
  }, [results]);

  return (
    <>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950 text-zinc-300' : 'bg-slate-50 text-slate-700'} font-sans selection:bg-indigo-500/30 flex flex-col h-screen overflow-hidden`}>
      {/* Environment Warning */}
      {systemState && (!systemState.anthropic || !systemState.openai) && (
        <div className={`${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-100 border-amber-200'} border-b px-4 py-1.5 flex items-center justify-center gap-3 text-[10px] font-mono text-amber-500`}>
          <AlertCircle className="w-3 h-3" />
          <span>SYSTEM_WARNING: Missing {(!systemState.anthropic && !systemState.openai) ? "Anthropic & OpenAI" : !systemState.anthropic ? "Anthropic" : "OpenAI"} API keys in environment. Execution may fail.</span>
        </div>
      )}

      {/* Engineering Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl sticky top-0 z-[100] h-14 flex-shrink-0`}>
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-100'} rounded flex items-center justify-center`}>
                <Box className="text-indigo-500 w-5 h-5" />
              </div>
              <h1 
                onClick={() => setShowGuidelines(true)}
                title="User guide"
                className={`font-bold text-sm uppercase tracking-tighter cursor-pointer hover:opacity-80 transition-opacity ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              >
                Prompt.Bench <span className={`ml-1 ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>v2.0.4</span>
              </h1>
            </div>
            
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-zinc-800 text-amber-500 hover:bg-zinc-700' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              title="Select model"
              className={`border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
              disabled={isRunning}
            >
              <optgroup label="OpenAI">
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-sonnet-4-20250514">claude-sonnet-4</option>
                <option value="claude-3-5-sonnet-20241022">claude-3.5-sonnet</option>
              </optgroup>
            </select>
            
            <button
              onClick={() => runTests()}
              disabled={isRunning}
              title="Run all tests"
              className={`
                flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all
                ${isRunning 
                  ? (theme === 'dark' ? "bg-zinc-800 text-zinc-600" : "bg-slate-200 text-slate-400")
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-95 border border-indigo-400/20"
                }
              `}
            >
              {isRunning ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? "Running..." : "Run All"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-w-0 ${theme === 'dark' ? 'bg-black/10' : 'bg-slate-100/50'}`}>
            <nav className={`border-b ${theme === 'dark' ? 'border-zinc-900 bg-zinc-950/50' : 'border-slate-200 bg-white/50'} p-2 flex-shrink-0`}>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {['simulation', 'adaptive', 'deep_learning'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    disabled={isRunning}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${
                      selectedFilter === f 
                        ? (theme === 'dark' ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-indigo-100 border-indigo-200 text-indigo-600")
                        : (theme === 'dark' ? "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200")
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}

                {selectedFilter && selectedFilter !== 'custom' && (
                  <button 
                    onClick={() => runTests(selectedFilter)}
                    disabled={isRunning}
                    title={`Run all ${selectedFilter} test fixtures`}
                    className={`
                      flex items-center gap-2 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-lg 
                      ${isRunning 
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none" 
                        : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 shadow-indigo-900/20"
                      }
                    `}
                  >
                    {isRunning ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {isRunning ? "Running..." : "Run Profile"}
                  </button>
                )}

                {results && results.some(r => !r.passed) && (
                  <button 
                    onClick={runFailedTests}
                    disabled={isRunning}
                    title="Re-run failed tests"
                    className={`
                      flex items-center gap-2 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border
                      ${isRunning 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed shadow-none" 
                        : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95"
                      }
                    `}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {isRunning ? "Running..." : "Run Failed"}
                  </button>
                )}

                <div className="h-4 w-px bg-zinc-800 mx-2" />

                <button
                  onClick={() => { setShowFreeTest(!showFreeTest); if (!showFreeTest) setShowEditor(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${
                    showFreeTest 
                      ? (theme === 'dark' ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-purple-100 border-purple-500/30 text-purple-600")
                      : (theme === 'dark' ? "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200")
                  }`}
                  title="Test any prompt against a model"
                >
                  <Terminal className="w-3.5 h-3.5" /> {showFreeTest ? "Exit Prompt Test" : "Prompt Test"}
                </button>

                <button
                  onClick={() => { setShowEditor(!showEditor); if (!showEditor) setShowFreeTest(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${
                    showEditor 
                      ? (theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-100 border-emerald-500/30 text-emerald-600")
                      : (theme === 'dark' ? "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200")
                  }`}
                  title="Test prompts with custom context and overrides"
                >
                  <FlaskConical className="w-3.5 h-3.5" /> {showEditor ? "Exit Lab" : "Adaptive Learning Lab"}
                </button>
              </div>
            </nav>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {showFreeTest && (
              <div className={`w-[450px] border-r ${theme === 'dark' ? 'border-zinc-900 bg-zinc-950' : 'border-slate-200 bg-white'} flex flex-col flex-shrink-0`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-zinc-900 bg-zinc-900/30' : 'border-slate-200 bg-slate-50'} flex items-center justify-between`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} flex items-center gap-2`}>
                    <Terminal className="w-3.5 h-3.5" /> Prompt Test
                  </div>
                </div>

                <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase`}>System Prompt</label>
                    <textarea 
                      value={freeTestPrompt}
                      onChange={(e) => setFreeTestPrompt(e.target.value)}
                      placeholder="Enter your system prompt here..."
                      spellCheck={false}
                      rows={8}
                      className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-purple-300 placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 text-purple-700 placeholder:text-slate-300'} border rounded p-3 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-y`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase`}>User Context / Input <span className="opacity-50">(optional)</span></label>
                    <textarea 
                      value={freeTestContext}
                      onChange={(e) => setFreeTestContext(e.target.value)}
                      placeholder="Enter context or user message..."
                      spellCheck={false}
                      rows={5}
                      className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-emerald-300 placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 text-emerald-700 placeholder:text-slate-300'} border rounded p-3 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-y`}
                    />
                  </div>

                  <button 
                    onClick={runFreeTest}
                    disabled={freeTestRunning || !freeTestPrompt.trim()}
                    title="Send prompt to model"
                    className={`
                      w-full py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2
                      ${freeTestRunning || !freeTestPrompt.trim()
                        ? (theme === 'dark' ? "bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none")
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 active:scale-95"
                      }
                    `}
                  >
                    {freeTestRunning ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {freeTestRunning ? "Running..." : "Run"}
                  </button>

                  {freeTestError && (
                    <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'} text-[10px] font-mono`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-3 h-3" />
                        <span className="font-bold uppercase">Error</span>
                      </div>
                      {freeTestError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showEditor && (
              <div className={`w-[450px] border-r ${theme === 'dark' ? 'border-zinc-900 bg-zinc-950' : 'border-slate-200 bg-white'} flex flex-col flex-shrink-0`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-zinc-900 bg-zinc-900/30' : 'border-slate-200 bg-slate-50'} flex items-center justify-between`}>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setEditorTab("context")}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                        editorTab === "context" 
                          ? (theme === 'dark' ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-100 text-indigo-600")
                          : (theme === 'dark' ? "text-zinc-600 hover:text-zinc-400" : "text-slate-400 hover:text-slate-600")
                      }`}
                    >
                      Context JSON
                    </button>
                    <button 
                      onClick={() => setEditorTab("prompts")}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                        editorTab === "prompts" 
                          ? (theme === 'dark' ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-100 text-indigo-600")
                          : (theme === 'dark' ? "text-zinc-600 hover:text-zinc-400" : "text-slate-400 hover:text-slate-600")
                      }`}
                    >
                      System Prompts
                    </button>
                    <button 
                      onClick={() => setEditorTab("keys")}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                        editorTab === "keys" 
                          ? (theme === 'dark' ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-100 text-indigo-600")
                          : (theme === 'dark' ? "text-zinc-600 hover:text-zinc-400" : "text-slate-400 hover:text-slate-600")
                      }`}
                    >
                      API Keys
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowGuidelines(true)}
                    className={`p-1.5 transition-colors ${theme === 'dark' ? 'text-zinc-600 hover:text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {editorTab === "context" ? (
                  <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <select 
                          value={contextType}
                          onChange={(e) => loadTemplate(e.target.value)}
                          className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'} border rounded px-2 py-1 text-[9px] focus:outline-none`}
                        >
                          <option value="simulation">Simulation</option>
                          <option value="adaptive">Adaptive</option>
                          <option value="deep_learning">Deep Learning</option>
                        </select>
                    </div>
                    <button 
                      onClick={() => runTests(undefined, true)}
                      disabled={isRunning}
                      className={`
                        w-full py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                        ${isRunning 
                          ? "bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none" 
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10"
                        }
                      `}
                    >
                      {isRunning ? "Running..." : "Run"}
                    </button>
                    <div className="flex-1 flex flex-col min-h-0 relative">
                      <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase mb-1.5 flex justify-between items-center`}>
                        <span>Context Payload</span>
                        {(() => {
                          try {
                            JSON.parse(customContext);
                            return <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Valid JSON</span>;
                          } catch (e) {
                            return <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Parse Error</span>;
                          }
                        })()}
                      </label>
                      <div className="relative flex-1 group">
                        <div className={`absolute inset-0 rounded pointer-events-none border-2 transition-opacity opacity-0 group-focus-within:opacity-100 ${theme === 'dark' ? 'border-indigo-500/20' : 'border-indigo-500/10'}`} />
                        <textarea 
                          value={customContext}
                          onChange={(e) => {
                            setCustomContext(e.target.value);
                            localStorage.setItem('bench_custom_json', e.target.value);
                          }}
                          spellCheck={false}
                          className={`w-full h-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-700'} border rounded p-4 font-mono text-[10px] focus:outline-none resize-none custom-scrollbar transition-all selection:bg-indigo-500/20`}
                        />
                      </div>
                    </div>

                    {/* Pinned Prompt Section */}
                    {pinnedPromptKey && prompts && (
                      <div className={`mt-auto pt-4 border-t ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'} flex flex-col gap-2 relative group-pin`}>
                        <div className="flex items-center justify-between">
                          <div className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase tracking-widest flex items-center gap-1.5`}>
                            <div className="relative">
                              <Pin className={`w-2.5 h-2.5 text-indigo-500 fill-indigo-500/20 ${isRunning ? 'animate-pulse' : ''}`} />
                              {isRunning && <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />}
                            </div>
                            Pinned: {pinnedPromptKey}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={`flex items-center border rounded-lg overflow-hidden h-7 ${
                                theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-200 bg-slate-50'
                              }`}>
                                <button 
                                  onClick={() => {
                                    const addon = contextType === 'simulation' ? prompts.simulation : contextType === 'adaptive' ? prompts.adaptive : prompts.deep_learning;
                                    const full = `${prompts.base}\n\n${addon}\n\nCONTEXT_OBJECT: ${customContext}\n\n${prompts.guardrails}`;
                                    const content = expandedPrompt.lab ? full : (prompts as any)[pinnedPromptKey];
                                    setMaximizedPromptContent({ 
                                      title: expandedPrompt.lab ? "Full Lab Prompt" : `Pinned: ${pinnedPromptKey}`, 
                                      content 
                                    });
                                  }}
                                  className={`p-1.5 transition-colors ${
                                    theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-white text-slate-400 hover:text-slate-700'
                                  }`}
                                  title="Full screen"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                                <div className={`w-[1px] h-3 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                                <button 
                                  onClick={() => {
                                    const addon = contextType === 'simulation' ? prompts.simulation : contextType === 'adaptive' ? prompts.adaptive : prompts.deep_learning;
                                    const full = `${prompts.base}\n\n${addon}\n\nCONTEXT_OBJECT: ${customContext}\n\n${prompts.guardrails}`;
                                    const content = expandedPrompt.lab ? full : (prompts as any)[pinnedPromptKey];
                                    navigator.clipboard.writeText(content);
                                    addLog("Copied prompt to clipboard.");
                                  }}
                                  className={`p-1.5 transition-colors ${
                                    theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-white text-slate-400 hover:text-slate-700'
                                  }`}
                                  title="Copy"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>

                              <button 
                                onClick={() => setExpandedPrompt(prev => ({ ...prev, lab: !prev.lab }))}
                                className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border transition-all h-7 flex items-center ${
                                  expandedPrompt.lab
                                    ? (theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-100 border-indigo-200 text-indigo-700')
                                    : (theme === 'dark' ? 'text-zinc-700 hover:text-zinc-500 border-zinc-800' : 'text-slate-300 hover:text-slate-500 border-slate-100')
                                }`}
                              >
                                {expandedPrompt.lab ? '[ LAYER ]' : '[ FINAL ]'}
                              </button>
                              <button 
                                onClick={() => setPinnedPromptKey(null)}
                                className={`text-[8px] font-black uppercase ${theme === 'dark' ? 'text-zinc-700 hover:text-zinc-500' : 'text-slate-300 hover:text-slate-500'}`}
                              >
                                [ UNPIN ]
                              </button>
                          </div>
                        </div>
                        <div className={`max-h-[150px] overflow-y-auto p-3 ${
                          isRunning 
                            ? (theme === 'dark' ? 'bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/20' : 'bg-indigo-50 ring-1 ring-inset ring-indigo-500/20')
                            : (theme === 'dark' ? 'bg-black/30' : 'bg-slate-50')
                        } ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'} rounded border border-inherit text-[9px] font-mono whitespace-pre-wrap leading-relaxed shadow-inner italic custom-scrollbar-mini transition-all`}>
                          {expandedPrompt.lab ? (() => {
                              const addon = contextType === 'simulation' ? prompts.simulation : contextType === 'adaptive' ? prompts.adaptive : prompts.deep_learning;
                              return `${prompts.base}\n\n${addon}\n\nCONTEXT_OBJECT: ${customContext}\n\n${prompts.guardrails}`;
                            })() : (prompts as any)[pinnedPromptKey]}
                        </div>
                      </div>
                    )}
                  </div>
                ) : editorTab === "prompts" ? (
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="flex items-center justify-between">
                       <button 
                          onClick={fetchPrompts}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
                       >
                         <RefreshCcw className="w-3 h-3" /> Reset Defaults
                       </button>
                       <button 
                          onClick={() => runTests()}
                          disabled={isRunning}
                          className={`
                            px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-lg
                            ${isRunning 
                              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none" 
                              : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/10"
                            }
                          `}
                        >
                          {isRunning ? "Running..." : "Run with Overrides"}
                        </button>
                    </div>

                    {prompts && (
                      <div className="space-y-6">
                        {[
                          { key: 'base', label: 'Layer 1 — Base Prompt' },
                          { key: 'simulation', label: 'Layer 2 — Simulation Add-on' },
                          { key: 'adaptive', label: 'Layer 2 — Adaptive Add-on' },
                          { key: 'deep_learning', label: 'Layer 2 — Deep Learning' },
                          { key: 'guardrails', label: 'Layer 4 — Guardrails' }
                        ].map((layer) => (
                          <div key={layer.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase tracking-widest`}>{layer.label}</label>
                              <button 
                                onClick={() => setPinnedPromptKey(pinnedPromptKey === layer.key ? null : layer.key)}
                                className={`p-1 rounded transition-all ${
                                  pinnedPromptKey === layer.key 
                                    ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600') 
                                    : (theme === 'dark' ? 'text-zinc-700 hover:text-zinc-500' : 'text-slate-300 hover:text-slate-500')
                                }`}
                                title={pinnedPromptKey === layer.key ? "Unpin from Context Tab" : "Pin to Context Tab"}
                              >
                                <Pin className={`w-3 h-3 ${pinnedPromptKey === layer.key ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                            <textarea 
                              value={(prompts as any)[layer.key]}
                              onChange={(e) => setPrompts({ ...prompts, [layer.key]: e.target.value })}
                              spellCheck={false}
                              rows={8}
                              className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 focus:border-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-slate-400'} border rounded p-3 font-mono text-[9px] focus:outline-none resize-y transition-colors`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {!prompts && <div className="text-[10px] text-zinc-600 animate-pulse uppercase font-black text-center mt-20">Initializing System Buffers...</div>}
                  </div>
                ) : (
                  <div className="flex-1 p-6 space-y-6">
                    <div className="space-y-4">
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>User Supplied Keys</h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase`}>Anthropic API Key</label>
                          <input 
                            type="password"
                            value={anthropicKey}
                            placeholder="sk-ant-..."
                            onChange={(e) => saveKeys(e.target.value, openaiKey)}
                            className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 focus:border-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'} border rounded p-2 text-[10px] focus:outline-none`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-[9px] font-bold ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} uppercase`}>OpenAI API Key</label>
                          <input 
                            type="password"
                            value={openaiKey}
                            placeholder="sk-..."
                            onChange={(e) => saveKeys(anthropicKey, e.target.value)}
                            className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 focus:border-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'} border rounded p-2 text-[10px] focus:outline-none`}
                          />
                        </div>
                      </div>
                      <p className={`text-[9px] leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'} italic`}>
                        Keys are stored in your browser's local storage and passed to the simulation backend to override system defaults.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="w-full space-y-6">
                {/* Quick Stats Dashboard */}
                {results && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border overflow-hidden ${
                      theme === 'dark' 
                        ? 'bg-zinc-900/50 border-zinc-800' 
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Progress bar */}
                    <div className={`h-1.5 w-full flex ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.total > 0 ? (stats.passed / stats.total) * 100 : 0}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${stats.passed === stats.total ? 'bg-green-500' : 'bg-indigo-500'}`}
                      />
                      {stats.failed > 0 && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.failed / stats.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          className="h-full bg-red-500"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Total Units</div>
                        <div className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Pass Rate</div>
                        <div className="flex items-end gap-2">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-xl font-black ${stats.passed === stats.total ? 'text-green-500' : 'text-indigo-500'}`}
                          >
                            {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%
                          </motion.div>
                          <div className="text-[10px] text-zinc-500 mb-1">({stats.passed}/{stats.total})</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Total Cost</div>
                        <div className="text-xl font-black text-amber-500">${stats.totalCost.toFixed(4)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Avg Latency</div>
                        <div className={`text-xl font-black ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {metadata?.duration ? `${Math.round(metadata.duration / stats.total)}ms` : "---"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Loading skeletons */}
                {isRunning && !results && (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`border rounded overflow-hidden flex animate-pulse ${
                          theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-1 flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-700' : 'bg-slate-200'}`} />
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                            <div className="space-y-2">
                              <div className={`h-2.5 w-16 rounded ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                              <div className={`h-3.5 w-48 rounded ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                            </div>
                          </div>
                          <div className={`h-5 w-24 rounded ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!results && !error && !isRunning && !showFreeTest && (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200 shadow-sm'}`}>
                      <Activity className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-500' : 'text-indigo-600'}`} />
                    </div>
                    <h3 className={`font-bold uppercase tracking-widest text-xs mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>Ready to Benchmark</h3>
                    <p className={`text-[11px] max-w-sm mx-auto leading-relaxed mb-8 ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>
                      Select a test profile below or run all tests to begin diagnostics.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {[
                        { label: 'Simulation', filter: 'simulation', color: 'indigo' },
                        { label: 'Adaptive', filter: 'adaptive', color: 'purple' },
                        { label: 'Deep Learning', filter: 'deep_learning', color: 'amber' },
                      ].map((item) => (
                        <button
                          key={item.filter}
                          onClick={() => runTests(item.filter)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${
                            theme === 'dark'
                              ? `bg-${item.color}-500/5 border-${item.color}-500/20 text-${item.color}-400 hover:bg-${item.color}-500/10 hover:border-${item.color}-500/40`
                              : `bg-${item.color}-50 border-${item.color}-200 text-${item.color}-600 hover:bg-${item.color}-100`
                          }`}
                        >
                          <Play className="w-3 h-3" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => runTests()}
                      className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Run All Tests
                    </button>
                  </div>
                )}

                {showFreeTest && (
                  <div className="w-full space-y-6">
                    {freeTestRunning && !freeTestMainResult && (
                      <div className="h-[40vh] flex flex-col items-center justify-center">
                        <RefreshCcw className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-purple-500' : 'text-purple-600'} mb-4`} />
                        <div className={`text-[11px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                          Running...
                        </div>
                      </div>
                    )}

                    {!freeTestMainResult && !freeTestRunning && !freeTestError && (
                      <div className="h-[60vh] flex flex-col items-start justify-center">
                        <h3 className={`font-bold uppercase tracking-widest text-xs mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>Prompt Test Mode</h3>
                        <p className={`text-[11px] max-w-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>
                          Enter a system prompt and optional context in the left panel, then click Execute to see the model response here.
                        </p>
                      </div>
                    )}

                    {freeTestError && !freeTestMainResult && (
                      <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-3 text-red-500 mb-4 font-bold text-xs">
                          <AlertCircle className="w-4 h-4" /> PROMPT_TEST_ERROR
                        </div>
                        <pre className={`text-xs whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{freeTestError}</pre>
                      </div>
                    )}

                    {freeTestMainResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Stats bar */}
                        <div className={`rounded-xl border overflow-hidden ${
                          theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <div className={`h-1.5 w-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                            <div className="h-full bg-purple-500 w-full" />
                          </div>
                          <div className="grid grid-cols-4 gap-4 p-4">
                            <div className="space-y-1">
                              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Model</div>
                              <div className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} truncate`}>{freeTestMainResult.model}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Latency</div>
                              <div className={`text-xl font-black ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{freeTestMainResult.duration}ms</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Tokens</div>
                              <div className="text-xl font-black text-purple-500">{freeTestMainResult.usage.total_tokens}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Cost</div>
                              <div className="text-xl font-black text-amber-500">${freeTestMainResult.usage.cost.toFixed(5)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Response */}
                        <div className={`rounded-xl border overflow-hidden ${
                          theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <div className={`px-6 py-3 border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'} flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setFreeTestViewTab("output")}
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
                                  freeTestViewTab === "output"
                                    ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                                    : (theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                }`}
                              >
                                Output
                              </button>
                              <button
                                onClick={() => setFreeTestViewTab("prompt")}
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
                                  freeTestViewTab === "prompt"
                                    ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                                    : (theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                }`}
                              >
                                Prompt
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              {freeTestViewTab === "prompt" && (
                                <button 
                                  onClick={() => setFreeTestPromptExpanded(!freeTestPromptExpanded)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-black uppercase transition-all ${
                                    freeTestPromptExpanded
                                      ? (theme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-100 border-indigo-200 text-indigo-700')
                                      : (theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700')
                                  }`}
                                >
                                  {freeTestPromptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {freeTestPromptExpanded ? 'Collapse' : 'Expand'}
                                </button>
                              )}
                              <button 
                                onClick={() => setMaximizedResult('prompt-test')}
                                className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}
                                title="Full screen"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  const content = freeTestViewTab === "prompt" 
                                    ? `System Prompt:\n${freeTestPrompt}${freeTestContext ? `\n\nUser Context:\n${freeTestContext}` : ''}`
                                    : freeTestMainResult.output;
                                  navigator.clipboard.writeText(content);
                                  addLog(`Prompt test ${freeTestViewTab} copied.`);
                                }}
                                className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}
                                title={freeTestViewTab === "prompt" ? "Copy prompt" : "Copy output"}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className={`p-6 ${theme === 'dark' ? 'bg-[#0a0a0b]' : 'bg-slate-50'} min-h-[300px] max-h-[60vh] overflow-y-auto custom-scrollbar-mini`}>
                            {freeTestViewTab === "output" ? (
                              <div 
                                className={`font-serif text-[13px] leading-[1.8] ${
                                  theme === 'dark' ? 'text-zinc-300' : 'text-slate-800'
                                } ${/[א-ת]/.test(freeTestMainResult.output) ? 'rtl text-right space-y-4 pr-1' : 'space-y-4'}`}
                                dir={/[א-ת]/.test(freeTestMainResult.output) ? 'rtl' : 'ltr'}
                              >
                                {freeTestMainResult.output.split('\n').map((line, idx) => line.trim() ? (
                                  <p key={idx} className="whitespace-pre-wrap">{line}</p>
                                ) : <br key={idx} />)}
                              </div>
                            ) : (
                              <div className="space-y-4 font-mono text-[10px]">
                                <div className="space-y-2">
                                  <div className="text-indigo-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                    <div className="w-4 h-[1px] bg-indigo-500/30" /> System Prompt
                                  </div>
                                  <div className={`${theme === 'dark' ? 'text-zinc-400 bg-black/20 border-zinc-800' : 'text-slate-600 bg-white border-slate-200'} p-4 rounded border whitespace-pre-wrap leading-relaxed ${!freeTestPromptExpanded ? 'max-h-[200px] overflow-hidden relative' : ''}`}>
                                    {freeTestPrompt}
                                    {!freeTestPromptExpanded && freeTestPrompt.length > 300 && (
                                      <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0a0a0b]' : 'from-slate-50'} to-transparent`} />
                                    )}
                                  </div>
                                </div>
                                {freeTestContext && (
                                  <div className="space-y-2">
                                    <div className="text-emerald-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                      <div className="w-4 h-[1px] bg-emerald-500/30" /> User Context
                                    </div>
                                    <div className={`${theme === 'dark' ? 'text-emerald-400/80 bg-emerald-500/5 border-emerald-500/10' : 'text-emerald-700 bg-emerald-50 border-emerald-200'} p-4 rounded border whitespace-pre-wrap leading-relaxed ${!freeTestPromptExpanded ? 'max-h-[200px] overflow-hidden relative' : ''}`}>
                                      {freeTestContext}
                                      {!freeTestPromptExpanded && freeTestContext.length > 300 && (
                                        <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0a0a0b]' : 'from-slate-50'} to-transparent`} />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded mb-8 font-mono">
                <div className="flex items-center gap-3 text-red-500 mb-4 font-bold text-xs">
                  <AlertCircle className="w-4 h-4" /> ERROR_STATE_TRIGGERED
                </div>
                <pre className="text-xs text-red-400 whitespace-pre-wrap leading-relaxed">{error}</pre>
              </div>
            )}

            {results && (
              <div className="grid grid-cols-1 gap-4">
                {results.map((test, index) => (
                  <motion.div
                    key={test.fixture_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      border rounded overflow-hidden transition-colors flex
                      ${test.passed 
                        ? (theme === 'dark' ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700" : "border-slate-200 bg-white shadow-sm hover:border-slate-300") 
                        : (theme === 'dark' ? "border-red-900/30 bg-red-950/10 hover:border-red-800/40" : "border-red-200 bg-red-50/50 shadow-sm hover:border-red-300")
                      }
                    `}
                  >
                    {/* Colored left border indicator */}
                    <div className={`w-1 flex-shrink-0 ${test.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0 flex flex-col">
                    <button
                      onClick={() => setExpandedId(expandedId === test.fixture_id ? null : test.fixture_id)}
                      className="w-full text-left p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={test.passed ? "text-green-500" : "text-red-500"}>
                          {test.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="font-mono">
                          <span className={`text-[10px] ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} block leading-none mb-1`}>UNIT: {test.fixture_id}</span>
                          <span className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'} tracking-tight`}>{test.label}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 font-mono">
                        <div className={`text-[10px] px-2 py-0.5 rounded border ${theme === 'dark' ? 'border-zinc-800 bg-black/40 text-zinc-500' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                          {test.pass_count}/{test.pass_count + test.fail_count} SUBTESTS
                        </div>
                        {expandedId === test.fixture_id ? <ChevronDown className="w-4 h-4 text-zinc-600" /> : <ChevronRight className="w-4 h-4 text-zinc-600" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedId === test.fixture_id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className={`border-t ${theme === 'dark' ? 'border-zinc-800 bg-black/40' : 'border-slate-200 bg-slate-50/80'} overflow-hidden`}
                        >
                          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono">
                            {/* Verifier Log */}
                            <div className="space-y-4">
                              <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Rule Verification Matrix
                              </h5>
                              <div className="space-y-2">
                                {test.rule_results.map((rule, i) => (
                                  <div key={i} className={`flex items-start gap-4 p-3 ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'} border rounded text-[11px] leading-snug`}>
                                    {rule.passed ? (
                                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                      <span className={rule.passed ? (theme === 'dark' ? "text-zinc-200" : "text-slate-700") : (theme === 'dark' ? "text-red-300" : "text-red-600")}>{rule.rule}</span>
                                      {rule.detail && <div className={`text-[9px] ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'} mt-1`}>{rule.detail}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Raw Data Log */}
                            <div className="space-y-4">
                              <div className={`p-4 rounded-xl border ${
                                theme === 'dark' 
                                  ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.3)]' 
                                  : 'bg-white border-slate-200 shadow-sm'
                              }`}>
                                <div className="flex flex-wrap items-start justify-between mb-4 pb-4 border-b border-inherit gap-y-4">
                                  <div className="flex items-center gap-3 min-w-fit">
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                                      theme === 'dark' ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                                    }`}>
                                      <Code2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <button 
                                          onClick={() => setViewingPrompt(prev => ({ ...prev, [test.fixture_id]: false }))}
                                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
                                            !viewingPrompt[test.fixture_id]
                                              ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                                              : (theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                          }`}
                                        >
                                          Output
                                        </button>
                                        <button 
                                          onClick={() => setViewingPrompt(prev => ({ ...prev, [test.fixture_id]: true }))}
                                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
                                            viewingPrompt[test.fixture_id]
                                              ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                                              : (theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                          }`}
                                        >
                                          Prompt
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {test.output && /[א-ת]/.test(test.output) && (
                                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold uppercase tracking-tighter ring-1 ring-inset ring-indigo-500/20 whitespace-nowrap">
                                            RTL Engine Active
                                          </span>
                                        )}
                                        {test.usage && (
                                          <div className="text-[9px] text-zinc-500 font-mono tracking-tight flex items-center gap-2 whitespace-nowrap">
                                            <span className="opacity-50">Tokens:</span> 
                                            <span className={theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}>{test.usage.total_tokens}</span>
                                            <span className="mx-1 opacity-20">|</span>
                                            <span className="text-indigo-400 font-bold">${test.usage.cost.toFixed(5)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <div className={`flex items-center border rounded-lg overflow-hidden h-8 ${
                                      theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-200 bg-slate-50'
                                    }`}>
                                      <button 
                                        onClick={() => setMaximizedResult(test.fixture_id)}
                                        className={`p-2 transition-colors ${
                                          theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-white text-slate-400 hover:text-slate-700'
                                        }`}
                                        title="Full screen"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                      <div className={`w-[1px] h-4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                                      {!test.passed && (
                                        <>
                                          <button 
                                            onClick={() => copyFailureDiagnosis(test)}
                                            className={`p-2 transition-colors ${
                                              theme === 'dark' ? 'hover:bg-red-500/10 text-red-500 hover:text-red-400' : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                            } group relative`}
                                            title="Copy diagnosis"
                                          >
                                            <Terminal className="w-3.5 h-3.5" />
                                            <span className={`absolute bottom-full right-0 mb-2 hidden group-hover:block ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'} border text-[9px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-2xl`}>
                                              Copy Diagnosis
                                            </span>
                                          </button>
                                          <div className={`w-[1px] h-4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                                        </>
                                      )}
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(test.output);
                                          setCopiedId(test.fixture_id);
                                          addLog(`Copied result for ${test.fixture_id}`);
                                          setTimeout(() => setCopiedId(null), 2000);
                                        }}
                                        className={`p-2 transition-colors min-w-[36px] flex items-center justify-center ${
                                          theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'hover:bg-white text-slate-400 hover:text-slate-700'
                                        }`}
                                        title="Copy response"
                                      >
                                        {copiedId === test.fixture_id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className={`${theme === 'dark' ? 'bg-[#0a0a0b]' : 'bg-slate-50'} p-6 rounded-xl overflow-y-auto text-[13px] leading-[1.7] shadow-inner min-h-[200px] max-h-[400px] custom-scrollbar-mini relative`}>
                                  <div className="absolute top-4 left-4 opacity-[0.03] pointer-events-none">
                                    <Command className="w-32 h-32" />
                                  </div>
                                  
                                  {viewingPrompt[test.fixture_id] ? (
                                    (() => {
                                      const getPromptPack = () => {
                                        const ctxType = test.context?.context_type || '';
                                        if (test.fixture_id.startsWith('SIM') || ctxType === 'simulation_report') 
                                          return { key: 'simulation', name: 'Simulation', content: prompts?.simulation };
                                        if (test.fixture_id.startsWith('ADP') || ctxType === 'adaptive_report') 
                                          return { key: 'adaptive', name: 'Adaptive', content: prompts?.adaptive };
                                        if (test.fixture_id.startsWith('DL') || ctxType === 'deep_learning') 
                                          return { key: 'deep_learning', name: 'Deep Learning', content: prompts?.deep_learning };
                                        return { key: 'unknown', name: 'Default/Unknown', content: 'NO_ADDON_MATCHED' };
                                      };
                                      const pack = getPromptPack();

                                      return (
                                        <div className="space-y-4 font-mono text-[10px]">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="text-zinc-600 font-bold uppercase tracking-widest text-[9px]">── Prompt Layers ──</div>
                                            <button 
                                              onClick={() => setExpandedPrompt(prev => ({ ...prev, [test.fixture_id]: !prev[test.fixture_id] }))}
                                              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                                                expandedPrompt[test.fixture_id]
                                                  ? (theme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-100 border-indigo-200 text-indigo-700')
                                                  : (theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700')
                                              }`}
                                            >
                                              {expandedPrompt[test.fixture_id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                              {expandedPrompt[test.fixture_id] ? 'COLLAPSE FULL PROMPT' : 'EXTEND TO FULL VIEW'}
                                            </button>
                                            <button 
                                              onClick={() => {
                                                const fullPrompt = `${prompts?.base || ''}\n\n${pack.content || ''}\n\nCONTEXT_OBJECT: ${JSON.stringify(test.context, null, 2)}\n\n${prompts?.guardrails || ''}`;
                                                navigator.clipboard.writeText(fullPrompt);
                                                setCopiedId(`prompt-${test.fixture_id}`);
                                                setTimeout(() => setCopiedId(null), 2000);
                                                addLog(`Copied full prompt for ${test.fixture_id}`);
                                              }}
                                              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                                                copiedId === `prompt-${test.fixture_id}`
                                                  ? (theme === 'dark' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 border-green-200 text-green-700')
                                                  : (theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700')
                                              }`}
                                              title="Copy prompt"
                                            >
                                              <Copy className="w-3 h-3" />
                                              {copiedId === `prompt-${test.fixture_id}` ? 'COPIED' : 'COPY PROMPT'}
                                            </button>
                                          </div>

                                          <AnimatePresence mode="wait">
                                            {expandedPrompt[test.fixture_id] ? (
                                              <motion.div 
                                                key="expanded"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={`${theme === 'dark' ? 'bg-indigo-500/5 text-zinc-300' : 'bg-indigo-50 text-slate-700'} p-4 rounded border border-indigo-500/20 whitespace-pre-wrap leading-relaxed italic`}
                                              >
                                                {`${prompts?.base || ''}\n\n${pack.content || ''}\n\nCONTEXT_OBJECT: ${JSON.stringify(test.context, null, 2)}\n\n${prompts?.guardrails || ''}`}
                                              </motion.div>
                                            ) : (
                                              <motion.div 
                                                key="stratified"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="space-y-4"
                                              >
                                                <div className="space-y-2">
                                                  <div className="text-indigo-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                                    <div className="w-4 h-[1px] bg-indigo-500/30" /> Layer 1 — Base System
                                                  </div>
                                                  <div className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} bg-black/20 p-3 rounded border border-inherit`}>
                                                    {prompts?.base || (prompts === null ? "Loading prompts..." : "NO_SYSTEM_CONTEXT_DEFINED")}
                                                  </div>
                                                </div>

                                                <div className="space-y-2">
                                                  <div className="text-pink-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                                    <div className="w-4 h-[1px] bg-pink-500/30" /> Layer 2 — Add-on ({pack.name})
                                                  </div>
                                                  <div className={`${theme === 'dark' ? 'text-pink-400/70' : 'text-pink-700'} bg-pink-500/5 p-3 rounded border border-pink-500/10`}>
                                                    {pack.content || "NO_ADDON_CONTENT_FOUND"}
                                                  </div>
                                                </div>

                                                <div className="space-y-2">
                                                  <div className="text-emerald-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                                    <div className="w-4 h-[1px] bg-emerald-500/30" /> Layer 3 — Data Context
                                                  </div>
                                                  <div className={`${theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-700/80'} bg-emerald-500/5 p-3 rounded border border-emerald-500/10`}>
                                                    {JSON.stringify(test.context, null, 2)}
                                                  </div>
                                                </div>

                                                <div className="space-y-2">
                                                  <div className="text-amber-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                                                    <div className="w-4 h-[1px] bg-amber-500/30" /> Layer 4 — Guardrails
                                                  </div>
                                                  <div className={`${theme === 'dark' ? 'text-amber-500/60' : 'text-amber-800/60'} bg-amber-500/5 p-3 rounded border border-amber-500/10`}>
                                                    {prompts?.guardrails || (prompts === null ? "Loading prompts..." : "NO_GUARDRAILS_DEFINED")}
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <>
                                      {test.output ? (
                                        <div 
                                          className={`font-serif ${
                                            theme === 'dark' ? 'text-zinc-300 selection:bg-indigo-500/30' : 'text-slate-800 selection:bg-indigo-200'
                                          } ${/[א-ת]/.test(test.output) ? 'rtl space-y-4 pr-1 pl-0 text-right' : 'space-y-4'}`}
                                          dir={/[א-ת]/.test(test.output) ? 'rtl' : 'ltr'}
                                        >
                                          {test.output.split('\n').map((line, idx) => line.trim() && (
                                            <p key={idx} className="whitespace-pre-wrap">{line}</p>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500/40 italic">
                                          <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                          <span>Waiting for model response stream...</span>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {test.error && (
                                    <div className={`mt-6 p-4 ${theme === 'dark' ? 'bg-red-900/10 border-red-900/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'} border rounded-xl flex items-start gap-3`}>
                                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <p className="font-mono text-xs leading-relaxed">{test.error}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </main>
        </div>
      </div>
    </div>

      <AnimatePresence>
        {maximizedPromptContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMaximizedPromptContent(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-900 border-slate-700'} border rounded-xl w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden font-mono`}
            >
              <div className={`border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-800 bg-slate-800/50'} p-6 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <Maximize2 className="text-indigo-400 w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">{maximizedPromptContent.title}</h3>
                    <div className="text-[10px] text-zinc-500">PROMPT_SYSTEM_STREAM</div>
                  </div>
                </div>
                <button 
                  onClick={() => setMaximizedPromptContent(null)}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-zinc-500 hover:text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className={`flex-1 overflow-y-auto p-8 lg:p-20 ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-950'} custom-scrollbar`}>
                <div className="max-w-3xl mx-auto">
                  <div className={`${theme === 'dark' ? 'text-zinc-100' : 'text-indigo-100'} text-xs lg:text-sm leading-relaxed font-mono selection:bg-indigo-500/40 whitespace-pre-wrap tracking-tight`}>
                    {maximizedPromptContent.content}
                  </div>
                </div>
              </div>
              <div className={`border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20 text-zinc-600' : 'border-slate-800 bg-slate-900 text-slate-500'} p-6 flex justify-end`}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(maximizedPromptContent.content);
                    addLog("Prompt copied from full view.");
                  }}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                    theme === 'dark'
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Copy className="w-4 h-4" /> Copy Content
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {maximizedResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMaximizedResult(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-900 border-slate-700'} border rounded-xl w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden font-mono`}
            >
              <div className={`border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-800 bg-slate-800/50'} p-6 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <Maximize2 className="text-indigo-400 w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Full Response</h3>
                    <div className="text-[10px] text-zinc-500">ID: {maximizedResult}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setMaximizedResult(null)}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-zinc-500 hover:text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className={`flex-1 overflow-y-auto p-8 lg:p-20 ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-950'} custom-scrollbar`}>
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className={`${theme === 'dark' ? 'text-zinc-100' : 'text-indigo-100'} text-lg lg:text-2xl leading-relaxed font-sans selection:bg-indigo-500/40 whitespace-pre-wrap tracking-tight`}>
                    {maximizedResult === 'prompt-test' ? freeTestMainResult?.output : results?.find(r => r.fixture_id === maximizedResult)?.output}
                  </div>
                  {maximizedResult !== 'prompt-test' && results?.find(r => r.fixture_id === maximizedResult)?.error && (
                    <div className={`p-8 rounded-xl text-sm font-mono ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-900 border border-red-800 text-red-200'}`}>
                      {results.find(r => r.fixture_id === maximizedResult)?.error}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuidelines && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-lg ${theme === 'dark' ? 'bg-zinc-950 border-zinc-900 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} border rounded-lg overflow-hidden flex flex-col max-h-[80vh]`}
            >
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-zinc-900 bg-zinc-900/30' : 'border-slate-100 bg-slate-50'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Guide</span>
                  </div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-800'}`}>
                    {guideLang === 'en' ? 'Engineering Guidelines' : 'הנחיות הנדסיות'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-200 border-slate-300'} rounded p-0.5 border`}>
                    <button 
                      onClick={() => setGuideLang('en')}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${guideLang === 'en' ? (theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-white text-slate-900') : 'text-zinc-600'}`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => setGuideLang('he')}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${guideLang === 'he' ? (theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-white text-slate-900') : 'text-zinc-600'}`}
                    >
                      עב
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowGuidelines(false)}
                    className={`p-1 hover:bg-zinc-900 rounded transition-colors ${theme === 'dark' ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`p-6 overflow-y-auto custom-scrollbar space-y-6 ${guideLang === 'he' ? 'rtl' : 'ltr'}`} dir={guideLang === 'he' ? 'rtl' : 'ltr'}>
                <div className="space-y-4">
                  <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>
                    {guideLang === 'en' ? 'Welcome to the Lab' : 'ברוכים הבאים למעבדה'}
                  </h4>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {guideLang === 'en' 
                      ? 'The Engineering Lab is designed for stress-testing the coaching logic using custom JSON payloads and system prompt overrides.'
                      : 'מעבדת ההנדסה תוכננה לביצוע בדיקות עומס ללוגיקת האימון באמצעות מטעני JSON מותאמים אישית ועקיפת הנחיות המערכת.'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
                      {guideLang === 'en' ? 'How to use' : 'איך משתמשים'}
                    </h5>
                    <ul className="space-y-2">
                      {[
                        guideLang === 'en' 
                          ? 'Supply API keys in the API Keys tab to use your own quotas and bypass system defaults.'
                          : 'הזינו מפתחות API בלשונית ה-API Keys כדי להשתמש במכסות שלכם ולעקוף את ברירות המחדל של המערכת.',
                        guideLang === 'en'
                          ? 'Use Context JSON to simulate different learner scenarios, missing data, or adversarial inputs.'
                          : 'השתמשו ב-Context JSON כדי לסמלץ תרחישי למידה שונים, נתונים חסרים או קלטים עוינים.',
                        guideLang === 'en'
                          ? 'Modify System Prompts to test logic changes in real-time. Changes are applied only to Lab runs.'
                          : 'שנו את ה-System Prompts כדי לבחון שינויי לוגיקה בזמן אמת. השינויים חלים רק על הרצות מעבדה.',
                        guideLang === 'en'
                          ? 'Analysis: Use the "Copy Diagnosis" tool on failed tests to get a ready-to-use prompt for debugging.'
                          : 'ניתוח: השתמשו בכלי ה-"Copy Diagnosis" בבדיקות שנכשלו כדי לקבל הנחיה מוכנה לדיבג.'
                      ].map((step, i) => (
                        <li key={i} className={`flex gap-3 text-[11px] ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                          <span className="text-emerald-500 font-mono shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-3 rounded flex gap-3 ${theme === 'dark' ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50 border border-indigo-100'}`}>
                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className={`text-[10px] italic leading-normal ${theme === 'dark' ? 'text-indigo-300/70' : 'text-indigo-600'}`}>
                      {guideLang === 'en'
                        ? 'Note: All Lab runs are session-isolated. Refreshing the browser will restore default system prompts but API keys are persisted in localStorage.'
                        : 'הערה: כל הרצות המעבדה מבודדות לסשן הנוכחי. רענון הדפדפן ישחזר את הנחיות המערכת המקוריות, אך מפתחות ה-API נשמרים בדפדפן.'
                      }
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-purple-500/80">
                      {guideLang === 'en' ? 'Prompt Test Mode' : 'מצב בדיקת פרומפט'}
                    </h5>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {guideLang === 'en'
                        ? 'The Prompt Test tab lets you quickly test any system prompt against any model without fixtures or rules. Perfect for rapid iteration on prompt wording.'
                        : 'לשונית בדיקת הפרומפט מאפשרת לבדוק כל הנחיית מערכת מול כל מודל ללא תבניות או כללים. מושלם לאיטרציה מהירה על ניסוח הנחיות.'
                      }
                    </p>
                    <ul className="space-y-2">
                      {[
                        guideLang === 'en'
                          ? 'Enter a system prompt (the instructions the model follows) in the left panel.'
                          : 'הזינו הנחיית מערכת (ההוראות שהמודל עוקב אחריהן) בפאנל השמאלי.',
                        guideLang === 'en'
                          ? 'Optionally add user context (simulates what the user sends to the model).'
                          : 'אופציונלית הוסיפו הקשר משתמש (מדמה את מה שהמשתמש שולח למודל).',
                        guideLang === 'en'
                          ? 'Select a model from the dropdown and click Execute. Results appear in the main area.'
                          : 'בחרו מודל מהתפריט ולחצו Execute. התוצאות מופיעות באזור הראשי.',
                        guideLang === 'en'
                          ? 'Toggle between Output and Prompt tabs in the result to review what was sent vs received.'
                          : 'עברו בין לשוניות Output ו-Prompt בתוצאה כדי לבדוק מה נשלח מול מה שהתקבל.'
                      ].map((step, i) => (
                        <li key={i} className={`flex gap-3 text-[11px] ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                          <span className="text-purple-500 font-mono shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-900 bg-zinc-900/10' : 'border-slate-100 bg-slate-50'} flex justify-end`}>
                <button 
                  onClick={() => setShowGuidelines(false)}
                  className={`px-4 py-1.5 border rounded text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {guideLang === 'en' ? 'Acknowledge' : 'הבנתי'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .ltr { text-align: left; }
        .rtl { text-align: right; direction: rtl; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#e2e8f0'}; border-radius: 10px; }
        .custom-scrollbar-mini::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#3f3f46' : '#cbd5e1'}; }
      `}</style>
      </div>
    </>
  );
}

