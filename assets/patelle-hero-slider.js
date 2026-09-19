/* ==========================================================================
   PATÉLLE — Hero slider (GSAP)
   <pt-hero-slider> custom element for sections/hero-slider.liquid.

   Six layers, all on one master gsap.timeline():
     1 atmosphere  .pt-hs__bg            data-bg-entrance
     2 word        .pt-hs__word          data-word-entrance
     3 splash      .pt-hs__splash-inner  data-splash-entrance
     4 bottle      .pt-hs__bottle        data-bottle-entrance
     5 foreground  .pt-hs__float-inner   data-float-entrance
     6 glass card  .pt-hs__card          data-card-entrance

   Each layer's entrance is picked in the section settings, one preset per
   layer, and every layer has a matching exit that undoes it, so a slide is
   never re-entered holding state from its last departure. The presets live in
   the add<Layer>Enter / add<Layer>Exit methods below: add a case to both, plus
   the matching schema option in sections/hero-slider.liquid, and it is wired
   up. The `cut` preset means "no animation" — the layer appears and disappears
   on the frame its timing starts, with no tween at all.

   The product drops in from the top by default (bottle_entrance is "drop").
   Once it lands, nothing else moves it: .pt-hs__bottle-img is left out of the
   ambient drift in startIdle(), so it never bobs after the entrance.

   Cursor parallax is a separate pass. It moves the [data-parallax-plane]
   wrappers through their own quickTo tweens, so it never touches the inner
   elements the timelines animate. See PARALLAX_PROFILE below.

   Theme editor: re-rendered sections re-upgrade the element on insertion, and
   disconnectedCallback tears everything down, so shopify:section:load is clean.
   ========================================================================== */

(() => {
    if (customElements.get("pt-hero-slider")) return;

    const reduceMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
    );

    // GSAP is loaded with `defer` right before this file, but apps or the editor
    // can reorder things. Wait briefly, then fall back to a no-animation mode.
    const waitForGsap = (timeout = 6000) =>
        new Promise((resolve) => {
            const start = performance.now();
            const check = () => {
                if (window.gsap) return resolve(window.gsap);
                if (performance.now() - start > timeout) return resolve(null);
                setTimeout(check, 50);
            };
            check();
        });

    // Cursor parallax planes. Each wrapper in the markup carries one, and the
    // numbers are px of travel at full deflection (nx/ny = ±1) — the signs are
    // the whole effect: the display word drifts with the pointer while the
    // petals travel further and further forward.
    // `data-depth` on an element is an optional weight (default 1), which lets
    // the four petals share one plane while keeping their own reach.
    //
    // Plane order, back to front — the travel ratio climbs with each step
    // forward:
    //   bg      atmosphere, almost still and slightly against the pointer
    //   word    oversized typography, a subtle slow drift with the pointer
    //   float   petals and droplets, the highest displacement
    // There is deliberately no plane on the bottle: .pt-hs__product holds the
    // hero product and must stay put while the pointer moves. The splash is
    // bottom-anchored for the same reason.
    // Durations are the smoothing lag: back planes trail, front planes follow
    // the pointer more closely, as nearer objects would.
    //
    // Tuned pushy on purpose. Everything here is multiplied by the Parallax
    // depth setting (parallax_strength, 40-160%) and by per-element data-depth,
    // so that slider is the dial for toning the whole effect down without a code
    // change. bg travel must also stay under the -24px bleed on .pt-hs__bg-plane,
    // or the section's base colour shows at an edge.
    const PARALLAX_PROFILE = {
        bg: { x: -13, y: -10, duration: 1.8 },
        word: { x: 22, y: 13, duration: 1.6 },
        float: { x: 87, y: 63, duration: 1.1 },
    };
    const PARALLAX_EASE = "power2.out";
    // Every layer eases home on one shared tween when the pointer leaves.
    const PARALLAX_RESET = { duration: 1.2, ease: "power2.out" };

    class PtHeroSlider extends HTMLElement {
        /* Lifecycle ------------------------------------------------------------ */

        connectedCallback() {
            if (this.initialized) return;
            this.initialized = true;

            this.abort = new AbortController();
            this.sectionId = this.dataset.sectionId;
            this.slides = Array.from(this.querySelectorAll(".pt-hs__slide"));
            this.index = Math.max(
                0,
                this.slides.findIndex((slide) =>
                    slide.classList.contains("is-active"),
                ),
            );
            this.pauseReasons = new Set();
            this.idleTweens = [];
            this.parallaxSetters = new WeakMap();
            this.reduced = reduceMotionQuery.matches;

            const speed = parseFloat(this.dataset.speed) || 1.4;
            this.settings = {
                autoplay:
                    this.dataset.autoplay === "true" &&
                    !this.reduced &&
                    this.slides.length > 1,
                interval: Math.max(2, parseFloat(this.dataset.interval) || 6),
                pauseOnHover: this.dataset.pauseOnHover === "true",
                parallax: this.dataset.parallax === "true",
                parallaxStrength:
                    (parseFloat(this.dataset.parallaxStrength) || 100) / 100,
                // Timelines are authored at 1.4s; the setting stretches or compresses them.
                timeScale: 1.4 / speed,
                // One entrance preset per layer. The fallbacks mirror the schema
                // defaults so a section rendered before the settings existed
                // still animates rather than freezing mid-setup.
                bgEntrance: this.dataset.bgEntrance || "bloom",
                wordEntrance: this.dataset.wordEntrance || "mask",
                splashEntrance: this.dataset.splashEntrance || "burst",
                bottleEntrance: this.dataset.bottleEntrance || "drop",
                floatEntrance: this.dataset.floatEntrance || "center",
                cardEntrance: this.dataset.cardEntrance || "wipe",
            };

            this.bar = this.querySelector("[data-bar]");
            this.counter = this.querySelector("[data-current]");
            this.live = this.querySelector("[data-live]");

            // Cart and size selection don't depend on GSAP.
            this.bindCards();
            this.bindControls();
            this.bindEditorEvents();

            waitForGsap().then((gsap) => {
                if (!this.isConnected || !this.initialized) return;
                this.gsap = gsap;
                if (gsap) {
                    this.setup();
                } else {
                    this.classList.add("pt-hs--ready");
                    this.updateStatus();
                }
            });
        }

        disconnectedCallback() {
            this.initialized = false;
            this.abort?.abort();
            this.observer?.disconnect();
            this.tl?.kill();
            this.progress?.kill();
            this.idleTweens.forEach((tween) => tween.kill());
            this.idleTweens = [];
            clearTimeout(this.addedTimer);
            if (this.gsap) this.gsap.killTweensOf(this.querySelectorAll("*"));
        }

        get signal() {
            return this.abort.signal;
        }

        setup() {
            this.slides.forEach((slide) => this.splitWord(slide));
            this.setupParallax();
            this.setupGlass();
            this.setupFlair();
            this.setupObserver();
            this.warmNeighbours();
            this.playIntro();
        }

        /* Timelines ------------------------------------------------------------ */

        playIntro() {
            const gsap = this.gsap;
            const slide = this.slides[this.index];
            this.classList.add("pt-hs--ready");
            if (!slide) return;

            this.updateStatus();

            if (this.reduced) {
                this.startProgress();
                return;
            }

            this.tl = gsap.timeline({
                onComplete: () => {
                    this.startIdle(slide);
                    this.startProgress();
                },
            });
            this.addEnter(this.tl, slide, 1, 0, true);
            this.tl.timeScale(this.settings.timeScale);
        }

        // One entrance and one exit per layer, each switching on the preset the
        // merchant picked in the section settings. The layer order here is the
        // back-to-front order of the hero, and the offsets are the handover
        // between them: the word waits for the atmosphere, the card comes last.
        addEnter(tl, slide, dir, at, intro = false) {
            const one = (selector) => slide.querySelector(selector);
            const all = (selector) => slide.querySelectorAll(selector);

            const bg = one(".pt-hs__bg");
            const word = one(".pt-hs__word");
            const chars = all(".pt-hs__char");
            const splash = one(".pt-hs__splash-inner");
            const floats = all(".pt-hs__float-inner");
            const bottle = one(".pt-hs__bottle");
            const shadow = one(".pt-hs__shadow");
            const card = one(".pt-hs__card");
            const cardItems = all("[data-card-item]");

            // Each layer reads its own preset from the section settings. The
            // methods below are deliberately small switches over one entrance
            // and one exit each, so adding a preset means touching one case.
            this.addBgEnter(tl, bg, dir, at, intro);

            const wordAt = intro ? at : at + 0.3;
            this.addWordEnter(tl, word, chars, dir, wordAt);

            this.addSplashEnter(tl, splash, dir, at + 0.35);

            this.addFloatEnter(tl, slide, floats, dir, at + 0.28);

            this.addBottleEnter(tl, bottle, dir, at + 0.15);
            this.addShadowEnter(tl, shadow, at + 0.7);

            this.addCardEnter(tl, card, cardItems, dir, at + 0.7);
        }

        /* Layer 1 — atmosphere ------------------------------------------------- */

        addBgEnter(tl, bg, dir, at, intro) {
            if (!bg) return;

            switch (this.settings.bgEntrance) {
                case "cut":
                    // Nothing moves; the incoming slide is already stacked on top
                    // of the outgoing one, so the new scene simply appears. The
                    // set() also restores the resting state after an earlier
                    // preset left a transform or a clip behind.
                    tl.set(bg, { autoAlpha: 1, clearProps: "all" }, at);
                    break;

                case "fade":
                    tl.fromTo(
                        bg,
                        { autoAlpha: 0, scale: intro ? 1.04 : 1.08 },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: intro ? 1.8 : 1.2,
                            ease: "power2.out",
                        },
                        at,
                    );
                    break;

                case "drift":
                    // Slides in from the side the transition travels from, so
                    // next and previous lean opposite ways.
                    tl.fromTo(
                        bg,
                        {
                            autoAlpha: 0,
                            xPercent: intro ? 3 : 14 * dir,
                            scale: 1.1,
                        },
                        {
                            autoAlpha: 1,
                            xPercent: 0,
                            scale: 1,
                            duration: intro ? 1.9 : 1.4,
                            ease: "expo.out",
                        },
                        at,
                    );
                    break;

                case "zoom":
                    tl.fromTo(
                        bg,
                        { autoAlpha: 0, scale: intro ? 1.18 : 1.3 },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: intro ? 2 : 1.5,
                            ease: "power3.out",
                        },
                        at,
                    );
                    break;

                default: {
                    // bloom — the new colour pools out of the product's position
                    // like ink in water. On page load there is no outgoing slide
                    // to cover, so it only settles from a slight zoom (no clip,
                    // so the largest image paints straight away).
                    if (intro) {
                        tl.fromTo(
                            bg,
                            { autoAlpha: 1, scale: 1.08 },
                            {
                                autoAlpha: 1,
                                scale: 1,
                                duration: 2.2,
                                ease: "power2.out",
                            },
                            at,
                        );
                    } else {
                        const ox = 50 + 18 * dir;
                        tl.fromTo(
                            bg,
                            {
                                autoAlpha: 1,
                                scale: 1.12,
                                clipPath: `circle(0% at ${ox}% 62%)`,
                            },
                            {
                                scale: 1,
                                clipPath: `circle(150% at ${ox}% 62%)`,
                                duration: 1.7,
                                ease: "power3.inOut",
                            },
                            at,
                        );
                        tl.set(bg, { clearProps: "clipPath" }, at + 1.7);
                    }
                }
            }
        }

        /* Layer 2 — display word ----------------------------------------------- */

        addWordEnter(tl, word, chars, dir, at) {
            if (!word) return;
            const preset = this.settings.wordEntrance;

            // Letters are staggered from the end in the flat presets so the wave
            // travels left, exactly as in mask mode.
            const line = (vars, duration, ease) =>
                tl.fromTo(
                    word,
                    vars,
                    {
                        xPercent: 0,
                        yPercent: 0,
                        autoAlpha: 1,
                        duration,
                        ease,
                    },
                    at + 0.05,
                );

            switch (preset) {
                case "cut":
                    tl.set(word, { autoAlpha: 1, clearProps: "all" }, at);
                    if (chars.length)
                        tl.set(chars, { autoAlpha: 1, clearProps: "all" }, at);
                    break;

                case "flip":
                    // Each letter tips up from lying flat on its baseline.
                    line({ autoAlpha: 0 }, 0.9, "power2.out");
                    if (!chars.length) break;
                    tl.fromTo(
                        chars,
                        {
                            autoAlpha: 0,
                            rotationX: 90,
                            yPercent: 40,
                            transformPerspective: 800,
                            transformOrigin: "50% 100%",
                        },
                        {
                            autoAlpha: 1,
                            rotationX: 0,
                            yPercent: 0,
                            duration: 1.1,
                            ease: "back.out(1.4)",
                            stagger: { each: 0.05, from: "start" },
                        },
                        at + 0.1,
                    );
                    tl.set(
                        chars,
                        { clearProps: "transformPerspective,transformOrigin" },
                        ">",
                    );
                    break;

                case "scatter":
                    // Letters fly in from their own offset and settle, with the
                    // blur clearing last so the gathering reads as depth.
                    line({ autoAlpha: 0 }, 1, "power2.out");
                    if (!chars.length) break;
                    tl.fromTo(
                        chars,
                        {
                            autoAlpha: 0,
                            x: () => this.gsap.utils.random(-170, 170),
                            y: () => this.gsap.utils.random(-100, 100),
                            rotation: () => this.gsap.utils.random(-40, 40),
                            filter: "blur(12px)",
                        },
                        {
                            autoAlpha: 1,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            filter: "blur(0px)",
                            duration: 1.35,
                            ease: "power3.out",
                            stagger: { each: 0.045, from: "random" },
                        },
                        at + 0.1,
                    );
                    tl.set(chars, { clearProps: "filter" }, ">");
                    break;

                case "right":
                    // The line and its letters sweep in from the right together.
                    line(
                        { xPercent: 45, autoAlpha: 0 },
                        1.6,
                        "expo.out",
                    );
                    if (!chars.length) break;
                    tl.fromTo(
                        chars,
                        { autoAlpha: 0, xPercent: 55, filter: "blur(10px)" },
                        {
                            autoAlpha: 1,
                            xPercent: 0,
                            filter: "blur(0px)",
                            duration: 1.25,
                            ease: "power4.out",
                            stagger: { each: 0.045, from: "end" },
                        },
                        at + 0.1,
                    );
                    tl.set(chars, { clearProps: "filter" }, ">");
                    break;

                default:
                    // mask — each letter rises out of its own clipped window while
                    // the line itself only fades, so the reveal lands flat. No
                    // filter here: a blur inside the clip would rasterise the
                    // letter and soften its edges against the mask.
                    line({ autoAlpha: 0 }, 1.2, "power2.out");
                    if (!chars.length) break;
                    tl.fromTo(
                        chars,
                        // 150% clears the window's padding as well as the letter
                        // box, so no ink shows before the rise.
                        { autoAlpha: 0, yPercent: 150 },
                        {
                            autoAlpha: 1,
                            yPercent: 0,
                            duration: 1.25,
                            ease: "power4.out",
                            stagger: { each: 0.045, from: "end" },
                        },
                        at + 0.1,
                    );
            }
        }

        /* Layer 3 — splash ------------------------------------------------------ */

        addSplashEnter(tl, splash, dir, at) {
            if (!splash) return;

            switch (this.settings.splashEntrance) {
                case "cut":
                    tl.set(splash, { autoAlpha: 1, clearProps: "all" }, at);
                    break;

                case "rise":
                    tl.fromTo(
                        splash,
                        {
                            autoAlpha: 0,
                            y: 70,
                            scale: 0.92,
                            transformOrigin: "50% 100%",
                        },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 1.3,
                            ease: "power3.out",
                        },
                        at,
                    );
                    break;

                case "wipe":
                    // Mask uncovers it from its base upward.
                    tl.fromTo(
                        splash,
                        { autoAlpha: 1, y: 24, clipPath: "inset(100% 0% 0% 0%)" },
                        {
                            y: 0,
                            clipPath: "inset(0% 0% 0% 0%)",
                            duration: 1.15,
                            ease: "expo.out",
                        },
                        at,
                    );
                    tl.set(splash, { clearProps: "clipPath" }, at + 1.25);
                    break;

                case "pulse":
                    // No travel at all, just a soft bloom out of its own base.
                    tl.fromTo(
                        splash,
                        {
                            autoAlpha: 0,
                            scale: 0.82,
                            transformOrigin: "50% 100%",
                        },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: 1.1,
                            ease: "elastic.out(1, 0.55)",
                        },
                        at,
                    );
                    break;

                default:
                    // burst — lands flat, then kicks upward past its size, the way
                    // liquid jumps behind a dropped bottle.
                    tl.fromTo(
                        splash,
                        {
                            autoAlpha: 0,
                            scaleX: 0.55,
                            scaleY: 0.15,
                            rotation: -8 * dir,
                            y: 60,
                            transformOrigin: "50% 100%",
                        },
                        {
                            autoAlpha: 1,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0,
                            y: 0,
                            duration: 1.4,
                            ease: "back.out(1.6)",
                        },
                        at,
                    );
            }
        }

        /* Layer 5 — petals and droplets ----------------------------------------- */

        addFloatEnter(tl, slide, floats, dir, at) {
            if (!floats.length) return;
            const gsap = this.gsap;

            switch (this.settings.floatEntrance) {
                case "cut":
                    tl.set(floats, { autoAlpha: 1, clearProps: "all" }, at);
                    break;

                case "drop":
                    // Falls in from above the slide, one petal after another.
                    floats.forEach((el, i) => {
                        tl.fromTo(
                            el,
                            {
                                autoAlpha: 0,
                                y: -(140 + i * 26),
                                rotation: -24 + i * 14,
                                scale: 0.75,
                            },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotation: 0,
                                scale: 1,
                                duration: 1.5,
                                ease: "bounce.out",
                            },
                            at + i * 0.08,
                        );
                    });
                    break;

                case "swirl":
                    // Spins out of a shrunken, offset start and unwinds into place.
                    floats.forEach((el, i) => {
                        tl.fromTo(
                            el,
                            {
                                autoAlpha: 0,
                                rotation: 200 * dir * (i % 2 ? -1 : 1),
                                scale: 0.12,
                                x: 50 * dir,
                                y: 70,
                            },
                            {
                                autoAlpha: 1,
                                rotation: 0,
                                scale: 1,
                                x: 0,
                                y: 0,
                                duration: 1.7,
                                ease: "back.out(1.2)",
                            },
                            at + i * 0.06,
                        );
                    });
                    break;

                case "scatter":
                    // Drifts in from the edges, the way it leaves again.
                    floats.forEach((el, i) => {
                        tl.fromTo(
                            el,
                            {
                                autoAlpha: 0,
                                scale: 0.4,
                                rotation: gsap.utils.random(-50, 50),
                                x: 70 * dir,
                                y: 90,
                            },
                            {
                                autoAlpha: 1,
                                scale: 1,
                                rotation: 0,
                                x: 0,
                                y: 0,
                                duration: 1.6,
                                ease: "expo.out",
                            },
                            at + 0.02 + i * 0.09,
                        );
                    });
                    break;

                default:
                    // center — each element bursts out of the slide centre and
                    // travels to its own spot.
                    this.centerOffsets(slide, floats).forEach((offset, i) => {
                        tl.fromTo(
                            floats[i],
                            {
                                autoAlpha: 0,
                                scale: 0.05,
                                rotation: gsap.utils.random(-120, 120),
                                x: offset.x,
                                y: offset.y,
                            },
                            {
                                autoAlpha: 1,
                                scale: 1,
                                rotation: 0,
                                x: 0,
                                y: 0,
                                duration: 1.8,
                                ease: "power3.out",
                            },
                            at + i * 0.07,
                        );
                    });
            }
        }

        /* Layer 4 — landing shadow ------------------------------------------------- */

        addShadowEnter(tl, shadow, at) {
            if (!shadow) return;
            const preset = this.settings.bottleEntrance;

            // The shadow belongs to the bottle: it stays put whenever the bottle
            // does, and only squeezes when the bottle actually lands on it.
            if (preset === "still" || preset === "cut") {
                tl.set(shadow, { autoAlpha: 1, scaleX: 1, clearProps: "all" }, at);
                return;
            }

            tl.fromTo(
                shadow,
                { autoAlpha: 0, scaleX: 0.3 },
                {
                    autoAlpha: 1,
                    scaleX: 1,
                    duration: 1.1,
                    ease: "power3.out",
                },
                at,
            );
            if (preset !== "reveal") {
                tl.to(
                    shadow,
                    {
                        scaleX: 1.08,
                        duration: 0.25,
                        ease: "power1.out",
                        yoyo: true,
                        repeat: 1,
                    },
                    at + 0.35,
                );
            }
        }

        /* Layer 6 — glass product card ------------------------------------------ */

        addCardEnter(tl, card, cardItems, dir, at) {
            if (!card) return;

            switch (this.settings.cardEntrance) {
                case "cut":
                    tl.set(card, { autoAlpha: 1, clearProps: "all" }, at);
                    if (cardItems.length)
                        tl.set(cardItems, { autoAlpha: 1, clearProps: "all" }, at);
                    return;

                case "rise":
                    tl.fromTo(
                        card,
                        { autoAlpha: 0, y: 40 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.95,
                            ease: "power3.out",
                        },
                        at,
                    );
                    break;

                case "grow":
                    tl.fromTo(
                        card,
                        {
                            autoAlpha: 0,
                            scale: 0.86,
                            transformOrigin: "0% 100%",
                        },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: 1,
                            ease: "back.out(1.3)",
                        },
                        at,
                    );
                    break;

                case "drop":
                    tl.fromTo(
                        card,
                        { autoAlpha: 0, y: -34, rotation: -1.5 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            rotation: 0,
                            duration: 0.9,
                            ease: "power4.out",
                        },
                        at,
                    );
                    break;

                default:
                    // wipe — the glass pane opens from its left edge while it
                    // lifts, as if it were being slid across the hero.
                    tl.fromTo(
                        card,
                        {
                            autoAlpha: 0,
                            y: 24,
                            clipPath: "inset(0% 100% 0% 0% round 22px)",
                        },
                        {
                            autoAlpha: 1,
                            y: 0,
                            clipPath: "inset(0% 0% 0% 0% round 22px)",
                            duration: 1.05,
                            ease: "expo.out",
                        },
                        at,
                    );
                    tl.set(card, { clearProps: "clipPath" }, at + 1.1);
            }

            if (cardItems.length) {
                tl.fromTo(
                    cardItems,
                    { autoAlpha: 0, y: 18 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        stagger: 0.07,
                    },
                    at + 0.2,
                );
            }
        }

        // Gap between an element's resting top and the top edge of the hero, plus a
        // little margin. Measured on the element's wrapper, which none of the
        // timelines transform, so the answer stays right even while the element
        // itself is mid-tween. Combined with the bottle's own -100% travel in the
        // "drop" entrance, this is what parks it fully off-screen before it falls.
        topGap(el) {
            const hero = this.getBoundingClientRect();
            const box = el.parentElement.getBoundingClientRect();
            return Math.ceil(Math.max(0, box.top - hero.top) + 24);
        }

        // Distance from each floating element's resting spot to the slide centre.
        centerOffsets(slide, elements) {
            const gsap = this.gsap;
            const box = slide.getBoundingClientRect();
            const cx = box.left + box.width / 2;
            const cy = box.top + box.height * 0.55;

            return Array.from(elements).map((el) => {
                const wrap = el.parentElement;
                const rect = wrap.getBoundingClientRect();
                if (!rect.width) return { x: 0, y: 0 };
                // Remove any pointer-parallax offset so the path ends on the true spot.
                const px = gsap.getProperty(wrap, "x") || 0;
                const py = gsap.getProperty(wrap, "y") || 0;
                return {
                    x: cx - (rect.left + rect.width / 2 - px),
                    y: cy - (rect.top + rect.height / 2 - py),
                };
            });
        }

        addBottleEnter(tl, bottle, dir, at) {
            if (!bottle) return;
            const img = bottle.querySelector("img, svg");
            const product = bottle.parentElement;
            const preset = this.settings.bottleEntrance;

            // `still` is available for a hero whose product should not move at
            // all: this slide's z-index already brings it over the outgoing
            // slide, so it needs no entrance of its own.
            if (preset === "still") {
                tl.set(product, { clearProps: "zIndex" }, at);
                tl.set(bottle, { autoAlpha: 1, clearProps: "all" }, at);
                return;
            }

            if (preset !== "depth") tl.set(product, { clearProps: "zIndex" }, at);

            // The drop travels on `y` (px) as well as yPercent, and its exit leaves
            // that offset behind. Clearing it here means a different preset chosen
            // later in the editor still starts from the bottle's real resting spot;
            // the preset's own tween, added after this, sets the value it wants.
            tl.set(bottle, { clearProps: "y,x" }, at);

            switch (preset) {
                case "drop":
                    // Falls in from above the hero: it starts fully out of frame,
                    // drops in, and straightens up as the blur clears. -100% covers
                    // the bottle's own height, and topGap() adds the distance from
                    // its resting top to the hero's top, so it clears the edge at
                    // every viewport instead of fading in half way down a short one.
                    // The section is overflow: hidden, so none of it shows above.
                    tl.fromTo(
                        bottle,
                        {
                            autoAlpha: 0,
                            yPercent: -100,
                            y: () => -this.topGap(bottle),
                            scale: 0.88,
                            rotationX: -22,
                            transformPerspective: 1100,
                            filter: "blur(18px)",
                        },
                        {
                            autoAlpha: 1,
                            yPercent: 0,
                            y: 0,
                            scale: 1,
                            rotationX: 0,
                            filter: "blur(0px)",
                            duration: 1.25,
                            ease: "power4.out",
                        },
                        at,
                    );
                    // A short rebound on landing is what gives it weight. It starts
                    // after the drop has finished, so the two never fight over `y`.
                    tl.to(
                        bottle,
                        {
                            y: -14,
                            duration: 0.3,
                            ease: "sine.out",
                            yoyo: true,
                            repeat: 1,
                        },
                        at + 1.25,
                    );
                    // Counter-moving the image itself keeps the drop from reading
                    // as one flat plate sliding down the screen.
                    if (img) {
                        tl.fromTo(
                            img,
                            { scale: 1.12, yPercent: -6 },
                            {
                                scale: 1,
                                yPercent: 0,
                                duration: 1.45,
                                ease: "expo.out",
                            },
                            at,
                        );
                    }
                    tl.set(
                        bottle,
                        // transformOrigin is left alone: the stylesheet pivots the
                        // bottle on its base on purpose, so the tilt reads as a
                        // bottle landing on its shadow.
                        { clearProps: "filter,transformPerspective" },
                        at + 1.95,
                    );
                    break;

                case "depth":
                    // Starts small and soft behind the display word, grows up from the
                    // bottom and crosses in front of the word as it comes into focus.
                    tl.set(product, { zIndex: 0 }, at);
                    tl.fromTo(
                        bottle,
                        {
                            autoAlpha: 0,
                            scale: 0.42,
                            yPercent: 38,
                            filter: "blur(16px)",
                        },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            yPercent: 0,
                            filter: "blur(0px)",
                            duration: 1.9,
                            ease: "power3.out",
                        },
                        at,
                    );
                    // Crosses in front of the word once it is about three-quarters
                    // size, and settles on the z4 plane — in front of the word,
                    // behind the petals. Must match .pt-hs__product's z-index.
                    tl.set(product, { zIndex: 4 }, at + 0.4);
                    tl.to(
                        bottle,
                        {
                            y: -8,
                            duration: 0.34,
                            ease: "sine.out",
                            yoyo: true,
                            repeat: 1,
                        },
                        at + 1.3,
                    );
                    tl.set(bottle, { clearProps: "filter" }, at + 2);
                    break;

                case "glide":
                    // Slides across from the travel side, leaning into the motion, then rights itself.
                    tl.fromTo(
                        bottle,
                        {
                            autoAlpha: 0,
                            xPercent: 60 * dir,
                            rotation: 10 * dir,
                            scale: 0.94,
                        },
                        {
                            autoAlpha: 1,
                            xPercent: 0,
                            rotation: 0,
                            scale: 1,
                            duration: 1.6,
                            ease: "expo.out",
                        },
                        at,
                    );
                    // Inertia: a brief lean the other way (skewX, so it doesn't fight rotation).
                    tl.to(
                        bottle,
                        {
                            skewX: -4 * dir,
                            duration: 0.3,
                            ease: "sine.out",
                            yoyo: true,
                            repeat: 1,
                        },
                        at + 0.7,
                    );
                    break;

                case "reveal":
                    // A mask rises from the base while the image drifts down into frame.
                    tl.fromTo(
                        bottle,
                        {
                            autoAlpha: 1,
                            clipPath: "inset(100% -30% -30% -30%)",
                        },
                        {
                            clipPath: "inset(-30% -30% -30% -30%)",
                            duration: 1.5,
                            ease: "expo.inOut",
                        },
                        at,
                    );
                    if (img) {
                        tl.fromTo(
                            img,
                            { scale: 1.18, yPercent: 12 },
                            {
                                scale: 1,
                                yPercent: 0,
                                duration: 1.9,
                                ease: "expo.out",
                            },
                            at,
                        );
                    }
                    tl.set(bottle, { clearProps: "clipPath" });
                    break;

                default:
                    // Rise and settle: lifts out of a soft blur, overshoots a touch, lands on its base.
                    tl.fromTo(
                        bottle,
                        {
                            autoAlpha: 0,
                            yPercent: 16,
                            scale: 0.9,
                            rotation: 4 * dir,
                            filter: "blur(14px)",
                        },
                        {
                            autoAlpha: 1,
                            yPercent: 0,
                            scale: 1,
                            rotation: 0,
                            filter: "blur(0px)",
                            duration: 1.4,
                            ease: "power4.out",
                        },
                        at,
                    );
                    // Settle bounce on `y` (px), separate from the yPercent rise.
                    tl.to(
                        bottle,
                        {
                            y: -10,
                            duration: 0.3,
                            ease: "sine.out",
                            yoyo: true,
                            repeat: 1,
                        },
                        at + 0.85,
                    );
                    tl.set(bottle, { clearProps: "filter" }, at + 1.5);
            }
        }

        addBottleExit(tl, bottle, dir, at) {
            const base = { duration: 0.6, ease: "power2.in" };
            switch (this.settings.bottleEntrance) {
                case "drop":
                    // Lifts back out through the top, the reverse of the drop, so
                    // the slide leaving clears the way for the next one to fall.
                    // -100% plus the measured gap is the same journey the entrance
                    // takes, mirrored, so it leaves as fully as it arrived.
                    tl.to(
                        bottle,
                        {
                            ...base,
                            duration: 0.7,
                            autoAlpha: 0,
                            yPercent: -100,
                            y: () => -this.topGap(bottle),
                            scale: 0.94,
                            filter: "blur(12px)",
                        },
                        at,
                    );
                    break;
                case "still":
                    // It never moved on the way in, so it does not move on the
                    // way out either: the slide change simply takes it away.
                    tl.set(bottle, { autoAlpha: 0 }, at);
                    break;
                case "depth":
                    // Recedes back behind the word into the background.
                    tl.to(
                        bottle,
                        {
                            ...base,
                            duration: 0.7,
                            autoAlpha: 0,
                            scale: 0.55,
                            yPercent: 22,
                            filter: "blur(12px)",
                        },
                        at,
                    );
                    tl.set(bottle.parentElement, { zIndex: 0 }, at + 0.2);
                    break;
                case "glide":
                    tl.to(
                        bottle,
                        {
                            ...base,
                            autoAlpha: 0,
                            xPercent: -50 * dir,
                            rotation: -8 * dir,
                            scale: 0.96,
                        },
                        at,
                    );
                    break;
                case "reveal":
                    // The mask closes upward, the reverse of the unveil.
                    tl.fromTo(
                        bottle,
                        { clipPath: "inset(-30% -30% -30% -30%)" },
                        { ...base, clipPath: "inset(-30% -30% 100% -30%)" },
                        at,
                    );
                    break;
                default:
                    tl.to(
                        bottle,
                        {
                            ...base,
                            autoAlpha: 0,
                            yPercent: -8,
                            scale: 1.04,
                            filter: "blur(10px)",
                        },
                        at,
                    );
            }
        }

        // The atmosphere has no exit on purpose: the incoming slide is already
        // stacked on top of this one, and its own entrance is what covers the
        // outgoing scene. Only the layers painted over the background have to
        // leave. Every preset gets a matching exit so a slide is never re-entered
        // holding state left behind by its last departure.
        addExit(tl, slide, dir, at) {
            const one = (selector) => slide.querySelector(selector);

            this.addWordExit(
                tl,
                one(".pt-hs__word"),
                slide.querySelectorAll(".pt-hs__char"),
                dir,
                at,
            );
            this.addSplashExit(tl, one(".pt-hs__splash-inner"), at);
            this.addFloatExit(
                tl,
                slide,
                slide.querySelectorAll(".pt-hs__float-inner"),
                dir,
                at,
            );

            const bottle = one(".pt-hs__bottle");
            if (bottle) this.addBottleExit(tl, bottle, dir, at);

            this.addShadowExit(tl, one(".pt-hs__shadow"), at);
            this.addCardExit(tl, one(".pt-hs__card"), at);
        }

        addWordExit(tl, word, chars, dir, at) {
            if (!word) return;

            if (!chars.length) {
                tl.to(
                    word,
                    {
                        xPercent: -30 * dir,
                        autoAlpha: 0,
                        duration: 0.7,
                        ease: "power2.in",
                    },
                    at,
                );
                return;
            }

            const flat = { autoAlpha: 0, duration: 0.55, ease: "power2.in" };

            switch (this.settings.wordEntrance) {
                case "cut":
                    tl.set(chars, { autoAlpha: 0 }, at);
                    break;

                case "flip":
                    // Tips back down over the baseline, the reverse of the rise.
                    tl.to(
                        chars,
                        {
                            ...flat,
                            rotationX: -80,
                            transformPerspective: 800,
                            transformOrigin: "50% 100%",
                            stagger: { each: 0.03, from: "end" },
                        },
                        at,
                    );
                    break;

                case "scatter":
                    // Blows apart the way it gathered.
                    tl.to(
                        chars,
                        {
                            ...flat,
                            x: () => this.gsap.utils.random(-130, 130),
                            y: -70,
                            rotation: () => this.gsap.utils.random(-30, 30),
                            filter: "blur(9px)",
                            stagger: { each: 0.03, from: "random" },
                        },
                        at,
                    );
                    tl.set(chars, { clearProps: "filter" }, ">");
                    break;

                case "right":
                    // Sweeps back out the way it came in.
                    tl.to(
                        chars,
                        {
                            ...flat,
                            yPercent: -40,
                            rotationX: 70,
                            transformPerspective: 700,
                            stagger: {
                                each: 0.025,
                                from: dir > 0 ? "start" : "end",
                            },
                        },
                        at,
                    );
                    break;

                default:
                    // mask — rises back out of its window. 180% clears the
                    // window's padding, so no ink is left at the clip edge.
                    tl.to(
                        chars,
                        {
                            ...flat,
                            yPercent: -180,
                            stagger: { each: 0.025, from: "end" },
                        },
                        at,
                    );
            }
        }

        addSplashExit(tl, splash, at) {
            if (!splash) return;
            if (this.settings.splashEntrance === "cut") {
                tl.set(splash, { autoAlpha: 0 }, at);
                return;
            }
            tl.to(
                splash,
                {
                    autoAlpha: 0,
                    scaleY: 0.3,
                    scaleX: 0.8,
                    y: 40,
                    duration: 0.55,
                    ease: "power2.in",
                },
                at,
            );
        }

        addFloatExit(tl, slide, floats, dir, at) {
            if (!floats.length) return;
            const preset = this.settings.floatEntrance;

            if (preset === "cut") {
                tl.set(floats, { autoAlpha: 0 }, at);
                return;
            }

            if (preset === "center") {
                // Pulled back into the centre as the slide leaves.
                this.centerOffsets(slide, floats).forEach((offset, i) => {
                    tl.to(
                        floats[i],
                        {
                            x: offset.x * 0.7,
                            y: offset.y * 0.7,
                            scale: 0.1,
                            autoAlpha: 0,
                            duration: 0.6,
                            ease: "power3.in",
                        },
                        at + i * 0.03,
                    );
                });
                return;
            }

            tl.to(
                floats,
                {
                    autoAlpha: 0,
                    scale: 0.6,
                    x: -40 * dir,
                    y: -50,
                    duration: 0.55,
                    ease: "power2.in",
                    stagger: 0.04,
                },
                at,
            );
        }

        addShadowExit(tl, shadow, at) {
            if (!shadow) return;
            if (this.settings.bottleEntrance === "still") {
                tl.set(shadow, { autoAlpha: 0 }, at);
                return;
            }
            tl.to(shadow, { autoAlpha: 0, scaleX: 0.4, duration: 0.5 }, at);
        }

        addCardExit(tl, card, at) {
            if (!card) return;
            if (this.settings.cardEntrance === "cut") {
                tl.set(card, { autoAlpha: 0 }, at);
                return;
            }
            tl.to(
                card,
                { autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in" },
                at,
            );
        }

        /* Navigation ----------------------------------------------------------- */

        next(fromUser = false) {
            this.goTo((this.index + 1) % this.slides.length, 1, fromUser);
        }

        prev(fromUser = false) {
            this.goTo(
                (this.index - 1 + this.slides.length) % this.slides.length,
                -1,
                fromUser,
            );
        }

        goTo(nextIndex, dir = 1, fromUser = false) {
            if (this.slides.length < 2 || nextIndex === this.index) return;
            // Ignore input while a transition is still playing.
            if (this.tl && this.tl.isActive()) return;

            const current = this.slides[this.index];
            const incoming = this.slides[nextIndex];
            this.announce = fromUser;

            if (!this.gsap) {
                this.swap(current, incoming, nextIndex);
                return;
            }

            const gsap = this.gsap;
            this.stopProgress();
            this.setSlideAccess(current, false);
            this.setSlideAccess(incoming, true);
            this.warm(incoming);
            incoming.classList.add("is-entering");

            this.tl = gsap.timeline({
                onComplete: () => {
                    this.stopIdle();
                    this.resetParallax(current);
                    this.swap(current, incoming, nextIndex);
                    if (this.reduced)
                        gsap.set(incoming, {
                            clearProps: "opacity,visibility",
                        });
                    this.startIdle(incoming);
                    this.warmNeighbours();
                    this.startProgress();
                },
            });

            if (this.reduced) {
                this.tl.fromTo(
                    incoming,
                    { autoAlpha: 0 },
                    { autoAlpha: 1, duration: 0.45, ease: "none" },
                );
                return;
            }

            this.addExit(this.tl, current, dir, 0);
            this.addEnter(this.tl, incoming, dir, 0.3);
            this.tl.timeScale(this.settings.timeScale);
        }

        swap(current, incoming, nextIndex) {
            current.classList.remove("is-active");
            incoming.classList.remove("is-entering");
            incoming.classList.add("is-active");
            this.setSlideAccess(current, false);
            this.setSlideAccess(incoming, true);
            this.index = nextIndex;
            this.updateStatus();
        }

        setSlideAccess(slide, visible) {
            if (visible) {
                slide.removeAttribute("aria-hidden");
                slide.removeAttribute("inert");
            } else {
                slide.setAttribute("aria-hidden", "true");
                slide.setAttribute("inert", "");
            }
        }

        updateStatus() {
            const total = this.slides.length;
            if (this.counter) this.counter.textContent = String(this.index + 1);

            // Without autoplay the timer bar doubles as a position indicator.
            if (this.bar && !this.settings.autoplay) {
                this.bar.style.transform = `scaleX(${(this.index + 1) / total})`;
            }

            if (this.live && this.announce) {
                const title =
                    this.slides[this.index].querySelector(".pt-hs__title");
                this.live.textContent = `${this.index + 1} / ${total}${title ? `: ${title.textContent.trim()}` : ""}`;
            }
        }

        /* Autoplay ------------------------------------------------------------- */

        startProgress() {
            if (!this.settings.autoplay || !this.gsap) return;
            this.progress?.kill();

            const target = this.bar || { value: 0 };
            const from = this.bar ? { scaleX: 0 } : { value: 0 };
            const to = this.bar ? { scaleX: 1 } : { value: 1 };

            this.progress = this.gsap.fromTo(target, from, {
                ...to,
                duration: this.settings.interval,
                ease: "none",
                onComplete: () => this.next(false),
            });

            if (this.pauseReasons.size) this.progress.pause();
        }

        stopProgress() {
            this.progress?.kill();
            this.progress = null;
        }

        pause(reason) {
            this.pauseReasons.add(reason);
            this.updatePlayback();
        }

        resume(reason) {
            this.pauseReasons.delete(reason);
            this.updatePlayback();
        }

        updatePlayback() {
            const paused = this.pauseReasons.size > 0;
            if (this.progress)
                paused ? this.progress.pause() : this.progress.resume();

            const offscreen =
                this.pauseReasons.has("offscreen") ||
                this.pauseReasons.has("hidden");
            this.idleTweens.forEach((tween) =>
                offscreen ? tween.pause() : tween.resume(),
            );
        }

        /* Ambient motion ------------------------------------------------------- */

        startIdle(slide) {
            if (this.reduced || !this.gsap) return;
            const gsap = this.gsap;
            // Only the petals drift. The splash is bottom-anchored and must hold
            // still, so its only motion is the one-off entrance burst, and the
            // product is deliberately static: `.pt-hs__bottle-img` is left out
            // so the hero bottle never bobs after it lands.
            const targets = slide.querySelectorAll(".pt-hs__float-img");

            targets.forEach((el, i) => {
                this.idleTweens.push(
                    gsap.to(el, {
                        y: gsap.utils.random(-22, -10),
                        rotation: gsap.utils.random(-9, 9),
                        duration: gsap.utils.random(2.6, 4.4),
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1,
                        delay: i * 0.15,
                    }),
                );
            });
            this.updatePlayback();
        }

        stopIdle() {
            if (!this.gsap) return;
            this.idleTweens.forEach((tween) => {
                tween.kill();
                this.gsap.set(tween.targets(), { y: 0, rotation: 0 });
            });
            this.idleTweens = [];
        }

        setupParallax() {
            if (!this.settings.parallax || this.reduced) return;
            let rect = null;

            // Touch screens are skipped through the pointer media query. It is
            // checked live, so a laptop that gains or loses a mouse (or a
            // tablet with a trackpad) switches over without a reload.
            finePointerQuery.addEventListener(
                "change",
                () => {
                    if (!finePointerQuery.matches)
                        this.resetParallax(this.slides[this.index]);
                },
                { signal: this.signal },
            );

            this.addEventListener(
                "pointerenter",
                () => (rect = this.getBoundingClientRect()),
                {
                    signal: this.signal,
                },
            );
            this.addEventListener(
                "pointermove",
                (event) => {
                    if (
                        event.pointerType !== "mouse" ||
                        !finePointerQuery.matches
                    )
                        return;
                    rect = rect || this.getBoundingClientRect();
                    const nx =
                        ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const ny =
                        ((event.clientY - rect.top) / rect.height) * 2 - 1;
                    this.moveLayers(this.slides[this.index], nx, ny);
                },
                { signal: this.signal },
            );
            this.addEventListener(
                "pointerleave",
                () => {
                    rect = null;
                    this.resetParallax(this.slides[this.index]);
                },
                { signal: this.signal },
            );
            window.addEventListener("scroll", () => (rect = null), {
                passive: true,
                signal: this.signal,
            });
        }

        // One layer per [data-parallax-plane] wrapper. quickTo keeps a single
        // reusable tween per property rather than building a new tween on every
        // mousemove, which is what keeps this smooth while the pointer moves fast.
        getParallaxLayers(slide) {
            if (this.parallaxSetters.has(slide))
                return this.parallaxSetters.get(slide);

            const gsap = this.gsap;
            const layers = [];
            const strength = this.settings.parallaxStrength;

            slide.querySelectorAll("[data-parallax-plane]").forEach((el) => {
                const profile = PARALLAX_PROFILE[el.dataset.parallaxPlane];
                if (!profile) return;

                const weight = (parseFloat(el.dataset.depth) || 1) * strength;
                const options = {
                    duration: profile.duration,
                    ease: PARALLAX_EASE,
                };

                if (profile.perspective)
                    gsap.set(el, {
                        transformPerspective: profile.perspective,
                    });

                const to = {
                    x: gsap.quickTo(el, "x", options),
                    y: gsap.quickTo(el, "y", options),
                };
                // Scale and the 3D tilt are constants: applied on move, undone
                // on the way home.
                if (profile.scale) to.scale = gsap.quickTo(el, "scale", options);
                if (profile.rotationX)
                    to.rotationX = gsap.quickTo(el, "rotationX", options);
                if (profile.rotationY)
                    to.rotationY = gsap.quickTo(el, "rotationY", options);

                layers.push({ el, profile, weight, to });
            });

            this.parallaxSetters.set(slide, layers);
            return layers;
        }

        moveLayers(slide, nx, ny) {
            if (!slide || !this.gsap) return;
            this.getParallaxLayers(slide).forEach(
                ({ profile, weight, to }) => {
                    to.x(nx * profile.x * weight);
                    to.y(ny * profile.y * weight);
                    if (to.scale) to.scale(profile.scale);
                    // The tilt scales with the depth setting but not with the
                    // per-element weight, so it stays a micro-tilt.
                    const tilt = this.settings.parallaxStrength;
                    if (to.rotationX) to.rotationX(ny * profile.rotationX * tilt);
                    if (to.rotationY) to.rotationY(nx * profile.rotationY * tilt);
                },
            );
        }

        resetParallax(slide) {
            if (!slide || !this.gsap) return;
            const layers = this.parallaxSetters.get(slide);
            if (!layers || !layers.length) return;

            // The per-layer quickTo tweens would fight a separate return tween, so
            // drop them and let the next pointermove build a fresh set. Only the
            // transform properties are killed: the entrance choreography also sets
            // zIndex on the bottle wrapper, and that has to keep running.
            this.parallaxSetters.delete(slide);
            const els = layers.map((layer) => layer.el);
            this.gsap.killTweensOf(els, "x,y,scale,rotationX,rotationY");
            this.gsap.to(els, {
                x: 0,
                y: 0,
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                ...PARALLAX_RESET,
            });
        }

        // Glass sheen: a soft specular highlight that follows the pointer across
        // the card and the explore pill. CSS draws it from --gx/--gy; this only
        // writes the two numbers, once per frame at most.
        setupGlass() {
            if (!finePointerQuery.matches) return;
            this.querySelectorAll("[data-glass]").forEach((pane) => {
                let frame = 0;
                let point = null;
                const paint = () => {
                    frame = 0;
                    if (!point) return;
                    const box = pane.getBoundingClientRect();
                    pane.style.setProperty("--gx", `${point.x - box.left}px`);
                    pane.style.setProperty("--gy", `${point.y - box.top}px`);
                };
                pane.addEventListener(
                    "pointermove",
                    (event) => {
                        point = { x: event.clientX, y: event.clientY };
                        if (!frame) frame = requestAnimationFrame(paint);
                    },
                    { signal: this.signal },
                );
                pane.addEventListener(
                    "pointerenter",
                    () => pane.classList.add("is-lit"),
                    { signal: this.signal },
                );
                pane.addEventListener(
                    "pointerleave",
                    () => pane.classList.remove("is-lit"),
                    { signal: this.signal },
                );
            });
        }

        // Magnetic pull on the navigation buttons used to live here. It moved
        // .pt-hs__arrow and .pt-hs__explore toward the pointer, and was removed
        // at the client's request: the buttons now stay put, so only the flair
        // fill (setupFlair) still reacts to the pointer.

        // GSAP button flair: a circle grows from the entry point, follows the
        // pointer via quickTo, and shrinks back out through the exit edge.
        setupFlair() {
            if (!finePointerQuery.matches) return;
            const gsap = this.gsap;
            const { pipe, mapRange, clamp } = gsap.utils;

            this.querySelectorAll("[data-flair]").forEach((button) => {
                const flair = button.querySelector(".button__flair");
                if (!flair) return;
                let xTo = null;
                let yTo = null;

                const getXY = (event) => {
                    const { left, top, width, height } =
                        button.getBoundingClientRect();
                    const toX = pipe(mapRange(0, width, 0, 100), clamp(0, 100));
                    const toY = pipe(
                        mapRange(0, height, 0, 100),
                        clamp(0, 100),
                    );
                    return {
                        x: toX(event.clientX - left),
                        y: toY(event.clientY - top),
                    };
                };

                const enter = (event) => {
                    if (
                        button.disabled ||
                        button.getAttribute("aria-disabled") === "true"
                    )
                        return;
                    const { x, y } = getXY(event);
                    gsap.killTweensOf(flair);
                    gsap.set(flair, { xPercent: x, yPercent: y });
                    // Fresh quickTo setters per hover; the leave tween kills the previous ones.
                    xTo = gsap.quickTo(flair, "xPercent", {
                        duration: this.reduced ? 0 : 0.4,
                        ease: "power2",
                    });
                    yTo = gsap.quickTo(flair, "yPercent", {
                        duration: this.reduced ? 0 : 0.4,
                        ease: "power2",
                    });
                    gsap.to(flair, {
                        scale: 1,
                        duration: this.reduced ? 0 : 0.4,
                        ease: "power2.out",
                    });
                    button.classList.add("is-flair");
                };

                const move = (event) => {
                    if (!xTo) return;
                    const { x, y } = getXY(event);
                    xTo(x);
                    yTo(y);
                };

                const leave = (event) => {
                    if (!xTo) return;
                    const { x, y } = getXY(event);
                    xTo = null;
                    yTo = null;
                    gsap.killTweensOf(flair);
                    // Push the exit point past the edge the pointer left through.
                    gsap.to(flair, {
                        xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
                        yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
                        scale: 0,
                        duration: this.reduced ? 0 : 0.3,
                        ease: "power2.out",
                    });
                    button.classList.remove("is-flair");
                };

                const signal = this.signal;
                button.addEventListener("mouseenter", enter, { signal });
                button.addEventListener("mousemove", move, { signal });
                button.addEventListener("mouseleave", leave, { signal });

                // Keyboard focus fills from the centre so the state is visible without a mouse.
                button.addEventListener(
                    "focus",
                    () => {
                        if (!button.matches(":focus-visible")) return;
                        gsap.killTweensOf(flair);
                        gsap.set(flair, { xPercent: 50, yPercent: 50 });
                        gsap.to(flair, {
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.out",
                        });
                        button.classList.add("is-flair");
                    },
                    { signal },
                );
                button.addEventListener(
                    "blur",
                    () => {
                        if (xTo) return;
                        gsap.to(flair, {
                            scale: 0,
                            duration: 0.25,
                            ease: "power2.out",
                        });
                        button.classList.remove("is-flair");
                    },
                    { signal },
                );
            });
        }

        /* Controls ------------------------------------------------------------- */

        bindControls() {
            const signal = this.signal;
            this.querySelector("[data-prev]")?.addEventListener(
                "click",
                () => this.prev(true),
                { signal },
            );
            this.querySelector("[data-next]")?.addEventListener(
                "click",
                () => this.next(true),
                { signal },
            );

            this.addEventListener(
                "keydown",
                (event) => {
                    if (event.target.closest("input, textarea, select")) return;
                    if (event.key === "ArrowRight") this.next(true);
                    if (event.key === "ArrowLeft") this.prev(true);
                },
                { signal },
            );

            // Swipe on touch screens
            const stage = this.querySelector(".pt-hs__stage");
            let startX = 0;
            let startY = 0;
            stage?.addEventListener(
                "touchstart",
                (event) => {
                    startX = event.touches[0].clientX;
                    startY = event.touches[0].clientY;
                },
                { passive: true, signal },
            );
            stage?.addEventListener(
                "touchend",
                (event) => {
                    const dx = event.changedTouches[0].clientX - startX;
                    const dy = event.changedTouches[0].clientY - startY;
                    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy))
                        return;
                    if (event.target.closest(".pt-hs__card")) return;
                    dx < 0 ? this.next(true) : this.prev(true);
                },
                { passive: true, signal },
            );

            if (this.settings.pauseOnHover) {
                this.addEventListener(
                    "pointerenter",
                    (event) =>
                        event.pointerType === "mouse" && this.pause("hover"),
                    { signal },
                );
                this.addEventListener(
                    "pointerleave",
                    () => this.resume("hover"),
                    { signal },
                );
            }

            this.addEventListener("focusin", () => this.pause("focus"), {
                signal,
            });
            this.addEventListener(
                "focusout",
                (event) => {
                    if (!this.contains(event.relatedTarget))
                        this.resume("focus");
                },
                { signal },
            );

            document.addEventListener(
                "visibilitychange",
                () =>
                    document.hidden
                        ? this.pause("hidden")
                        : this.resume("hidden"),
                { signal },
            );
        }

        setupObserver() {
            if (!("IntersectionObserver" in window)) return;
            this.observer = new IntersectionObserver(
                ([entry]) =>
                    entry.isIntersecting
                        ? this.resume("offscreen")
                        : this.pause("offscreen"),
                { threshold: 0.2 },
            );
            this.observer.observe(this);
        }

        bindEditorEvents() {
            if (!window.Shopify || !window.Shopify.designMode) return;
            const signal = this.signal;
            const isMine = (event) =>
                event.detail && event.detail.sectionId === this.sectionId;

            document.addEventListener(
                "shopify:section:select",
                (e) => isMine(e) && this.pause("editor"),
                {
                    signal,
                },
            );
            document.addEventListener(
                "shopify:section:deselect",
                (e) => isMine(e) && this.resume("editor"),
                {
                    signal,
                },
            );

            document.addEventListener(
                "shopify:block:select",
                (event) => {
                    if (!isMine(event)) return;
                    const target = this.slides.indexOf(event.target);
                    if (target < 0) return;
                    this.pause("editor-block");
                    // Finish any running transition so the merchant sees the chosen slide.
                    if (this.tl && this.tl.isActive()) this.tl.progress(1);
                    if (target !== this.index)
                        this.goTo(target, target > this.index ? 1 : -1, false);
                },
                { signal },
            );
            document.addEventListener(
                "shopify:block:deselect",
                (event) => isMine(event) && this.resume("editor-block"),
                { signal },
            );
        }

        /* Helpers -------------------------------------------------------------- */

        splitWord(slide) {
            const word = slide.querySelector(".pt-hs__word");
            if (!word || word.dataset.split) return;
            const text = word.textContent;
            const fragment = document.createDocumentFragment();

            Array.from(text).forEach((character) => {
                // Each letter sits in its own window so the mask entrance can
                // clip it. In every other mode the wrapper is a pass-through
                // (see .pt-hs__char-mask in the stylesheet). The whole line is
                // already aria-hidden, so the wrappers stay silent to AT.
                const mask = document.createElement("span");
                mask.className = "pt-hs__char-mask";

                const span = document.createElement("span");
                span.className = "pt-hs__char";
                span.textContent = character === " " ? "\u00A0" : character;

                mask.append(span);
                fragment.append(mask);
            });

            word.textContent = "";
            word.append(fragment);
            word.dataset.split = "true";
        }

        warm(slide) {
            slide
                ?.querySelectorAll('img[loading="lazy"]')
                .forEach((img) => (img.loading = "eager"));
        }

        warmNeighbours() {
            const total = this.slides.length;
            if (total < 2) return;
            this.warm(this.slides[(this.index + 1) % total]);
            this.warm(this.slides[(this.index - 1 + total) % total]);
        }

        /* Product card --------------------------------------------------------- */

        bindCards() {
            this.slides.forEach((slide) => {
                const card = slide.querySelector(".pt-hs__card");
                if (!card) return;

                let variants = [];
                try {
                    variants = JSON.parse(
                        card.querySelector("[data-variants]")?.textContent ||
                            "[]",
                    );
                } catch (error) {
                    variants = [];
                }

                card.addEventListener(
                    "click",
                    (event) => {
                        const button = event.target.closest(".pt-hs__size");
                        if (button) this.selectVariant(card, variants, button);
                    },
                    { signal: this.signal },
                );

                const form = card.querySelector("[data-hero-form]");
                form?.addEventListener(
                    "submit",
                    (event) => {
                        event.preventDefault();
                        this.addToCart(card, form);
                    },
                    { signal: this.signal },
                );
            });
        }

        selectVariant(card, variants, button) {
            const id = Number(button.dataset.variantId);
            const variant = variants.find((item) => item.id === id);
            if (!variant) return;

            card.querySelectorAll(".pt-hs__size").forEach((item) => {
                item.setAttribute("aria-pressed", String(item === button));
            });

            const input = card.querySelector("[data-variant-input]");
            const price = card.querySelector("[data-price]");
            const compare = card.querySelector("[data-compare-price]");
            const atc = card.querySelector("[data-atc]");
            const label = card.querySelector("[data-atc-label]");

            if (input) input.value = id;
            if (price) price.textContent = variant.price;
            if (compare) {
                compare.hidden = !variant.compare;
                compare.textContent = variant.compare || "";
            }
            if (atc) {
                atc.disabled = !variant.available;
                if (atc.disabled) {
                    atc.classList.remove("is-flair");
                    if (window.gsap)
                        window.gsap.set(atc.querySelector(".button__flair"), {
                            scale: 0,
                        });
                }
                label.textContent = variant.available
                    ? atc.dataset.labelAdd
                    : atc.dataset.labelSoldOut;
            }
            this.showError(card, "");

            const gsap = window.gsap;
            if (gsap && price && !this.reduced) {
                gsap.fromTo(
                    price,
                    { y: 6, autoAlpha: 0 },
                    { y: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out" },
                );
            }
        }

        async addToCart(card, form) {
            const button = card.querySelector("[data-atc]");
            const label = card.querySelector("[data-atc-label]");
            if (
                !button ||
                button.disabled ||
                button.getAttribute("aria-busy") === "true"
            )
                return;

            const variantId = Number(form.querySelector('[name="id"]').value);
            const cart =
                document.querySelector("cart-notification") ||
                document.querySelector("cart-drawer");
            const body = { id: variantId, quantity: 1 };

            if (cart && typeof cart.getSectionsToRender === "function") {
                body.sections = cart
                    .getSectionsToRender()
                    .map((section) => section.id);
                body.sections_url = window.location.pathname;
                if (typeof cart.setActiveElement === "function")
                    cart.setActiveElement(button);
            }

            const routes = window.routes || {};
            button.setAttribute("aria-busy", "true");
            this.showError(card, "");

            try {
                const response = await fetch(
                    `${routes.cart_add_url || "/cart/add"}.js`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                        body: JSON.stringify(body),
                    },
                );
                const data = await response.json();

                if (!response.ok || data.status) {
                    const message =
                        data.description ||
                        data.message ||
                        (window.cartStrings && window.cartStrings.error) ||
                        "Error";
                    if (
                        typeof publish === "function" &&
                        typeof PUB_SUB_EVENTS !== "undefined"
                    ) {
                        publish(PUB_SUB_EVENTS.cartError, {
                            source: "pt-hero-slider",
                            productVariantId: variantId,
                            errors: data.errors || data.description,
                            message: data.message,
                        });
                    }
                    this.showError(card, message);
                    return;
                }

                if (
                    typeof publish === "function" &&
                    typeof PUB_SUB_EVENTS !== "undefined"
                ) {
                    publish(PUB_SUB_EVENTS.cartUpdate, {
                        source: "pt-hero-slider",
                        productVariantId: variantId,
                        cartData: data,
                    });
                }

                if (cart && typeof cart.renderContents === "function") {
                    cart.classList.remove("is-empty");
                    cart.renderContents(data);
                } else {
                    window.location.href = routes.cart_url || "/cart";
                    return;
                }

                label.textContent =
                    button.dataset.labelAdded || label.textContent;
                if (window.gsap && !this.reduced) {
                    window.gsap.fromTo(
                        button,
                        { scale: 0.94 },
                        {
                            scale: 1,
                            duration: 0.6,
                            ease: "elastic.out(1, 0.45)",
                        },
                    );
                }
                clearTimeout(this.addedTimer);
                this.addedTimer = setTimeout(() => {
                    label.textContent = button.dataset.labelAdd;
                }, 2200);
            } catch (error) {
                console.error(error);
                this.showError(
                    card,
                    (window.cartStrings && window.cartStrings.error) || "Error",
                );
            } finally {
                button.removeAttribute("aria-busy");
            }
        }

        showError(card, message) {
            const el = card.querySelector("[data-error]");
            if (!el) return;
            el.textContent = message;
            el.hidden = !message;
        }
    }

    customElements.define("pt-hero-slider", PtHeroSlider);

    // Belt and braces for the theme editor: make sure a re-rendered slider runs.
    document.addEventListener("shopify:section:load", (event) => {
        event.target.querySelectorAll("pt-hero-slider").forEach((slider) => {
            if (!slider.initialized) slider.connectedCallback();
        });
    });
})();
