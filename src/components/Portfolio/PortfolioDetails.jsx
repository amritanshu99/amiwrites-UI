  import React, { useEffect, useState, useRef } from "react";
  import axios from "axios";
  import {
    FaLinkedin,
    FaGithub,
    FaInstagram,
    FaFacebook,
    FaBriefcase,
    FaGraduationCap,
    FaReact,
    FaNodeJs,
    FaJs,
  } from "react-icons/fa";
  import {
    SiMongodb,
    SiExpress,
    SiGraphql,
    SiOpenai,
    SiTensorflow,
  } from "react-icons/si";
  import {
    motion,
    useScroll,
    useTransform,
    useInView,
    AnimatePresence,
  } from "framer-motion";
  import InitialLoader from "./InitialLoader";
  import AchievementsModal from "./AchievementsModal";

  /* ================= ICON MAP ================= */
  const skillIconMap = {
    JavaScript: <FaJs />,
    React: <FaReact />,
    "Node.js": <FaNodeJs />,
    MongoDB: <SiMongodb />,
    Express: <SiExpress />,
    GraphQL: <SiGraphql />,
    AI: <SiOpenai />,
    ML: <SiTensorflow />,
  };

  const socialColors = {
    LinkedIn: "text-[#0A66C2]",
    GitHub: "text-[#181717] dark:text-white",
    Instagram: "text-[#E4405F]",
    Facebook: "text-[#1877F2]",
  };

  /* ================= TOOLTIP ================= */
  const Tooltip = ({ children, content }) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative flex justify-center">
        <motion.div
          onHoverStart={() => setShow(true)}
          onHoverEnd={() => setShow(false)}
          onTap={() => setShow((prev) => !prev)}
        >
          {children}
        </motion.div>

        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute -top-9 z-20
                        bg-black text-white dark:bg-white dark:text-black
                        text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };




  /* ================= ANIMATED BANNER ================= */
  const AnimatedBanner = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-120px" });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
      >
        <img
          src="/banner.png"
          alt="Amritanshu Mishra Banner"
          className="
            w-full
            h-auto
            object-cover
            shadow-xl
          "
        />
      </motion.div>
    );
  };



  /* ================= FADE ROW ================= */
  const FadeRow = ({ children }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-160px" });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );
  };

  /* ================= SOCIAL MODAL ================= */
  const SocialModal = ({ isOpen, onClose, platform, url, icon }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-xl p-5 w-[280px] text-center"
        >
          <div className="text-2xl mb-2">{icon}</div>
          <h3 className="text-sm font-semibold mb-1">{platform}</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
            Open profile in a new tab?
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 text-xs rounded bg-black text-white dark:bg-white dark:text-black"
            >
              Open
            </a>
          </div>
        </motion.div>
      </div>
    );
  };

  /* ================= MAIN ================= */
  export default function PortfolioDetails() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false });
    const [isDark, setIsDark] = useState(false);
    const [socialModal, setSocialModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hideArrow, setHideArrow] = useState(true);
  const pageRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);

    const heroRef = useRef(null);

    const heroScroll = useScroll({
      target: heroRef,
      offset: ["start start", "end end"],
    });

    const imageScale = useTransform(heroScroll.scrollYProgress, [0, 1], [1.12, 1]);
    const textY = useTransform(heroScroll.scrollYProgress, [0, 1], [0, -140]);
    const textOpacity = useTransform(
      heroScroll.scrollYProgress,
      [0, 0.8],
      [1, 0.65]
    );

    useEffect(() => {
      const sync = () =>
        setIsDark(document.documentElement.classList.contains("dark"));
      sync();
      const obs = new MutationObserver(sync);
      obs.observe(document.documentElement, { attributes: true });
      return () => obs.disconnect();
    }, []);
  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll"
    );

    if (!scrollContainer) return;

    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = scrollContainer;

      if (scrollTop > 10) {
        setHasScrolled(true);
      }

      const atBottom =
        Math.ceil(scrollTop + clientHeight) >= scrollHeight;

      // hide only AFTER user has scrolled at least once
      setHideArrow(hasScrolled && atBottom);
    };

    scrollContainer.addEventListener("scroll", onScroll);

    // DO NOT auto-run onScroll here

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, [hasScrolled]);



    useEffect(() => {
      axios
        .get("https://amiwrites-backend-app-2lp5.onrender.com/api/portfolio")
        .then((res) => {
          setData(res.data);
          setTimeout(() => setLoading(false), 1400);
        });
    }, []);

    if (loading || !data) return <InitialLoader />;

    const [firstName, lastName] = data.name.split(" ");

  const socials = [
    { name: "LinkedIn", icon: <FaLinkedin size={28} />, url: data.socialLinks.linkedin },
    { name: "GitHub", icon: <FaGithub size={28} />, url: data.socialLinks.github },
    { name: "Instagram", icon: <FaInstagram size={28} />, url: data.socialLinks.instagram },
    { name: "Facebook", icon: <FaFacebook size={28} />, url: data.socialLinks.facebook },
  ];


    const skillColors = {
      JavaScript: "text-[#F7DF1E]",
      React: "text-[#61DAFB]",
      "Node.js": "text-[#339933]",
      MongoDB: "text-[#47A248]",
      Express: "text-black dark:text-white",
      GraphQL: "text-[#E10098]",
      AI: "text-[#10A37F]",
      ML: "text-[#FF6F00]",
    };

    return (
  <main
    ref={pageRef}
    className="relative w-full text-zinc-900 dark:text-zinc-100 overflow-hidden"
  >

  {/* ===== PREMIUM NY BACKGROUND ===== */}
  <div
    className="fixed inset-0 -z-10 bg-cover bg-center"
    style={{ backgroundImage: "url('/ny-bg.png')" }}
  >
    {/* corporate neutral tint (not too white, not too dark) */}
    <div className="absolute inset-0 bg-white/25 dark:bg-black/35" />

  {/* slightly stronger corporate tint */}
  <div className="absolute inset-0 bg-white/35 dark:bg-black/45" />

  {/* stronger readability but still elegant */}
  <div className="absolute inset-0 bg-gradient-to-b 
    from-white/20 
    via-transparent 
    to-white/55 
    dark:from-black/40 
    dark:to-black/80" 
  />


    {/* subtle corporate depth */}
    <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.28)]" />
  </div>






        {/* PAGE HEIGHT WRAPPER (controls sticky duration) */}
        <div className="relative min-h-[200vh]">

          {/* ================= STICKY SCROLL INDICATOR ================= */}
    <motion.div
    className="
      fixed top-24 left-1/2 -translate-x-1/2
      z-20 text-zinc-700 dark:text-white/70
      text-center pointer-events-none
    "
    animate={{
      opacity: hideArrow ? 0 : 1,
    }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-[10px] tracking-widest uppercase mb-2">
      Scroll
    </div>

    <div className="flex flex-col items-center leading-none">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="text-lg"
          animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 1.4,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ↓
        </motion.div>
      ))}
    </div>
  </motion.div>


          {/* ================= HERO ================= */}
          <section ref={heroRef} className="relative h-[150vh]">
            <motion.div
              style={{ scale: imageScale }}
              className="sticky top-0 h-screen overflow-hidden"
            >
      <motion.img
    src={`https://amiwrites-backend-app-2lp5.onrender.com${
      isDark ? data.photoUrlDark : data.photoUrl
    }`}
    alt={data.name}
    onLoad={() => setImageLoaded(true)}
    initial={{ opacity: 0, scale: 1.03 }}
    animate={{
      opacity: imageLoaded ? 1 : 0,
      scale: imageLoaded ? 1 : 1.03,
    }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  className="
    w-full
    h-full
    object-cover
    object-center
    block
  "

  />


              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/95" />
            </motion.div>

            <motion.div
              style={{ y: textY, opacity: textOpacity }}
              className="pointer-events-none sticky top-0 h-screen flex items-center px-6 md:px-20 z-10"
            >
             <h1
  className="
    font-extrabold tracking-[-0.04em] leading-[0.92]
    text-black/80 dark:text-white
    text-[14vw] sm:text-[11vw] md:text-[8vw] lg:text-[7vw]
  "
>

                {firstName}
                <br />
                {lastName}
              </h1>
            </motion.div>
          </section>
  {/* ================= BRAND BANNER ================= */}
  <section className="w-full overflow-hidden bg-white dark:bg-black py-12 md:py-16">
    <AnimatedBanner />
  </section>


          {/* ================= INTRO ================= */}
          <section className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800">
            <FadeRow>
              <div className="max-w-4xl space-y-4">
                <p className="text-lg md:text-xl font-medium leading-relaxed">
                  {data.description}
                </p>
              <div className="flex gap-4 text-zinc-500">
    {socials.map((s) => (
      <button
        key={s.name}
        onClick={() => setSocialModal(s)}
        className={`${socialColors[s.name]} hover:scale-110 transition-transform`}
      >
        {s.icon}
      </button>
    ))}
  </div>
              </div>
            </FadeRow>
          </section>

          {/* ================= SKILLS ================= */}
          <section className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800">
            <FadeRow>
              <h2 className="text-xl md:text-2xl font-semibold mb-8">
                01 — Skills
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-6">
                {data.skills.map(({ skill, expertise }) => (
                  <Tooltip key={skill} content={expertise}>
                  <motion.div
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  className="
    group
    flex flex-col items-center justify-center
    w-[110px] h-[110px]
    gap-2 p-3
    rounded-2xl cursor-pointer
    border border-zinc-200 dark:border-zinc-800
    bg-white dark:bg-zinc-900/50
    transition-all duration-300
    hover:shadow-xl hover:-translate-y-1
    hover:border-zinc-300 dark:hover:border-zinc-600
  "

  >

                      <div className={`text-3xl ${skillColors[skill]}`}>
                        {skillIconMap[skill]}
                      </div>
                    <span className="text-sm font-semibold text-center leading-tight">
    {skill}
  </span>

          </motion.div>

                  </Tooltip>
                ))}
              </div>
            </FadeRow>
          </section>

          {/* ================= EXPERIENCE ================= */}
          <section className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800">
            <FadeRow>
              <h2 className="text-xl md:text-2xl font-semibold mb-8 flex items-center gap-2">
                <FaBriefcase /> 02 — Experience
              </h2>

              {data.experience.map((exp, i) => (
                <div
                  key={i}
                  className="grid sm:grid-cols-[160px_1fr] sm:grid-cols-[160px_1fr] md:grid-cols-[220px_1fr] gap-8 pb-10
                            border-b border-zinc-200 dark:border-zinc-800 last:border-none"
                >
                  <div className="text-sm text-zinc-500">{exp.duration}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{exp.role}</h3>
                    <p className="text-sm text-zinc-500">{exp.company}</p>
                    <p className="mt-2 text-base">{exp.description}</p>

                    {exp.achievements?.length > 0 && (
                      <button
                        className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
                        onClick={() =>
                          setModal({
                            isOpen: true,
                            title: `${exp.role} @ ${exp.company}`,
                            achievements: exp.achievements,
                          })
                        }
                      >
                        → View achievements
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </FadeRow>
          </section>

          {/* ================= EDUCATION ================= */}
        <section className="px-6 md:px-20 py-14 md:py-16">
          <FadeRow>
            <h2 className="text-xl md:text-2xl font-semibold mb-8 flex items-center gap-2">
              <FaGraduationCap /> 03 — Education
            </h2>

            {data.education.map((edu, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[160px_1fr] sm:grid-cols-[160px_1fr] md:grid-cols-[220px_1fr] gap-8 pb-10
                          border-b border-zinc-200 dark:border-zinc-800 last:border-none"
              >
                <div className="text-sm text-zinc-500">{edu.duration}</div>
                <div>
                  <h3 className="text-lg font-semibold">{edu.degree}</h3>
                  <p className="text-sm text-zinc-500">{edu.institution}</p>

                  {edu.achievements?.length > 0 && (
                    <button
                      className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
                      onClick={() =>
                        setModal({
                          isOpen: true,
                          title: `${edu.degree} @ ${edu.institution}`,
                          achievements: edu.achievements,
                        })
                      }
                    >
                      → View achievements
                    </button>
                  )}
                </div>
              </div>
            ))}
          </FadeRow>
        </section>
        </div>

        <AchievementsModal
          isOpen={modal.isOpen}
          title={modal.title}
          achievements={modal.achievements}
          onClose={() => setModal({ isOpen: false })}
        />

        <SocialModal
          isOpen={!!socialModal}
          platform={socialModal?.name}
          url={socialModal?.url}
          icon={socialModal?.icon}
          onClose={() => setSocialModal(null)}
        />
      </main>
    );
  }
