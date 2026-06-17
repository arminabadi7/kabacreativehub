import { useState, useEffect } from "react";
import { Copy, Check, Sparkles, RefreshCw, Hash, AlertCircle, Pencil, X, Save } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Caption remixer for the issue modal. Generates 10 reworded variations with
// swapped hashtags, persists them onto the issue (survives close/logout), and
// lets you edit each one. Talks to /api/ai/caption-remix and
// PUT /api/issues/:id/captions so the API key stays server-side.

const TONES = [
  { id: "keep", label: "Match original" },
  { id: "casual", label: "More casual" },
  { id: "professional", label: "More polished" },
  { id: "punchy", label: "Punchier" },
  { id: "playful", label: "Playful" },
];

interface Variation {
  caption: string;
  hashtags: string[];
}

interface CaptionsData {
  source?: string;
  tone?: string;
  variations?: Variation[];
}

interface CaptionRemixerProps {
  issueId?: string;
  initialCaption?: string;
  initialCaptions?: CaptionsData | null;
}

export function CaptionRemixer({ issueId, initialCaption = "", initialCaptions }: CaptionRemixerProps) {
  const [input, setInput] = useState(initialCaptions?.source || initialCaption);
  const [tone, setTone] = useState(initialCaptions?.tone || "keep");
  const [variations, setVariations] = useState<Variation[]>(initialCaptions?.variations || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [saving, setSaving] = useState(false);

  // Hydrate from persisted captions once they load (the parent fetches the issue async)
  useEffect(() => {
    if (initialCaptions) {
      if (initialCaptions.source !== undefined) setInput(initialCaptions.source || initialCaption);
      if (initialCaptions.tone) setTone(initialCaptions.tone);
      if (Array.isArray(initialCaptions.variations)) setVariations(initialCaptions.variations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCaptions]);

  const persist = async (nextVariations: Variation[], nextSource = input, nextTone = tone) => {
    if (!issueId) return;
    setSaving(true);
    try {
      await fetch(`/api/issues/${issueId}/captions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ source: nextSource, tone: nextTone, variations: nextVariations }),
      });
    } catch (err) {
      console.error("Failed to persist captions", err);
    } finally {
      setSaving(false);
      if (issueId) queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId] });
    }
  };

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setEditingIndex(null);

    try {
      const res = await fetch("/api/ai/caption-remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ caption: input, tone, issueId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setVariations(data.variations || []); // already persisted server-side
      if (issueId) queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId] });
    } catch (err: any) {
      setError(err.message || "Couldn't generate variations. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditCaption(variations[i].caption);
    setEditHashtags((variations[i].hashtags || []).join(" "));
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditCaption("");
    setEditHashtags("");
  };

  const saveEdit = async (i: number) => {
    const hashtags = editHashtags
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, "").trim())
      .filter(Boolean);
    const next = variations.map((v, idx) => (idx === i ? { caption: editCaption, hashtags } : v));
    setVariations(next);
    cancelEdit();
    await persist(next);
  };

  const copyVariation = (v: Variation, i: number) => {
    const tags = (v.hashtags || []).map((h) => `#${h}`).join(" ");
    const full = tags ? `${v.caption}\n\n${tags}` : v.caption;
    navigator.clipboard.writeText(full);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="text-slate-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Caption Remixer</span>
        </div>
        {saving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <RefreshCw size={11} className="animate-spin" /> Saving…
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-gray-400 text-sm mb-3">
        Generate 10 reworded versions with swapped hashtags. They're saved to this issue and you can edit any of them.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your caption here, including any hashtags…"
          rows={4}
          className="w-full resize-none rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-gray-400">Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="text-sm rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><RefreshCw size={15} className="animate-spin" />Generating…</>
            ) : (
              <><Sparkles size={15} />{variations.length > 0 ? "Regenerate 10" : "Generate 10 variations"}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {variations.length > 0 && (
        <div className="mt-4 space-y-3">
          {variations.map((v, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              {editingIndex === i ? (
                /* ── Edit mode ── */
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-semibold">{i + 1}</span>
                    <span className="text-xs text-gray-400">Editing</span>
                  </div>
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Hashtags (space or comma separated, no # needed)</label>
                    <input
                      value={editHashtags}
                      onChange={(e) => setEditHashtags(e.target.value)}
                      placeholder="fitness gym proteinshake"
                      className="w-full mt-1 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(i)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Save size={13} /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-semibold mb-2">{i + 1}</span>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{v.caption}</p>
                    {v.hashtags && v.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {v.hashtags.map((h, hi) => (
                          <span key={hi} className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-slate-600 dark:text-gray-300">
                            <Hash size={10} />{h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => copyVariation(v, i)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedIndex === i ? (
                        <><Check size={13} className="text-green-600" />Copied</>
                      ) : (
                        <><Copy size={13} />Copy</>
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(i)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Pencil size={13} />Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
