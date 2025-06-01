import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Loader from './Loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ContactMeButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', reason: '' });

  // Preload the sound
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/message.mp3');
    audioRef.current.load();
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => console.error('Audio play failed:', err));
    }
  };

  const handleOpen = () => {
    playSound();
    setOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'https://amiwrites-backend-app-1.onrender.com/api/contact',
        form
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Your request is submitted. We will get back to you shortly.');
        setForm({ name: '', email: '', reason: '' });
        setOpen(false);
      } else {
        toast.error('Something went wrong, please try again later.');
      }
    } catch (error) {
      console.error('API error:', error);
      toast.error('Failed to send your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-xl hover:scale-105 transition-transform duration-200 backdrop-blur-md text-sm sm:text-base"
        aria-label="Contact Me"
      >
        ✉️ Contact Me
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn transition-all backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">Let’s Connect</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              I'd love to hear from you. Fill in your details below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 dark:text-gray-200 font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 font-medium">Reason to Connect</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows="3"
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 items-center">
                {loading && <Loader />}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
    </>
  );
}
