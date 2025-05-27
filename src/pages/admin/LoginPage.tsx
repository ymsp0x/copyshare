// project/src/pages/admin/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { GradientLogo } from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type LoginFormData = {
  email: string;
  password: string;
};

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const { error } = await signIn(data.email, data.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
      } else {
        toast.success('Login successful');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"> {/* MODIFIED */}
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
        <div className="text-center">
          <GradientLogo className="mx-auto h-16 w-16" />
          <h2 className="mt-6 text-3xl font-bold text-text-dark dark:text-text-light">Admin Login</h2> {/* MODIFIED */}
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sign in to access your dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
              placeholder="admin@example.com"
            />
            
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign in
          </Button>
          
          <div className="text-center mt-4">
            <a
              href="/"
              className="font-medium text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300" // MODIFIED
            >
              Back to homepage
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;