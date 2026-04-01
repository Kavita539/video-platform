import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { videosAPI } from "../services/api";
import { useProcessing } from "../context/ProcessingContext";
import { Badge } from "../components/Badge";
import { Button, Spinner } from "../components/Button";
import { Empty } from "../components/Empty";

const STATUS_OPTS = ["", "pending", "processing", "completed", "failed"];
const SENSITIVITY_OPTS = ["", "unanalysed", "safe", "flagged"];

function fmt(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function fmtDur(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60),
    s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Library() {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sensitivity, setSensitivity] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const { getJob } = useProcessing();

  const load = useCallback(
    async (pg = 1) => {
      setLoading(true);
      try {
        const { data } = await videosAPI.list({
          page: pg,
          limit: 18,
          ...(search && { search }),
          ...(status && { status }),
          ...(sensitivity && { sensitivity }),
        });
        setVideos(data.videos);
        setTotal(data.total);
        setPages(data.pages);
        setPage(pg);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [search, status, sensitivity],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const handleDelete = async (id) => {
    try {
      await videosAPI.delete(id);
      setVideos((v) => v.filter((x) => x._id !== id));
      setTotal((t) => t - 1);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-[1.6rem] font-extrabold tracking-tight leading-snug">
            Library
          </h1>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-1 tracking-wider">
            {total} video{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 border-none rounded-[var(--radius-sm)] font-[var(--font-mono)] font-medium tracking-wider uppercase cursor-pointer transition-all duration-[var(--transition)] whitespace-nowrap bg-[var(--accent)] text-[#0d0e10] hover:bg-[#ffb733] hover:shadow-[0_0_20px_var(--accent-glow)] p-[10px_20px] text-[0.78rem] self-start"
        >
          ⬆ Upload
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-[10px] mb-6 flex-wrap">
        <input
          className="flex-1 min-w-[200px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-[var(--font-mono)] text-[0.82rem] p-[9px_14px] outline-none transition-all duration-[var(--transition)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-glow)] placeholder:text-[var(--text-muted)]"
          placeholder="Search titles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-[var(--font-mono)] text-[0.78rem] p-[9px_12px] outline-none cursor-pointer transition-colors duration-[var(--transition)] focus:border-[var(--accent)]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTS.map((o) => (
            <option key={o} value={o}>
              {o || "All statuses"}
            </option>
          ))}
        </select>
        <select
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-[var(--font-mono)] text-[0.78rem] p-[9px_12px] outline-none cursor-pointer transition-colors duration-[var(--transition)] focus:border-[var(--accent)]"
          value={sensitivity}
          onChange={(e) => setSensitivity(e.target.value)}
        >
          {SENSITIVITY_OPTS.map((o) => (
            <option key={o} value={o}>
              {o || "All sensitivity"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-[80px_0] text-[var(--accent)]">
          <Spinner size="lg" />
        </div>
      ) : videos.length === 0 ? (
        <Empty
          icon="▤"
          title="No videos found"
          message="Try adjusting your filters or upload a new video."
          action={
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 border border-[var(--border-bright)] rounded-[var(--radius-sm)] font-[var(--font-mono)] font-medium tracking-wider uppercase cursor-pointer transition-all duration-[var(--transition)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] p-[10px_20px] text-[0.78rem]"
            >
              Upload video
            </Link>
          }
        />
      ) : (
        <>
          {/* Library Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-8">
            {videos.map((v) => {
              const liveJob = getJob(v._id);
              const displayStatus = liveJob?.status || v.processingStatus;
              const isFlagged = v.sensitivityStatus === "flagged";
              return (
                <div
                  key={v._id}
                  className={`group relative bg-[var(--bg-surface)] border rounded-[var(--radius)] transition-all duration-[var(--transition)] animate-[fadeUp_0.35s_ease_forwards] overflow-hidden ${isFlagged ? "border-[var(--danger-dim)] hover:border-[var(--danger)]" : "border-[var(--border)] hover:border-[var(--border-bright)]"} hover:bg-[var(--bg-raised)]`}
                >
                  <Link
                    to={`/library/${v._id}`}
                    className="block p-4 pr-9 text-none"
                  >
                    <div className="flex items-start justify-between gap-[10px] mb-[10px]">
                      <span className="text-[0.82rem] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
                        {v.title}
                      </span>
                      <Badge
                        variant={
                          displayStatus === "completed"
                            ? "completed"
                            : displayStatus === "processing"
                              ? "processing"
                              : displayStatus === "failed"
                                ? "failed"
                                : "pending"
                        }
                      >
                        {displayStatus}
                      </Badge>
                    </div>

                    {liveJob && displayStatus === "processing" && (
                      <div className="h-[3px] bg-[var(--bg-overlay)] rounded-[2px] mb-[10px] overflow-hidden">
                        <div
                          className="h-full bg-[var(--info)] rounded-[2px] transition-all duration-[0.4s] ease-out"
                          style={{ width: `${liveJob.progress || 0}%` }}
                        />
                      </div>
                    )}

                    <div className="flex gap-[10px] flex-wrap text-[0.68rem] text-[var(--text-muted)] mb-2 font-mono">
                      <span>{fmt(v.fileSize)}</span>
                      {v.duration && <span>{fmtDur(v.duration)}</span>}
                      {v.width && (
                        <span>
                          {v.width}×{v.height}
                        </span>
                      )}
                    </div>

                    {v.sensitivityStatus !== "unanalysed" && (
                      <div className="mb-2">
                        <Badge
                          variant={
                            v.sensitivityStatus === "flagged"
                              ? "flagged"
                              : "safe"
                          }
                          dot
                        >
                          {v.sensitivityStatus}
                        </Badge>
                      </div>
                    )}

                    {v.tags?.length > 0 && (
                      <div className="flex gap-[6px] flex-wrap">
                        {v.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[0.65rem] bg-[var(--bg-overlay)] text-[var(--text-muted)] p-[2px_7px] rounded-[2px] tracking-wider"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>

                  <button
                    className="absolute top-[10px] right-[10px] bg-transparent border-none text-[var(--text-muted)] text-[0.75rem] w-[22px] h-[22px] rounded-[var(--radius-sm)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-[var(--transition)] hover:text-[var(--danger)] hover:bg-[var(--danger-glow)]"
                    onClick={() => setDeleteId(v._id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-4 p-[20px_0]">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                ← Prev
              </Button>
              <span className="text-[0.75rem] text-[var(--text-muted)] font-mono">
                Page {page} / {pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pages}
                onClick={() => load(page + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirm delete modal */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-bright)] rounded-[var(--radius-lg)] w-full max-w-[540px] max-height-[90vh] overflow-y-auto animate-[fadeUp_0.35s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-[20px_24px_16px] border-b border-[var(--border)]">
              <h3 className="font-[var(--font-display)] text-[1rem] font-bold">
                Delete video
              </h3>
              <button
                className="bg-transparent border-none text-[var(--text-muted)] text-[1rem] p-[4px_8px] rounded-[var(--radius-sm)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
                onClick={() => setDeleteId(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <p className="text-[0.85rem] text-[var(--text-secondary)]">
                This action cannot be undone. The video will be permanently
                deleted.
              </p>
              <div className="flex gap-[10px] justify-end">
                <Button variant="secondary" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(deleteId)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
