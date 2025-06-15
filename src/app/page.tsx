"use client";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { useDropzone } from "react-dropzone";

type Mode = "upload" | "result";

export default function Home() {
  /* state */
  const [mode,      setMode]      = useState<Mode>("upload");
  const [fileText,  setFileText]  = useState("");
  const [top,       setTop]       = useState<{director:string;avg:number;films:number}[]>([]);
  const [minFilms,  setMinFilms]  = useState(3);
  const [loading,   setLoading]   = useState(false);
  const [message,   setMessage]   = useState("Drop your Letterboxd export (.zip)");

  /* ─────────  fetch helper  ───────── */
  const analyse = useCallback(async () => {
    if (!fileText) return;
    setLoading(true);
    const res = await fetch(`/api/analyse?min=${minFilms}`, {
      method:  "POST",
      headers: { "Content-Type": "text/plain" },
      body:    fileText,
    });
    const json = await res.json();
    setTop(json.toplist);
    setLoading(false);
    setMode("result");
  }, [fileText, minFilms]);

  /* re-analyse live when minFilms changes in result mode */
  useEffect(() => {
    if (mode === "result") analyse();
  }, [minFilms]);            // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────  Dropzone  ───────── */
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const zip  = await JSZip.loadAsync(await file.arrayBuffer());
    const ratings = zip.file("ratings.csv");
    if (!ratings) { setMessage("ZIP must contain ratings.csv"); return; }
    setFileText(await ratings.async("string"));
    analyse();
  }, [analyse]);

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({ onDrop, disabled: mode !== "upload" });

  /* reset */
  function reset() {
    setMode("upload");
    setTop([]);
    setMessage("Drop your Letterboxd export (.zip)");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      {mode === "result" && (
        <button
          onClick={reset}
          className="fixed top-4 left-4 z-50 bg-neutral-800 border-2 border-solid rounded px-4 py-1 text-sm cursor-pointer"
        >
           Upload
        </button>
      )}

      {/* upload zone */}
      {mode === "upload" && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                      ${isDragActive ? "bg-neutral-800" : "bg-neutral-900"}`}
        >
          <input {...getInputProps()} />
          {loading ? <p>Analysing…</p> : <p>{message}</p>}
        </div>
      )}

      {/* result zone */}
      {mode === "result" && (
        <div className="relative border-2 border-solid rounded-xl bg-neutral-900 p-8 max-w-lg w-full">
        
          {/* selector (now only visible in result mode) */}
          <label className="flex items-center gap-2 mb-4 font-medium">
            Minimum films counted&nbsp;
            <select
              value={minFilms}
              onChange={e => setMinFilms(Number(e.target.value))}
              className="bg-neutral-800 border-dashed rounded px-1 py-1"
            >
              {Array.from({ length: 8 }, (_, i) => i + 3).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          {/* list */}
          <h2 className="text-lg font-semibold mb-4 text-center">🎬 Your top directors</h2>
          <ol className="list-decimal list-inside space-y-1">
            {top.map(({ director, avg, films }) => (
              <li key={director}>
                {director} — {avg.toFixed(2)} ★ ({films} films)
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  );
}
