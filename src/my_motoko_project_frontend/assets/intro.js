(() => {
  const canvas = document.getElementById("flow");
  const ctx = canvas.getContext("2d", { alpha: true });

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const redirectUrl = "home.html";
  const baseDuration = 6200;
  const exitDuration = 700;
  const totalDelay = prefersReduced ? 200 : baseDuration;

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let frame = 0;
  let running = true;

  const palette = [
    [255, 154, 61],
    [176, 119, 255],
    [255, 107, 45],
    [200, 140, 255],
  ];

  const config = {
    particleCount: prefersReduced ? 120 : 650,
    speed: prefersReduced ? 0.35 : 0.9,
    fade: prefersReduced ? 0.16 : 0.08,
    noiseScale: 0.0017,
    curlStrength: 2.4,
  };

  const particles = [];

  const hash = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const noise = (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;

    const a = hash(x0, y0);
    const b = hash(x0 + 1, y0);
    const c = hash(x0, y0 + 1);
    const d = hash(x0 + 1, y0 + 1);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };

  const curl = (x, y) => {
    const eps = 0.0008;
    const n1 = noise(x, y + eps);
    const n2 = noise(x, y - eps);
    const n3 = noise(x + eps, y);
    const n4 = noise(x - eps, y);
    const dx = (n1 - n2) / (2 * eps);
    const dy = (n3 - n4) / (2 * eps);
    return { x: dy, y: -dx };
  };

  const pick = () => palette[Math.floor(Math.random() * palette.length)];

  const resetParticle = (p, edge = false) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = edge ? Math.max(width, height) * 0.55 : Math.random() * Math.min(width, height) * 0.45;
    p.x = centerX + Math.cos(angle) * radius;
    p.y = centerY + Math.sin(angle) * radius;
    p.vx = 0;
    p.vy = 0;
    p.life = 0;
    p.ttl = 80 + Math.random() * 140;
    p.color = pick();
  };

  const createParticles = () => {
    particles.length = 0;
    for (let i = 0; i < config.particleCount; i += 1) {
      const p = {};
      resetParticle(p, true);
      particles.push(p);
    }
  };

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    centerX = width * 0.5;
    centerY = height * 0.5;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const step = () => {
    if (!running) return;
    frame += 1;

    ctx.fillStyle = `rgba(10, 5, 18, ${config.fade})`;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      const nx = p.x * config.noiseScale;
      const ny = p.y * config.noiseScale;
      const flow = curl(nx, ny);
      const pullX = (centerX - p.x) * 0.0004;
      const pullY = (centerY - p.y) * 0.0004;

      p.vx += (flow.x * config.curlStrength + pullX) * config.speed;
      p.vy += (flow.y * config.curlStrength + pullY) * config.speed;

      p.x += p.vx;
      p.y += p.vy;

      const [r, g, b] = p.color;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      ctx.lineWidth = 1.1;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.3, p.y - p.vy * 1.3);
      ctx.stroke();

      p.life += 1;

      if (p.life > p.ttl || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
        resetParticle(p, true);
      }
    }

    requestAnimationFrame(step);
  };

  const boot = () => {
    resize();
    createParticles();
    ctx.fillStyle = "#0e0718";
    ctx.fillRect(0, 0, width, height);
    step();
  };

  const redirect = () => {
    if (!running) return;
    running = false;
    document.body.classList.add("finish");
    window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, prefersReduced ? 0 : exitDuration);
  };

  window.setTimeout(redirect, totalDelay);

  const skip = document.querySelector(".skip");
  if (skip) {
    skip.addEventListener("click", redirect);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      redirect();
    }
  });

  window.addEventListener("resize", resize);

  if (prefersReduced) {
    canvas.style.opacity = "0.5";
  }

  boot();
})();
