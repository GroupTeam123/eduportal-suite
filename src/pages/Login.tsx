import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, User, Users, Crown, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const roles: { value: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'teacher', label: 'Teacher', icon: User, description: 'Manage students and generate reports' },
  { value: 'hod', label: 'HOD', icon: Users, description: 'Oversee department operations' },
  { value: 'principal', label: 'Principal', icon: Crown, description: 'Institute-wide administration' },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        navigate(`/${selectedRole}`);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">EduPortal</h1>
              <p className="text-primary-foreground/70">Annual Report Management System</p>
            </div>
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight mb-6">
            Streamline Your<br />
            Academic Reporting
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            A comprehensive platform for managing student records, generating insightful reports, 
            and facilitating seamless communication across your educational institution.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-primary-foreground/70">Students Managed</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-primary-foreground/70">Faculty Members</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-primary-foreground/70">Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">EduPortal</h1>
              <p className="text-sm text-muted-foreground">Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Select your role and sign in to continue</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Select Role</Label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 bg-card'
                  )}
                >
                  <role.icon className={cn(
                    'w-6 h-6 mx-auto mb-2',
                    selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <p className={cn(
                    'text-sm font-medium',
                    selectedRole === role.value ? 'text-primary' : 'text-foreground'
                  )}>
                    {role.label}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {roles.find(r => r.value === selectedRole)?.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@institute.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 input-field"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 input-field"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            For demo, use any email and password (min 4 characters)
          </p>
        </div>
      </div>
    </div>
  );
}
