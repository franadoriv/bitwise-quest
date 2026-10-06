"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { MoonShape } from "@/lib/content/types";

export interface PlanetMesh {
  slug: string; label: string; surface: string; accent: string; ring?: string;
  /** Decorative moons. */
  moons?: number;
  /** Framework moons (playable): bigger, colored, orbit first. */
  frameworkMoons?: { color: string; locked: boolean; shape?: MoonShape; label?: string }[];
  locked: boolean;
}

/** Which world to dive into: a planet, or one of its framework moons. */
export interface Landing { planet: number; moon?: number }

const edges = (geo: THREE.BufferGeometry, color = 0xfff8ea) =>
  new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color }));

/** A framework moon whose shape hints at what it teaches. Parts named "spin" rotate on their own. */
function moonMesh(shape: MoonShape | undefined, color: THREE.Color, locked: boolean): THREE.Object3D {
  const mat = () => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const line = locked ? 0x777777 : 0xfff8ea;
  const g = new THREE.Group();
  switch (shape) {
    case "atom": {
      // React: a nucleus with electron orbits
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), mat()));
      [0, Math.PI / 3, -Math.PI / 3].forEach((tilt) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 4, 20), new THREE.MeshLambertMaterial({ color: locked ? 0x666666 : 0xfff8ea, flatShading: true }));
        ring.rotation.set(Math.PI / 2, tilt, 0);
        g.add(ring);
      });
      g.name = "spin";
      break;
    }
    case "tetra": {
      // WebGL: the triangle, the GPU's basic primitive
      const geo = new THREE.TetrahedronGeometry(0.85);
      const m = new THREE.Mesh(geo, mat());
      m.add(edges(geo, line));
      m.name = "spin";
      g.add(m);
      break;
    }
    case "cube": {
      // three.js: a wireframe-edged cube, the "hello world" of every scene
      const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
      const m = new THREE.Mesh(geo, mat());
      m.add(edges(geo, line));
      m.name = "spin";
      g.add(m);
      break;
    }
    case "wheel": {
      // Rails: a locomotive wheel with spokes, rolling along its orbit
      const wheel = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.12, 4, 14), mat());
      wheel.add(rim);
      for (let k = 0; k < 4; k++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: locked ? 0x555555 : 0xb9c2cc, flatShading: true }));
        spoke.rotation.z = (k * Math.PI) / 4;
        wheel.add(spoke);
      }
      wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8).rotateX(Math.PI / 2), mat()));
      wheel.name = "roll";
      g.add(wheel);
      break;
    }
    default:
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), mat()));
  }
  return g;
}

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
  const fw = p.frameworkMoons ?? [];
  fw.forEach((fm, m) => {
    const c = new THREE.Color(fm.color);
    if (fm.locked) c.multiplyScalar(0.4);
    const moon = moonMesh(fm.shape, c, fm.locked);
    moon.userData.orbit = { r: 3.7 + m * 1.2, speed: 0.45 - m * 0.08, phase: m * 2.4 };
    moon.userData.framework = m;
    moon.name = "moon";
    g.add(moon);
  });
  for (let m = 0; m < (p.moons ?? 0); m++) {
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + m * 0.1, 0), new THREE.MeshLambertMaterial({ color: p.locked ? 0x444444 : 0xdddddd, flatShading: true }));
    moon.userData.orbit = { r: 3.6 + (fw.length + m) * 1.0, speed: 0.6 - m * 0.15, phase: m * 2.1 + 1 };
    moon.name = "moon";
    g.add(moon);
  }
  return g;
}

export function Galaxy3D({ planets, selected, selectedMoon = null, onSelect, onSwipe, landing }: {
  planets: PlanetMesh[];
  selected: number;
  /** Framework moon of the selected planet that is in focus (null: the planet itself). */
  selectedMoon?: number | null;
  /** A planet (and maybe one of its framework moons) was tapped. */
  onSelect(i: number, moon?: number): void;
  onSwipe?(dir: 1 | -1): void;
  landing?: Landing | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const moonLabels = useRef<(HTMLDivElement | null)[]>([]);
  const view = useRef({ planet: selected, moon: selectedMoon });
  view.current = { planet: selected, moon: selectedMoon };
  const moonFocusRef = useRef<(moon: number | null) => void>(() => {});
  const focusRef = useRef<(i: number) => void>(() => {});
  const landRef = useRef<(l: Landing) => void>(() => {});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

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

    // The focus point glides toward the selected planet, or follows the selected moon on its orbit.
    const focus = posOf(selected).clone();
    const focusTarget = new THREE.Vector3();
    focusRef.current = (i) => {
      gsap.fromTo(groups[i].scale, { x: 0.8, y: 0.8, z: 0.8 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(3)" });
    };
    const moonOf = (planet: number, moon: number | null | undefined) =>
      moon == null ? null : groups[planet]?.children.find((c) => c.name === "moon" && c.userData.framework === moon) ?? null;

    // Camera rig: distance and height from the focus, field of view and a sideways drag offset.
    const cam = { dist: 10.5, lift: 1.6, fov: 40, drag: 0, landing: false };
    let landTarget: THREE.Object3D | null = null;
    moonFocusRef.current = (moon) => {
      // Get closer to a moon so its shape reads; back out to the whole system for the planet.
      gsap.to(cam, moon == null ? { dist: 10.5, lift: 1.6, duration: 0.8, ease: "power2.inOut" } : { dist: 5.2, lift: 0.9, duration: 0.8, ease: "power2.inOut" });
      const target = moonOf(view.current.planet, moon);
      if (target) gsap.fromTo(target.scale, { x: 0.6, y: 0.6, z: 0.6 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(3)" });
    };
    landRef.current = (l) => {
      const g = groups[l.planet];
      landTarget = l.moon == null ? g : (g.children.find((c) => c.name === "moon" && c.userData.framework === l.moon) ?? g);
      cam.landing = true;
      // Dive in while the field of view widens: the planet rushes up like a landing.
      gsap.to(cam, { dist: l.moon == null ? 2.6 : 1.2, lift: 0.15, fov: 82, drag: 0, duration: 0.9, ease: "power3.in" });
    };

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    /** What is under the pointer: a planet index (-1 for nothing) and, if hit, its framework moon. */
    const pickAt = (e: PointerEvent): { planet: number; moon?: number } => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let o: THREE.Object3D | null = ray.intersectObjects(groups, true)[0]?.object ?? null;
      let moon: number | undefined;
      while (o && o.userData.index === undefined) {
        if (o.name === "moon" && typeof o.userData.framework === "number") moon = o.userData.framework as number;
        o = o.parent;
      }
      return o ? { planet: o.userData.index as number, moon } : { planet: -1 };
    };
    const pick = (e: PointerEvent) => pickAt(e).planet;
    // Tap a planet to select it; swipe (or drag with the mouse) to move through the galaxy.
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: PointerEvent) => {
      if (down) {
        cam.drag = -(e.clientX - down.x) / Math.max(1, el.clientWidth) * 6;
        el.style.cursor = "grabbing";
        return;
      }
      el.style.cursor = pick(e) >= 0 ? "pointer" : "default";
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      gsap.to(cam, { drag: 0, duration: 0.35, ease: "power2.out" });
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) onSwipeRef.current?.(dx < 0 ? 1 : -1);
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        const hit = pickAt(e);
        if (hit.planet >= 0) onSelectRef.current(hit.planet, hit.moon);
      }
    };
    const onCancel = () => { down = null; gsap.to(cam, { drag: 0, duration: 0.35 }); };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);

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
          const spin = m.getObjectByName("spin");
          if (spin) spin.rotation.set(t * 0.7, t * 1.1, 0);
          const roll = m.getObjectByName("roll");
          if (roll) roll.rotation.z = -t * 2.2;
        });
      });
      stars.rotation.z = t * 0.004;
      if (cam.landing && landTarget) {
        // Follow the target (moons keep orbiting) while diving in.
        landTarget.getWorldPosition(tmp);
        focus.lerp(tmp, 0.25);
      } else {
        const moonObj = moonOf(view.current.planet, view.current.moon);
        if (moonObj) moonObj.getWorldPosition(focusTarget);
        else focusTarget.copy(posOf(view.current.planet));
        focus.lerp(focusTarget, moonObj ? 0.12 : 0.06);
      }
      if (camera.fov !== cam.fov) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
      const sway = cam.landing ? 0 : Math.sin(t * 0.2) * 0.8;
      camera.position.set(focus.x + sway + cam.drag, focus.y + cam.lift, focus.z + cam.dist);
      camera.lookAt(focus.x + cam.drag * 0.6, focus.y, focus.z);
      renderer.render(scene, camera);
      const w = el.clientWidth, h = el.clientHeight;
      groups.forEach((g, i) => {
        const lab = labels.current[i];
        if (!lab) return;
        tmp.copy(g.position).setY(g.position.y + 3.4).project(camera);
        lab.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${Math.max(28, ((1 - tmp.y) / 2) * h)}px)`;
        lab.style.opacity = !cam.landing && tmp.z < 1 && Math.abs(tmp.x) < 1.15 ? "1" : "0";
      });
      // Name tags over the selected planet's framework moons.
      moonLabels.current.forEach((lab, m) => {
        if (!lab) return;
        const obj = moonOf(view.current.planet, m);
        if (!obj || cam.landing) { lab.style.opacity = "0"; return; }
        obj.getWorldPosition(tmp);
        tmp.y += 1.15;
        tmp.project(camera);
        lab.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
        lab.style.opacity = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 ? "1" : "0";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
      gsap.killTweensOf(cam);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.LineSegments) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
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

  useEffect(() => {
    if (landing) landRef.current(landing);
  }, [landing]);

  const firstMoon = useRef(true);
  useEffect(() => {
    if (firstMoon.current) { firstMoon.current = false; return; }
    moonFocusRef.current(selectedMoon);
  }, [selectedMoon, selected]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* touch-action none: swipes and taps go to the galaxy, not to browser scrolling or zoom */}
      <div ref={host} style={{ position: "absolute", inset: 0, touchAction: "none" }} />
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
      {(planets[selected]?.frameworkMoons ?? []).map((m, i) => (
        <div
          key={`moon-${selected}-${i}`}
          ref={(e) => { moonLabels.current[i] = e; }}
          className="pixel"
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", fontSize: 8, whiteSpace: "nowrap", padding: "3px 5px", opacity: 0, background: i === selectedMoon ? "var(--gold)" : "var(--p0)", color: i === selectedMoon ? "var(--p0)" : "var(--good)", boxShadow: "0 0 0 2px var(--p0)" }}
        >
          {m.label}
        </div>
      ))}
    </div>
  );
}
