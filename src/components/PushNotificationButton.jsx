import React, { useState } from 'react';

const VAPID_PUBLIC_KEY = 'BALDbiFNlNyLWEOHi9BxuemRyq-ShZn_5ynesh4btV9-CsRMGfx3kyrB8ma2LiaegXzQt5Glgiha99MKuFKvl64'; // Replace this with your real key

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotificationButton = () => {
  const [subscribed, setSubscribed] = useState(false);

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Service workers are not supported in this browser.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        alert('Notification permission denied.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setSubscribed(true);
      alert('🎉 Subscribed to blog notifications!');
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  if (subscribed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={subscribeUser}
        className="
          flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2
          text-xs sm:text-sm font-medium
          text-gray-800 dark:text-white
          bg-white/70 dark:bg-zinc-800/70
          backdrop-blur-md border border-gray-300 dark:border-zinc-700
          shadow-md rounded-full
          hover:bg-white/90 dark:hover:bg-zinc-700/90
          transition-all duration-300 ease-in-out
        "
      >
        <span className="text-base">🔔</span>
        <span className="hidden sm:inline">Notify Me</span>
      </button>
    </div>
  );
};

export default PushNotificationButton;
