"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TUAMS - "Your Privacy Is Our Priority" Cinematic Intro
   ───────────────────────────────────────────────────────────────────────────
   Phase 0 (0-2.4s)   : Digital eye iris forms from scattered particles (EXTENDED)
   Phase 1 (2.4-4.2s) : Eye shatters -> hexagonal shield grid assembles
                         Encryption hex streams cascade on both sides
                         Radar sweep activates
   Phase 2 (4.2-6.2s) : 3D wireframe lock icon assembles from fragments
                         Concentric data orbits spin around it
                         Side panels show encryption status bars
   Phase 3 (6.2-8.2s) : Lock rises, TUAMS decrypts char-by-char from scramble
                         Subtitle types out with cursor
   Phase 4 (8.2s+)    : Enter button, everything breathes
   Exit               : Lock implodes, streams reverse, circular wipe
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── GLSL Shader ─────────────────────────────────────────────────────────────

const VERT = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_phase;
  uniform float u_exit;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
               mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)), dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = rot * p * 2.0 + 100.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time * 0.12;
    vec2 mouse = (u_mouse - 0.5) * 0.2;

    // Digital grid pattern
    vec2 grid = fract(st * 15.0 + t * 0.3);
    float gridLine = smoothstep(0.0, 0.03, grid.x) * smoothstep(0.0, 0.03, grid.y);
    float gridAlpha = (1.0 - gridLine) * 0.012 * u_phase;

    // Flowing noise
    float n1 = fbm(st * 2.5 + t + mouse);
    float n2 = fbm(st * 3.5 - t * 0.6 + vec2(n1) * 0.4);

    vec3 col = vec3(0.035, 0.035, 0.055);
    vec3 primary = vec3(1.0, 0.2, 0.36);
    vec3 accent = vec3(0.3, 0.7, 1.0);

    // Encryption circuit traces
    float circuit = smoothstep(0.0, 0.08, abs(n1 * 0.5 + 0.25)) * smoothstep(0.35, 0.15, abs(n1));
    col += primary * circuit * 0.04 * u_phase;
    col += accent * smoothstep(0.0, 0.06, abs(n2 * 0.3)) * 0.015 * u_phase;

    // Grid overlay
    col += primary * gridAlpha;

    // Radial vignette
    col *= 1.0 - length(st) * 0.5;

    // Center glow - shield energy
    float shield = exp(-length(st) * 2.5) * 0.06 * u_phase;
    col += primary * shield;

    // Hex pattern overlay
    vec2 hexSt = st * 8.0;
    float hexN = noise(hexSt + t * 2.0);
    float hexPulse = smoothstep(0.3, 0.35, hexN) * smoothstep(0.4, 0.35, hexN);
    col += primary * hexPulse * 0.02 * u_phase;

    // Film grain
    float grain = (noise(gl_FragCoord.xy * 0.5 + u_time * 80.0) * 0.5 + 0.5) * 0.012;
    col += grain;

    // Exit
    if (u_exit > 0.0) {
      col = mix(col, vec3(0.035, 0.035, 0.055), u_exit * u_exit);
      if (u_exit < 0.25) col += primary * (0.25 - u_exit) / 0.25 * 0.12;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── 3D Lock Wireframe ──────────────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number; }

function createLockGeometry(): { vertices: Vec3[]; edges: [number, number][]; } {
  const verts: Vec3[] = [];
  const edges: [number, number][] = [];

  // Lock body (rounded rectangle prism)
  const bw = 0.7, bh = 0.6, bd = 0.35;
  const bodyStart = verts.length;
  // Front face
  verts.push({ x: -bw, y: -bh, z: bd }, { x: bw, y: -bh, z: bd },
    { x: bw, y: bh, z: bd }, { x: -bw, y: bh, z: bd });
  // Back face
  verts.push({ x: -bw, y: -bh, z: -bd }, { x: bw, y: -bh, z: -bd },
    { x: bw, y: bh, z: -bd }, { x: -bw, y: bh, z: -bd });
  // Front edges
  edges.push([bodyStart, bodyStart + 1], [bodyStart + 1, bodyStart + 2],
    [bodyStart + 2, bodyStart + 3], [bodyStart + 3, bodyStart]);
  // Back edges
  edges.push([bodyStart + 4, bodyStart + 5], [bodyStart + 5, bodyStart + 6],
    [bodyStart + 6, bodyStart + 7], [bodyStart + 7, bodyStart + 4]);
  // Connecting edges
  for (let i = 0; i < 4; i++) edges.push([bodyStart + i, bodyStart + 4 + i]);

  // Shackle (arch on top)
  const shackleSegs = 16;
  const sr = 0.45, sh = 0.4;
  const shackleStart = verts.length;
  // Front arch
  for (let i = 0; i <= shackleSegs; i++) {
    const angle = Math.PI * (i / shackleSegs);
    verts.push({ x: Math.cos(angle) * sr, y: -bh - sh - Math.sin(angle) * sh, z: bd * 0.6 });
  }
  // Back arch
  for (let i = 0; i <= shackleSegs; i++) {
    const angle = Math.PI * (i / shackleSegs);
    verts.push({ x: Math.cos(angle) * sr, y: -bh - sh - Math.sin(angle) * sh, z: -bd * 0.6 });
  }
  // Front arch edges
  for (let i = 0; i < shackleSegs; i++) edges.push([shackleStart + i, shackleStart + i + 1]);
  // Back arch edges
  const backStart = shackleStart + shackleSegs + 1;
  for (let i = 0; i < shackleSegs; i++) edges.push([backStart + i, backStart + i + 1]);
  // Connect front to back
  for (let i = 0; i <= shackleSegs; i += 4) edges.push([shackleStart + i, backStart + i]);

  // Keyhole (small diamond on front)
  const kStart = verts.length;
  const ks = 0.12;
  verts.push({ x: 0, y: -ks * 1.5, z: bd + 0.01 }, { x: ks, y: 0, z: bd + 0.01 },
    { x: 0, y: ks * 2, z: bd + 0.01 }, { x: -ks, y: 0, z: bd + 0.01 });
  edges.push([kStart, kStart + 1], [kStart + 1, kStart + 2], [kStart + 2, kStart + 3], [kStart + 3, kStart]);

  return { vertices: verts, edges };
}

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}
function project(v: Vec3, w: number, h: number, scale: number, fov: number) {
  const z = v.z + fov;
  const p = fov / z;
  return { x: w / 2 + v.x * scale * p, y: h / 2 + v.y * scale * p, depth: z };
}

// ─── Easing ──────────────────────────────────────────────────────────────────

function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutBack(t: number) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

// ─── Simplex Noise ───────────────────────────────────────────────────────────

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const grad3: [number, number][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

function createNoise() {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return function (xin: number, yin: number): number {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; const gi = perm[ii + perm[jj]] % 8; n0 = t0 * t0 * (grad3[gi][0] * x0 + grad3[gi][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; const gi = perm[ii + i1 + perm[jj + j1]] % 8; n1 = t1 * t1 * (grad3[gi][0] * x1 + grad3[gi][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; const gi = perm[ii + 1 + perm[jj + 1]] % 8; n2 = t2 * t2 * (grad3[gi][0] * x2 + grad3[gi][1] * y2); }
    return 70 * (n0 + n1 + n2);
  };
}

// ─── Hex Characters ──────────────────────────────────────────────────────────

const HEX = "0123456789ABCDEF";
const CIPHER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
function rndHex() { return HEX[Math.floor(Math.random() * 16)]; }
function rndCipher() { return CIPHER[Math.floor(Math.random() * CIPHER.length)]; }

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { onComplete: () => void; }

export default function IntroSplash({ onComplete }: Props) {
  const glRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const phaseRef = useRef(0);
  const exitRef = useRef(false);
  const exitStartRef = useRef(0);
  const animRef = useRef(0);
  const startRef = useRef(0);
  const noiseRef = useRef(createNoise());

  const handleEnter = useCallback(() => {
    if (exitRef.current) return;
    setExiting(true);
    exitRef.current = true;
    exitStartRef.current = performance.now();
    // Fire onComplete early so the homepage starts its entrance
    // while the intro is still fading out on top (crossfade overlap)
    setTimeout(() => onComplete(), 600);
  }, [onComplete]);

  // Phase timeline - Updated timings for extended particle gathering
  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); phaseRef.current = 1; }, 2400), // Was 1200
      setTimeout(() => { setPhase(2); phaseRef.current = 2; }, 4200), // Was 3000
      setTimeout(() => { setPhase(3); phaseRef.current = 3; }, 6200), // Was 5000
      setTimeout(() => { setPhase(4); phaseRef.current = 4; setShowUI(true); }, 8200), // Was 7000
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }; };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // ─── WebGL ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = glRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    function compile(src: string, type: number) {
      const s = gl!.createShader(type); if (!s) return null;
      gl!.shaderSource(s, src); gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) { gl!.deleteShader(s); return null; }
      return s;
    }
    const vs = compile(VERT, gl.VERTEX_SHADER);
    const fs = compile(FRAG, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;
    const prog = gl.createProgram(); if (!prog) return;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, "u_time");
    const uR = gl.getUniformLocation(prog, "u_resolution");
    const uM = gl.getUniformLocation(prog, "u_mouse");
    const uP = gl.getUniformLocation(prog, "u_phase");
    const uE = gl.getUniformLocation(prog, "u_exit");

    let w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
    startRef.current = performance.now();

    const renderGL = (now: number) => {
      const t = (now - startRef.current) / 1000;
      let exitVal = 0;
      if (exitRef.current) exitVal = Math.min((now - exitStartRef.current) / 2200, 1);
      gl.uniform1f(uT, t); gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uM, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uP, Math.min(phaseRef.current / 3, 1));
      gl.uniform1f(uE, exitVal);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    (window as unknown as Record<string, unknown>).__glRender = renderGL;

    const onResize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); delete (window as unknown as Record<string, unknown>).__glRender; };
  }, []);

  // ─── Overlay Canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = ovRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const noise = noiseRef.current;
    const lock = createLockGeometry();

    // ── Eye iris particles ──
    const eyeCount = 120;
    type EyeP = { angle: number; dist: number; targetDist: number; x: number; y: number; size: number; speed: number; };
    const eyeParticles: EyeP[] = [];
    for (let i = 0; i < eyeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(w, h) * 0.8;
      eyeParticles.push({
        angle, dist, targetDist: 20 + Math.random() * 50,
        x: w / 2 + Math.cos(angle) * dist, y: h / 2 + Math.sin(angle) * dist,
        size: Math.random() * 2 + 0.5, speed: Math.random() * 0.5 + 0.5,
      });
    }

    // ── Hex data streams (left + right) ──
    const streamCount = 24;
    type HexStream = { x: number; chars: { char: string; y: number; speed: number; alpha: number }[]; side: "left" | "right"; };
    const hexStreams: HexStream[] = [];
    for (let i = 0; i < streamCount; i++) {
      const side = i < streamCount / 2 ? "left" : "right";
      const baseX = side === "left" ? 20 + (i % (streamCount / 2)) * 28 : w - 20 - (i % (streamCount / 2)) * 28;
      const charCount = 8 + Math.floor(Math.random() * 12);
      const chars = [];
      for (let j = 0; j < charCount; j++) {
        chars.push({ char: rndHex(), y: -Math.random() * h, speed: 1 + Math.random() * 2.5, alpha: Math.random() * 0.5 + 0.2 });
      }
      hexStreams.push({ x: baseX, chars, side });
    }

    // ── Radar sweep ──
    let radarAngle = 0;

    // ── Shield hex grid ──
    const hexGridSize = 24;
    type HexCell = { cx: number; cy: number; targetAlpha: number; alpha: number; scale: number; delay: number; };
    const hexGrid: HexCell[] = [];
    const hexR = 16;
    for (let row = -8; row <= 8; row++) {
      for (let col = -12; col <= 12; col++) {
        const cx = w / 2 + col * hexR * 1.75 + (row % 2) * hexR * 0.875;
        const cy = h / 2 + row * hexR * 1.52;
        const distFromCenter = Math.sqrt((cx - w / 2) ** 2 + (cy - h / 2) ** 2);
        if (distFromCenter < Math.min(w, h) * 0.35) {
          hexGrid.push({ cx, cy, targetAlpha: 0.08 + Math.random() * 0.12, alpha: 0, scale: 0, delay: distFromCenter * 2 });
        }
      }
    }

    // ── Orbiting data rings ──
    const ringCount = 3;
    type DataRing = { radius: number; speed: number; chars: { angle: number; char: string }[]; };
    const dataRings: DataRing[] = [];
    for (let i = 0; i < ringCount; i++) {
      const r = 80 + i * 50;
      const count = 12 + i * 6;
      const chars = [];
      for (let j = 0; j < count; j++) chars.push({ angle: (j / count) * Math.PI * 2, char: rndHex() + rndHex() });
      dataRings.push({ radius: r, speed: (0.3 + i * 0.15) * (i % 2 === 0 ? 1 : -1), chars });
    }

    // ── Floating dust ──
    const dustCount = 60;
    type Dust = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; };
    const dustArr: Dust[] = [];
    for (let i = 0; i < dustCount; i++) {
      dustArr.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.2 + 0.05,
      });
    }

    // ── Side connection beams ──
    type Beam = { fromX: number; toX: number; y: number; progress: number; speed: number; alpha: number; };
    const beams: Beam[] = [];
    for (let i = 0; i < 14; i++) {
      const side = i < 7 ? "left" : "right";
      beams.push({
        fromX: side === "left" ? 0 : w,
        toX: w / 2,
        y: h * 0.2 + Math.random() * h * 0.6,
        progress: 0, speed: 0.008 + Math.random() * 0.012,
        alpha: 0.05 + Math.random() * 0.1,
      });
    }

    // ── Side status bars ──
    type StatusBar = { x: number; y: number; width: number; progress: number; label: string; side: "left" | "right"; };
    const statusBars: StatusBar[] = [];
    const barLabels = ["AES-256", "RSA-4096", "SHA-512", "TLS 1.3", "E2E ENC", "ZERO-LOG"];
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? "left" : "right";
      statusBars.push({
        x: side === "left" ? 32 : w - 152,
        y: h * 0.35 + (i % 3) * 50,
        width: 120, progress: 0,
        label: barLabels[i], side,
      });
    }

    // ── Encryption scramble text state ──
    const tuamsChars = "TUAMS".split("");
    const scrambleState = tuamsChars.map((target, i) => ({
      target, current: rndCipher(), resolved: false, delay: i * 300, iterations: 0,
    }));

    

    // ── Side wireframe shapes ──
    type SideShape = {
      x: number; y: number; rotation: number; rotSpeed: number;
      sides: number; radius: number; alpha: number;
    };
    const sideShapes: SideShape[] = [];
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? "left" : "right";
      sideShapes.push({
        x: side === "left" ? 40 + Math.random() * 100 : w - 40 - Math.random() * 100,
        y: h * 0.15 + Math.random() * h * 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        sides: 3 + Math.floor(Math.random() * 4),
        radius: 8 + Math.random() * 16,
        alpha: 0,
      });
    }

    // ── Scanning lines (left/right edge) ──
    let scanLeft = 0, scanRight = h;

    startRef.current = performance.now();

    const animate = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const ph = phaseRef.current;
      const isExit = exitRef.current;
      const exitT = isExit ? (now - exitStartRef.current) / 2200 : 0;

      const glRender = (window as unknown as Record<string, (n: number) => void>).__glRender;
      if (glRender) glRender(now);

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;

      // ═══ PHASE 0: Eye iris forming (EXTENDED to 2.4s) ═══
      if (ph >= 0) {
        const eyeProgress = Math.min(t / 2.4, 1); // Changed from 1.2 to 2.4
        const eyeEased = easeOutExpo(eyeProgress);
        const eyeAlpha = isExit ? Math.max(0, 1 - exitT * 3) : (ph >= 1 ? Math.max(0, 1 - (t - 2.4) * 2) : 1); // Updated timing

        if (eyeAlpha > 0) {
          for (const p of eyeParticles) {
            p.dist += (p.targetDist - p.dist) * 0.03 * p.speed * eyeEased;
            p.angle += 0.005 * p.speed;
            p.x = cx + Math.cos(p.angle) * p.dist;
            p.y = cy + Math.sin(p.angle) * p.dist;

            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 51, 92, ${eyeAlpha * 0.6})`;
            ctx.fill();
          }
          // Center pupil
          const pupilR = 8 * eyeEased;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0, pupilR), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 51, 92, ${eyeAlpha * 0.8})`;
          ctx.fill();
          // Outer ring - REDUCED brightness from 0.2 to 0.1
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0, 55 * eyeEased), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 51, 92, ${eyeAlpha * 0.1})`; // Reduced from 0.2
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // ═══ PHASE 1+: Shield hex grid ═══
      if (ph >= 1) {
        const shieldProgress = Math.min((t - 2.4) / 1.8, 1); // Updated from (t - 1.2)
        const shieldAlpha = isExit ? Math.max(0, 1 - exitT * 2) : 1;

        if (shieldAlpha > 0) {
          for (const cell of hexGrid) {
            const cellProgress = Math.max(0, Math.min((shieldProgress * 2000 - cell.delay) / 500, 1));
            cell.alpha += (cell.targetAlpha * cellProgress - cell.alpha) * 0.1;
            cell.scale += (cellProgress - cell.scale) * 0.1;

            if (cell.alpha > 0.005) {
              ctx.save();
              ctx.translate(cell.cx, cell.cy);
              ctx.scale(cell.scale, cell.scale);
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = Math.cos(a) * hexR;
                const py = Math.sin(a) * hexR;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.strokeStyle = `rgba(255, 51, 92, ${cell.alpha * shieldAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // ── Radar sweep ──
        radarAngle += 0.025;
        const radarR = Math.min(w, h) * 0.32;
        const radarAlpha = isExit ? Math.max(0, 1 - exitT * 2.5) : Math.min((t - 2.4) * 0.5, 1); // Updated from (t - 1.2)
        if (radarAlpha > 0) {
          ctx.save();
          const grad = ctx.createConicGradient(radarAngle, cx, cy);
          grad.addColorStop(0, `rgba(255, 51, 92, ${0.08 * radarAlpha})`);
          grad.addColorStop(0.12, `rgba(255, 51, 92, 0)`);
          grad.addColorStop(1, `rgba(255, 51, 92, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0, radarR), 0, Math.PI * 2);
          ctx.fill();
          // Sweep line
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(radarAngle) * radarR, cy + Math.sin(radarAngle) * radarR);
          ctx.strokeStyle = `rgba(255, 51, 92, ${0.3 * radarAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          // Concentric circles
          for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(0, radarR * i / 3), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 51, 92, ${0.04 * radarAlpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ═══ PHASE 1+: Hex data streams (left + right) ═══
      if (ph >= 1) {
        const streamAlpha = isExit ? Math.max(0, 1 - exitT * 2) : Math.min((t - 2.4) * 0.6, 1); // Updated from (t - 1.2)
        if (streamAlpha > 0) {
          ctx.save();
          ctx.font = "10px monospace";
          for (const stream of hexStreams) {
            for (const c of stream.chars) {
              c.y += c.speed;
              if (c.y > h + 20) { c.y = -20; c.char = rndHex(); }
              if (Math.random() < 0.02) c.char = rndHex();
              ctx.fillStyle = `rgba(255, 51, 92, ${c.alpha * streamAlpha})`;
              ctx.fillText(c.char, stream.x, c.y);
            }
          }
          ctx.restore();
        }
      }

      // ═══ PHASE 1+: Side wireframe shapes ═══
      if (ph >= 1) {
        const shapeAlpha = isExit ? Math.max(0, 1 - exitT * 2) : Math.min((t - 2.4) * 0.4, 1); // Updated from (t - 1.2)
        for (const shape of sideShapes) {
          shape.rotation += shape.rotSpeed;
          shape.alpha += (shapeAlpha * 0.15 - shape.alpha) * 0.05;
          if (shape.alpha > 0.005) {
            ctx.save();
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.rotation);
            ctx.beginPath();
            for (let i = 0; i <= shape.sides; i++) {
              const a = (Math.PI * 2 / shape.sides) * i;
              const px = Math.cos(a) * shape.radius;
              const py = Math.sin(a) * shape.radius;
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(255, 51, 92, ${shape.alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // ═══ PHASE 1+: Scanning edge lines ═══
      if (ph >= 1) {
        const lineAlpha = isExit ? Math.max(0, 1 - exitT * 2) : Math.min((t - 2.4) * 0.5, 1); // Updated from (t - 1.2)
        scanLeft = (scanLeft + 1.5) % h;
        scanRight = (scanRight - 1.5 + h) % h;
        if (lineAlpha > 0) {
          // Left edge line
          ctx.save();
          ctx.strokeStyle = `rgba(255, 51, 92, ${0.12 * lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(18, h); ctx.stroke();
          // Left scan marker
          ctx.fillStyle = `rgba(255, 51, 92, ${0.6 * lineAlpha})`;
          ctx.fillRect(14, scanLeft - 2, 8, 4);
          // Left ticks
          for (let y = 0; y < h; y += 40) {
            ctx.fillStyle = `rgba(255, 51, 92, ${0.06 * lineAlpha})`;
            ctx.fillRect(18, y, 6, 1);
          }

          // Right edge line
          ctx.strokeStyle = `rgba(255, 51, 92, ${0.12 * lineAlpha})`;
          ctx.beginPath(); ctx.moveTo(w - 18, 0); ctx.lineTo(w - 18, h); ctx.stroke();
          // Right scan marker
          ctx.fillStyle = `rgba(255, 51, 92, ${0.6 * lineAlpha})`;
          ctx.fillRect(w - 22, scanRight - 2, 8, 4);
          // Right ticks
          for (let y = 0; y < h; y += 40) {
            ctx.fillStyle = `rgba(255, 51, 92, ${0.06 * lineAlpha})`;
            ctx.fillRect(w - 24, y, 6, 1);
          }
          ctx.restore();
        }
      }

      // ═══ PHASE 2+: 3D Lock wireframe ═══
      if (ph >= 2) {
        const lockProgress = Math.min((t - 4.2) / 2.0, 1); // Updated from (t - 3.0)
        const lockEased = easeOutBack(Math.max(0, lockProgress));
        const lockRise = ph >= 3 ? Math.min((t - 6.2) / 1.5, 1) : 0; // Updated from (t - 5.0)
        const lockRiseEased = easeInOutCubic(Math.max(0, lockRise));
        const lockAlpha = isExit ? Math.max(0, 1 - exitT * 1.8) : 1;

        const lockCY = cy - lockRiseEased * (h * 0.15);
        const lockScale = Math.min(w, h) * 0.2 * lockEased * (1 - lockRiseEased * 0.35);

        const rotYA = t * 0.35 + (mouseRef.current.x - 0.5) * 0.4;
        const rotXA = t * 0.12 + (mouseRef.current.y - 0.5) * 0.3;

        if (lockAlpha > 0.01 && lockScale > 0) {
          const projected = lock.vertices.map((v, i) => {
            // Assembly scatter
            const scatter = (1 - lockEased) * 3;
            const nx = noise(v.x * 3 + t * 0.5, i * 0.7) * scatter;
            const ny = noise(v.y * 3 + i * 0.7, t * 0.5) * scatter;
            const nz = noise(v.z * 3 + t * 0.5, v.x * 3) * scatter;
            const sv: Vec3 = { x: v.x + nx, y: v.y + ny, z: v.z + nz };
            let r = rotateY(sv, rotYA);
            r = rotateX(r, rotXA);
            return project(r, w, lockCY * 2, lockScale, 4);
          });

          ctx.save();
          for (const [a, b] of lock.edges) {
            const pa = projected[a];
            const pb = projected[b];
            const avgD = (pa.depth + pb.depth) / 2;
            const df = Math.max(0, Math.min(1, (avgD - 2) / 4));
            const alpha = lockAlpha * (0.1 + df * 0.4);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = `rgba(255, 51, 92, ${alpha})`;
            ctx.lineWidth = 0.6 + df * 0.8;
            ctx.stroke();
          }

          // Vertex dots
          for (const p of projected) {
            const df = Math.max(0, Math.min(1, (p.depth - 2) / 4));
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, 1 + df * 1.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 51, 92, ${lockAlpha * (0.6 + df * 0.4)})`;
            ctx.fill();
          }
          ctx.restore();

          // ── Orbiting data rings ──
          const ringAlpha = lockAlpha * Math.min((t - 4.2) * 0.4, 1); // Updated from (t - 3.0)
          if (ringAlpha > 0.01) {
            ctx.save();
            ctx.font = "8px monospace";
            for (const ring of dataRings) {
              for (const c of ring.chars) {
                const a = c.angle + t * ring.speed;
                const rx = cx + Math.cos(a) * ring.radius * (1 - lockRiseEased * 0.3);
                const ry = lockCY + Math.sin(a) * ring.radius * 0.35 * (1 - lockRiseEased * 0.3);
                if (Math.random() < 0.01) c.char = rndHex() + rndHex();
                ctx.fillStyle = `rgba(255, 51, 92, ${ringAlpha * 0.5})`;
                ctx.fillText(c.char, rx, ry);
              }
            }
            ctx.restore();
          }
        }
      }

      // ═══ PHASE 2+: Connection beams ═══
      if (ph >= 2) {
        const beamAlpha = isExit ? Math.max(0, 1 - exitT * 2) : Math.min((t - 4.2) * 0.3, 1); // Updated from (t - 3.0)
        if (beamAlpha > 0) {
          ctx.save();
          for (const beam of beams) {
            beam.progress = Math.min(beam.progress + beam.speed, 1);
            const ep = easeOutExpo(beam.progress);
            const x1 = beam.fromX;
            const x2 = beam.fromX + (beam.toX - beam.fromX) * ep;
            const grad = ctx.createLinearGradient(x1, 0, x2, 0);
            grad.addColorStop(0, `rgba(255, 51, 92, 0)`);
            grad.addColorStop(0.8, `rgba(255, 51, 92, ${beam.alpha * beamAlpha})`);
            grad.addColorStop(1, `rgba(255, 51, 92, ${beam.alpha * beamAlpha * 2})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x1, beam.y);
            ctx.lineTo(x2, beam.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // ── Status bars ──
        const barAlpha = isExit ? Math.max(0, 1 - exitT * 2) : Math.min((t - 4.7) * 0.4, 1); // Updated from (t - 3.5)
        if (barAlpha > 0) {
          ctx.save();
          for (const bar of statusBars) {
            bar.progress = Math.min(bar.progress + 0.005 + Math.random() * 0.003, 1);
            // Label
            ctx.font = "10px monospace";
            ctx.fillStyle = `rgba(255, 51, 92, ${0.3 * barAlpha})`;
            ctx.fillText(bar.label, bar.x, bar.y - 6);
            // Background
            ctx.fillStyle = `rgba(255, 51, 92, ${0.04 * barAlpha})`;
            ctx.fillRect(bar.x, bar.y, bar.width, 3);
            // Fill
            ctx.fillStyle = `rgba(255, 51, 92, ${0.25 * barAlpha})`;
            ctx.fillRect(bar.x, bar.y, bar.width * bar.progress, 3);
            // Percentage
            ctx.fillStyle = `rgba(255, 51, 92, ${0.2 * barAlpha})`;
            ctx.fillText(`${Math.floor(bar.progress * 100)}%`, bar.x + bar.width + 6, bar.y + 3);
          }
          ctx.restore();
        }
      }

      // ═══ PHASE 3+: Text decrypt animation ═══
      if (ph >= 3) {
        const textElapsed = (t - 6.2) * 1000; // Updated from (t - 5.0)
        const textAlpha = isExit ? Math.max(0, 1 - (exitT - 0.1) * 2.5) : 1;

        if (textAlpha > 0.01) {
          ctx.save();
          const fontSize = Math.min(w * 0.1, 140);
          ctx.font = `600 ${fontSize}px "Cormorant Garamond", "Garamond", "Georgia", serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const textY = cy + (ph >= 3 ? Math.min((t - 6.2) / 1.5, 1) : 0) * h * 0.12; // Updated from (t - 5.0)

          // Scramble resolve
          for (const sc of scrambleState) {
            if (textElapsed > sc.delay && !sc.resolved) {
              sc.iterations++;
              if (sc.iterations > 6 + Math.random() * 4) {
                sc.resolved = true;
                sc.current = sc.target;
              } else {
                sc.current = rndCipher();
              }
            }
          }

          const fullText = scrambleState.map((s) => s.current).join("");
          const totalW = ctx.measureText(fullText).width;
          let xOff = cx - totalW / 2;

          for (let i = 0; i < scrambleState.length; i++) {
            const sc = scrambleState[i];
            const charW = ctx.measureText(sc.current).width;
            const charAlpha = textElapsed > sc.delay ? Math.min((textElapsed - sc.delay) / 400, 1) : 0;

            if (charAlpha > 0.01) {
              const charCX = xOff + charW / 2;

              // Glow
              ctx.shadowColor = `rgba(255, 51, 92, ${charAlpha * textAlpha * 0.4})`;
              ctx.shadowBlur = 30;
              ctx.fillStyle = `rgba(255, 255, 255, ${charAlpha * textAlpha * 0.9})`;
              ctx.fillText(sc.current, charCX, textY);

              // Accent layer
              ctx.shadowBlur = 0;
              ctx.globalCompositeOperation = "lighter";
              ctx.fillStyle = `rgba(255, 51, 92, ${charAlpha * textAlpha * (sc.resolved ? 0.08 : 0.25)})`;
              ctx.fillText(sc.current, charCX + 1, textY + 1);
              ctx.globalCompositeOperation = "source-over";
            }
            xOff += charW;
          }

          // Underline
          if (textElapsed > scrambleState.length * 300) {
            const lineP = easeOutExpo(Math.min((textElapsed - scrambleState.length * 300) / 800, 1));
            const lineY = textY + fontSize * 0.45;
            const lineW = totalW * lineP;
            ctx.strokeStyle = `rgba(255, 51, 92, ${0.3 * textAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(cx - lineW / 2, lineY);
            ctx.lineTo(cx + lineW / 2, lineY);
            ctx.stroke();
          }

          ctx.restore();

          
        }
      }

      // ═══ Floating dust (always) ═══
      if (ph >= 1) {
        const dAlpha = isExit ? Math.max(0, 1 - exitT * 2) : 1;
        for (const d of dustArr) {
          d.x += d.vx; d.y += d.vy;
          d.vx += noise(d.x * 0.005 + t, d.y * 0.005) * 0.015;
          d.vy += noise(d.x * 0.005, d.y * 0.005 + t) * 0.01;
          d.vx *= 0.99; d.vy *= 0.99;
          if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
          if (d.x < -10) d.x = w + 10;
          if (d.x > w + 10) d.x = -10;
          ctx.beginPath();
          ctx.arc(d.x, d.y, Math.max(0, d.size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 51, 92, ${d.alpha * dAlpha})`;
          ctx.fill();
        }
      }

      // ═══ CRT scan lines ═══
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.015)";
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.restore();

      // ═══ Corner brackets ═══
      if (ph >= 1) {
        const bAlpha = isExit ? Math.max(0, 1 - exitT * 1.5) : Math.min((t - 2.4) * 0.4, 1) * 0.25; // Updated from (t - 1.2)
        const bLen = 30;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 51, 92, ${bAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(24, 24 + bLen); ctx.lineTo(24, 24); ctx.lineTo(24 + bLen, 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w - 24 - bLen, 24); ctx.lineTo(w - 24, 24); ctx.lineTo(w - 24, 24 + bLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(24, h - 24 - bLen); ctx.lineTo(24, h - 24); ctx.lineTo(24 + bLen, h - 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w - 24 - bLen, h - 24); ctx.lineTo(w - 24, h - 24); ctx.lineTo(w - 24, h - 24 - bLen); ctx.stroke();
        ctx.restore();
      }

      // ═══ Exit: handled by CSS opacity fade on container ═══

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: "#14141a",
        opacity: exiting ? 0 : 1,
        transition: "opacity 3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <canvas ref={glRef} className="absolute inset-0" aria-hidden="true" />
      <canvas ref={ovRef} className="absolute inset-0" aria-hidden="true" />

      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: exiting ? 0 : 1, transition: "opacity 0.8s ease" }}
      >
        {/* Top label */}
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2"
          style={{
            opacity: showUI ? 1 : 0,
            transform: showUI ? "translateY(0)" : "translateY(-16px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
        >
          <span
            className="text-[10px] tracking-[0.6em] uppercase font-mono"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            SECURE CONNECTION ESTABLISHED
          </span>
        </div>

        {/* Spacer for canvas text */}
        <div style={{ height: "clamp(5rem, 16vw, 14rem)" }} aria-label="TUAMS" role="heading" />

        {/* Tagline */}
        <div
          className="flex flex-col items-center mt-40"
          style={{
            opacity: showUI ? 2 : 0,
            transform: showUI ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
          }}
        >
          <div
            style={{
              width: showUI ? 60 : 0,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,51,92,0.5), transparent)",
              transition: "width 1.2s cubic-bezier(0.65, 0, 0.35, 1)",
              marginBottom: 20,
            }}
            aria-hidden="true"
          />
          <p
            className="text-[11px] md:text-xs tracking-[0.4em] uppercase font-light"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            
          </p>
        </div>

        {/* Enter button */}
        <button
          type="button"
          onClick={handleEnter}
          className="group relative cursor-pointer pointer-events-auto mt-[110px]"
          style={{
            opacity: showUI ? 1 : 0,
            transform: showUI ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
            transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
          }}
          aria-label="Enter site"
        >
          <svg
            className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none"
            viewBox="0 0 200 60" aria-hidden="true"
          >
            <rect
              x="1" y="1" width="198" height="58" rx="29" fill="none"
              stroke="rgba(255,51,92,0.15)" strokeWidth="0.5" strokeDasharray="3 6"
              style={{ animation: "introSpin 25s linear infinite" }}
              className="origin-center"
            />
          </svg>
          <svg
            className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none"
            viewBox="0 0 200 60" aria-hidden="true"
          >
            <rect
              x="1" y="1" width="198" height="58" rx="29" fill="none"
              stroke="rgba(255,51,92,0.08)" strokeWidth="0.5" strokeDasharray="2 10"
              style={{ animation: "introSpinReverse 18s linear infinite" }}
              className="origin-center"
            />
          </svg>
          <span
            className="relative inline-flex items-center gap-3 px-10 py-4 rounded-full text-[11px] font-medium uppercase tracking-[0.3em] border transition-all duration-700"
            style={{
              background: "rgba(255,51,92,0.04)",
              borderColor: "rgba(255,51,92,0.15)",
              color: "rgba(255,255,255,0.6)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,51,92,0.12)";
              e.currentTarget.style.borderColor = "rgba(255,51,92,0.5)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.boxShadow = "0 0 60px rgba(255,51,92,0.15), inset 0 0 30px rgba(255,51,92,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,51,92,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,51,92,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
              <rect x="1" y="5" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 5V3.5a3 3 0 0 1 6 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="6" cy="9.5" r="1" fill="currentColor" />
            </svg>
            <span>Enter</span>
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>

      {/* Skip */}
      {!showUI && !exiting && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute bottom-8 right-8 z-20 text-[10px] uppercase tracking-[0.3em] cursor-pointer transition-colors duration-300"
          style={{ color: "rgba(255,255,255,0.12)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.12)"; }}
          aria-label="Skip intro"
        >
          Skip
        </button>
      )}

      {/* Bottom detail */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: showUI && !exiting ? 0.5 : 0, transition: "opacity 1s ease 0.8s" }}

      >
        <span className="text-[9px] tracking-[0.4em] uppercase font-mono" style={{ color: "rgba(255,255,255,1)" }}>
          {'AES-256 \u2022 ZERO-KNOWLEDGE \u2022 END-TO-END'}
        </span>
      </div>

      <style jsx>{`
        @keyframes introSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes introSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>
    </div>
  );
}