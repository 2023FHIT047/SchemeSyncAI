import React from 'react';

/**
 * Renders scheme text that may contain newlines, markdown-like formatting
 * (bold, bullets, numbered lists, blockquotes) into proper HTML.
 */
export const FormattedText = ({ text, className, style }) => {
  if (!text) return null;

  const cleaned = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const lines = cleaned.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null;

  const flushList = (key) => {
    if (listBuffer.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={key} style={{ margin: '0.75rem 0', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {listBuffer.map((item, i) => (
          <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--gray-700)' }}>
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  const renderInline = (str) => {
    // Handle [text](url) links, ***bold italic***, **bold**, and *italic*
    const parts = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*([^*\n]+)\*/g;
    let lastIdx = 0;
    let keyIdx = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) parts.push(str.slice(lastIdx, match.index));
      if (match[1] && match[2]) {
        parts.push(
          <a
            key={keyIdx++}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'underline' }}
          >
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        parts.push(
          <strong key={keyIdx++} style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
            <em>{match[3]}</em>
          </strong>
        );
      } else if (match[4]) {
        parts.push(<strong key={keyIdx++} style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{match[4]}</strong>);
      } else if (match[5]) {
        parts.push(<em key={keyIdx++}>{match[5]}</em>);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < str.length) parts.push(str.slice(lastIdx));
    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (!trimmed) {
      flushList(`list-${idx}`);
      return;
    }

    // Blockquote: > text
    if (trimmed.startsWith('>')) {
      flushList(`list-${idx}`);
      const quoteText = trimmed.replace(/^>\s*/, '').replace(/\*\*/g, '');
      if (quoteText) {
        elements.push(
          <div key={idx} style={{
            borderLeft: '3px solid var(--primary-600)',
            background: 'var(--primary-50)',
            padding: '0.75rem 1rem',
            margin: '0.75rem 0',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            fontSize: '0.88rem',
            color: 'var(--gray-700)',
            fontWeight: 600
          }}>
            {quoteText}
          </div>
        );
      }
      return;
    }

    // Numbered list: 1. text or 1) text
    const numMatch = trimmed.match(/^\d+[\.\)]\s+(.+)/);
    if (numMatch) {
      if (listType !== 'ol') flushList(`list-${idx}`);
      listType = 'ol';
      listBuffer.push(numMatch[1]);
      return;
    }

    // Bullet list: - text or * text
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      if (listType !== 'ul') flushList(`list-${idx}`);
      listType = 'ul';
      listBuffer.push(bulletMatch[1]);
      return;
    }

    // Heading-like: # to ###### text
    if (trimmed.match(/^#{1,6}\s+/)) {
      flushList(`list-${idx}`);
      const headingText = trimmed.replace(/^#{1,6}\s+/, '');
      elements.push(
        <h4 key={idx} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-900)', margin: '1.25rem 0 0.5rem' }}>
          {renderInline(headingText)}
        </h4>
      );
      return;
    }

    // Regular paragraph text
    flushList(`list-${idx}`);
    elements.push(
      <p key={idx} style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--gray-700)', margin: '0.5rem 0' }}>
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('list-end');

  return <div className={className} style={style}>{elements}</div>;
};
