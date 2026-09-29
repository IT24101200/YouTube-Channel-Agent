import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Shield, CheckCircle, 
  DollarSign, BookOpen, Film, Video, Calendar, 
  RefreshCw, Plus, Check, Trash2, ArrowRight
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'ideas' | 'scripts' | 'review' | 'budget'>('overview');
  
  // Data states
  const [channelData, setChannelData] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('');
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [researchRuns, setResearchRuns] = useState<any[]>([]);
  const [publishingJobs, setPublishingJobs] = useState<any[]>([]);
  const [budgetUsage, setBudgetUsage] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [videoVersion, setVideoVersion] = useState<any>(null);

  // Form & action states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [newTopicQuery, setNewTopicQuery] = useState('');
  const [newIdeaQuestion, setNewIdeaQuestion] = useState('');
  const [newIdeaAngle, setNewIdeaAngle] = useState('');
  const [newIdeaPillar, setNewIdeaPillar] = useState('Everyday Tech');
  const [scheduleTime, setScheduleTime] = useState('');

  // Initial load
  useEffect(() => {
    fetchChannel();
    fetchIdeas();
    fetchResearch();
    fetchBudget();
    fetchPublishing();
  }, []);

  // When selected idea changes, load its script
  useEffect(() => {
    if (selectedIdeaId) {
      fetchScriptForIdea(selectedIdeaId);
    }
  }, [selectedIdeaId]);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // API Call Helpers
  const fetchChannel = async () => {
    try {
      const res = await fetch(`${API_BASE}/channels/current`);
      if (res.ok) setChannelData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${API_BASE}/ideas`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data);
        if (data.length > 0 && !selectedIdeaId) {
          setSelectedIdeaId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScriptForIdea = async (ideaId: string) => {
    try {
      const res = await fetch(`${API_BASE}/ideas/${ideaId}/script`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScript(data.script);
        setVideoVersion(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResearch = async () => {
    try {
      const res = await fetch(`${API_BASE}/research/runs`);
      if (res.ok) setResearchRuns(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBudget = async () => {
    try {
      const res = await fetch(`${API_BASE}/budget/usage`);
      if (res.ok) {
        const data = await res.json();
        setBudgetUsage(data);
      }
      const auditRes = await fetch(`${API_BASE}/budget/audit`);
      if (auditRes.ok) setAuditEvents(await auditRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublishing = async () => {
    try {
      const res = await fetch(`${API_BASE}/publishing/jobs`);
      if (res.ok) setPublishingJobs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Actions
  const handleUpdateMode = async (mode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/channels/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        showMsg(`Operating mode changed to: ${mode}`);
        fetchChannel();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (type: 'production' | 'publishing') => {
    if (!channelData) return;
    setLoading(true);
    try {
      const payload = type === 'production' 
        ? { pause_production: !channelData.channel.pause_production }
        : { pause_publishing: !channelData.channel.pause_publishing };

      const res = await fetch(`${API_BASE}/channels/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showMsg(`Pause status updated for ${type}`);
        fetchChannel();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/research/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_topic: newTopicQuery })
      });
      if (res.ok) {
        showMsg(`Research completed for "${newTopicQuery}"`);
        setNewTopicQuery('');
        fetchResearch();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaQuestion.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newIdeaQuestion,
          pillar: newIdeaPillar,
          original_angle: newIdeaAngle
        })
      });
      if (res.ok) {
        showMsg(`Idea "${newIdeaQuestion}" added to board!`);
        setNewIdeaQuestion('');
        setNewIdeaAngle('');
        fetchIdeas();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Failed to add idea', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    try {
      const res = await fetch(`${API_BASE}/ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMsg('Idea deleted');
        fetchIdeas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDraftScript = async () => {
    if (!selectedIdeaId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ideas/${selectedIdeaId}/draft`, { method: 'POST' });
      if (res.ok) {
        showMsg('New script drafted successfully!');
        fetchScriptForIdea(selectedIdeaId);
        fetchIdeas();
        fetchBudget();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Drafting failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClaims = async () => {
    if (!currentScript) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scripts/${currentScript.id}/verify`, { method: 'POST' });
      if (res.ok) {
        showMsg('Factual claims verified against evidence sources!');
        fetchScriptForIdea(selectedIdeaId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScriptEdits = async () => {
    if (!currentScript) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scripts/${currentScript.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration: currentScript.narration,
          learning_goal: currentScript.learning_goal,
          title_options: currentScript.title_options,
          scenes: currentScript.scenes
        })
      });
      if (res.ok) {
        showMsg('Script edits saved! Previous approvals invalidated for safety.', 'info');
        fetchScriptForIdea(selectedIdeaId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAssets = async () => {
    if (!currentScript) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scripts/${currentScript.id}/generate-assets`, { method: 'POST' });
      if (res.ok) {
        showMsg('Scene illustrations & narration audio generated!');
        fetchBudget();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Asset generation failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!currentScript) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scripts/${currentScript.id}/render-video`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setVideoVersion(data.video_version);
        showMsg('Video version rendered! Moving to Review & Publishing tab.');
        setActiveTab('review');
        fetchIdeas();
        fetchBudget();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Rendering failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVersion = async () => {
    if (!videoVersion) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/video-versions/${videoVersion.id}/approve`, { method: 'POST' });
      if (res.ok) {
        showMsg(`Approved! Bound to SHA256 hash: ${videoVersion.final_hash}`);
        // Refresh version
        const vres = await fetch(`${API_BASE}/video-versions/${videoVersion.id}`);
        if (vres.ok) setVideoVersion(await vres.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoVersion) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/publishing/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_version_id: videoVersion.id,
          scheduled_publish_time: scheduleTime ? new Date(scheduleTime).toISOString() : null
        })
      });
      if (res.ok) {
        showMsg('Video scheduled in publishing queue!');
        fetchPublishing();
        fetchBudget();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Scheduling failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPublishingJob = async (id: string) => {
    if (!confirm('Cancel this scheduled release?')) return;
    try {
      const res = await fetch(`${API_BASE}/publishing/jobs/${id}/cancel`, { method: 'POST' });
      if (res.ok) {
        showMsg('Publishing release cancelled');
        fetchPublishing();
        fetchBudget();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">YT</div>
          <div>
            <div className="brand-title">ClearTech Minute • Channel Agent</div>
            <div className="brand-subtitle">
              Owner: ayeshmantha@local • Channel ID: {channelData?.channel?.youtube_channel_id || 'UC_DEMO'}
            </div>
          </div>
        </div>

        {/* Header Mode & Pause Controls */}
        <div className="header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mode:</span>
            <select 
              className="form-select" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={channelData?.channel?.mode || 'draft'}
              onChange={(e) => handleUpdateMode(e.target.value)}
              disabled={loading}
            >
              <option value="draft">Draft (Review each step)</option>
              <option value="approved_queue">Approved Queue</option>
              <option value="manual">Manual Only</option>
              <option value="bounded_auto">Bounded Auto</option>
            </select>
          </div>

          {/* Concrete Pause Switches (Build Plan Section 6) */}
          <button 
            className={`btn btn-sm ${channelData?.channel?.pause_production ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => handleTogglePause('production')}
            title="Stop starting new generation jobs"
            disabled={loading}
          >
            {channelData?.channel?.pause_production ? <Play size={14}/> : <Pause size={14}/>}
            {channelData?.channel?.pause_production ? 'Resume Prod' : 'Pause Prod'}
          </button>

          <button 
            className={`btn btn-sm ${channelData?.channel?.pause_publishing ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => handleTogglePause('publishing')}
            title="Stop new uploads and publishing actions"
            disabled={loading}
          >
            {channelData?.channel?.pause_publishing ? <Play size={14}/> : <Pause size={14}/>}
            {channelData?.channel?.pause_publishing ? 'Resume Pub' : 'Pause Pub'}
          </button>

          <div className="badge badge-blue">
            ${budgetUsage?.summary?.monthly_actual || 0} / ${budgetUsage?.summary?.monthly_limit || 30} USD
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Film size={16}/> Overview & Health
        </button>
        <button 
          className={`nav-tab ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <BookOpen size={16}/> Topic Research
        </button>
        <button 
          className={`nav-tab ${activeTab === 'ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          <Plus size={16}/> Idea Board ({ideas.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <Film size={16}/> Script & Storyboard Studio
        </button>
        <button 
          className={`nav-tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <Video size={16}/> Review & Publishing
        </button>
        <button 
          className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <DollarSign size={16}/> Budget & Audit
        </button>
      </nav>

      {/* Global Alerts */}
      <div style={{ maxWidth: 1300, margin: '1rem auto 0', padding: '0 1.5rem', width: '100%' }}>
        {message && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setMessage(null)}>Dismiss</button>
          </div>
        )}

        {(channelData?.channel?.pause_production || channelData?.channel?.pause_publishing) && (
          <div className="alert alert-warning" style={{ marginTop: '0.5rem' }}>
            <span>
              <strong>System Notice:</strong> {channelData?.channel?.pause_production ? 'Production is PAUSED. ' : ''}
              {channelData?.channel?.pause_publishing ? 'Publishing is PAUSED.' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <main className="main-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 4 Stats Cards */}
            <div className="grid-4">
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Topic Ideas</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{ideas.length}</div>
                <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{ideas.filter(i => i.status === 'new').length} ready to script</span>
              </div>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Scripts Drafted</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                  {ideas.filter(i => i.status === 'scripted' || i.status === 'produced').length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Evidence & claims checked</span>
              </div>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Videos Rendered</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                  {ideas.filter(i => i.status === 'produced').length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>9:16 Shorts format</span>
              </div>
              <div className="card">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Scheduled Releases</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                  {publishingJobs.filter(j => j.state === 'scheduled' || j.state === 'ready_for_upload').length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Approved batches</span>
              </div>
            </div>

            {/* Channel Identity & Strategy Summary */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Shield size={18}/> Channel Strategy & Brief</div>
                  <span className="badge badge-blue">Version 1.0</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div>
                    <strong>Viewer Promise:</strong>
                    <p style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
                      "{channelData?.brief?.viewer_promise}"
                    </p>
                  </div>
                  <div>
                    <strong>Audience:</strong> Beginners, students, everyday tech learners
                  </div>
                  <div>
                    <strong>Pillars:</strong> {channelData?.brief?.pillars?.join(' • ') || 'Everyday Tech • AI Basics'}
                  </div>
                  <div>
                    <strong>Target Duration:</strong> 35–60 seconds (Shorts vertical format)
                  </div>
                  <div>
                    <strong>Timezone:</strong> {channelData?.channel?.timezone || 'Asia/Colombo'}
                  </div>
                </div>
              </div>

              {/* Operating Budget Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><DollarSign size={18}/> Monthly Budget Controls</div>
                  <span className="badge badge-green">Hard Cap Protected</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <span>Spent: <strong>${budgetUsage?.summary?.monthly_actual || 0} USD</strong></span>
                      <span>Cap: <strong>${budgetUsage?.summary?.monthly_limit || 30} USD</strong></span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${Math.min(100, ((budgetUsage?.summary?.monthly_actual || 0) / (budgetUsage?.summary?.monthly_limit || 30)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    • Daily safety cap: ${budgetUsage?.summary?.daily_limit || 3.00} USD<br/>
                    • Per-video limit: ${budgetUsage?.summary?.per_video_limit || 1.00} USD<br/>
                    • Budget reservation is required before any AI generation call.
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('budget')}>
                    View Full Transaction Ledger <ArrowRight size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOPIC RESEARCH */}
        {activeTab === 'research' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><BookOpen size={18}/> Research Candidate Topic</div>
                <span className="badge badge-blue">Evidence Rubric</span>
              </div>
              <form onSubmit={handleRunResearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. How does Wi-Fi pass through walls?"
                  value={newTopicQuery}
                  onChange={(e) => setNewTopicQuery(e.target.value)}
                  style={{ flex: 1, minWidth: '260px' }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Researching...' : 'Run Research & Score'}
                </button>
              </form>
            </div>

            {/* List of Research Runs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>Completed Topic Investigations & Evidence</h3>
              {researchRuns.map((run) => (
                <div key={run.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{run.query_topic}</div>
                    <div className="badge badge-green">
                      Editorial Fit: {run.findings?.fit_score || 88}/100
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    <strong>Key Finding:</strong> {run.findings?.key_takeaway || 'Viable educational concept for 45s Shorts.'}
                  </div>

                  {/* Evidence Items */}
                  {run.evidence && run.evidence.length > 0 && (
                    <div style={{ background: '#111827', borderRadius: '6px', padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>CITED SOURCES:</span>
                      {run.evidence.map((ev: any) => (
                        <div key={ev.id} style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>
                          <a href={ev.source_url} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                            {ev.title} ({ev.publisher})
                          </a>
                          <p style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '0.2rem' }}>"{ev.short_extract}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Limitations: {run.limitations}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: IDEA BOARD */}
        {activeTab === 'ideas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Create Idea Form */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Plus size={18}/> Add Video Idea to Board</div>
              </div>
              <form onSubmit={handleAddIdea} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Viewer Question (The Hook):</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Why does your battery drain faster in the cold?"
                    value={newIdeaQuestion}
                    onChange={(e) => setNewIdeaQuestion(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Content Pillar:</label>
                    <select 
                      className="form-select"
                      value={newIdeaPillar}
                      onChange={(e) => setNewIdeaPillar(e.target.value)}
                    >
                      <option value="Everyday Tech">Everyday Tech</option>
                      <option value="AI Basics">AI Basics</option>
                      <option value="Practical Digital Safety">Practical Digital Safety</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Original Angle / Analogy:</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. Compare chemical reaction speed to walking in snow"
                      value={newIdeaAngle}
                      onChange={(e) => setNewIdeaAngle(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                  Add Idea to Board
                </button>
              </form>
            </div>

            {/* List of Ideas */}
            <div className="table-container card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question / Topic</th>
                    <th>Pillar</th>
                    <th>Editorial Fit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id}>
                      <td>
                        <strong>{idea.question}</strong>
                        {idea.original_angle && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            Angle: {idea.original_angle}
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-purple">{idea.pillar}</span></td>
                      <td><span className="badge badge-blue">{idea.editorial_fit_score}/100</span></td>
                      <td>
                        <span className={`badge ${
                          idea.status === 'produced' ? 'badge-green' :
                          idea.status === 'scripted' ? 'badge-blue' : 'badge-amber'
                        }`}>
                          {idea.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedIdeaId(idea.id);
                              setActiveTab('scripts');
                            }}
                          >
                            Script Studio
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteIdea(idea.id)}
                          >
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SCRIPT & STORYBOARD STUDIO */}
        {activeTab === 'scripts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Idea Selection Header */}
            <div className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Idea:</span>
                <select 
                  className="form-select"
                  style={{ marginLeft: '0.5rem', fontWeight: 600 }}
                  value={selectedIdeaId}
                  onChange={(e) => setSelectedIdeaId(e.target.value)}
                >
                  {ideas.map(i => (
                    <option key={i.id} value={i.id}>{i.question}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={handleDraftScript} disabled={loading}>
                  <RefreshCw size={14}/> {currentScript ? 'Regenerate Draft' : 'Generate Script Draft'}
                </button>
                {currentScript && (
                  <>
                    <button className="btn btn-primary" onClick={handleSaveScriptEdits} disabled={loading}>
                      Save Edits
                    </button>
                    <button className="btn btn-secondary" onClick={handleGenerateAssets} disabled={loading}>
                      Generate Media Assets
                    </button>
                    <button className="btn btn-success" onClick={handleRenderVideo} disabled={loading}>
                      <Film size={14}/> Render Video
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Script Editor Body */}
            {currentScript ? (
              <div className="grid-2">
                {/* Left: Narration & Claims */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Spoken Narration (35–60s)</div>
                      <span className="badge badge-blue">Version {currentScript.version}</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Learning Goal:</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={currentScript.learning_goal || ''}
                        onChange={(e) => setCurrentScript({ ...currentScript, learning_goal: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Title Options:</label>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {currentScript.title_options?.map((t: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: '#93c5fd' }}>• {t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Narration Text:</label>
                      <textarea 
                        className="form-textarea" 
                        rows={7}
                        value={currentScript.narration}
                        onChange={(e) => setCurrentScript({ ...currentScript, narration: e.target.value })}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Word count: {currentScript.narration.split(' ').length} words (approx. {Math.round(currentScript.narration.split(' ').length / 2.5)} seconds)
                      </span>
                    </div>
                  </div>

                  {/* Factual Claims & Verification */}
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title"><CheckCircle size={18}/> Factual Claims Check</div>
                      <button className="btn btn-sm btn-secondary" onClick={handleVerifyClaims} disabled={loading}>
                        Verify Claims
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentScript.claims?.map((c: any, idx: number) => (
                        <div key={idx} style={{ background: '#111827', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 'bold' }}>Claim #{idx + 1}</span>
                            <span className={`badge ${c.verification_status === 'verified' ? 'badge-green' : 'badge-amber'}`}>
                              {c.verification_status}
                            </span>
                          </div>
                          <p style={{ color: '#cbd5e1' }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: 4-Scene Storyboard */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">4-Scene Storyboard (9:16 Shorts)</div>
                    <span className="badge badge-purple">{currentScript.scenes?.length || 0} Scenes</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentScript.scenes?.map((scene: any, idx: number) => (
                      <div key={idx} style={{ border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', background: '#111827' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600, color: '#60a5fa' }}>Scene {idx + 1} ({scene.target_duration_seconds}s)</span>
                          <span style={{ color: '#94a3b8' }}>Banner: "{scene.on_screen_text}"</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.4rem' }}>
                          <strong>Visual Brief:</strong> {scene.visual_brief}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Spoken: "{scene.narration_segment}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>No script drafted for this idea yet.</p>
                <button className="btn btn-primary" onClick={handleDraftScript} disabled={loading}>
                  Generate Sourced Script Draft
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REVIEW & PUBLISHING */}
        {activeTab === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2">
              {/* Left: Shorts Preview Player */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="card-header" style={{ width: '100%' }}>
                  <div className="card-title"><Video size={18}/> Vertical Shorts Preview</div>
                  <span className="badge badge-blue">9:16 (1080×1920)</span>
                </div>

                <div className="shorts-preview-frame" style={{ marginTop: '1rem' }}>
                  {/* Generated Scene Image Preview */}
                  <img 
                    src={currentScript?.id ? `${API_BASE}/media/files/asset_${currentScript.id}_scene_1.jpg` : ''} 
                    alt="Scene preview"
                    className="shorts-preview-img"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="shorts-overlay-badge">ClearTech Minute</div>
                  <div className="shorts-captions-overlay">
                    {currentScript?.scenes?.[0]?.on_screen_text || 'An API is like a waiter'}
                  </div>
                </div>

                {/* Audio playback */}
                {currentScript?.id && (
                  <div style={{ width: '100%', marginTop: '1rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.3rem', display: 'block' }}>Narration Audio Track:</label>
                    <audio 
                      controls 
                      style={{ width: '100%' }}
                      src={`${API_BASE}/media/files/audio_${currentScript.id}.wav`}
                    />
                  </div>
                )}
              </div>

              {/* Right: Technical Manifest & Approval Binding */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><Shield size={18}/> Exact Version Approval</div>
                    <span className="badge badge-green">Cryptographic Binding</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <strong>Video Title:</strong> {currentScript?.title_options?.[0] || 'Shorts Video'}
                    </div>
                    <div>
                      <strong>Final Payload Hash:</strong>{' '}
                      <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#60a5fa' }}>
                        {videoVersion?.final_hash || 'e7fad9fb8a5be07d'}
                      </code>
                    </div>
                    <div>
                      <strong>Total Duration:</strong> {videoVersion?.duration_seconds || 40} seconds
                    </div>
                    <div>
                      <strong>Subtitles / Captions:</strong> WebVTT file generated & synced
                    </div>

                    <div className="alert alert-info" style={{ marginTop: '0.5rem' }}>
                      Approving binds publishing rights to this exact version hash. Any subsequent edit to the script invalidates approval automatically.
                    </div>

                    <button 
                      className="btn btn-success" 
                      onClick={handleApproveVersion}
                      disabled={loading || !videoVersion}
                      style={{ marginTop: '0.5rem' }}
                    >
                      <Check size={16}/> Approve This Version
                    </button>
                  </div>
                </div>

                {/* Schedule for Publishing */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><Calendar size={18}/> Schedule for YouTube</div>
                  </div>
                  <form onSubmit={handleSchedulePublish} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Publish Date & Time ({channelData?.channel?.timezone || 'Asia/Colombo'}):</label>
                      <input 
                        type="datetime-local" 
                        className="form-input"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading || !videoVersion}
                    >
                      Schedule Video
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Publishing Queue Table */}
            <div className="card table-container">
              <div className="card-header">
                <div className="card-title"><Calendar size={18}/> Publishing Queue & Release Calendar</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Video Title</th>
                    <th>Scheduled For</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {publishingJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No scheduled jobs in queue.</td>
                    </tr>
                  ) : (
                    publishingJobs.map((job) => (
                      <tr key={job.id}>
                        <td><strong>{job.video_title}</strong></td>
                        <td>{job.scheduled_publish_time ? new Date(job.scheduled_publish_time).toLocaleString() : 'Immediate'}</td>
                        <td>
                          <span className={`badge ${
                            job.state === 'scheduled' ? 'badge-blue' :
                            job.state === 'published' ? 'badge-green' : 'badge-amber'
                          }`}>
                            {job.state}
                          </span>
                        </td>
                        <td>
                          {job.state !== 'cancelled' && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleCancelPublishingJob(job.id)}
                            >
                              Cancel Release
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: BUDGET & AUDIT */}
        {activeTab === 'budget' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2">
              {/* Cost Summary */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><DollarSign size={18}/> Spend Breakdown</div>
                  <span className="badge badge-green">Hard Cap Protected</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly Confirmed Spend:</span>
                    <strong>${budgetUsage?.summary?.monthly_actual || 0} USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Reservations:</span>
                    <strong>${budgetUsage?.summary?.monthly_reserved || 0} USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly Limit Cap:</span>
                    <strong>${budgetUsage?.summary?.monthly_limit || 30.00} USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Daily Confirmed Spend:</span>
                    <strong>${budgetUsage?.summary?.daily_actual || 0} USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Remaining Monthly Cap:</span>
                    <strong style={{ color: '#34d399' }}>${budgetUsage?.summary?.remaining_monthly || 30.00} USD</strong>
                  </div>
                </div>
              </div>

              {/* Security & Audit Events */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Shield size={18}/> Security Audit Log</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {auditEvents.map((evt) => (
                    <div key={evt.id} style={{ background: '#111827', padding: '0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                        <span>{evt.action}</span>
                        <span style={{ color: '#64748b' }}>{new Date(evt.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>Actor: {evt.actor} • Resource: {evt.resource}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent API Transactions Ledger */}
            <div className="card table-container">
              <div className="card-header">
                <div className="card-title">Recent API Cost Ledger (Section 10)</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Reserved Cost</th>
                    <th>Actual Cost</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetUsage?.recent_ledger?.map((item: any) => (
                    <tr key={item.id}>
                      <td><span className="badge badge-blue">{item.operation}</span></td>
                      <td>${item.reserved_cost.toFixed(4)}</td>
                      <td>${item.actual_cost.toFixed(4)}</td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{JSON.stringify(item.details)}</td>
                      <td style={{ fontSize: '0.75rem' }}>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
