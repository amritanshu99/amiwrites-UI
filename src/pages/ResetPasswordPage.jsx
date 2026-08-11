import ResetPasswordPageDetails from '../components/Auth/ResetPasswordPageDetails';

const ResetPasswordPage = ({ token }) => {
  return (
    <div>
      <ResetPasswordPageDetails token={token} />
    </div>
  );
};

export default ResetPasswordPage;
