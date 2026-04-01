import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProcessing } from "../context/ProcessingContext";
import { videosAPI } from "../services/api";
import { Badge } from "../components/Badge";
import { ProgressBar } from "../components/ProgressBar";

const StatCard = ({ label, value, accent, loading }) => (
  <div
    className={`bg-surface border border-border rounded-[var(--radius)] p-[18px_20px] flex flex-col gap-2 animate-[fadeUp_0.35s_ease_forwards] transition-colors duration-[var(--transition)] hover:border-border-bright ${accent ? "border-[var(--danger-dim)] bg-[var(--danger-glow)]" : ""}`}
  >
    <span className="text-[0.68rem] text-muted tracking-[0.08em] uppercase">
      {label}
    </span>
    {loading ? (
      <span
        className="animate-pulse bg-overlay"
        style={{ height: 36, width: 60, borderRadius: 4 }}
      />
    ) : (
      <span className="font-[var(--font-display)] text-[2rem] font-extrabold text-primary leading-none">
        {value ?? "—"}
      </span>
    )}
  </div>
);

function sensitivityVariant(s) {
  if (s === "safe") return "safe";
  if (s === "flagged") return "flagged";
  return "default";
}

function statusVariant(s) {
  if (s === "completed") return "completed";
  if (s === "processing") return "processing";
  if (s === "failed") return "failed";
  return "pending";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { jobs } = useProcessing();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, statsRes] = await Promise.all([
          videosAPI.list({ limit: 6 }),
          user.role === "admin" ? videosAPI.stats() : null,
        ]);
        setRecent(videosRes.data.videos);
        if (statsRes) setStats(statsRes.data.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  // Active processing jobs (from socket)
  const activeJobs = Object.entries(jobs).filter(
    ([, j]) => j.status === "processing" || j.status === "pending",
  );

  return (
    <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-[1.6rem] font-extrabold tracking-tight leading-snug">
            Dashboard
          </h1>
          <p className="text-[0.78rem] text-muted mt-1 tracking-wider">
            Welcome back, {user.name}
          </p>
        </div>
        {(user.role === "editor" || user.role === "admin") && (
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 border-none rounded-[var(--radius-sm)] font-[var(--font-mono)] font-medium tracking-wider uppercase cursor-pointer transition-all duration-[var(--transition)] whitespace-nowrap bg-accent text-[#0d0e10] hover:bg-[#ffb733] hover:shadow-[0_0_20px_var(--accent-glow)] p-[10px_20px] text-[0.78rem] self-start"
          >
            ⬆ Upload video
          </Link>
        )}
      </div>

      {/* Stats row (admin only) */}
      {user.role === "admin" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-[36px]">
          <StatCard
            label="Total videos"
            value={Object.values(stats?.byStatus || {}).reduce(
              (a, b) => a + b,
              0,
            )}
            loading={loading}
          />
          <StatCard
            label="Processing"
            value={stats?.byStatus?.processing ?? 0}
            loading={loading}
          />
          <StatCard
            label="Safe"
            value={stats?.bySensitivity?.safe ?? 0}
            loading={loading}
          />
          <StatCard
            label="Flagged"
            value={stats?.bySensitivity?.flagged ?? 0}
            accent
            loading={loading}
          />
          <StatCard
            label="Storage"
            value={
              stats
                ? `${(stats.totalStorageBytes / 1024 / 1024 / 1024).toFixed(2)} GB`
                : null
            }
            loading={loading}
          />
        </div>
      )}

      {/* Active processing jobs */}
      {activeJobs.length > 0 && (
        <section className="mb-10">
          <h2 className="font-[var(--font-display)] text-[0.85rem] font-bold tracking-[0.08em] uppercase text-secondary flex items-center gap-2 mb-4">
            <span className="inline-block w-[7px] h-[7px] rounded-full bg-info animate-[pulseDot_1.2s_ease_infinite]" />
            Processing now
          </h2>
          <div className="flex flex-col gap-[10px] mb-2">
            {activeJobs.map(([videoId, job]) => (
              <div
                key={videoId}
                className="bg-surface border border-border border-l-[3px] border-l-[var(--info)] rounded-[var(--radius)] p-[14px_16px] flex flex-col gap-[10px] animate-[fadeUp_0.3s_ease_forwards]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] text-muted tracking-widest">
                    {videoId.slice(-8)}
                  </span>
                  <Badge variant="processing" dot>
                    {job.stage || "Processing"}
                  </Badge>
                </div>
                <ProgressBar value={job.progress || 0} variant="processing" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent videos */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[var(--font-display)] text-[0.85rem] font-bold tracking-[0.08em] uppercase text-secondary flex items-center gap-2">
            Recent videos
          </h2>
          <Link
            to="/library"
            className="text-[0.75rem] text-accent tracking-wider transition-opacity hover:opacity-70"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-overlay rounded-lg h-[110px]"
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[60px_20px] text-center gap-[10px]">
            <div className="text-[2.5rem] mb-2 opacity-40">▤</div>
            <p className="font-[var(--font-display)] text-[0.95rem] text-secondary">
              No videos yet
            </p>
            <p className="text-[0.8rem] text-muted max-w-[320px]">
              Upload your first video to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {recent.map((v) => {
              const liveJob = jobs[v._id];
              const displayStatus = liveJob?.status || v.processingStatus;
              return (
                <Link
                  key={v._id}
                  to={`/library/${v._id}`}
                  className="block bg-surface border border-border rounded-[var(--radius)] p-4 transition-all duration-[var(--transition)] text-none animate-[fadeUp_0.35s_ease_forwards] hover:border-border-bright hover:bg-raised"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[0.82rem] font-medium text-primary leading-snug line-clamp-2">
                      {v.title}
                    </span>
                    <Badge variant={statusVariant(displayStatus)}>
                      {displayStatus}
                    </Badge>
                  </div>
                  {liveJob &&
                  (displayStatus === "processing" ||
                    displayStatus === "pending") ? (
                    <ProgressBar
                      value={liveJob.progress || 0}
                      variant="processing"
                    />
                  ) : (
                    <div className="flex items-center gap-[10px] flex-wrap text-[0.7rem] text-muted">
                      <span>{(v.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                      {v.sensitivityStatus !== "unanalysed" && (
                        <Badge
                          variant={sensitivityVariant(v.sensitivityStatus)}
                        >
                          {v.sensitivityStatus}
                        </Badge>
                      )}
                      {v.duration && (
                        <span>
                          {Math.floor(v.duration / 60)}m{" "}
                          {Math.floor(v.duration % 60)}s
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
