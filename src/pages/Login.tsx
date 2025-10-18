import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Drumstick, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'analyst' | 'viewer'>('analyst');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setEmail('');
          setSuccess('');
        }, 3000);
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName, role);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setRole('analyst');
      }
    } else {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('analyst');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Floating Petri Dishes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left Side Dishes */}
        <div className="absolute top-[15%] left-[5%] w-32 h-32 animate-float-slow">
          <img src="/34-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        <div className="absolute top-[45%] left-[8%] w-28 h-28 animate-float-medium">
          <img src="/29-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        <div className="absolute top-[70%] left-[4%] w-36 h-36 animate-float-fast">
          <img src="/28-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        {/* Right Side Dishes */}
        <div className="absolute top-[20%] right-[5%] w-30 h-30 animate-float-medium">
          <img src="/26-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        <div className="absolute top-[50%] right-[7%] w-32 h-32 animate-float-fast">
          <img src="/24-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        <div className="absolute top-[75%] right-[4%] w-28 h-28 animate-float-slow">
          <img src="/34-removebg-preview.png" alt="Petri Dish" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3">
            <img src="/pngtree-red-bull-logo-with-black-outline-clipart-png-image_13722053.png" alt="MeatLab Pro" className="w-20 h-20" />
          </div>
          <h1 className="text-2xl font-bold text-red-600">MeatLab Pro</h1>
          <p className="text-gray-600 text-sm mt-1">Micro Lab Management</p>
        </div>

        {!isForgotPassword && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => !isSignUp || toggleMode()}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isSignUp
                  ? 'bg-red-600 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-red-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => isSignUp || toggleMode()}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isSignUp
                  ? 'bg-red-600 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-red-600'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
            <p className="text-sm text-gray-600 mt-1">Enter your email to receive a reset link</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'analyst' | 'viewer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              >
                <option value="viewer">Viewer (Read-only access)</option>
                <option value="analyst">Analyst (Can add and edit data)</option>
                <option value="admin">Admin (Full access)</option>
              </select>
            </div>
          )}

          {!isForgotPassword && !isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="text-sm text-red-600 hover:text-orange-600 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {loading
              ? isForgotPassword
                ? 'Sending Reset Email...'
                : isSignUp
                ? 'Creating Account...'
                : 'Signing in...'
              : isForgotPassword
              ? 'Send Reset Email'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-600">
            {isForgotPassword ? (
              <>
                Remember your password?{' '}
                <button onClick={toggleForgotPassword} className="text-red-600 hover:text-orange-600 font-medium">
                  Sign in here
                </button>
              </>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <button onClick={toggleMode} className="text-red-600 hover:text-orange-600 font-medium">
                  Sign in here
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button onClick={toggleMode} className="text-red-600 hover:text-orange-600 font-medium">
                  Sign up here
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Made by <span className="font-semibold text-orange-600">Junaid Gabol</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
