"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { SPRITES } from "@/components/pixel/sprites";
import { PALETTES, currentPalette, type Palette } from "@/lib/palette";
import type { Theme } from "@/lib/content/types";

export interface MapRegion {
  name: string;
  theme: Theme;
  unlocked: boolean;
  completed: boolean;
  soon: boolean;
}

interface Props {
  regions: MapRegion[];
  selected: number;
  onSelect(i: number): void;
}

const islandPos = (i: number) => new THREE.Vector3(i * 8, 0, Math.sin(i * 1.3) * 3.2);

function spriteTexture(p: Palette) {
  const rows = SPRITES.hero;
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d")!;
  const map: Record<string, string> = { "0": p.p0, "1": p.p1, "2": p.p2, "3": p.p3, r: p.red, y: p.gold, b: p.blue, s: p.skin, w: p.white, g: p.good };
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") { g.fillStyle = map[ch]; g.fillRect(x, y, 1, 1); } }));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mat(color: number, dim: boolean) {
  const c = new THREE.Color(color);
  if (dim) c.multiplyScalar(0.3);
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

function buildIsland(r: MapRegion): THREE.Group {
  const dim = !r.unlocked;
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.4, 0.8, 8), mat(r.theme === "mountain" ? 0x8a8a7a : 0x58b84a, dim));
  top.position.y = 0.4;
  const rock = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 8), mat(0x7a5a3a, dim));
  rock.rotation.x = Math.PI;
  rock.position.y = -1.3;
  g.add(top, rock);

  const add = (m: THREE.Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); g.add(m); };
  const rnd = (i: number) => Math.sin(i * 12.9898) * 0.5 + 0.5;

  switch (r.theme) {
    case "village":
      [[-1, -0.6], [1, 0.4], [-0.2, 1.3]].forEach(([x, z], i) => {
        add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), mat(0xf0e0c0, dim)), x, 1.15, z);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 4), mat(i % 2 ? 0xd04030 : 0x3060c0, dim));
        roof.rotation.y = Math.PI / 4;
        add(roof, x, 1.8, z);
      });
      break;
    case "forest":
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const rad = 0.6 + rnd(i) * 1.5;
        add(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 6), mat(0x1f7a2f, dim)), Math.cos(a) * rad, 1.7, Math.sin(a) * rad);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), mat(0x5a3a1a, dim)), Math.cos(a) * rad, 0.95, Math.sin(a) * rad);
      }
      break;
    case "mountain":
      add(new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 6), mat(0x6a6a6a, dim)), -0.4, 2.4, 0);
      add(new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 6), mat(0xffffff, dim)), -0.4, 3.6, 0);
      add(new THREE.Mesh(new THREE.ConeGeometry(1, 2, 6), mat(0x7a7a7a, dim)), 1.2, 1.8, 0.6);
      break;
    case "castle":
      add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), mat(0xb0b0c0, dim)), 0, 1.4, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2, 6), mat(0xc0c0d0, dim)), x, 1.8, z);
        add(new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 6), mat(0x8040c0, dim)), x, 3.1, z);
      });
      break;
    case "tower":
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4, 8), mat(0x504060, dim)), 0, 2.8, 0);
      add(new THREE.Mesh(new THREE.ConeGeometry(1, 1.2, 8), mat(0xe04040, dim)), 0, 5.4, 0);
      break;
  }
  if (r.completed) {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), mat(0xffffff, false)), 1.8, 1.6, -1.2);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.05), mat(0xffc020, false)), 2.15, 2.15, -1.2);
  }
  return g;
}

export function WorldMap3D({ regions, selected, onSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const api = useRef<{ focus(i: number, jump: boolean): void } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(1);
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", imageRendering: "pixelated" });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ad4ff);
    scene.fog = new THREE.Fog(0x9ad4ff, 34, 80);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a4a3a, 1.4));
    const sun = new THREE.DirectionalLight(0xfff2dd, 2.4);
    sun.position.set(5, 10, 7);
    scene.add(sun);

    // water with faceted waves
    const waterGeo = new THREE.PlaneGeometry(140, 80, 56, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, new THREE.MeshLambertMaterial({ color: 0x2a7fd4, flatShading: true }));
    water.position.set(16, -1.2, 0);
    scene.add(water);
    const basePos = (waterGeo.attributes.position.array as Float32Array).slice();

    // islands
    const islands: THREE.Group[] = regions.map((r, i) => {
      const g = buildIsland(r);
      g.position.copy(islandPos(i));
      g.userData.index = i;
      scene.add(g);
      return g;
    });

    // stepping stones between islands
    for (let i = 0; i < regions.length - 1; i++) {
      const a = islandPos(i), b = islandPos(i + 1);
      const lit = regions[i + 1].unlocked;
      for (let k = 1; k < 4; k++) {
        const p = a.clone().lerp(b, 0.22 + k * 0.14);
        const stone = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), mat(lit ? 0xffd040 : 0x606060, false));
        stone.position.set(p.x, -0.75, p.z);
        scene.add(stone);
      }
    }

    // clouds
    const clouds: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2 + (i % 3), 0.6, 1.2), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }));
      c.position.set(i * 6 - 6, 6 + (i % 3), -6 - (i % 4) * 2);
      scene.add(c);
      clouds.push(c);
    }

    // hero billboard
    let palette = PALETTES[currentPalette()];
    const heroMat = new THREE.SpriteMaterial({ map: spriteTexture(palette), transparent: true });
    const hero = new THREE.Sprite(heroMat);
    hero.scale.set(1.4, 1.4, 1);
    const start = islandPos(selected);
    hero.position.set(start.x, 1.6, start.z + 1.2);
    scene.add(hero);

    // Sky and fog follow the UI palette; the world keeps its own low-poly colors.
    const applyPal = () => {
      palette = PALETTES[currentPalette()];
      (scene.background as THREE.Color).set(palette.p3);
      scene.fog!.color.set(palette.p3);
      heroMat.map?.dispose();
      heroMat.map = spriteTexture(palette);
      heroMat.needsUpdate = true;
    };
    applyPal();
    window.addEventListener("bf:palette", applyPal);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const px = 2; // chunky but readable pixels, upscaled with nearest-neighbor
      renderer.setSize(Math.max(64, Math.floor(w / px)), Math.max(48, Math.floor(h / px)), false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // camera follows a focus point
    const focus = islandPos(selected).clone();
    const camOffset = new THREE.Vector3(0, 9, 13);
    api.current = {
      focus(i, jump) {
        const p = islandPos(i);
        gsap.to(focus, { x: p.x, z: p.z, duration: 0.9, ease: "power2.inOut" });
        if (jump) {
          gsap.to(hero.position, { x: p.x, z: p.z + 1.2, duration: 0.7, ease: "power1.inOut" });
          gsap.timeline().to(hero.position, { y: 4, duration: 0.35, ease: "power2.out" }).to(hero.position, { y: 1.6, duration: 0.35, ease: "bounce.out" });
        }
      },
    };

    // picking
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovered = -1;
    const pick = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(islands, true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && o.userData.index === undefined) o = o.parent;
      return o ? (o.userData.index as number) : -1;
    };
    const onMove = (e: PointerEvent) => {
      const i = pick(e);
      if (i !== hovered) {
        if (hovered >= 0) gsap.to(islands[hovered].scale, { x: 1, y: 1, z: 1, duration: 0.2 });
        if (i >= 0) gsap.to(islands[i].scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.2, ease: "back.out(3)" });
        hovered = i;
        el.style.cursor = i >= 0 ? "pointer" : "default";
      }
    };
    const onClick = (e: PointerEvent) => { const i = pick(e); if (i >= 0) onSelectRef.current(i); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onClick);

    // loop
    const tmp = new THREE.Vector3();
    let raf = 0;
    const t0 = performance.now();
    const pos = waterGeo.attributes.position;
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < pos.count; i++) {
        const x = basePos[i * 3], z = basePos[i * 3 + 2];
        pos.setY(i, Math.sin(x * 0.6 + t * 1.5) * 0.12 + Math.cos(z * 0.8 + t) * 0.1);
      }
      pos.needsUpdate = true;
      waterGeo.computeVertexNormals();
      islands.forEach((g, i) => { g.position.y = Math.sin(t * 1.2 + i) * 0.12; g.rotation.y = Math.sin(t * 0.3 + i) * 0.05; });
      clouds.forEach((c, i) => { c.position.x += 0.01 + (i % 3) * 0.004; if (c.position.x > 50) c.position.x = -12; });
      hero.material.rotation = 0;
      camera.position.set(focus.x + camOffset.x + Math.sin(t * 0.25) * 1.2, camOffset.y, focus.z + camOffset.z);
      camera.lookAt(focus.x, 0.5, focus.z);

      renderer.render(scene, camera);

      // HTML labels follow islands
      const w = el.clientWidth, h = el.clientHeight;
      islands.forEach((g, i) => {
        const lab = labels.current[i];
        if (!lab) return;
        tmp.copy(g.position).setY(g.position.y + (regions[i].theme === "tower" ? 6.6 : 4.2)).project(camera);
        const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.2;
        lab.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
        lab.style.opacity = vis ? "1" : "0";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("bf:palette", applyPal);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onClick);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
      });
      heroMat.map?.dispose();
      heroMat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    api.current?.focus(selected, true);
  }, [selected]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      {regions.map((r, i) => (
        <div
          key={i}
          ref={(e) => { labels.current[i] = e; }}
          className="pixel"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
            fontSize: 9,
            whiteSpace: "nowrap",
            padding: "4px 6px",
            background: i === selected ? "var(--gold)" : "var(--p0)",
            color: i === selected ? "var(--p0)" : r.unlocked ? "var(--p3)" : "var(--p2)",
            boxShadow: "0 0 0 2px var(--p0)",
          }}
        >
          {r.soon ? "🔒 PRONTO" : !r.unlocked ? "🔒 " + r.name : (r.completed ? "★ " : "") + r.name}
        </div>
      ))}
    </div>
  );
}
