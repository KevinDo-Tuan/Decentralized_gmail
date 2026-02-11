(() => {
  const canvas = document.getElementById("words");
  const ctx = canvas.getContext("2d", { alpha: true });

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const redirectUrl = "home.html";
  const formationDuration = 3500; // Particles forming shapes
  const holdDuration = 1000; // Hold the formation
  const disperseDuration = 800; // Disperse elegantly
  const totalDuration = 7000;
  const exitDuration = 800;

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let running = true;
  let startTime = Date.now();
  let phase = "forming"; // "forming" -> "holding" -> "dispersing" -> "complete"

  const particles = [];
  
  // Elegant color palette - soft pastels with depth
  const colors = [
    { r: 255, g: 182, b: 193, name: 'light-pink' },     // Light pink
    { r: 221, g: 160, b: 221, name: 'plum' },           // Plum
    { r: 255, g: 218, b: 185, name: 'peach' },          // Peach
    { r: 176, g: 224, b: 230, name: 'powder-blue' },    // Powder blue
    { r: 255, g: 228, b: 196, name: 'bisque' },         // Bisque
    { r: 230, g: 190, b: 255, name: 'lavender' },       // Lavender
    { r: 255, g: 200, b: 221, name: 'cherry' },         // Cherry blossom
    { r: 200, g: 220, b: 255, name: 'periwinkle' },     // Periwinkle
  ];

  // Letter formations using particles
  // Simplified abstract pattern that suggests movement and connection
  const formationPatterns = [
    // Creates flowing, organic shapes
    { x: -0.3, y: 0, type: 'cluster' },
    { x: -0.15, y: -0.1, type: 'cluster' },
    { x: 0, y: 0, type: 'cluster' },
    { x: 0.15, y: -0.1, type: 'cluster' },
    { x: 0.3, y: 0, type: 'cluster' },
    // Additional flowing points
    { x: -0.2, y: 0.15, type: 'flow' },
    { x: 0, y: 0.2, type: 'flow' },
    { x: 0.2, y: 0.15, type: 'flow' },
    // Orbiting particles
    { x: -0.35, y: -0.15, type: 'orbit' },
    { x: 0.35, y: -0.15, type: 'orbit' },
  ];

  class Particle {
    constructor(index) {
      this.index = index;
      
      // Random start position
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(width, height) * (0.3 + Math.random() * 0.4);
      this.x = centerX + Math.cos(angle) * radius;
      this.y = centerY + Math.sin(angle) * radius;
      
      // Choose a formation target
      const pattern = formationPatterns[index % formationPatterns.length];
      const spread = 80; // How spread out the formation is
      this.targetX = centerX + pattern.x * spread + (Math.random() - 0.5) * 20;
      this.targetY = centerY + pattern.y * spread + (Math.random() - 0.5) * 20;
      this.formationType = pattern.type;
      
      // Velocity
      this.vx = 0;
      this.vy = 0;
      
      // Visual properties
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.size = 3 + Math.random() * 4;
      this.opacity = 0;
      this.baseOpacity = 0.4 + Math.random() * 0.4;
      
      // Animation properties
      this.appearDelay = Math.random() * 1000;
      this.hasAppeared = false;
      this.pulseOffset = Math.random() * Math.PI * 2;
      this.orbitAngle = Math.random() * Math.PI * 2;
      this.orbitSpeed = (Math.random() - 0.5) * 0.02;
      this.orbitRadius = 5 + Math.random() * 10;
    }
    
    update(elapsed) {
      // Handle appearance delay
      if (!this.hasAppeared && elapsed > this.appearDelay) {
        this.hasAppeared = true;
      }
      
      if (!this.hasAppeared) {
        return;
      }
      
      const localElapsed = elapsed - this.appearDelay;
      
      if (phase === "forming") {
        // Smooth fade in
        this.opacity = Math.min(this.baseOpacity, localElapsed / 1200);
        
        // Move toward formation target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
          const progress = Math.min(1, localElapsed / formationDuration);
          const easing = 1 - Math.pow(1 - progress, 3); // Ease out
          
          const force = 0.03 + easing * 0.08;
          this.vx += dx * force;
          this.vy += dy * force;
          
          // Damping
          this.vx *= 0.92;
          this.vy *= 0.92;
          
          this.x += this.vx;
          this.y += this.vy;
        }
        
        // Gentle pulsing
        const pulse = Math.sin(localElapsed * 0.003 + this.pulseOffset) * 0.2 + 0.8;
        this.currentOpacity = this.opacity * pulse;
        
      } else if (phase === "holding") {
        // Subtle breathing motion in formation
        this.orbitAngle += this.orbitSpeed;
        
        const orbitX = Math.cos(this.orbitAngle) * this.orbitRadius;
        const orbitY = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.x = this.targetX + orbitX;
        this.y = this.targetY + orbitY;
        
        // Gentle pulsing continues
        const pulse = Math.sin(elapsed * 0.003 + this.pulseOffset) * 0.15 + 0.85;
        this.currentOpacity = this.opacity * pulse;
        
      } else if (phase === "dispersing") {
        // Elegant dispersion
        const disperseProgress = (elapsed - formationDuration - holdDuration) / disperseDuration;
        
        // Fade out
        this.opacity = this.baseOpacity * (1 - disperseProgress);
        this.currentOpacity = this.opacity;
        
        // Gentle outward movement
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
          this.x += (dx / distance) * 2;
          this.y += (dy / distance) * 2;
        }
        
        // Shrink
        this.currentSize = this.size * (1 - disperseProgress * 0.5);
      }
    }
    
    draw() {
      if (!this.hasAppeared || this.currentOpacity <= 0) return;
      
      const { r, g, b } = this.color;
      
      // Soft glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity * 0.6})`;
      
      // Main particle
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize || this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner glow
      ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity * 0.4})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, (this.currentSize || this.size) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    drawConnection(other) {
      if (!this.hasAppeared || !other.hasAppeared) return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw connections within a certain distance
      if (distance < 80 && phase === "holding") {
        const { r, g, b } = this.color;
        const opacity = (1 - distance / 80) * 0.15 * this.currentOpacity;
        
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  }

  const createParticles = () => {
    particles.length = 0;
    // Create enough particles for a beautiful formation
    const particleCount = 150;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i));
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

  const animate = () => {
    if (!running) return;
    
    const elapsed = Date.now() - startTime;
    
    // Phase transitions
    if (elapsed > formationDuration && phase === "forming") {
      phase = "holding";
    }
    if (elapsed > formationDuration + holdDuration && phase === "holding") {
      phase = "dispersing";
      // Reveal the TUAMS logo
      document.querySelector('.content-wrapper').classList.add('revealed');
    }
    if (elapsed > formationDuration + holdDuration + disperseDuration && phase === "dispersing") {
      phase = "complete";
    }
    
    // Clear with subtle trail
    ctx.fillStyle = "rgba(250, 249, 247, 0.12)";
    ctx.fillRect(0, 0, width, height);
    
    // Draw connections first (behind particles)
    if (phase === "holding") {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          particles[i].drawConnection(particles[j]);
        }
      }
    }
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.update(elapsed);
      particle.draw();
    });
    
    requestAnimationFrame(animate);
  };

  const boot = () => {
    resize();
    
    // Initial clear background
    ctx.fillStyle = "#faf9f7";
    ctx.fillRect(0, 0, width, height);
    
    createParticles();
    animate();
  };

  const redirect = () => {
    if (!running) return;
    running = false;
    document.body.classList.add("finish");
    
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, prefersReduced ? 0 : exitDuration);
  };

  // Auto-redirect
  setTimeout(redirect, prefersReduced ? 500 : totalDuration);

  // Skip button
  const skip = document.querySelector(".skip");
  if (skip) {
    skip.addEventListener("click", redirect);
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      redirect();
    }
  });

  // Handle resize
  window.addEventListener("resize", () => {
    resize();
    centerX = width * 0.5;
    centerY = height * 0.5;
  });

  if (prefersReduced) {
    // Skip animation for reduced motion
    document.querySelector('.content-wrapper').classList.add('revealed');
    setTimeout(redirect, 500);
  } else {
    boot();
  }
})();