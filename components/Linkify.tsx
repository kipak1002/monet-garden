import React from 'react';

interface LinkifyProps {
  text: string;
}

/**
 * Smart Linkify component:
 * Converts markdown links [Label](url), raw URLs, emails, instagram tags (@handle), and bold text (**bold**)
 * into clickable, styled elements.
 */
const Linkify: React.FC<LinkifyProps> = ({ text }) => {
  if (!text) return null;

  // Split by markdown link first: [Label](url)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const tokens: Array<{ type: 'text' | 'mdLink'; text: string; url?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mdLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.substring(lastIndex, match.index) });
    }
    tokens.push({ type: 'mdLink', text: match[1], url: match[2] });
    lastIndex = mdLinkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.substring(lastIndex) });
  }

  const renderInlineFormatted = (str: string, keyPrefix: string): React.ReactNode => {
    // Check for bold text **bold**
    const boldParts = str.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      const subKey = `${keyPrefix}-b${bIdx}`;
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
        return (
          <strong key={subKey} className="font-bold text-gray-900">
            {renderUrlsAndEmails(bPart.slice(2, -2), `${subKey}-in`)}
          </strong>
        );
      }
      return <React.Fragment key={subKey}>{renderUrlsAndEmails(bPart, `${subKey}-out`)}</React.Fragment>;
    });
  };

  const renderUrlsAndEmails = (plainText: string, keyPrefix: string): React.ReactNode => {
    if (!plainText) return null;

    const pattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:instagram\.com\/[a-zA-Z0-9_.]+|@[a-zA-Z0-9_.]+)|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/gi;
    const parts = plainText.split(pattern);

    return parts.map((part, pIdx) => {
      const partKey = `${keyPrefix}-p${pIdx}`;
      if (!part) return null;

      // Email
      if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(part)) {
        return (
          <a
            key={partKey}
            href={`mailto:${part}`}
            className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors"
          >
            {part}
          </a>
        );
      }

      // Instagram handle (@username)
      if (/^@[a-zA-Z0-9_.]+$/.test(part)) {
        const username = part.substring(1);
        return (
          <a
            key={partKey}
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-800 underline underline-offset-4 decoration-pink-300 hover:decoration-pink-600 font-medium transition-colors inline-flex items-center gap-0.5"
          >
            {part}
            <span className="text-[0.75em] opacity-70">↗</span>
          </a>
        );
      }

      // URLs
      if (
        part.startsWith('http://') ||
        part.startsWith('https://') ||
        part.startsWith('www.') ||
        part.startsWith('instagram.com/')
      ) {
        let href = part;
        if (href.startsWith('www.')) {
          href = `https://${href}`;
        } else if (href.startsWith('instagram.com/')) {
          href = `https://${href}`;
        }
        return (
          <a
            key={partKey}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors inline-flex items-center gap-0.5 break-all"
          >
            {part}
            <span className="text-[0.75em] opacity-70">↗</span>
          </a>
        );
      }

      return <span key={partKey}>{part}</span>;
    });
  };

  return (
    <>
      {tokens.map((token, tIdx) => {
        if (token.type === 'mdLink' && token.url) {
          let href = token.url.trim();
          if (href.startsWith('@')) {
            href = `https://instagram.com/${href.substring(1)}`;
          } else if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            if (href.includes('@') && !href.includes('/')) {
              href = `mailto:${href}`;
            } else {
              href = `https://${href}`;
            }
          }
          return (
            <a
              key={`mdl-${tIdx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors inline-flex items-center gap-0.5"
            >
              {token.text}
              <span className="text-[0.75em] opacity-70">↗</span>
            </a>
          );
        }

        return (
          <React.Fragment key={`tok-${tIdx}`}>
            {renderInlineFormatted(token.text, `tok-${tIdx}`)}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Linkify;
