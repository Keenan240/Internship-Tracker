'use client';

import { useEffect, useState } from 'react';

const messages = [
  "You're qualified. Send that application!",
  "Your effort pays off. Keep applying!",
  "You're not cooked bud, just lock tf in.",
  "Rejections are just redirections 🚀",
  "Each 'no' gets you closer to a 'yes.'",
];

export default function Motivate() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out first
      setFade(false);

      // Wait 500ms for fade out before changing message
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setFade(true); // Fade in new message
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`text-center text-lg font-medium text-gray-600 mb-10 transition-opacity duration-500 ${
        fade ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {messages[index]}
    </div>
  );
}
