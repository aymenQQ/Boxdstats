"use client";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
//import tutorialgif from "./gif/tutorial.gif";


type Mode = "upload" | "result";

export default function Home() {
  const [mode,      setMode]      = useState<Mode>("upload");
  const [fileText,  setFileText]  = useState("");
  const [top,       setTop]       = useState<{director:string;avg:number;films:number}[]>([]);
  const [minFilms,  setMinFilms]  = useState(3);
  const [loading,   setLoading]   = useState(false);
  const [message,   setMessage]   = useState("Drop your Letterboxd export (.zip)");

  const analyse = useCallback(
    async () => {
    if (!fileText) return;
    setLoading(true);
    const response = await fetch(`/api/analyse?min=${minFilms}`, {
      method:  "POST",
      headers: { "Content-Type": "text/plain" },
      body:    fileText,
    });
    const json = await response.json();
    setTop(json.toplist);
    setLoading(false);
    setMode("result");
    }, 
    [fileText, minFilms]);

  useEffect(() => {
    if (mode === "result") analyse();
    }, 
    [mode, analyse]);

  const onDrop = useCallback(
    async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const zip  = await JSZip.loadAsync(await file.arrayBuffer());
    const ratings = zip.file("ratings.csv");
    if (!ratings) { setMessage("ZIP must contain ratings.csv"); return; }
    setFileText(await ratings.async("string"));
  }, []);

  useEffect(() => {
    if (fileText != "" && mode === "upload") analyse();
  }, [fileText, minFilms]);

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({ onDrop, disabled: mode !== "upload" });

  function reset() {
    setMode("upload");
    setTop([]);
    setFileText("");
    setMessage("Drop your Letterboxd export (.zip)");
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-white p-6">
      {mode === "result" && (
        <button
          onClick={reset}
          className="fixed top-4 left-4 z-50 bg-neutral-800 border-2 border-solid rounded px-4 py-1 text-sm cursor-pointer"
        >
           Reset
        </button>
      )}

{mode === "upload" && (
  <div className="relative flex flex-col items-center w-full max-w-2xl">
    
    <Image
      src="/gif/tutorial.gif"
      width={500} height={281}
      alt="How to export your Letterboxd data"
      priority
      className="w-full max-w-lg md:max-w-xl lg:max-w-2xl h-auto rounded-lg shadow-lg mb-6 md:mb-8"
    />
    
    <div
      {...getRootProps()}
      className={`border-2 rounded-xl p-8 md:p-12 text-center cursor-pointer w-full ${
        isDragActive ? "bg-neutral-800" : "bg-neutral-900"
      }`}
    >
      <input {...getInputProps()} />
      {loading ? <p>Analysing…</p> : <p>{message}</p>}
    </div>
  </div>
)}

      {mode === "result" && (
        <div className="relative border-2 border-solid rounded-xl bg-neutral-900 p-6 md:p-8 w-full max-w-md">
        
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

          <h2 className="text-lg font-semibold mb-4 text-center">🎬 Your top rated directors</h2>
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
