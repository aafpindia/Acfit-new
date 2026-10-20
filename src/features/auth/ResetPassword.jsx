import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    const res = await updatePassword(values.password);
    setIsLoading(false);

    if (res.success) {
      success('Password changed successfully!');
      setIsSuccess(true);
    } else {
      error(res.error || 'Failed to change password. Session may have expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text-main">ACFIT Academy</span>
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">New Password</CardTitle>
            <CardDescription>Configure a new secure password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="inline-flex p-3 rounded-full bg-success/10 border border-success/20 text-success mb-2 justify-center mx-auto">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your password has been successfully updated. You may now log in to the application.
                </p>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Proceed to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4.5 w-4.5" />}
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4.5 w-4.5" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button
                  type="submit"
                  className="w-full mt-4"
                  isLoading={isLoading}
                >
                  Save Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
