import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Shield, CheckCircle, 
  DollarSign, BookOpen, Film, Video, Calendar, 
  RefreshCw, Plus, Check, Trash2, ArrowRight,
  ExternalLink, Upload, Unlink, Radio,
  BarChart3, MessageSquare, Send, ThumbsUp, Eye, Users,
  CheckCircle2, XCircle, Award
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pilot' | 'research' | 'ideas' | 'scripts' | 'review' | 'channel' | 'analytics' | 'comments' | 'budget'>('overview');
  
  // Data states
  const [channelData, setChannelData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('');
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [researchRuns, setResearchRuns] = useState<any[]>([]);
  const [publishingJobs, setPublishingJobs] = useState<any[]>([]);
  const [budgetUsage, setBudgetUsage] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [videoVersion, setVideoVersion] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [pilotGates, setPilotGates] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);

  // Form & action states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [newTopicQuery, setNewTopicQuery] = useState('');
  const [newIdeaQuestion, setNewIdeaQuestion] = useState('');
  const [newIdeaAngle, setNewIdeaAngle] = useState('');
  const [newIdeaPillar, setNewIdeaPillar] = useState('Everyday Tech');
  const [scheduleTime, setScheduleTime] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<{ [key: string]: string }>({});
  const [briefName, setBriefName] = useState('');
  const [briefHandle, setBriefHandle] = useState('');
  const [briefPromise, setBriefPromise] = useState('');
  const [llmStatus, setLlmStatus] = useState<any>(null);
  const [llmTesting, setLlmTesting] = useState(false);

  // Channel Connection Modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMethod, setConnectMethod] = useState<'direct' | 'oauth'>('direct');
  const [directName, setDirectName] = useState('');
  const [directHandle, setDirectHandle] = useState('');
  const [directChannelId, setDirectChannelId] = useState('');
  const [directPromise, setDirectPromise] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');

  // Initial load
  useEffect(() => {
    fetchChannel();
    fetchAuthStatus();
    fetchLlmStatus();
    fetchIdeas();
    fetchResearch();
    fetchBudget();
    fetchPublishing();
    fetchChannelVideos();
    fetchAnalytics();
    fetchComments();
    fetchPilotData();
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
      if (res.ok) {
        const data = await res.json();
        setChannelData(data);
        if (data.brief) {
          setBriefName(data.brief.name || '');
          setBriefHandle(data.brief.handle || '');
          setBriefPromise(data.brief.viewer_promise || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/status`);
      if (res.ok) setAuthStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLlmStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/llm/status`);
      if (res.ok) setLlmStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestLlm = async () => {
    setLlmTesting(true);
    try {
      const res = await fetch(`${API_BASE}/llm/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showMsg(`Local LLM (${data.model}) test success: "${data.sample_response}"`);
          fetchLlmStatus();
        } else {
          showMsg(`Local LLM error: ${data.error}`, 'error');
        }
      }
    } catch (e: any) {
      showMsg(`Failed to test local LLM: ${e.message}`, 'error');
    } finally {
      setLlmTesting(false);
    }
  };

  const fetchChannelVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/videos`);
      if (res.ok) {
        const data = await res.json();
        setChannelVideos(data.videos || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPilotData = async () => {
    try {
      const gRes = await fetch(`${API_BASE}/pilot/gates`);
      if (gRes.ok) setPilotGates(await gRes.json());
      const cRes = await fetch(`${API_BASE}/pilot/curriculum`);
      if (cRes.ok) setCurriculum(await cRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`);
      if (res.ok) setAnalyticsData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data);
        const draftMap: any = {};
        data.forEach((c: any) => {
          draftMap[c.id] = c.proposed_reply || '';
        });
        setReplyDrafts(draftMap);
      }
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
        if (data.length > 0) {
          if (!selectedIdeaId || !data.some((i: any) => i.id === selectedIdeaId)) {
            setSelectedIdeaId(data[0].id);
          }
        } else {
          setSelectedIdeaId('');
          setCurrentScript(null);
          setVideoVersion(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScriptForIdea = async (ideaId: string) => {
    if (!ideaId) {
      setCurrentScript(null);
      setVideoVersion(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ideas/${ideaId}/script`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScript(data.script);
        setVideoVersion(null);
      } else {
        setCurrentScript(null);
        setVideoVersion(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentScript(null);
      setVideoVersion(null);
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

  // Phase 7: Pilot Actions
  const handleSeedCurriculum = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pilot/seed-curriculum`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showMsg(data.message || 'Curriculum seeded onto Idea Board!');
        fetchIdeas();
        fetchPilotData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Phase 6: Maintenance Actions (Analytics & Comments)
  const handleSyncAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analytics/sync`, { method: 'POST' });
      if (res.ok) {
        showMsg('YouTube Analytics refreshed successfully!');
        fetchAnalytics();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDraftAICommentReply = async (commentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}/draft-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_instructions: 'Friendly and educational' })
      });
      if (res.ok) {
        const data = await res.json();
        showMsg('AI reply drafted! You can edit it before sending.');
        setReplyDrafts(prev => ({ ...prev, [commentId]: data.proposed_reply }));
        fetchComments();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommentReply = async (commentId: string) => {
    const text = replyDrafts[commentId];
    if (!text || !text.trim()) {
      showMsg('Please write a reply before sending.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}/send-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: text })
      });
      if (res.ok) {
        showMsg('Reply sent and logged in audit history!');
        fetchComments();
        fetchBudget();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismissComment = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        showMsg('Comment dismissed');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Phase 4: Channel Actions
  const handleConnectChannel = async (mode: 'standard' | 'demo' = 'standard') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'redirect_required' && data.auth_url) {
          window.location.href = data.auth_url;
        } else if (data.status === 'not_configured') {
          setShowConnectModal(true);
          setConnectMethod('oauth');
          showMsg(data.message, 'info');
        } else {
          showMsg(data.message || 'Channel connected successfully!');
          fetchAuthStatus();
          fetchChannel();
          fetchChannelVideos();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDirectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim() || !directChannelId.trim()) {
      showMsg('Please provide at least Channel Name and Channel ID (e.g. UC...)', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/link-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: directName.trim(),
          handle: directHandle.trim() || `@${directName.trim().replace(/\s+/g, '')}`,
          channel_id: directChannelId.trim(),
          viewer_promise: directPromise.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        showMsg(data.message || 'YouTube Channel linked successfully!');
        setShowConnectModal(false);
        fetchAuthStatus();
        fetchChannel();
        fetchChannelVideos();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Failed to link channel', 'error');
      }
    } catch (e: any) {
      showMsg(e.message || 'Error linking channel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOAuthAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthClientId.trim() || !oauthClientSecret.trim()) {
      showMsg('Please provide both Client ID and Client Secret from Google Cloud Console', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/configure-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: oauthClientId.trim(),
          client_secret: oauthClientSecret.trim()
        })
      });
      if (res.ok) {
        showMsg('Google OAuth credentials saved! Initiating Google login...');
        handleConnectChannel('standard');
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Failed to save OAuth credentials', 'error');
      }
    } catch (e: any) {
      showMsg(e.message || 'Error saving OAuth credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectChannel = async () => {
    if (!confirm('Are you sure you want to disconnect this YouTube channel?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/youtube/disconnect`, { method: 'POST' });
      if (res.ok) {
        showMsg('Channel disconnected successfully');
        fetchAuthStatus();
        fetchChannel();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPrivate = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/publishing/jobs/${jobId}/upload-private`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showMsg(`Uploaded to YouTube as Private! Video ID: ${data.remote_video_id}`);
        fetchPublishing();
        fetchBudget();
      } else {
        const err = await res.json();
        showMsg(err.detail || 'Upload failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // General Actions
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

  const handleClearSystemData = async () => {
    if (!confirm("Are you sure you want to clear all dummy data, sample scripts, ideas, publishing jobs, comments, and media files? This will reset the workspace to a clean state.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/channels/reset-system-data`, { method: 'POST' });
      if (res.ok) {
        showMsg("All dummy data and sample records cleared successfully!");
        fetchChannel();
        fetchIdeas();
        fetchResearch();
        fetchBudget();
        fetchPublishing();
        fetchAnalytics();
        fetchComments();
        fetchPilotData();
        setCurrentScript(null);
        setVideoVersion(null);
        setSelectedIdeaId('');
      } else {
        showMsg("Failed to reset system data", "error");
      }
    } catch (e: any) {
      showMsg(e.message || "Failed to reset system data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/channels/brief`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: briefName,
          handle: briefHandle,
          viewer_promise: briefPromise
        })
      });
      if (res.ok) {
        showMsg("Channel profile updated successfully!");
        fetchChannel();
        fetchBudget();
      } else {
        showMsg("Failed to update channel profile", "error");
      }
    } catch (e: any) {
      showMsg(e.message || "Failed to update channel profile", "error");
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
            <div className="brand-title">{channelData?.brief?.name || 'ClearTech Minute'} • Channel Agent</div>
            <div className="brand-subtitle">
              Owner: ayeshmantha@local • Channel: {authStatus?.is_connected ? (authStatus?.channel_info?.title || channelData?.brief?.name || 'Connected Channel') : 'Not Connected'}
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

          {/* LLM Engine Indicator */}
          <div 
            className={`badge ${llmStatus?.is_connected ? 'badge-green' : 'badge-amber'}`}
            title={`Local LLM: ${llmStatus?.provider?.toUpperCase() || 'OLLAMA'} (${llmStatus?.model || 'llama3.2:3b'}) • ${llmStatus?.is_connected ? 'Online' : 'Offline'}. Click to test.`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}
            onClick={handleTestLlm}
          >
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: llmStatus?.is_connected ? '#22c55e' : '#f59e0b',
              display: 'inline-block' 
            }} />
            <span>{llmStatus?.provider === 'ollama' ? '🦙 Ollama' : 'Gemini'}: {llmStatus?.model || 'llama3.2:3b'}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({llmStatus?.cost_mode === 'free_local' ? '$0.00' : 'Cloud'})</span>
            {llmTesting && <RefreshCw size={12} className="spin" />}
          </div>

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
          className={`nav-tab ${activeTab === 'pilot' ? 'active' : ''}`}
          onClick={() => setActiveTab('pilot')}
        >
          <Award size={16}/> Pilot & Gates (Phase 7)
        </button>
        <button 
          className={`nav-tab ${activeTab === 'channel' ? 'active' : ''}`}
          onClick={() => setActiveTab('channel')}
        >
          <Radio size={16}/> Channel Setup
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
          <Film size={16}/> Script Studio
        </button>
        <button 
          className={`nav-tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <Video size={16}/> Review & Publishing
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16}/> Analytics
        </button>
        <button 
          className={`nav-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          <MessageSquare size={16}/> Comments & Q&A
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
                  {publishingJobs.filter(j => j.state === 'scheduled' || j.state === 'ready_for_upload' || j.state === 'uploaded_private').length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>YouTube ready</span>
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

            {/* Local AI Engine Status Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <BookOpen size={18}/> Local AI Language Model (Ollama)
                </div>
                <span className={`badge ${llmStatus?.is_connected ? 'badge-green' : 'badge-amber'}`}>
                  {llmStatus?.is_connected ? 'Connected & Ready' : 'Service Offline'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Active Provider</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>
                    {llmStatus?.provider === 'ollama' ? '🦙 Ollama (Local Hardware)' : 'Google Gemini (Cloud)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.2rem' }}>
                    {llmStatus?.cost_mode === 'free_local' ? '100% Free • Zero API Cost' : 'Metered API'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Installed Model</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>
                    {llmStatus?.model || 'llama3.2:3b'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Endpoint: {llmStatus?.base_url || 'http://localhost:11434'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Detected Local Models</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#60a5fa', marginTop: '0.2rem' }}>
                    {llmStatus?.installed_models && llmStatus.installed_models.length > 0 
                      ? llmStatus.installed_models.join(', ') 
                      : 'None detected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Cost per script: {llmStatus?.cost_per_script || '$0.00'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                  Educational scripts, claim verifications, and viewer replies run privately on your local PC via Ollama without spending cloud credits.
                </p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleTestLlm}
                  disabled={llmTesting}
                >
                  <RefreshCw size={14} className={llmTesting ? 'spin' : ''}/>
                  {llmTesting ? 'Testing Local LLM...' : 'Test Local LLM Response'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PILOT & AUTOMATION GATES (PHASE 7) */}
        {activeTab === 'pilot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 8 Automation Readiness Gates Box */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Award size={18}/> 8 Engineering Safety Gates for Bounded Automatic Mode</div>
                <span className={`badge ${pilotGates?.all_gates_passed ? 'badge-green' : 'badge-amber'}`}>
                  {pilotGates?.all_gates_passed ? 'Eligible for Automation' : 'Safety Review Required'}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Before allowing unattended batch creation or bounded publishing, Build Plan Section 20 requires passing these 8 engineering verification checks:
              </div>

              <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                {pilotGates?.gates?.map((gate: any) => (
                  <div key={gate.id} style={{ border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', background: '#111827' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{gate.name}</span>
                      {gate.passed ? (
                        <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle2 size={12}/> PASS
                        </span>
                      ) : (
                        <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <XCircle size={12}/> HOLD
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{gate.requirement}</div>
                    <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.2rem' }}>State: {gate.current_value}</div>
                  </div>
                ))}
              </div>

              {pilotGates?.eligible_for_bounded_auto && channelData?.channel?.mode !== 'bounded_auto' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6ee7b7' }}>
                    All 8 engineering criteria verified! You can safely switch to Bounded Automatic mode.
                  </span>
                  <button className="btn btn-sm btn-success" onClick={() => handleUpdateMode('bounded_auto')}>
                    Enable Bounded Auto
                  </button>
                </div>
              )}
            </div>

            {/* 20-Topic First Month Curriculum */}
            <div className="card table-container">
              <div className="card-header">
                <div>
                  <div className="card-title">20-Video First Month Curriculum (Build Plan Section 21)</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    4 weeks of educational technology Shorts covering everyday tech, AI concepts, and digital safety.
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSeedCurriculum} disabled={loading}>
                  <Plus size={14}/> Seed Full 20-Video Curriculum
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Topic Question</th>
                    <th>Pillar</th>
                    <th>Educational Visual Angle</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculum.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className="badge badge-blue">Week {item.week}</span></td>
                      <td><strong>{item.question}</strong></td>
                      <td><span className="badge badge-purple">{item.pillar}</span></td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{item.angle}</td>
                      <td>
                        {item.idea_id ? (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedIdeaId(item.idea_id);
                              setActiveTab('scripts');
                            }}
                          >
                            Script Studio
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Click Seed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: YOUTUBE CHANNEL (PHASE 4) */}
        {activeTab === 'channel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Radio size={18}/> Connected Channel Information (Phase 4)</div>
                <span className={`badge ${authStatus?.is_connected ? 'badge-green' : 'badge-amber'}`}>
                  {authStatus?.is_connected ? 'Connected & Authorized' : 'Not Connected'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: 68, 
                  height: 68, 
                  borderRadius: '50%', 
                  background: authStatus?.is_connected 
                    ? 'linear-gradient(135deg, #ef4444, #3b82f6)' 
                    : '#334155', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {authStatus?.is_connected ? 'YT' : '—'}
                </div>

                <div style={{ flex: 1 }}>
                  {authStatus?.is_connected ? (
                    <>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                        {authStatus?.channel_info?.title || channelData?.brief?.name || 'Connected Channel'}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>Handle: <strong>{authStatus?.channel_info?.custom_url || channelData?.brief?.handle || '—'}</strong></span>
                        <span>Channel ID: <code>{authStatus?.channel_info?.channel_id || channelData?.channel?.youtube_channel_id}</code></span>
                        <span>Subscribers: <strong>{authStatus?.channel_info?.subscriber_count ?? '0'}</strong></span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', color: '#cbd5e1' }}>
                        No Channel Connected
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        No YouTube channel is currently linked. Click <strong>Connect Channel</strong> to authorize your YouTube account or start local channel mode.
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!authStatus?.is_connected ? (
                    <button className="btn btn-primary" onClick={() => {
                      setDirectName(channelData?.brief?.name || '');
                      setDirectHandle(channelData?.brief?.handle || '');
                      setDirectChannelId(channelData?.channel?.youtube_channel_id || '');
                      setShowConnectModal(true);
                    }} disabled={loading}>
                      <Plus size={14}/> Connect My YouTube Channel
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setDirectName(authStatus?.channel_info?.title || channelData?.brief?.name || '');
                        setDirectHandle(authStatus?.channel_info?.custom_url || channelData?.brief?.handle || '');
                        setDirectChannelId(authStatus?.channel_info?.channel_id || channelData?.channel?.youtube_channel_id || '');
                        setShowConnectModal(true);
                      }} disabled={loading}>
                        Switch / Re-link Channel
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={handleDisconnectChannel} disabled={loading}>
                        <Unlink size={14}/> Disconnect Channel
                      </button>
                    </>
                  )}
                  {authStatus?.is_connected && (
                    <a 
                      href={authStatus?.channel_info?.channel_id && !authStatus?.channel_info?.channel_id?.startsWith('UC_DEMO') ? `https://studio.youtube.com/channel/${authStatus.channel_info.channel_id}` : "https://studio.youtube.com"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary btn-sm"
                    >
                      Open YouTube Studio <ExternalLink size={14}/>
                    </a>
                  )}
                </div>
              </div>

              <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
                <strong>Phase 4 Compliance:</strong> In accordance with YouTube API developer policies, test uploads from developer applications are uploaded strictly with <code>privacyStatus: private</code>. You can review and publish them inside desktop YouTube Studio.
              </div>
            </div>

            {/* Connect Channel Modal / Box */}
            {showConnectModal && (
              <div className="card" style={{ border: '2px solid #3b82f6', background: 'rgba(30, 41, 59, 0.98)' }}>
                <div className="card-header">
                  <div className="card-title">
                    <Radio size={18}/> Connect Your YouTube Channel
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowConnectModal(false)}>
                    Close
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Choose how you want to connect your YouTube channel to the agent:
                </p>

                {/* Tab switch between Direct Link and Google OAuth */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <button 
                    className={`btn btn-sm ${connectMethod === 'direct' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setConnectMethod('direct')}
                    type="button"
                  >
                    1. Link Channel Directly (Instant &amp; Recommended)
                  </button>
                  <button 
                    className={`btn btn-sm ${connectMethod === 'oauth' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setConnectMethod('oauth')}
                    type="button"
                  >
                    2. Google OAuth 2.0 (Live Google Login)
                  </button>
                </div>

                {connectMethod === 'direct' ? (
                  <form onSubmit={handleLinkDirectChannel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.83rem', color: '#93c5fd', lineHeight: 1.5 }}>
                      💡 <strong>Instant Link:</strong> Enter your real YouTube Channel Name, Handle, and Channel ID. All script drafting, topic research, video rendering, and metadata will immediately use your real channel brand!
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                        <label className="form-label">Your YouTube Channel Name *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Chama Tech, Tech With Alex, etc."
                          value={directName}
                          onChange={(e) => setDirectName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                        <label className="form-label">Channel Handle *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. @ChamaTech"
                          value={directHandle}
                          onChange={(e) => setDirectHandle(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                        <label className="form-label">YouTube Channel ID (e.g. UC...) *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxx"
                          value={directChannelId}
                          onChange={(e) => setDirectChannelId(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Found in YouTube Studio &gt; Customization &gt; Basic info &gt; Channel ID
                        </span>
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                        <label className="form-label">Channel Niche / Viewer Promise</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. One tech concept explained in 60 seconds."
                          value={directPromise}
                          onChange={(e) => setDirectPromise(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowConnectModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Check size={14}/> Save &amp; Link My Channel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSaveOAuthAndConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.83rem', color: '#fde047', lineHeight: 1.5 }}>
                      🔑 <strong>Google OAuth Setup (Optional):</strong> To authenticate with your Google account via OAuth, provide your OAuth 2.0 Web Application credentials from Google Cloud Console with redirect URI <code>http://localhost:8000/api/auth/youtube/callback</code>.
                    </div>

                    {authStatus?.is_configured ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div className="alert alert-success">
                          Google OAuth credentials are configured in <code>.env</code>!
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleConnectChannel('standard')}
                          disabled={loading}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Sign In with Google Account <ExternalLink size={14}/>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                            <label className="form-label">Google OAuth Client ID</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="e.g. 123456789-xxxxxx.apps.googleusercontent.com"
                              value={oauthClientId}
                              onChange={(e) => setOauthClientId(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                            <label className="form-label">Google OAuth Client Secret</label>
                            <input 
                              type="password" 
                              className="form-input" 
                              placeholder="e.g. GOCSPX-xxxxxxxxx"
                              value={oauthClientSecret}
                              onChange={(e) => setOauthClientSecret(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowConnectModal(false)}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            Save &amp; Authorize with Google
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Channel Profile & Editorial Brand */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Channel Profile & Brand Settings</div>
                <span className="badge badge-purple">Editorial Profile</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Customize your channel name, handle, and audience promise. This controls what name and branding is used across script drafts and metadata.
              </p>
              <form onSubmit={handleSaveBrief} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="form-label">Channel Display Name:</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={briefName}
                      onChange={(e) => setBriefName(e.target.value)}
                      placeholder="e.g. ClearTech Minute or My Tech Shorts"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="form-label">Channel Handle:</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={briefHandle}
                      onChange={(e) => setBriefHandle(e.target.value)}
                      placeholder="e.g. @MyChannel"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Viewer Promise (Channel Description):</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={briefPromise}
                    onChange={(e) => setBriefPromise(e.target.value)}
                    placeholder="e.g. One useful technology idea, explained clearly in about a minute."
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                  Save Channel Profile
                </button>
              </form>
            </div>

            {/* Imported Channel Videos (Build Plan Section 4 & 20) */}
            <div className="card table-container">
              <div className="card-header">
                <div className="card-title">Existing Channel Videos (Imported via YouTube API)</div>
                <button className="btn btn-sm btn-secondary" onClick={fetchChannelVideos}>
                  <RefreshCw size={12}/> Refresh List
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Video Title</th>
                    <th>Published Date</th>
                    <th>YouTube Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channelVideos.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                        No published videos yet. Connect your YouTube channel or produce your first video to see it here.
                      </td>
                    </tr>
                  ) : (
                    channelVideos.map((vid) => (
                      <tr key={vid.video_id}>
                        <td>
                          <strong>{vid.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            {vid.description}
                          </div>
                        </td>
                        <td>{new Date(vid.published_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a 
                              href={vid.studio_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-secondary"
                            >
                              Studio Edit <ExternalLink size={12}/>
                            </a>
                            <a 
                              href={vid.watch_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-primary"
                            >
                              Watch <ExternalLink size={12}/>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* System Reset / Clean State */}
            <div className="card" style={{ borderColor: '#ef4444' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: '#f87171' }}>System Clean State & Reset</div>
                <span className="badge badge-red">Clean Workspace</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Wipe all dummy/sample ideas, scripts, storyboard assets, comments, analytics reports, and media files from the database and disk while keeping your channel configuration intact.
              </p>
              <button 
                className="btn btn-danger btn-sm"
                onClick={handleClearSystemData}
                disabled={loading}
              >
                <Trash2 size={14}/> Clear All Dummy & Sample Data
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TOPIC RESEARCH */}
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
              {researchRuns.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                  No completed topic investigations yet. Enter a topic query above to begin factual research and evidence gathering.
                </div>
              ) : (
                researchRuns.map((run) => (
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
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: IDEA BOARD */}
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
                  {ideas.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No ideas on the board yet. Add your own topic above or seed the pilot curriculum from the Pilot tab!
                      </td>
                    </tr>
                  ) : (
                    ideas.map((idea) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SCRIPT & STORYBOARD STUDIO */}
        {activeTab === 'scripts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {ideas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>No ideas available to script yet.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('ideas')}>
                  Go to Idea Board
                </button>
              </div>
            ) : (
              <>
                {/* Idea Selection Header */}
                <div className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Idea:</span>
                    <select 
                      className="form-select"
                      style={{ marginLeft: '0.5rem', fontWeight: 600, maxWidth: '400px' }}
                      value={selectedIdeaId}
                      onChange={(e) => setSelectedIdeaId(e.target.value)}
                    >
                      {ideas.map(i => (
                        <option key={i.id} value={i.id}>{i.question}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              </>
            )}
          </div>
        )}

        {/* TAB 7: REVIEW & PUBLISHING */}
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
                    {currentScript?.scenes?.[0]?.on_screen_text || 'Render video to preview'}
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
                      <strong>Video Title:</strong> {currentScript?.title_options?.[0] || 'No video rendered yet'}
                    </div>
                    <div>
                      <strong>Final Payload Hash:</strong>{' '}
                      <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#60a5fa' }}>
                        {videoVersion?.final_hash || 'None (Render video first)'}
                      </code>
                    </div>
                    <div>
                      <strong>Total Duration:</strong> {videoVersion?.duration_seconds ? `${videoVersion.duration_seconds} seconds` : 'N/A'}
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
                <div className="card-title"><Calendar size={18}/> Publishing Queue & YouTube Uploads</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Video Title</th>
                    <th>Scheduled For</th>
                    <th>Status</th>
                    <th>YouTube Actions</th>
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
                            job.state === 'uploaded_private' ? 'badge-green' :
                            job.state === 'scheduled' ? 'badge-blue' :
                            job.state === 'cancelled' ? 'badge-red' : 'badge-amber'
                          }`}>
                            {job.state}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {job.state !== 'uploaded_private' && job.state !== 'cancelled' && (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleUploadPrivate(job.id)}
                                disabled={loading}
                              >
                                <Upload size={12}/> Upload Private
                              </button>
                            )}

                            {job.studio_url && (
                              <a 
                                href={job.studio_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn btn-sm btn-secondary"
                              >
                                Studio <ExternalLink size={12}/>
                              </a>
                            )}

                            {job.state !== 'cancelled' && (
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancelPublishingJob(job.id)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Native YouTube Analytics Performance</h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Period: {analyticsData?.reporting_period} • Last refreshed: {analyticsData?.last_refresh ? new Date(analyticsData.last_refresh).toLocaleString() : 'Just now'}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSyncAnalytics} disabled={loading}>
                <RefreshCw size={14}/> Sync Analytics
              </button>
            </div>

            {/* Native Metrics Cards */}
            <div className="grid-4">
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.85rem' }}>
                  <Eye size={16}/> Total Views
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {analyticsData?.metrics?.views?.toLocaleString() || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Engaged views: <strong>{analyticsData?.metrics?.engaged_views?.toLocaleString() || 0}</strong>
                </span>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem' }}>
                  <Film size={16}/> Avg View Retention
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {analyticsData?.metrics?.average_view_percentage || 0}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Avg duration: <strong>{analyticsData?.metrics?.average_view_duration_seconds || 0}s</strong>
                </span>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontSize: '0.85rem' }}>
                  <Users size={16}/> Subscribers Gained
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  +{analyticsData?.metrics?.subscribers_gained || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Lost: {analyticsData?.metrics?.subscribers_lost || 0}
                </span>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.85rem' }}>
                  <ThumbsUp size={16}/> Viewer Engagement
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {analyticsData?.metrics?.likes || 0} Likes
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {analyticsData?.metrics?.comments || 0} comments • {analyticsData?.metrics?.shares || 0} shares
                </span>
              </div>
            </div>

            {/* Weekly Creative Experiments Review (Build Plan Section 17) */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><BarChart3 size={18}/> Weekly Creative Review & Insights</div>
                <span className="badge badge-purple">AI & Native Synthesis</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
                <div>
                  <strong>Best Performing Hook:</strong>
                  <p style={{ color: '#60a5fa', marginTop: '0.2rem' }}>
                    {analyticsData?.weekly_review?.best_performing_hook}
                  </p>
                </div>
                <div>
                  <strong>Drop-off Point Observation:</strong>
                  <p style={{ color: '#cbd5e1', marginTop: '0.2rem' }}>
                    {analyticsData?.weekly_review?.audience_dropoff_point}
                  </p>
                </div>
                <div>
                  <strong>Creative Recommendation for Next Batch:</strong>
                  <p style={{ color: '#34d399', marginTop: '0.2rem' }}>
                    {analyticsData?.weekly_review?.creative_recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: COMMENTS & COMMUNITY */}
        {activeTab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><MessageSquare size={18}/> Viewer Comments & AI Reply Studio</div>
                <button className="btn btn-sm btn-secondary" onClick={fetchComments}>
                  <RefreshCw size={12}/> Refresh Comments
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {commentsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No viewer comments found. When viewers comment on published YouTube Shorts, they will appear here for review and educational AI drafting.
                  </div>
                ) : (
                  commentsList.map((comm) => (
                  <div key={comm.id} style={{ border: '1px solid #334155', borderRadius: '8px', padding: '1rem', background: '#111827' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>{comm.author_display_name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                          on "{comm.video_title}"
                        </span>
                      </div>
                      <span className={`badge ${
                        comm.moderation_state === 'sent' ? 'badge-green' :
                        comm.moderation_state === 'approved_reply' ? 'badge-blue' : 'badge-amber'
                      }`}>
                        {comm.moderation_state.replace('_', ' ')}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '0.75rem' }}>
                      "{comm.text_snapshot}"
                    </p>

                    {/* Proposed Reply Area */}
                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <label className="form-label">Drafted Reply (Editable):</label>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleDraftAICommentReply(comm.id)}
                          disabled={loading}
                        >
                          <RefreshCw size={12}/> Generate AI Reply
                        </button>
                      </div>
                      <textarea 
                        className="form-textarea"
                        rows={2}
                        value={replyDrafts[comm.id] || ''}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [comm.id]: e.target.value })}
                        placeholder="Draft reply here..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSendCommentReply(comm.id)}
                        disabled={loading}
                      >
                        <Send size={12}/> Send Reply to YouTube
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDismissComment(comm.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: BUDGET & AUDIT */}
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
                  {auditEvents.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', padding: '0.5rem' }}>No audit events logged.</div>
                  ) : (
                    auditEvents.map((evt) => (
                    <div key={evt.id} style={{ background: '#111827', padding: '0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                        <span>{evt.action}</span>
                        <span style={{ color: '#64748b' }}>{new Date(evt.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>Actor: {evt.actor} • Resource: {evt.resource}</div>
                    </div>
                  ))
                )}
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
                  {(!budgetUsage?.recent_ledger || budgetUsage.recent_ledger.length === 0) ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                        No API transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    budgetUsage.recent_ledger.map((item: any) => (
                      <tr key={item.id}>
                        <td><span className="badge badge-blue">{item.operation}</span></td>
                        <td>${item.reserved_cost.toFixed(4)}</td>
                        <td>${item.actual_cost.toFixed(4)}</td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{JSON.stringify(item.details)}</td>
                        <td style={{ fontSize: '0.75rem' }}>{new Date(item.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
