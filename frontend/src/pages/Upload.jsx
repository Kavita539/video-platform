import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { videosAPI } from "../services/api";
import { useProcessing } from "../context/ProcessingContext";
import { Input, Textarea } from "../components/FormControls";
import { ProgressBar } from "../components/ProgressBar";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";

const MAX_SIZE_MB = parseInt(import.meta.env.VITE_MAX_UPLOAD_MB || "500", 10);
const ACCEPT =
  "video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "" });
  const [uploadPct, setUploadPct] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | done | error
  const [error, setError] = useState("");
  const [resultVideo, setResultVideo] = useState(null);
  const fileInputRef = useRef(null);
  const { trackVideo, getJob } = useProcessing();
  const navigate = useNavigate();

  /* ── File selection ── */
  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("File must be a video.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_SIZE_MB} MB limit.`);
      return;
    }
    setFile(f);
    setError("");
    if (!form.title)
      setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setPhase("uploading");
    setUploadPct(0);

    const fd = new FormData();
    fd.append("video", file);
    fd.append("title", form.title || file.name);
    if (form.description) fd.append("description", form.description);
    if (form.tags) fd.append("tags", form.tags);

    try {
      const { data } = await videosAPI.upload(fd, setUploadPct);
      setResultVideo(data.video);
      trackVideo(data.video._id, "pending");
      setPhase("processing");
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again.",
      );
      setPhase("error");
    }
  };

  /* ── Live job state ── */
  const liveJob = resultVideo ? getJob(resultVideo._id) : null;
  const jobDone =
    liveJob?.status === "completed" || liveJob?.status === "failed";

  /* ── Reset ── */
  const reset = () => {
    setFile(null);
    setForm({ title: "", description: "", tags: "" });
    setUploadPct(0);
    setPhase("idle");
    setError("");
    setResultVideo(null);
  };

  /* ── Render phases ── */
  if (phase === "processing" || phase === "done") {
    return (
      <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
          <div>
            <h1 className="font-[var(--font-display)] text-[1.6rem] font-extrabold tracking-tight leading-snug">
              Processing
            </h1>
            <p className="text-[0.78rem] muted mt-1 tracking-wider">
              {resultVideo?.title}
            </p>
          </div>
        </div>

        <div className="max-w-[520px] surface border border rounded-[var(--radius-lg)] p-8 flex flex-col gap-7 animate-[fadeUp_0.35s_ease_forwards]">
          <div className="flex flex-col gap-3">
            {[
              { key: "upload", label: "Upload complete", done: true },
              { key: "probe", label: "Probing video metadata", pct: 10 },
              { key: "thumb", label: "Generating thumbnail", pct: 30 },
              { key: "analyse", label: "Sensitivity analysis", pct: 60 },
              { key: "complete", label: "Done", pct: 100 },
            ].map((s) => {
              const progress = liveJob?.progress || 0;
              const isActive =
                !s.done && progress >= s.pct - 30 && progress < s.pct;
              const isDone = s.done || progress >= s.pct;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-3 text-[0.80rem] transition-colors duration-[var(--transition)] ${isDone ? "secondary" : isActive ? "primary" : "muted"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-[var(--transition)] ${isDone ? "success" : isActive ? "info shadow-[0_0_8px_var(--info)] animate-[pulseDot_1s_ease_infinite]" : "border-bright"}`}
                  />
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="py-1">
            <ProgressBar
              value={phase === "processing" ? liveJob?.progress || 0 : 100}
              variant={
                liveJob?.status === "failed"
                  ? "failed"
                  : liveJob?.status === "completed"
                    ? "completed"
                    : "processing"
              }
              label={liveJob?.stage || "Waiting for server…"}
            />
          </div>

          {jobDone && (
            <div className="pt-1 flex flex-col gap-5 animate-[fadeIn_0.2s_ease]">
              {liveJob.status === "completed" ? (
                <>
                  <div className="flex items-start gap-3.5 p-[14px_16px] rounded-[var(--radius)] text-[0.82rem] bg-[rgba(63,207,142,0.08)] border border-[rgba(63,207,142,0.2)]">
                    <span className="text-[1.2rem] flex-shrink-0 leading-[1.4] success">
                      ✓
                    </span>
                    <div>
                      <strong className="block mb-1">
                        Processing complete
                      </strong>
                      <p className="muted flex items-center gap-1.5 flex-wrap">
                        Content classified as{" "}
                        <Badge
                          variant={
                            liveJob.sensitivityStatus === "flagged"
                              ? "flagged"
                              : "safe"
                          }
                        >
                          {liveJob.sensitivityStatus || "safe"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/library/${resultVideo._id}`)}
                    >
                      Watch video →
                    </Button>
                    <Button variant="secondary" onClick={reset}>
                      Upload another
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3.5 p-[14px_16px] rounded-[var(--radius)] text-[0.82rem] bg-[var(--danger-glow)] border border-[var(--danger-dim)]">
                  <span className="text-[1.2rem] flex-shrink-0 leading-[1.4] danger">
                    ✕
                  </span>
                  <div>
                    <strong className="block mb-1">Processing failed</strong>
                    <p className="muted flex items-center gap-1.5 flex-wrap">
                      {liveJob.message ||
                        "An error occurred during processing."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-[1.6rem] font-extrabold tracking-tight leading-snug">
            Upload video
          </h1>
          <p className="text-[0.78rem] muted mt-1 tracking-wider">
            MP4, WebM, MOV, AVI, MKV · Max {MAX_SIZE_MB} MB
          </p>
        </div>
      </div>

      <form
        className="max-w-[640px] flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        {/* Drop zone */}
        <div
          className={`group border-2 border-dashed rounded-[var(--radius-lg)] text-center cursor-pointer transition-colors duration-[var(--transition)] surface ${dragging ? "accent bg-[var(--accent-glow)]" : "border-bright hover:accent hover:bg-[var(--accent-glow)]"} ${file ? "border-solid accent p-[20px_24px] cursor-default" : "p-[48px_24px]"}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {file ? (
            <div className="flex items-center gap-3.5">
              <span className="text-[1.5rem] accent flex-shrink-0">
                ▶
              </span>
              <div className="flex-1 text-left min-w-0">
                <span className="block text-[0.85rem] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {file.name}
                </span>
                <span className="text-[0.72rem] muted">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button
                type="button"
                className="bg-transparent border-none muted text-[0.9rem] p-1.5 rounded-[var(--radius-sm)] transition-colors duration-[var(--transition)] hover:danger hover:bg-[var(--danger-glow)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <span
                className={`text-[2rem] muted ${dragging ? "accent" : ""}`}
              >
                ⬆
              </span>
              <span className="text-[0.82rem] secondary">
                Drop video here or{" "}
                <u className="accent no-underline group-hover:underline">
                  browse
                </u>
              </span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-3.5">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Video title"
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Brief description…"
          />
          <Input
            label="Tags (optional, comma-separated)"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="marketing, product, 2024"
          />
        </div>

        {error && (
          <p className="text-[0.78rem] danger bg-[var(--danger-glow)] border border-[var(--danger-dim)] p-[8px_12px] rounded-[var(--radius-sm)]">
            {error}
          </p>
        )}

        {phase === "uploading" && (
          <div className="py-1 animate-[fadeIn_0.2s_ease]">
            <ProgressBar value={uploadPct} label="Uploading to server…" />
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={phase === "uploading"}
          disabled={!file}
          className="w-full justify-center"
        >
          {phase === "uploading"
            ? `Uploading ${uploadPct}%`
            : "Upload & process"}
        </Button>
      </form>
    </div>
  );
}
