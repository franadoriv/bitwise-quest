"use client";
import { createContext, useContext, useLayoutEffect, useState } from "react";

// Logical canvas the UI is designed for. The frame is scaled with CSS zoom to fit the viewport.
const LANDSCAPE = { w: 1280, h: 720 };
const PORTRAIT_W = 480;

type Orientation = "landscape" | "portrait";
const OrientationCtx = createContext<Orientation>("landscape");
export const useOrientation = () => useContext(OrientationCtx);

export function GameFrame({ children }: { children: React.ReactNode }) {
  const [box, setBox] = useState({ w: LANDSCAPE.w, h: LANDSCAPE.h, zoom: 1, o: "landscape" as Orientation, ready: false });

  useLayoutEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw / vh >= 1.15) {
        setBox({ ...LANDSCAPE, zoom: Math.min(vw / LANDSCAPE.w, vh / LANDSCAPE.h), o: "landscape", ready: true });
      } else {
        const zoom = vw / PORTRAIT_W;
        setBox({ w: PORTRAIT_W, h: vh / zoom, zoom, o: "portrait", ready: true });
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <OrientationCtx.Provider value={box.o}>
      <div className="game-viewport">
        <div
          className={`game-frame ${box.o}`}
          data-orientation={box.o}
          style={{ width: box.w, height: box.h, zoom: box.zoom, visibility: box.ready ? "visible" : "hidden" }}
        >
          {children}
        </div>
      </div>
    </OrientationCtx.Provider>
  );
}
