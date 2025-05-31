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
  FaTimes,
} from "react-icons/fa";
import { SiJavascript, SiExpress, SiMongodb, SiGraphql } from "react-icons/si";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Loader from "./Loader";


const skillIcons = {
  JavaScript: <SiJavascript className="text-yellow-500" />,
  React: <FaReact className="text-cyan-500" />,
  "Node.js": <FaNodeJs className="text-green-600" />,
  Express: <SiExpress className="text-gray-700" />,
  MongoDB: <SiMongodb className="text-green-700" />,
  GraphQL: <SiGraphql className="text-pink-500" />,
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
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-cyan-900 px-2 py-1 text-xs font-semibold text-white shadow-md z-50 select-none pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-900 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ScrollFadeIn({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" }); // triggers a bit before fully visible

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

function AchievementsModal({ isOpen, onClose, title, achievements }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-cyan-700 hover:text-cyan-900 transition text-2xl focus:outline-none"
              >
                <FaTimes />
              </button>

              <h2 className="text-2xl font-bold text-cyan-900 mb-4">{title}</h2>
              <ul className="list-disc list-inside space-y-3 text-cyan-800 text-base leading-relaxed">
                {achievements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, title: "", achievements: [] });

  useEffect(() => {
    axios
      .get(`https://amiwrites-backend-app-1.onrender.com/api/portfolio`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching portfolio:", err));
  }, []);

  if (!data) return <Loader />;

  const openModal = (title, achievements) => {
    setModalData({ isOpen: true, title, achievements });
  };

  const closeModal = () => {
    setModalData({ isOpen: false, title: "", achievements: [] });
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-4 sm:p-8 md:p-12 flex justify-center">
        <article className="bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg max-w-4xl w-full p-6 md:p-10">
          <section className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <motion.img
              src={`https://amiwrites-backend-app-1.onrender.com${data.photoUrl}`}
              alt={data.name}
              loading="lazy"
              width={192}
              height={192}
              className="rounded-3xl object-cover shadow-lg border-4 border-cyan-300 w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 12px 20px rgba(14,203,253,0.3)",
                transition: { duration: 0.3 },
              }}
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-900 leading-tight">
                {data.name}
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-cyan-700 mt-1">{data.title}</h2>
              <p className="text-cyan-800 italic mt-3 max-w-md mx-auto sm:mx-0 leading-relaxed">
                {data.description}
              </p>
              <div className="mt-4 space-y-1 text-cyan-700 font-medium text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                <p>✉️ {data.email}</p>
                <p>📞 {data.phone}</p>
              </div>
              <nav className="flex justify-center sm:justify-start gap-6 mt-5 text-cyan-600 text-2xl">
                {[
                  {
                    Icon: FaLinkedin,
                    url: data.socialLinks.linkedin,
                    label: "LinkedIn",
                    color: "#0A66C2",
                  },
                  { Icon: FaGithub, url: data.socialLinks.github, label: "GitHub", color: "#333" },
                  {
                    Icon: FaInstagram,
                    url: data.socialLinks.instagram,
                    label: "Instagram",
                    color: "#E4405F",
                  },
                  {
                    Icon: FaFacebook,
                    url: data.socialLinks.facebook,
                    label: "Facebook",
                    color: "#1877F2",
                  },
                ].map(({ Icon, url, label, color }) => (
                  <motion.a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    whileHover={{ scale: 1.15, color }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="cursor-pointer"
                  >
                    <Icon />
                  </motion.a>
                ))}
              </nav>
            </div>
          </section>

          {/* Summary */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 mb-3 border-b-2 border-cyan-300 pb-1">Summary</h3>
            <p className="text-cyan-900 leading-relaxed">{data.summary}</p>
          </ScrollFadeIn>

          {/* Skills */}
          <ScrollFadeIn className="mt-8">
            <h3 className="text-2xl font-bold text-cyan-800 mb-4 border-b-2 border-cyan-300 pb-1">Skills</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-md">
              {data.skills.map(({ skill, expertise }) => (
                <Tooltip key={skill} content={expertise}>
                  <div className="flex items-center space-x-1 rounded-md border border-cyan-300 px-3 py-1 text-cyan-900 text-sm font-semibold cursor-default select-none hover:bg-cyan-100 transition">
                    {skillIcons[skill]}
                    <span>{skill}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </ScrollFadeIn>

          {/* Experience */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 mb-4 border-b-2 border-cyan-300 pb-1 flex items-center gap-2">
              <FaBriefcase /> Experience
            </h3>
            <div className="space-y-6 max-w-md">
              {data.experience.map(({ company, role, duration, description, achievements }, i) => (
                <article key={i} className="border-l-4 border-cyan-400 pl-4">
                  <h4 className="text-xl font-semibold text-cyan-900">{role}</h4>
                  <p className="italic text-gray-600 mb-1">
                    {company} • {duration}
                  </p>
                  <p className="text-cyan-800">{description}</p>
                  {achievements && achievements.length > 0 && (
                    <button
                      onClick={() => openModal(`${role} at ${company} - Achievements`, achievements)}
                      className="mt-2 text-cyan-600 hover:text-cyan-900 font-semibold underline cursor-pointer"
                      aria-label={`View achievements for ${role} at ${company}`}
                    >
                      View Achievements
                    </button>
                  )}
                </article>
              ))}
            </div>
          </ScrollFadeIn>

          {/* Education */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 mb-4 border-b-2 border-cyan-300 pb-1 flex items-center gap-2">
              <FaGraduationCap /> Education
            </h3>
            <div className="space-y-6 max-w-md">
              {data.education.map(({ institution, degree, duration, achievements }, i) => (
                <article key={i} className="border-l-4 border-cyan-400 pl-4">
                  <h4 className="text-xl font-semibold text-cyan-900">{degree}</h4>
                  <p className="italic text-gray-600 mb-1">
                    {institution} • {duration}
                  </p>
                  {achievements && achievements.length > 0 && (
                    <button
                      onClick={() => openModal(`${degree} at ${institution} - Achievements`, achievements)}
                      className="mt-2 text-cyan-600 hover:text-cyan-900 font-semibold underline cursor-pointer"
                      aria-label={`View achievements for ${degree} at ${institution}`}
                    >
                      View Achievements
                    </button>
                  )}
                </article>
              ))}
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
