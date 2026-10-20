import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-error/3 rounded-full blur-[120px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card className="border-border text-center shadow-premium">
          <CardContent className="pt-8 pb-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-error/8 border border-error/15 flex items-center justify-center text-error mb-6">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Access Denied</h1>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed max-w-xs">
              You do not have administrative privileges to view this section. If this is an error, contact your administrator.
            </p>

            <div className="flex gap-3 mt-8 w-full">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-1/2 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/app/dashboard')}
                className="w-1/2 gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
