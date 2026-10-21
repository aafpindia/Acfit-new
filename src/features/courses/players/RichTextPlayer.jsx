import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';

export const RichTextPlayer = ({ content }) => {
  const rawText = typeof content === 'string'
    ? content
    : (content?.body || content?.text || content?.content || '');

  const textContent = rawText || '<p>No written lesson content available.</p>';
  const isHtml = /<[a-z][\s\S]*>/i.test(textContent);

  return (
    <Card className="border-border bg-white shadow-2xs rounded-2xl overflow-hidden font-sans">
      <CardContent className="p-6 sm:p-10">
        {isHtml ? (
          <div 
            className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4
              [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h1]:mb-3
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-1.5
              [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-2 [&_ul]:space-y-1.5
              [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-2 [&_ol]:space-y-1.5
              [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#2563EB] [&_code]:border [&_code]:border-slate-200
              [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-slate-800 [&_pre]:font-mono [&_pre]:text-xs
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#2563EB] [&_blockquote]:bg-blue-50/50 [&_blockquote]:pl-4 [&_blockquote]:py-2.5 [&_blockquote]:rounded-r-lg [&_blockquote]:font-medium [&_blockquote]:text-[#2563EB]
            "
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        ) : (
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans selection:bg-[#2563EB] selection:text-white">
            {textContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RichTextPlayer;
