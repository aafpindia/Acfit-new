import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const ExternalLinkPlayer = ({ content = {} }) => {
  const mediaObj = typeof content === 'string' ? { url: content } : (content || {});
  const targetUrl = mediaObj.url || mediaObj.fileUrl || mediaObj.link || '#';

  return (
    <Card className="border-border bg-white select-none">
      <CardContent className="p-6 flex flex-col items-center text-center justify-center space-y-5">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20">
          <Globe className="h-8 w-8" />
        </div>
        
        <div className="space-y-2 max-w-sm">
          <h3 className="font-extrabold text-base text-text-main">{mediaObj.title || 'External Learning Resource'}</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {mediaObj.description || 'This module references external sandbox environments, documentation pages, or templates.'}
          </p>
        </div>

        <Button
          variant="primary"
          asChild
          className="gap-2 text-xs h-10 px-5 shadow-sm"
        >
          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
            <span>Launch External Link</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExternalLinkPlayer;
