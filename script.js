'use strict';

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
const rm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ============================================================
   BIG BANG INTRO
============================================================ */
(function () {
    if (rm) { document.getElementById('main-content').style.opacity = '1'; return; }

    const overlay = document.getElementById('bb-overlay');
    const cv = document.getElementById('bb-canvas');
    const ctx = cv.getContext('2d');
    const flash = document.getElementById('bb-flash');
    const title = document.getElementById('bb-title');
    const main = document.getElementById('main-content');

    let W, H, cx, cy;
    function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; cx = W / 2; cy = H / 2; }
    resize();
    addEventListener('resize', resize);

    let particles = [], shockwaves = [], frameId, startTime, spawnDone = false;
    const COLORS = ['#5eead4', '#38bdf8', '#c084fc', '#f472b6', '#fbbf24', '#ffffff', '#a5f3fc', '#e879f9'];

    // Reduce particles on mobile
    const PARTICLE_COUNT = isMobile ? 160 : 520;
    const STREAK_COUNT = isMobile ? 30 : 80;

    function spawnBang() {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2, speed = 1.5 + Math.random() * 14;
            particles.push({
                x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                ax: Math.cos(angle) * -0.04, ay: Math.sin(angle) * -0.04 + 0.018,
                size: 0.5 + Math.random() * 3.5, color: COLORS[Math.floor(Math.random() * COLORS.length)],
                alpha: 1, life: 0.45 + Math.random() * 0.55, age: 0, trail: Math.random() > .55, px: cx, py: cy
            });
        }
        for (let i = 0; i < STREAK_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2, speed = 8 + Math.random() * 22;
            particles.push({
                x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                ax: 0, ay: 0.05, size: 0.6 + Math.random() * 1.4, color: '#ffffff',
                alpha: 1, life: 0.25 + Math.random() * 0.3, age: 0, trail: true, px: cx, py: cy, streak: true
            });
        }
        const rings = isMobile ? 2 : 4;
        for (let i = 0; i < rings; i++) {
            shockwaves.push({ r: 0, maxR: Math.max(W, H) * 0.75 * (0.4 + i * 0.22), alpha: 0.8 - i * 0.15, speed: 18 + i * 9, color: COLORS[i * 2] });
        }
    }

    function drawFrame(elapsed) {
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
        bg.addColorStop(0, elapsed < 0.3 ? 'rgba(255,255,255,0.95)' : elapsed < 0.6 ? `rgba(94,234,212,${Math.max(0, (0.6 - elapsed) * 2)})` : 'rgba(10,14,20,0)');
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const sw = shockwaves[i]; sw.r += sw.speed; sw.alpha *= 0.955;
            if (sw.alpha < 0.005 || sw.r > sw.maxR) { shockwaves.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
            ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]; p.age += 0.016;
            const lr = Math.min(p.age / p.life, 1);
            if (lr >= 1) { particles.splice(i, 1); continue; }
            p.px = p.x; p.py = p.y; p.vx += p.ax; p.vy += p.ay; p.x += p.vx; p.y += p.vy;
            p.alpha = p.streak ? (1 - lr) : Math.pow(1 - lr, 0.5);
            ctx.globalAlpha = Math.max(0, p.alpha);
            if (p.trail || p.streak) {
                ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = p.color; ctx.lineWidth = p.size * (p.streak ? 1.4 : 0.9); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - lr * 0.5), 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        if (!isMobile && elapsed > 0.25 && elapsed < 2.2) {
            const nA = Math.sin(((elapsed - 0.25) / 1.95) * Math.PI) * 0.18;
            for (let i = 0; i < 3; i++) {
                const ng = ctx.createRadialGradient(cx + Math.sin(elapsed * 0.9 + i * 2.1) * 80, cy + Math.cos(elapsed * 0.7 + i * 1.7) * 60, 0, cx, cy, Math.max(W, H) * 0.55);
                ng.addColorStop(0, `rgba(${i === 0 ? '94,234,212' : i === 1 ? '56,189,248' : '192,132,252'},${nA})`);
                ng.addColorStop(1, 'transparent');
                ctx.fillStyle = ng; ctx.globalAlpha = 1; ctx.fillRect(0, 0, W, H);
            }
        }
    }

    let revealed = false, overlayDone = false;
    function revealContent() {
        if (revealed) return; revealed = true;
        main.style.transition = 'opacity 0.9s ease'; main.style.opacity = '1';
        document.querySelectorAll('header,section,footer').forEach((el, i) => {
            el.style.animationDelay = (i * 0.07) + 's'; el.classList.add('cinematic-in');
        });
        document.body.classList.add('lb-gone');
        document.body.style.overflow = '';
    }
    function removeOverlay() {
        if (overlayDone) return; overlayDone = true;
        cancelAnimationFrame(frameId);
        overlay.style.transition = 'opacity 0.6s ease'; overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 650);
    }

    function animate(ts) {
        if (!startTime) startTime = ts;
        const e = (ts - startTime) / 1000;
        drawFrame(e);
        if (e < 0.15) { frameId = requestAnimationFrame(animate); return; }
        if (e < 0.35) { flash.style.opacity = Math.min((e - 0.15) / 0.18, 1); frameId = requestAnimationFrame(animate); return; }
        if (!spawnDone) { spawnDone = true; spawnBang(); }
        flash.style.opacity = Math.max(0, 1 - (e - 0.35) / 0.22);
        if (e < 0.65) { frameId = requestAnimationFrame(animate); return; }
        if (e < 1.4) { const tp = Math.min((e - 0.65) / 0.55, 1), ease = 1 - Math.pow(1 - tp, 3); title.style.opacity = ease; title.style.transform = `scale(${0.3 + ease * 0.7})`; frameId = requestAnimationFrame(animate); return; }
        if (e < 2.4) { title.style.opacity = 1; title.style.transform = 'scale(1)'; frameId = requestAnimationFrame(animate); return; }
        if (e < 3.2) { const fp = Math.min((e - 2.4) / 0.55, 1); title.style.opacity = Math.max(0, 1 - fp); if (e > 2.55) revealContent(); frameId = requestAnimationFrame(animate); return; }
        revealContent(); removeOverlay();
    }

    document.body.style.overflow = 'hidden';
    frameId = requestAnimationFrame(animate);
    setTimeout(() => { revealContent(); removeOverlay(); document.body.style.overflow = ''; }, isMobile ? 3000 : 4000);
})();

/* ============================================================
   STARFIELD — lighter on mobile
============================================================ */
(function () {
    const cv = document.getElementById('starfield');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, stars = [];
    function resize() {
        W = cv.width = innerWidth; H = cv.height = innerHeight;
        const density = isMobile ? 18000 : 7000;
        const n = Math.floor(W * H / density);
        stars = Array.from({ length: n }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.4 + 0.2,
            speed: isMobile ? 0.06 : (Math.random() * 0.18 + 0.02),
            alpha: Math.random() * 0.65 + 0.15,
            color: Math.random() > .85 ? '#38bdf8' : Math.random() > .7 ? '#c084fc' : '#5eead4'
        }));
    }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
            ctx.globalAlpha = s.alpha; ctx.fillStyle = s.color;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
            if (!rm) { s.y += s.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
        }
        ctx.globalAlpha = 1;
        if (!rm) requestAnimationFrame(draw);
    }
    addEventListener('resize', resize);
    resize(); draw();
})();

/* ============================================================
   SVG SCROLL PATH — desktop only
============================================================ */
(function () {
    if (isMobile || rm) { const d = document.getElementById('path-dot'); if (d) d.style.display = 'none'; return; }
    const wrap = document.getElementById('scroll-path-wrap');
    const svg = document.getElementById('scroll-path-svg');
    const track = document.getElementById('path-track');
    const prog = document.getElementById('path-progress');
    const dot = document.getElementById('path-dot');
    if (!wrap || !dot) return;

    const SVG_W = 300, CX = SVG_W / 2, AMP = 120, PERIOD = 700;
    wrap.style.width = SVG_W + 'px';
    wrap.style.left = 'calc(50% - ' + (SVG_W / 2) + 'px)';
    svg.setAttribute('width', SVG_W);
    let pathLen = 0;

    function buildPath(totalH) {
        svg.setAttribute('height', totalH); svg.style.height = totalH + 'px'; wrap.style.height = totalH + 'px';
        let d = 'M ' + CX + ' 0';
        for (let y = 0; y <= totalH; y += 6) { const x = CX + Math.sin((y / PERIOD) * 2 * Math.PI) * AMP; d += ' L ' + x.toFixed(1) + ' ' + y; }
        track.setAttribute('d', d); prog.setAttribute('d', d);
        pathLen = prog.getTotalLength(); prog.style.strokeDasharray = pathLen; prog.style.strokeDashoffset = pathLen;
    }

    function onScroll() {
        if (!pathLen) return;
        const pct = Math.min(scrollY / (document.body.scrollHeight - innerHeight), 1);
        const drawn = pathLen * pct;
        prog.style.strokeDashoffset = pathLen - drawn;
        const pt = prog.getPointAtLength(drawn);
        const wl = wrap.getBoundingClientRect().left;
        dot.style.left = (wl + pt.x) + 'px'; dot.style.top = (pt.y - scrollY) + 'px';
    }

    function init() {
        const totalH = Math.max(document.body.scrollHeight, document.body.offsetHeight);
        wrap.style.top = '0'; buildPath(totalH); onScroll();
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => setTimeout(init, 120));
    setTimeout(init, 300);
})();

/* ============================================================
   3-D CARD TILT — desktop only
============================================================ */
(function () {
    if (isMobile || rm) return;
    document.querySelectorAll('.card,.stat,.sg,.ecard').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(700px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateY(-5px) scale(1.02)`;
            card.style.boxShadow = `${-px * 20}px ${-py * 20}px 40px rgba(94,234,212,0.18)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });
})();

/* ============================================================
   SCROLL REVEAL
============================================================ */
(function () {
    const items = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { items.forEach(e => e.classList.add('in')); return; }
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); else e.target.classList.remove('in'); });
    }, { threshold: 0.1 });
    items.forEach(e => obs.observe(e));
})();

/* ============================================================
   TERMINAL TYPEWRITER
============================================================ */
(function () {
    const line1Text = 'me = DataScientist()  >>> me.currently_doing()';
    const line2Text = "'Web Dev Intern @ Prodigy Infotech'";
    const typingSpeed = isMobile ? 35 : 45;

    function initTyping() {
        const el1 = document.getElementById('type-line1');
        const cur1 = document.getElementById('cursor1');
        const wrap = document.getElementById('output-wrapper');
        const el2 = document.getElementById('type-line2');
        const cur2 = document.getElementById('cursor2');
        if (!el1) return;

        if (rm) {
            el1.textContent = line1Text; el2.textContent = line2Text;
            wrap.style.display = 'block'; if (cur1) cur1.style.display = 'none'; if (cur2) cur2.style.display = 'inline-block';
            return;
        }

        let i = 0;
        function typeLine1() {
            if (i < line1Text.length) { el1.textContent += line1Text.charAt(i++); setTimeout(typeLine1, typingSpeed); }
            else { setTimeout(() => { if (cur1) cur1.style.display = 'none'; wrap.style.display = 'block'; typeLine2(); }, 500); }
        }
        function typeLine2() {
            let j = 0;
            function type() { if (j < line2Text.length) { el2.textContent += line2Text.charAt(j++); setTimeout(type, typingSpeed - 15); } else { if (cur2) cur2.style.display = 'inline-block'; } }
            type();
        }
        typeLine1();
    }

    const delay = isMobile ? 2500 : 3200;
    if (document.readyState === 'complete') setTimeout(initTyping, delay);
    else window.addEventListener('load', () => setTimeout(initTyping, delay));
})();