// Innocent Cat site behaviour: config, copy button, chrome (loader, nav, progress, cursor),
// canvas effects, and GSAP ScrollTrigger scroll transitions.
(() => {
  // Project settings: change these in one place once the chain and buy link are confirmed.
  const ICAT = {
    contract: "0x6AA64e5215Fc7a9182f26d5c55C21Ce0863049fF",
    chain: "BNB Smart Chain",
  };
  ICAT.links = {
    buy: `https://pancakeswap.finance/swap?chain=bsc&outputCurrency=${ICAT.contract}`,
    chart: `https://dexscreener.com/bsc/${ICAT.contract}`,
    explorer: `https://bscscan.com/token/${ICAT.contract}`,
  };

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  /* ---------- content config ---------- */
  $$("[data-ca]").forEach((el) => (el.textContent = ICAT.contract));
  // [data-link="buy|chart|explorer"] anchors open the matching external page in a new tab.
  $$("[data-link]").forEach((a) => {
    a.href = ICAT.links[a.dataset.link];
    a.target = "_blank";
    a.rel = "noopener";
  });

  $$("[data-copy]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const label = $(".ca__act", btn);
      try {
        await navigator.clipboard.writeText(ICAT.contract);
        label.textContent = "Copied!";
      } catch {
        const range = document.createRange();
        range.selectNodeContents($(".ca__addr", btn));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        label.textContent = "Selected";
      }
      setTimeout(() => (label.textContent = "Copy"), 1600);
    })
  );

  /* ---------- nav + progress ---------- */
  const nav = $(".nav");
  const bar = $(".progress span");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- cursor glow + magnetic buttons ---------- */
  if (finePointer && !reduced) {
    const glow = $(".cursor-glow");
    root.classList.add("has-pointer");
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();

    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.25;
        const dy = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- gold dust canvas (hero) ---------- */
  function goldDust(canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, parts = [], running = true;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 14000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4, s: Math.random() * 0.35 + 0.1,
        a: Math.random() * Math.PI * 2, tw: Math.random() * 0.03 + 0.01,
      }));
    };
    resize();
    addEventListener("resize", resize);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) draw(); }).observe(canvas);
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.s; p.a += p.tw; p.x += Math.sin(p.a) * 0.2;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        ctx.globalAlpha = 0.35 + Math.sin(p.a) * 0.3;
        ctx.fillStyle = "#f4c14f";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------- confetti burst (join) ---------- */
  function confettiBurst(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#f4c14f", "#fbe3a4", "#c98e24", "#ffffff", "#3f8fd1"];
    const bits = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.55,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 6,
      r: Math.random() * 6 + 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0], life: 0,
    }));
    (function tick() {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const b of bits) {
        b.life++; b.vy += 0.38; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        if (b.y < h + 20) alive++;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.globalAlpha = Math.max(0, 1 - b.life / 160);
        ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(tick); else ctx.clearRect(0, 0, w, h);
    })();
  }

  /* ---------- loader ---------- */
  const ready = new Promise((res) => {
    if (document.readyState === "complete") res();
    else addEventListener("load", res);
    setTimeout(res, 2200);
  });

  const hasGsap = window.gsap && window.ScrollTrigger;
  if (reduced || !hasGsap) {
    root.classList.add(reduced ? "reduced" : "no-js");
    ready.then(() => root.classList.add("is-loaded"));
    return;
  }

  goldDust($(".dust"));
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id === "#top" ? 0 : $(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === "#top" ? 0 : -10 });
      })
    );
  }

  /* ---------- text splitting ---------- */
  $$("[data-split]").forEach((el) => {
    el.setAttribute("aria-label", el.textContent);
    el.innerHTML = [...el.textContent].map((c) => `<span class="char" aria-hidden="true">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });
  $$("[data-split-words]").forEach((el) => {
    el.setAttribute("aria-label", el.textContent);
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="word" aria-hidden="true"><span>${w}</span></span>`).join(" ");
  });

  /* ---------- hero intro ---------- */
  gsap.set(".hero-in", { autoAlpha: 0, y: 30 });
  gsap.set(".logotype__top .char", { yPercent: 120, rotate: 12, autoAlpha: 0 });
  gsap.set(".hero__img", { scale: 0.6, y: 80, rotate: -10, autoAlpha: 0 });
  gsap.set(".halo", { scale: 0.4, autoAlpha: 0 });
  gsap.set(".coin, .float", { scale: 0, autoAlpha: 0 });

  ready.then(() => {
    root.classList.add("is-loaded");
    gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.25 })
      .to(".halo", { scale: 1, autoAlpha: 1, duration: 1.2 })
      .to(".hero__img", { scale: 1, y: 0, rotate: 0, autoAlpha: 1, duration: 1.1, ease: "back.out(1.6)" }, 0.1)
      .to(".logotype__top .char", { yPercent: 0, rotate: 0, autoAlpha: 1, stagger: 0.045, duration: 0.8, ease: "back.out(2)" }, 0.2)
      .fromTo(".logotype__cat", { autoAlpha: 0, scale: 0.4, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: -4, duration: 0.8, ease: "back.out(2.4)", clearProps: "scale" }, 0.6)
      .to(".hero-in:not(.logotype__cat)", { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7 }, 0.7)
      .to(".coin, .float", { scale: 1, autoAlpha: 1, stagger: 0.1, duration: 0.6, ease: "back.out(3)" }, 0.9);
  });

  // hero scroll-out: cat floats up and away, text drifts
  gsap.to("[data-hero-art]", { yPercent: -18, scale: 0.88, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("[data-hero-copy]", { y: -90, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".scroll-cue", { autoAlpha: 0, scrollTrigger: { trigger: ".hero", start: "top top", end: "15% top", scrub: true } });

  /* ---------- ribbons: marquee speed follows scroll velocity ---------- */
  $$("[data-marquee]").forEach((track) => {
    const dir = Number(track.dataset.marquee);
    let x = 0, boost = 0;
    const half = () => track.scrollWidth / 2;
    ScrollTrigger.create({ onUpdate: (st) => (boost = Math.min(Math.abs(st.getVelocity()) / 120, 14)) });
    gsap.ticker.add(() => {
      boost *= 0.92;
      x -= (1.1 + boost) * dir;
      const hw = half();
      if (x <= -hw) x += hw;
      if (x > 0) x -= hw;
      track.style.transform = `translateX(${x}px)`;
    });
  });

  /* ---------- section transitions: panels rise in as cards and unfold ---------- */
  $$(".panel").forEach((panel) => {
    gsap.fromTo(panel,
      { clipPath: "inset(70px 4% 0px 4% round 44px)" },
      { clipPath: "inset(0px 0% 0px 0% round 0px)", ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "top 20%", scrub: true } });
    const inner = panel.querySelector(":scope > .wrap, :scope > .road-pin");
    if (inner) gsap.from(inner, { y: 90, ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "top 25%", scrub: true } });
  });

  /* ---------- reveals ---------- */
  $$(".reveal").forEach((el) => {
    if (el.hasAttribute("data-split-words")) return;
    gsap.from(el, { y: 50, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$("[data-split-words]").forEach((el) => {
    gsap.from($$(".word > span", el), { yPercent: 110, rotate: 4, duration: 0.9, stagger: 0.06, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$("[data-stagger]").forEach((list) => {
    gsap.from(list.children, { y: 50, autoAlpha: 0, scale: 0.96, duration: 0.7, stagger: 0.09, ease: "back.out(1.4)", scrollTrigger: { trigger: list, start: "top 85%" } });
  });

  // quote highlight sweeps in as you read
  $$("[data-highlight]").forEach((el) => {
    gsap.fromTo(el, { "--hl": "0%" }, { "--hl": "100%", ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "top 45%", scrub: true } });
  });

  /* ---------- image motion ---------- */
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -Number(img.dataset.parallax) }, { yPercent: Number(img.dataset.parallax), ease: "none", scrollTrigger: { trigger: img.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$("[data-float]").forEach((img) => {
    gsap.from(img, { y: 120, rotate: -8, scale: 0.85, autoAlpha: 0, duration: 1.2, ease: "back.out(1.5)", scrollTrigger: { trigger: img, start: "top 90%" } });
    gsap.to(img, { y: -14, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });
  $$("[data-spin]").forEach((img) => {
    gsap.fromTo(img, { rotateY: -35, rotateZ: -6, scale: 0.85 }, { rotateY: 20, rotateZ: 4, scale: 1.05, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } });
  });
  gsap.from(".join__img", { y: 160, scale: 0.7, autoAlpha: 0, duration: 1.3, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".join__img", start: "top 85%", onEnter: () => confettiBurst($(".confetti")) } });

  /* ---------- counters ---------- */
  $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    el.textContent = "0";
    gsap.to(obj, { v: end, duration: end > 100 ? 2.2 : 1.2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en-US")) });
  });

  /* ---------- how to buy: dashed path draws across ---------- */
  gsap.fromTo(".steps-line", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: ".steps", start: "top 85%", end: "top 40%", scrub: true } });

  /* ---------- roadmap ---------- */
  const mm = gsap.matchMedia();
  const items = $$(".road li");
  const lightUpTo = (p) => items.forEach((li, i) => li.classList.toggle("is-lit", p >= i / items.length + 0.02));

  mm.add("(min-width: 961px)", () => {
    const road = $(".road");
    const rocket = $(".road-rocket");
    const dist = () => road.scrollWidth - innerWidth + 80;
    gsap.set(rocket, { top: -6, x: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "[data-roadmap]",
        start: "top top",
        end: () => "+=" + (dist() + innerHeight * 0.6),
        pin: ".road-pin",
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (st) => lightUpTo(st.progress),
      },
    });
    tl.to(road, { x: () => -dist(), ease: "none" }, 0)
      .fromTo(".road-line__fill", { scaleX: 0.05 }, { scaleX: 1, ease: "none" }, 0)
      .fromTo(rocket, { x: 0, rotate: 0 }, { x: () => innerWidth - 240, ease: "none" }, 0)
      .to(rocket, { y: -18, rotate: 4, ease: "sine.inOut", yoyo: true, repeat: 5, duration: 0.1 }, 0);
  });

  mm.add("(max-width: 960px)", () => {
    const stage = $(".road-stage");
    const rocket = $(".road-rocket");
    gsap.set(rocket, { top: 0, x: 0 });
    gsap.timeline({
      scrollTrigger: { trigger: stage, start: "top 60%", end: "bottom 60%", scrub: 0.6, onUpdate: (st) => lightUpTo(st.progress) },
    })
      .fromTo(".road-line__fill", { scaleY: 0.05 }, { scaleY: 1, ease: "none" }, 0)
      .fromTo(rocket, { y: 0 }, { y: () => stage.offsetHeight - rocket.offsetHeight, ease: "none" }, 0);
  });

  /* ---------- active nav link ---------- */
  const links = $$(".nav__links a");
  ["story", "charity", "tokenomics", "how-to-buy", "roadmap"].forEach((id) => {
    ScrollTrigger.create({
      trigger: "#" + id,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (st) => st.isActive && links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id)),
    });
  });

  // images load late; recompute trigger positions once they have size
  $$("img").forEach((img) => img.complete || img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true }));
})();
