import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { videosAPI } from "../services/api";
import { useProcessing } from "../context/ProcessingContext";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/FormControls";
import { ProgressBar } from "../components/ProgressBar";

function fmt(bytes) {
  if (!bytes) return "—";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
function fmtDur(sec) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { getJob, trackVideo } = useProcessing();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    videosAPI
      .getOne(id)
      .then(({ data }) => {
        setVideo(data.video);
        setEditForm({
          title: data.video.title,
          description: data.video.description || "",
          tags: (data.video.tags || []).join(", "),
        });
        if (
          data.video.processingStatus !== "completed" &&
          data.video.processingStatus !== "failed"
        ) {
          trackVideo(id, data.video.processingStatus);
        }
      })
      .catch(() => setError("Video not found or access denied."))
      .finally(() => setLoading(false));
  }, [id]);

  // Merge live job data
  const liveJob = getJob(id);
  const displayStatus = liveJob?.status || video?.processingStatus;
  const isReady = displayStatus === "completed";
  const isProcessing =
    displayStatus === "processing" || displayStatus === "pending";

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await videosAPI.update(id, {
        title: editForm.title,
        description: editForm.description,
        tags: editForm.tags,
      });
      setVideo(data.video);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    await videosAPI.delete(id);
    navigate("/library");
  };

  if (loading)
    return (
      <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
        <div className="flex flex-col items-center justify-center gap-5 min-height-[60vh] text-[var(--text-secondary)] text-[0.85rem]">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
        <div className="flex flex-col items-center justify-center gap-5 min-height-[60vh] text-[var(--text-secondary)] text-[0.85rem]">
          <p>{error}</p>
          <Link
            to="/library"
            className="bg-transparent border border-[var(--border)] text-[var(--text-secondary)] font-[var(--font-mono)] text-[0.72rem] p-[7px_14px] rounded-[var(--radius-sm)] tracking-[0.04em] uppercase hover:bg-[var(--bg-raised)] transition-colors duration-[var(--transition)]"
          >
            ← Back to library
          </Link>
        </div>
      </div>
    );

  return (
    <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[0.75rem] text-[var(--text-muted)]">
        <Link
          to="/library"
          className="text-[var(--accent)] transition-opacity duration-[var(--transition)] hover:opacity-70"
        >
          Library
        </Link>
        <span className="text-[var(--border-bright)]">/</span>
        <span className="text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
          {video.title}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-7 items-start">
        {/* ── Left: player / processing ── */}
        <div className="w-full">
          {isReady ? (
            <div className="bg-black rounded-[var(--radius)] overflow-hidden border border-[var(--border)] aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full block outline-none [&::-webkit-media-controls-panel]:bg-[rgba(13,14,16,0.9)]"
                controls
                preload="metadata"
                src={videosAPI.streamUrl(id)}
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : isProcessing ? (
            <div className="aspect-video bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-[2rem] text-[var(--info)] animate-spin">
                ⟳
              </div>
              <p className="text-[0.85rem] text-[var(--text-secondary)] tracking-[0.04em]">
                {liveJob?.stage || "Processing…"}
              </p>
              <div className="w-full max-w-[320px]">
                <ProgressBar
                  value={liveJob?.progress || 0}
                  variant="processing"
                />
              </div>
              <p className="text-[0.72rem] text-[var(--text-muted)]">
                Real-time updates via WebSocket
              </p>
            </div>
          ) : (
            <div className="aspect-video bg-[var(--bg-surface)] border border-[var(--danger-dim)] rounded-[var(--radius)] flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-[2rem] text-[var(--danger)]">✕</div>
              <p className="text-[0.85rem] text-[var(--text-secondary)] tracking-[0.04em]">
                Processing failed
              </p>
              {video.processingError && (
                <p className="text-[0.72rem] text-[var(--text-muted)]">
                  {video.processingError}
                </p>
              )}
            </div>
          )}

          {/* Sensitivity banner */}
          {video.sensitivityStatus !== "unanalysed" && (
            <div
              className={`flex items-start gap-3 p-[12px_16px] rounded-[var(--radius)] mt-3 text-[0.80rem] ${video.sensitivityStatus === "flagged" ? "bg-[var(--danger-glow)] border border-[var(--danger-dim)]" : "bg-[rgba(63,207,142,0.08)] border border-[rgba(63,207,142,0.2)]"}`}
            >
              <span
                className={`text-[1rem] leading-[1.5] flex-shrink-0 ${video.sensitivityStatus === "flagged" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
              >
                {video.sensitivityStatus === "flagged" ? "⚠" : "✓"}
              </span>
              <div>
                <strong className="block mb-0.5">
                  {video.sensitivityStatus === "flagged"
                    ? "Content flagged"
                    : "Content is safe"}
                </strong>
                {video.sensitivityScore != null && (
                  <span className="text-[0.72rem] text-[var(--text-muted)] ml-2">
                    Confidence: {(video.sensitivityScore * 100).toFixed(0)}%
                  </span>
                )}
                {video.sensitivityReason && (
                  <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">
                    {video.sensitivityReason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: metadata ── */}
        <aside className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[22px] flex flex-col gap-[18px] md:sticky md:top-6">
          {editing ? (
            <div className="flex flex-col gap-3.5 animate-[fadeIn_0.2s_ease]">
              <Input
                label="Title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              <Textarea
                label="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <Input
                label="Tags (comma-separated)"
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="marketing, product"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2.5">
                <h1 className="font-[var(--font-display)] text-[1rem] font-bold leading-[1.35]">
                  {video.title}
                </h1>
                {canEdit && (
                  <button
                    className="bg-transparent border-none text-[var(--accent)] font-[var(--font-mono)] text-[0.72rem] cursor-pointer p-[4px_8px] rounded-[var(--radius-sm)] whitespace-nowrap transition-colors duration-[var(--transition)] hover:bg-[var(--accent-glow)]"
                    onClick={() => setEditing(true)}
                  >
                    ✎ Edit
                  </button>
                )}
              </div>

              {video.description && (
                <p className="text-[0.80rem] text-[var(--text-secondary)] leading-[1.6]">
                  {video.description}
                </p>
              )}
            </>
          )}

          {/* Status badges */}
          <div className="flex gap-1.5 flex-wrap">
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
              dot={isProcessing}
            >
              {displayStatus}
            </Badge>
            {video.sensitivityStatus !== "unanalysed" && (
              <Badge
                variant={
                  video.sensitivityStatus === "flagged" ? "flagged" : "safe"
                }
              >
                {video.sensitivityStatus}
              </Badge>
            )}
          </div>

          {/* Metadata table */}
          <div className="flex flex-col border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
            {[
              ["File", video.originalName],
              ["Size", fmt(video.fileSize)],
              ["Duration", fmtDur(video.duration)],
              [
                "Resolution",
                video.width ? `${video.width}×${video.height}` : "—",
              ],
              ["Codec", video.codec || "—"],
              ["FPS", video.fps ? video.fps.toFixed(2) : "—"],
              [
                "Uploaded",
                new Date(video.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              ],
              ["Owner", video.owner?.name || "—"],
            ].map(([k, v], idx) => (
              <div
                key={k}
                className={`flex items-baseline justify-between gap-3 p-[7px_12px] text-[0.72rem] border-b border-[var(--border)] last:border-b-0 ${idx % 2 === 0 ? "bg-[var(--bg-raised)]" : ""}`}
              >
                <span className="text-[var(--text-muted)] tracking-[0.04em] flex-shrink-0">
                  {k}
                </span>
                <span className="text-[var(--text-secondary)] text-right break-all font-mono">
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {video.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {video.tags.map((t) => (
                <span
                  key={t}
                  className="text-[0.68rem] tracking-[0.04em] p-[3px_8px] bg-[var(--bg-raised)] text-[var(--text-muted)] rounded-[var(--radius-sm)] border border-[var(--border)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="pt-1">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete video
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
