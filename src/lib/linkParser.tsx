import React from 'react';

export function renderFormattedTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(combinedRegex);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part);
    if (isEmail) {
      return (
        <a
          key={index}
          href={`mailto:${part}`}
          className="text-gold underline hover:text-gold/80 font-medium break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    const isUrl = /^https?:\/\/[^\s]+$/.test(part) || /^www\.[^\s]+$/.test(part);
    if (isUrl) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline hover:text-gold/80 font-medium break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return part;
  });
}
