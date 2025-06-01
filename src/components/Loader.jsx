const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-transparent border-b-transparent border-cyan-400 rounded-full animate-spin-slower"></div>
        <div className="absolute inset-2 border-4 border-t-transparent border-b-transparent border-pink-400 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default Loader;
