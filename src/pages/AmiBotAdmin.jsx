import { useEffect } from "react";
import AmiBotAdminPanel from "../components/AmiBot/AmiBotAdmin";
import { applySEO } from "../utils/seo";

const AmiBotAdmin = () => {
  useEffect(() => {
    applySEO({
      path: "/amibot-admin",
      title: "AmiBot Admin | AmiVerse",
      description: "Admin dashboard for AmiBot knowledge and unanswered questions.",
      noindex: true,
    });
  }, []);

  return <AmiBotAdminPanel />;
};

export default AmiBotAdmin;
