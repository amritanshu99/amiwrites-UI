import { useEffect } from "react";
import ResetPasswordPageDetails from '../components/Auth/ResetPasswordPageDetails';

import { applySEO, seoByRoute } from "../utils/seo";

const ResetPasswordPage = ({ token }) => {
  useEffect(() => {
    const routeSeo = seoByRoute["/reset-password"] || {
      title: "Reset Password | AmiVerse",
      description: "Securely reset your AmiVerse account password.",
      noindex: true,
    };

    applySEO({
      path: "/reset-password",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <ResetPasswordPageDetails token={token} />
    </div>
  );
};

export default ResetPasswordPage;
