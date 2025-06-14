"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";

export default function Home() {
  const [message, setMessage] = useState("Drop your Letterboxd export (.zip)");

  const [list,   setList]   = useState<{ director:string; avg:number; films:number }[]>([]);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
  const file = files[0];
  if (!file) return;

  setLoading(true);
  setMessage("Unzipping your file…");
    const ab = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(ab);

const ratingsFile = zip.file("ratings.csv");

if (!ratingsFile) {
  setMessage("ZIP must contain ratings.csv");
  return;
}
const ratingsText = await ratingsFile.async("string");

    setMessage("Loading…");
    
    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: ratingsText,
    });

  if (!res.ok) { setMessage("Server error – try again"); setLoading(false); return; }

  const { toplist } = await res.json();
  setList(toplist);
  setMessage("");                 // clear banner
  setLoading(false);
}, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
           ${isDragActive ? "bg-neutral-800" : "bg-neutral-900"}`}>
        <input {...getInputProps()} />
        {loading && <p>{message}</p>}
        {!loading && list.length === 0 && <p>Drop your Letterboxd export (.zip)</p>}
  
        {/* render list when ready */}
        {!loading && list.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">🎬 Your top directors</h2>
            <ol className="text-left list-decimal list-inside space-y-1">
              {list.map(({ director, avg, films }, i) => (
                <li key={i}>
                  {director} — {avg.toFixed(2)} ★ ({films} films)
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm opacity-70">(minimum 4 films counted)</p>
          </>
        )}
      </div>
    </main>
  );
}
