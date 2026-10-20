import React from 'react';
import { Calendar, Video, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const LiveClassPlayer = ({ content }) => {
  const startDate = new Date(content.startTime);
  const formattedDate = startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="border-border bg-white select-none overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-text-main">Live Classroom Event</h3>
            <p className="text-[10px] uppercase font-bold text-text-secondary mt-0.5">Stream Provider: {content.meetingProvider}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-border py-5 text-xs sm:text-sm">
          <div className="flex items-center gap-3 text-text-secondary">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-text-main">Schedule Date</span>
              <span className="text-xs text-text-secondary mt-0.5">{formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-text-secondary">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-text-main">Schedule Time</span>
              <span className="text-xs text-text-secondary mt-0.5">{formattedTime} ({content.durationMinutes} min session)</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Ensure you have installed the correct webinar utility client before joining. Launch the classroom using the secure handle below when the timer expires.
          </p>
          <Button
            variant="primary"
            asChild
            className="w-full sm:w-auto justify-center gap-2 h-10 text-xs px-5 shadow-sm"
          >
            <a href={content.meetingUrl} target="_blank" rel="noopener noreferrer">
              <span>Join Live Classroom</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveClassPlayer;
