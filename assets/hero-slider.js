document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".hero-slider-container");
    if (!slider) return;

    const slides = slider.querySelectorAll(".hero-slide");
    const prevBtn = slider.querySelector(".hero-prev-btn");
    const nextBtn = slider.querySelector(".hero-next-btn");

    let currentIndex = 0;
    let isAnimating = false;

    // Initial Entrance Animation
    function playEntrance(slide) {
        const title = slide.querySelector(".gsap-title");
        const bottle = slide.querySelector(".gsap-bottle");
        const card = slide.querySelector(".gsap-card");
        const flowers = slide.querySelectorAll(".gsap-flower");

        const tl = gsap.timeline();

        tl.fromTo(
            title,
            { y: 60, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out" },
        )
            .fromTo(
                bottle,
                { y: 120, opacity: 0, scale: 0.9 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.1,
                    ease: "power3.out",
                },
                "-=0.7",
            )
            .fromTo(
                flowers,
                { scale: 0.6, opacity: 0, rotation: -15 },
                {
                    scale: 1,
                    opacity: 1,
                    rotation: 0,
                    duration: 0.9,
                    stagger: 0.08,
                    ease: "back.out(1.4)",
                },
                "-=0.8",
            )
            .fromTo(
                card,
                { x: -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
                "-=0.6",
            );
    }

    // Slide Switch Logic
    function goToSlide(nextIndex, direction = 1) {
        if (isAnimating || nextIndex === currentIndex || slides.length <= 1)
            return;
        isAnimating = true;

        const currentSlide = slides[currentIndex];
        const nextSlide = slides[nextIndex];

        const currentBottle = currentSlide.querySelector(".gsap-bottle");
        const currentTitle = currentSlide.querySelector(".gsap-title");
        const currentCard = currentSlide.querySelector(".gsap-card");

        const exitTl = gsap.timeline({
            onComplete: () => {
                currentSlide.classList.remove("is-active");
                nextSlide.classList.add("is-active");
                playEntrance(nextSlide);
                currentIndex = nextIndex;
                isAnimating = false;
            },
        });

        exitTl
            .to([currentTitle, currentCard], {
                y: -30 * direction,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
            })
            .to(
                currentBottle,
                {
                    y: 60,
                    opacity: 0,
                    duration: 0.45,
                    ease: "power2.in",
                },
                "-=0.3",
            );
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const next = (currentIndex + 1) % slides.length;
            goToSlide(next, 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const prev = (currentIndex - 1 + slides.length) % slides.length;
            goToSlide(prev, -1);
        });
    }

    // Interactive 50ml / 100ml Pill Toggle
    slider.querySelectorAll(".size-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const parent = e.currentTarget.closest(".card-size-selector");
            parent
                .querySelectorAll(".size-btn")
                .forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
        });
    });

    // Mousemove Parallax on Floating Flowers
    slider.addEventListener("mousemove", (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const activeSlide = slides[currentIndex];
        if (!activeSlide) return;

        activeSlide.querySelectorAll(".gsap-flower").forEach((flower) => {
            const depth = parseFloat(flower.getAttribute("data-depth")) || 0.05;
            const moveX = (clientX - centerX) * depth;
            const moveY = (clientY - centerY) * depth;

            gsap.to(flower, {
                x: moveX,
                y: moveY,
                duration: 0.6,
                ease: "power1.out",
            });
        });
    });

    // Run on initial load
    if (slides[0]) {
        playEntrance(slides[0]);
    }
});
