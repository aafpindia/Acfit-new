import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';

export const RichTextPlayer = ({ content }) => {
  const htmlContent = typeof content === 'string'
    ? content
    : (content?.body || content?.text || content?.content || '<p>No text content available.</p>');

  return (
    <Card className="border-border bg-white">
      <CardContent className="p-6 sm:p-8">
        <div 
          className="prose max-w-none text-text-main text-sm sm:text-base leading-relaxed space-y-4
            [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-text-main [&_h1]:mt-6 [&_h1]:mb-3
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-main [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-text-main [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-2 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-2 [&_ol]:space-y-1.5
            [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary [&_code]:border [&_code]:border-border
            [&_pre]:bg-background [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:font-mono [&_pre]:text-xs
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:pl-4 [&_blockquote]:py-2.5 [&_blockquote]:rounded-r-lg [&_blockquote]:font-medium [&_blockquote]:text-primary
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </CardContent>
    </Card>
  );
};

export default RichTextPlayer;
