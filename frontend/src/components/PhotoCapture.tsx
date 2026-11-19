import { useEffect, useRef, useState } from "react";
import { analyzePhoto } from "../api/endpoints";
import type { PhotoAnalysis } from "../api/types";
import { downscaleToJpeg, fileToJpeg } from "../lib";

interface Props {
  onResult: (analysis: PhotoAnalysis, photo: string) => void;
}

/** Camera or upload -> one analysis request; the result goes to the form for review. */
export function PhotoCapture({ onResult }: Props) {
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");

  const release = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  const stop = () => { release(); setLive(false); setReady(false); };
  useEffect(() => release, []);

  const analyze = async (getPhoto: () => string | Promise<string>) => {
    setBusy(true); setError(null);
    try {
      const photo = await getPhoto();
      onResult(await analyzePhoto(photo), photo);
    } catch (e) {
      setError((e as Error).message || "Bild konnte nicht verarbeitet werden");
    } finally {
      setBusy(false);
    }
  };

  const start = async (id = "") => {
    setError(null); setReady(false);
    // getUserMedia exists only on https or localhost.
    if (!navigator.mediaDevices) return setError("Kamera nur über https oder localhost verfügbar. Bitte ein Bild hochladen.");
    release();
    try {
      // Prefer the rear camera unless a device was chosen.
      const wanted: MediaTrackConstraints = id ? { deviceId: { exact: id } } : { facingMode: { ideal: "environment" } };
      stream.current = await navigator.mediaDevices.getUserMedia({ video: wanted });
    } catch {
      return setError("Kein Kamerazugriff. Bitte Berechtigung erteilen oder ein Bild hochladen.");
    }
    // Device labels are empty until permission is granted.
    const all = await navigator.mediaDevices.enumerateDevices();
    setCameras(all.filter((d) => d.kind === "videoinput"));
    setDeviceId(stream.current.getVideoTracks()[0]?.getSettings().deviceId ?? "");
    setLive(true);
  };

  // Callback ref so the stream attaches as soon as <video> mounts.
  const attach = (el: HTMLVideoElement | null) => {
    video.current = el;
    if (el && stream.current && el.srcObject !== stream.current) {
      el.srcObject = stream.current;
      el.muted = true;
      el.play().catch(() => setError("Kamera-Vorschau konnte nicht gestartet werden."));
    }
  };

  const capture = () => {
    const v = video.current!;
    // Size is 0 before the first frame.
    if (!v.videoWidth) return setError("Kamerabild noch nicht bereit, bitte kurz warten.");
    const photo = downscaleToJpeg(v, v.videoWidth, v.videoHeight);
    stop();
    void analyze(() => photo);
  };

  return (
    <div className="card form">
      <div className="row">
        <button type="button" onClick={live ? stop : () => void start()} disabled={busy}>{live ? "Kamera aus" : "Kamera"}</button>
        <label className="button file-button">
          Bild hochladen
          <input
            type="file" accept="image/*" hidden disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void analyze(() => fileToJpeg(file));
            }}
          />
        </label>
      </div>
      {live && (
        <>
          {cameras.length > 1 && (
            <select value={deviceId} onChange={(e) => void start(e.target.value)} aria-label="Kamera wählen">
              {cameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Kamera ${i + 1}`}</option>)}
            </select>
          )}
          <video ref={attach} className="camera" playsInline muted onLoadedData={() => setReady(true)} />
          <button type="button" className="primary" disabled={!ready} onClick={capture}>Aufnehmen &amp; analysieren</button>
        </>
      )}
      {busy && <p className="muted">Analysiere Foto …</p>}
      {error && <p className="error">{error}</p>}
      <p className="muted">Das Ergebnis erscheint unten im Formular und kann vor dem Hinzufügen angepasst werden.</p>
    </div>
  );
}
