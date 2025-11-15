import React from 'react';

interface LinkifyProps {
  text: string;
}

const Linkify: React.FC<LinkifyProps> = ({ text }) => {
  if (!text) return null;

  // A more robust regex to find URLs (including those without http/https)
  const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `http://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

export default Linkify;
