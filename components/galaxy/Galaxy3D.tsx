"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

export interface PlanetMesh { slug: string; label: string; surface: string; accent: string; ring?: string; moons?: number; locked: boolean }

const SPACING = 9;
const posOf = (i: number) => new THREE.Vector3(i * SPACING, Math.sin(i * 1.7) * 1.2, Math.cos(i * 1.3) * 2);

function planetGroup(p: PlanetMesh): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(2.2, 1);
  // per-face color jitter between surface and accent for a faceted low-poly look
  const base = new THREE.Color(p.surface);
  const accent = new THREE.Color(p.accent);
  const colors: number[] = [];
  const pos = geo.attributes.position;
  for (let f = 0; f < pos.count; f += 3) {
    const c = base.clone().lerp(accent, ((Math.sin(f * 12.9898) * 43758.5453) % 1 + 1) % 1 > 0.72 ? 0.65 : Math.random() * 0.15);
    if (p.locked) c.multiplyScalar(0.35);
    for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const body = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  body.name = "body";
  g.add(body);
  if (p.ring) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.9, 3.8, 24, 1), new THREE.MeshLambertMaterial({ color: new THREE.Color(p.ring).multiplyScalar(p.locked ? 0.35 : 1), side: THREE.DoubleSide, flatShading: true }));
    ring.rotation.x = Math.PI / 2.4;
    g.add(ring);
  }
  for (let m = 0; m < (p.moons ?? 0); m++) {
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + m * 0.1, 0), new THREE.MeshLambertMaterial({ color: p.locked ? 0x444444 : 0xdddddd, flatShading: true }));
    moon.userData.orbit = { r: 3.4 + m * 0.9, speed: 0.6 - m * 0.15, phase: m * 2.1 };
    moon.name = "moon";
    g.add(moon);
  }
  return g;
}

export function Galaxy3D({ planets, selected, onSelect }: { planets: PlanetMesh[]; selected: number; onSelect(i: number): void }) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const focusRef = useRef<(i: number) => void>(() => {});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(1);
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", imageRendering: "pixelated" });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0716);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff0dd, 2.6);
    sun.position.set(-6, 5, 8);
    scene.add(sun);

    // starfield
    const starGeo = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < 900; i++) pts.push((Math.random() - 0.3) * 160, (Math.random() - 0.5) * 80, -20 - Math.random() * 120);
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff2c0, size: 1.6, sizeAttenuation: false }));
    scene.add(stars);

    const groups = planets.map((p, i) => {
      const g = planetGroup(p);
      g.position.copy(posOf(i));
      g.userData.index = i;
      scene.add(g);
      return g;
    });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(Math.max(64, Math.floor(w / 2)), Math.max(48, Math.floor(h / 2)), false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const focus = posOf(selected).clone();
    focusRef.current = (i) => {
      const p = posOf(i);
      gsap.to(focus, { x: p.x, y: p.y, z: p.z, duration: 1, ease: "power2.inOut" });
      gsap.fromTo(groups[i].scale, { x: 0.8, y: 0.8, z: 0.8 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(3)" });
    };

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let o: THREE.Object3D | null = ray.intersectObjects(groups, true)[0]?.object ?? null;
      while (o && o.userData.index === undefined) o = o.parent;
      return o ? (o.userData.index as number) : -1;
    };
    const onMove = (e: PointerEvent) => { el.style.cursor = pick(e) >= 0 ? "pointer" : "default"; };
    const onUp = (e: PointerEvent) => { const i = pick(e); if (i >= 0) onSelectRef.current(i); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);

    const t0 = performance.now();
    const tmp = new THREE.Vector3();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      groups.forEach((g, i) => {
        g.getObjectByName("body")!.rotation.y = t * 0.25 + i;
        g.position.y = posOf(i).y + Math.sin(t * 0.8 + i) * 0.2;
        g.children.filter((c) => c.name === "moon").forEach((m) => {
          const o = m.userData.orbit as { r: number; speed: number; phase: number };
          m.position.set(Math.cos(t * o.speed + o.phase) * o.r, Math.sin(t * o.speed + o.phase) * 0.6, Math.sin(t * o.speed + o.phase) * o.r);
        });
      });
      stars.rotation.z = t * 0.004;
      camera.position.set(focus.x + Math.sin(t * 0.2) * 0.8, focus.y + 1.6, focus.z + 10.5);
      camera.lookAt(focus.x, focus.y, focus.z);
      renderer.render(scene, camera);
      const w = el.clientWidth, h = el.clientHeight;
      groups.forEach((g, i) => {
        const lab = labels.current[i];
        if (!lab) return;
        tmp.copy(g.position).setY(g.position.y + 3.4).project(camera);
        lab.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${Math.max(28, ((1 - tmp.y) / 2) * h)}px)`;
        lab.style.opacity = tmp.z < 1 && Math.abs(tmp.x) < 1.15 ? "1" : "0";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    focusRef.current(selected);
  }, [selected]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      {planets.map((p, i) => (
        <div
          key={p.slug}
          ref={(e) => { labels.current[i] = e; }}
          className="pixel"
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", fontSize: 10, whiteSpace: "nowrap", padding: "4px 6px", background: i === selected ? "var(--gold)" : "var(--p0)", color: i === selected ? "var(--p0)" : "var(--p3)", boxShadow: "0 0 0 2px var(--p0)" }}
        >
          {p.locked ? "🔒 " : ""}{p.label}
        </div>
      ))}
    </div>
  );
}
