import React from 'react';

/**
 * Renders scheme text that may contain newlines, markdown-like formatting
 * (bold, bullets, numbered lists, blockquotes) into proper HTML.
 */
export const FormattedText = ({ text, className, style }) => {
  if (!text) return null;

  const lines = text.split('\n');
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
    // Handle **bold** and *italic*
    const parts = [];
    let remaining = str;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const idx = remaining.indexOf(boldMatch[0]);
        if (idx > 0) parts.push(remaining.slice(0, idx));
        parts.push(<strong key={keyIdx++} style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(idx + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
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

    // Heading-like: #### text or short uppercase line
    if (trimmed.match(/^#{1,4}\s+/)) {
      flushList(`list-${idx}`);
      const headingText = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
      elements.push(
        <h4 key={idx} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-900)', margin: '1.25rem 0 0.5rem' }}>
          {headingText}
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
