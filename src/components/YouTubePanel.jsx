// ============================================================
// YouTubePanel.jsx
// The YouTube learning videos column on the Schedule page.
//
// Each session has its own "Find Videos" button so the user only
// fetches what they need — saves API quota.
//
// • PDF uploaded  → extracts clean academic topics (ignoring code
//                   syntax or sample student names), always anchoring
//                   search strictly with the course name.
// • No PDF       → search using course name.
// ============================================================

import { useState } from 'react';
import api          from '../services/api.js';
import videoIcon    from '../assets/clapperboard-play-svgrepo-com.svg';
import '../styling/Schedule.css';

// ── helpers ──────────────────────────────────────────────────

async function searchYouTube(topic, course) {
  try {
    const params = new URLSearchParams({ topic });
    if (course) params.append('course', course);

    const res = await api.get(`/api/schedules/youtube/search?${params.toString()}`);
    return res.data?.data?.videos || [];
  } catch {
    return [];
  }
}

/**
 * Extract clean, high-signal topic keywords from a PDF text slice.
 * Filters out raw programming code, student names, syntax delimiters,
 * exercises, and numbers so YouTube receives meaningful educational queries.
 */
function extractEducationalTopic(pdfText, pageStart, pageEnd, totalPages, courseName) {
  if (!pdfText || !totalPages) return `${courseName} tutorial`;

  const textLen = pdfText.length;
  const start   = Math.floor(((pageStart - 1) / totalPages) * textLen);
  const end     = Math.floor((pageEnd / totalPages) * textLen);
  const raw     = pdfText.substring(start, end).trim();

  // Strip code syntax, symbols, quotes, numbers, braces
  let cleaned = raw
    .replace(/[{}[\]();=<>:"'`.•\r\n\t_]/g, ' ')
    // Strip common programming boilerplate keywords & exercise tokens
    .replace(/\b(public|private|protected|static|void|int|double|float|String|boolean|new|return|import|package|class|System|out|println|print|gpa|student|studentGpa|name|age|null|true|false|this|super|extends|implements|throws|try|catch|finally|while|for|if|else|Exercise|Practice|Assignment|Homework|Quiz|Test|Chapter|Section|Page|Pages|Author|Title)\b/gi, ' ')
    // Filter out names that look like example variables (e.g. Kipchoge, Akinyi, Jane, Tom, Dennis)
    .replace(/\b(Dennis|Muthui|Kipchoge|Akinyi|Jane|John|Tom|Alice|Bob|Charlie|Smith)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Select key technical/conceptual terms (length between 3 and 25 chars)
  const tokens = cleaned
    .split(' ')
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w));

  const uniqueTokens = [];
  const seen = new Set();
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueTokens.push(t);
    }
    if (uniqueTokens.length >= 5) break;
  }

  const topicSnippet = uniqueTokens.join(' ');
  return topicSnippet ? `${topicSnippet} ${courseName}` : `${courseName} core concepts tutorial`;
}

// ── per-session row (has its own fetch button) ───────────────

function SessionRow({ label, subtitle, schedule, buildTopic, docFallbackTopic }) {
  const [open,     setOpen]     = useState(false);
  const [videos,   setVideos]   = useState(null);  // null = not yet fetched
  const [loading,  setLoading]  = useState(false);
  const [fallback, setFallback] = useState(false);
  const [error,    setError]    = useState('');

  const fetchForSession = async () => {
    setLoading(true);
    setError('');
    setFallback(false);

    let results = await searchYouTube(buildTopic(), schedule.course);
    let isFallback = false;

    // If nothing found AND we have a doc-level fallback topic
    if (!results.length && docFallbackTopic) {
      results    = await searchYouTube(docFallbackTopic, schedule.course);
      isFallback = true;
    }

    setVideos(results);
    setFallback(isFallback);
    setOpen(true);
    if (!results.length) setError('No videos found for this section.');
    setLoading(false);
  };

  const hasVideos = videos !== null && videos.length > 0;

  return (
    <div className="yt-dropdown">
      {/* Header bar — always visible */}
      <div className="yt-dropdown-header">
        {/* Left: expand/collapse (only clickable when videos are loaded) */}
        <button
          className="yt-dropdown-toggle"
          onClick={() => hasVideos && setOpen((v) => !v)}
          disabled={!hasVideos}
          aria-expanded={open}
        >
          <span className="yt-dropdown-chevron">
            {hasVideos ? (open ? '▼' : '▶') : '○'}
          </span>
          <span className="yt-dropdown-label">{label}</span>
          <span className="yt-dropdown-subtitle">{subtitle}</span>
        </button>

        {/* Right: fetch button OR video count */}
        {videos === null ? (
          <button
            className="yt-session-fetch-btn"
            onClick={fetchForSession}
            disabled={loading}
          >
            <img src={videoIcon} alt="" width="14" height="14" />
            {loading ? 'Searching…' : 'Find Videos'}
          </button>
        ) : (
          <span className="yt-dropdown-count">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Body — collapsible video list */}
      {open && videos !== null && (
        <div className="yt-dropdown-body">
          {fallback && (
            <p className="youtube-fallback-note">
              ⚠️ No videos found specifically for this section — showing
              results for the overall course instead.
            </p>
          )}

          {error && <p className="youtube-error">{error}</p>}

          {videos.length > 0 && (
            <div className="youtube-list">
              {videos.map((v) => (
                <VideoCard key={v.videoId} v={v} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── video card ───────────────────────────────────────────────

function VideoCard({ v }) {
  return (
    <div className="youtube-card">
      <img src={v.thumbnail} alt={v.title} className="youtube-thumbnail" />
      <h3>{v.title}</h3>
      <p className="youtube-channel">{v.channel}</p>
      <a
        href={v.url}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-watch-btn"
      >
        ▶ Watch on YouTube
      </a>
    </div>
  );
}

// ── main panel ───────────────────────────────────────────────

function YouTubePanel({ schedule }) {
  const hasPdf     = Boolean(schedule?.pdfText);
  const tasks      = schedule?.tasks || [];
  const totalPages = schedule?.totalPages || 1;
  const pdfText    = schedule?.pdfText || '';

  // De-duplicate sessions by page range
  const seen     = new Set();
  const sessions = [];
  tasks.forEach((task) => {
    const key = `${task.pageStart}-${task.pageEnd}`;
    if (!seen.has(key)) {
      seen.add(key);
      sessions.push(task);
    }
  });

  // Doc-level fallback topic: course name + high level concepts
  const docFallbackTopic = `${schedule.course} complete tutorial course concepts`;

  return (
    <section className="col-panel youtube-section">
      <h2>🎬 Learning Videos</h2>
      <p className="col-subtitle">
        Click <strong>Find Videos</strong> on any session to search for relevant tutorials.
      </p>

      {!hasPdf && (
        <p className="youtube-course-note">
          📝 No PDF uploaded — results will be based on the course name
          "<strong>{schedule.course}</strong>".
        </p>
      )}

      <div className="yt-dropdown-list">
        {hasPdf ? (
          /* ── PDF mode: one row per session ── */
          sessions.map((task) => {
            const label    = `📖 Session — Day ${task.day}`;
            const subtitle = `Pages ${task.pageStart}–${task.pageEnd}`;
            const buildTopic = () =>
              extractEducationalTopic(pdfText, task.pageStart, task.pageEnd, totalPages, schedule.course);

            return (
              <SessionRow
                key={`${task.pageStart}-${task.pageEnd}`}
                label={label}
                subtitle={subtitle}
                schedule={schedule}
                buildTopic={buildTopic}
                docFallbackTopic={docFallbackTopic}
              />
            );
          })
        ) : (
          /* ── No-PDF mode: single row for the whole course ── */
          <SessionRow
            label={`📚 ${schedule.course}`}
            subtitle="Entire course"
            schedule={schedule}
            buildTopic={() => `${schedule.course} study tutorial explanation`}
            docFallbackTopic={null}
          />
        )}
      </div>
    </section>
  );
}

export default YouTubePanel;
