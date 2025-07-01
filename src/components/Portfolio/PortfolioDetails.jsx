import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaInstagram,
  FaReact,
  FaNodeJs,
  FaBriefcase,
  FaGraduationCap,
  FaJs, // ✅ Added
} from "react-icons/fa";
import {
  SiTensorflow,
  SiOpenai,
  SiExpress,
  SiMongodb,
  SiGraphql,
} from "react-icons/si";
import clsx from "clsx";
import { motion, AnimatePresence, useInView } from "framer-motion";
import InitialLoader from "./InitialLoader";
import { useLocation } from "react-router-dom";
import AchievementsModal from "./AchievementsModal";


// 🎯 Skill icon data with proper label and icon component
const skillIconMap = {
  JavaScript: <FaJs className="text-yellow-500 w-8 h-8" />,
  React: <FaReact className="text-cyan-500 w-8 h-8" />,
  "Node.js": <FaNodeJs className="text-green-600 w-8 h-8" />,
  Express: <SiExpress className="text-gray-700 dark:text-gray-200 w-8 h-8" />,
  MongoDB: <SiMongodb className="text-green-700 w-8 h-8" />,
  GraphQL: <SiGraphql className="text-pink-500 w-8 h-8" />,
  AI: <SiOpenai className="text-purple-600 w-8 h-8" />,
  ML: <SiTensorflow className="text-orange-500 w-8 h-8" />,
};





const Tooltip = ({ children, content }) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white dark:bg-cyan-600 px-2 py-1 text-xs font-semibold shadow-md z-50 select-none pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 dark:bg-cyan-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ScrollFadeIn({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    achievements: [],
  });
  const [showLoader, setShowLoader] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
    document.title = "Amritanshu Mishra's Portfolio";

    const loaderTimer = setTimeout(() => {
      setShowLoader(false);
    }, 1600);

    axios
      .get(`https://amiwrites-backend-app-1.onrender.com/api/portfolio`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching portfolio:", err));

    return () => clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  if (!data || showLoader) return <InitialLoader />;

  const openModal = (title, achievements) => {
    setModalData({ isOpen: true, title, achievements });
  };

  const closeModal = () => {
    setModalData({ isOpen: false, title: "", achievements: [] });
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4 sm:p-8 md:p-12 flex justify-center">
        <article className="bg-white dark:bg-zinc-900 text-black dark:text-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl max-w-4xl w-full p-6 md:p-10">
          <section className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <motion.img
              src={`https://amiwrites-backend-app-1.onrender.com${data.photoUrl}`}
              alt="Amritanshu Mishra"
              loading="eager"
              width={192}
              height={192}
              className="rounded-3xl object-cover shadow-lg border-4 border-cyan-300 w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-900 dark:text-cyan-300 leading-tight">
                {data.name}
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-cyan-700 dark:text-cyan-400 mt-1">
                {data.title}
              </h2>
              <p className="text-cyan-800 dark:text-cyan-200 italic mt-3 max-w-md mx-auto sm:mx-0 leading-relaxed">
                {data.description}
              </p>
              <div className="mt-4 space-y-1 text-cyan-700 dark:text-cyan-300 font-medium text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                <p>✉️ {data.email}</p>
                <p>📞 {data.phone}</p>
              </div>
          <nav className="flex justify-center sm:justify-start gap-6 mt-5 text-2xl">
  <motion.a
    href={data.socialLinks.linkedin}
    target="_blank"
    rel="noreferrer"
    whileHover={{ scale: 1.15 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-blue-700"
  >
    <FaLinkedin />
  </motion.a>

  <motion.a
    href={data.socialLinks.github}
    target="_blank"
    rel="noreferrer"
    whileHover={{ scale: 1.15 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-gray-800"
  >
    <FaGithub />
  </motion.a>

  <motion.a
    href={data.socialLinks.instagram}
    target="_blank"
    rel="noreferrer"
    whileHover={{ scale: 1.15 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-pink-500"
  >
    <FaInstagram />
  </motion.a>

  <motion.a
    href={data.socialLinks.facebook}
    target="_blank"
    rel="noreferrer"
    whileHover={{ scale: 1.15 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-blue-600"
  >
    <FaFacebook />
  </motion.a>
</nav>

            </div>
          </section>

          {/* Skills */}
<ScrollFadeIn className="mt-10">
  <h3 className="text-3xl font-bold text-cyan-800 dark:text-cyan-300 mb-6 border-b-4 border-cyan-300 dark:border-cyan-600 inline-block pb-1">
    Skills
  </h3>

  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
    {data.skills.map(({ skill, expertise }, index) => (
      <motion.div
        key={skill}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          delay: index * 0.03,
          duration: 0.4,
          ease: "easeOut",
        }}
      >
        <Tooltip content={expertise}>
          <div className="group flex flex-col items-center justify-center aspect-square max-w-[110px] w-full mx-auto bg-white dark:bg-zinc-800 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 ease-in-out">
            <div className="w-9 h-9 mb-2 flex items-center justify-center">
              <span className="group-hover:animate-pulse-slow">
                {skillIconMap[skill] ?? (
                  <span className="text-cyan-700 dark:text-cyan-300 text-sm">?</span>
                )}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center truncate px-2">
              {skill}
            </span>
          </div>
        </Tooltip>
      </motion.div>
    ))}
  </div>
</ScrollFadeIn>


          {/* Experience */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4 border-b-2 border-cyan-300 dark:border-cyan-600 pb-1 flex items-center gap-2">
              <FaBriefcase /> Experience
            </h3>
            <div className="space-y-6 max-w-md">
              {data.experience.map(
                ({ company, role, duration, description, achievements }, i) => (
                  <article
                    key={i}
                    className="border-l-4 border-cyan-400 dark:border-cyan-600 pl-4"
                  >
                    <h4 className="text-xl font-semibold text-cyan-900 dark:text-cyan-200">
                      {role}
                    </h4>
                    <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                      {company} • {duration}
                    </p>
                    <p className="text-cyan-800 dark:text-cyan-300">
                      {description}
                    </p>
                    {achievements?.length > 0 && (
                      <button
                        onClick={() =>
                          openModal(
                            `${role} at ${company} - Achievements`,
                            achievements
                          )
                        }
                        className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-100 font-semibold underline"
                      >
                        View Achievements
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          </ScrollFadeIn>

          {/* Education */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4 border-b-2 border-cyan-300 dark:border-cyan-600 pb-1 flex items-center gap-2">
              <FaGraduationCap /> Education
            </h3>
            <div className="space-y-6 max-w-md">
              {data.education.map(
                ({ institution, degree, duration, achievements }, i) => (
                  <article
                    key={i}
                    className="border-l-4 border-cyan-400 dark:border-cyan-600 pl-4"
                  >
                    <h4 className="text-xl font-semibold text-cyan-900 dark:text-cyan-200">
                      {degree}
                    </h4>
                    <p className="italic text-gray-600 dark:text-gray-400 mb-1">
                      {institution} • {duration}
                    </p>
                    {achievements?.length > 0 && (
                      <button
                        onClick={() =>
                          openModal(
                            `${degree} at ${institution} - Achievements`,
                            achievements
                          )
                        }
                        className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-100 font-semibold underline"
                      >
                        View Achievements
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          </ScrollFadeIn>
        </article>
      </main>

      <AchievementsModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        title={modalData.title}
        achievements={modalData.achievements}
      />
    </>
  );
}
