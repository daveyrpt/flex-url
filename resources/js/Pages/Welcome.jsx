import { Link, Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Check, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '../Components/ui/button';
import { Input } from '../Components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../Components/ui/alert-dialog';
import InputError from '@/Components/InputError';

export default function Welcome({ auth, canResetPassword }) {
    const [longUrl, setLongUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [authTab, setAuthTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showRateLimitModal, setShowRateLimitModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleShorten = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const response = await axios.post('/api/v1/shorten', {
                original_url: longUrl
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                withCredentials: true
            });

            if (response.data.success) {
                setShortUrl(response.data.data.short_url);
                setErrorMessage('');
            } else {
                setErrorMessage(response.data.message || 'Failed to shorten URL');
            }
        } catch (error) {
            if (error.response?.status === 429) {
                // Rate limit exceeded
                const errorData = error.response.data;
                setShowRateLimitModal(true);
                setErrorMessage(errorData.message || 'Rate limit exceeded. Please wait before trying again.');
            } else if (error.response?.status === 422) {
                // Validation error
                const errorData = error.response.data;
                setErrorMessage(errorData.message || 'Please enter a valid URL');
            } else {
                console.error('Error shortening URL:', error);
                setErrorMessage('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submitLogin = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const submitRegister = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <>
            <Head title="FlexURL - Fast & Simple URL Shortener" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                {/* Navigation */}
                <nav className="p-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <LinkIcon className="h-8 w-8 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">FlexURL</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="home">Home</TabsTrigger>
                                        <TabsTrigger value="auth">Login</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {auth.user || activeTab === 'home' ? (
                        <div className="text-center space-y-8">
                            {/* Hero Section */}
                            <div className="space-y-4">
                                <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                                    Shorten Your URLs
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                    Create short, memorable links that are easy to share. Perfect for social media, 
                                    emails, and anywhere you need a clean URL.
                                </p>
                            </div>

                            {/* URL Shortener Form */}
                            <Card className="max-w-2xl mx-auto">
                                <CardHeader>
                                    <CardTitle>Shorten Your Link</CardTitle>
                                    <CardDescription>
                                        Paste your long URL below and get a short link instantly
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleShorten} className="space-y-4">
                                        <div className="flex space-x-2">
                                            <Input
                                                type="url"
                                                placeholder="https://example.com/very-long-url..."
                                                value={longUrl}
                                                onChange={(e) => setLongUrl(e.target.value)}
                                                className="flex-1"
                                                required
                                            />
                                            <Button type="submit" disabled={!longUrl.trim() || isLoading}>
                                                {isLoading ? 'Shortening...' : 'Shorten'}
                                            </Button>
                                        </div>
                                        
                                        {errorMessage && (
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <p className="text-sm text-red-700 dark:text-red-300 flex items-center">
                                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                                    {errorMessage}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {shortUrl && (
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                                                    Your shortened URL:
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <Input 
                                                        value={shortUrl} 
                                                        readOnly 
                                                        className="bg-white dark:bg-gray-800"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={handleCopy}
                                                    >
                                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Features */}
                            <div className="grid md:grid-cols-3 gap-6 mt-16">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">⚡ Lightning Fast</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Generate short URLs instantly with our optimized infrastructure.
                                        </p>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">📊 Analytics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Track clicks, locations, and referrers with detailed analytics.
                                        </p>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">🔒 Secure</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Your links are protected with enterprise-grade security.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        /* Auth Section */
                        <div className="max-w-md mx-auto">
                            <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Login</TabsTrigger>
                                    <TabsTrigger value="register">Register</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="login">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Welcome Back</CardTitle>
                                            <CardDescription>
                                                Sign in to your account to access your shortened URLs
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={submitLogin} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Email</label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className="mt-1 block w-full"
                                                        autoComplete="username"
                                                        placeholder="Enter your email"
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.email} className="mt-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Password</label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={data.password}
                                                        className="mt-1 block w-full"
                                                        autoComplete="current-password"
                                                        placeholder="Enter your password"
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.password} className="mt-2" />
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <input
                                                            id="remember"
                                                            name="remember"
                                                            type="checkbox"
                                                            checked={data.remember}
                                                            onChange={(e) => setData('remember', e.target.checked)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                                            Remember me
                                                        </label>
                                                    </div>

                                                    {canResetPassword && (
                                                        <Link
                                                            href={route('password.request')}
                                                            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                        >
                                                            Forgot password?
                                                        </Link>
                                                    )}
                                                </div>

                                                <Button type="submit" className="w-full mt-4" disabled={processing}>
                                                    {processing ? 'Signing In...' : 'Sign In'}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                
                                <TabsContent value="register">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Create Account</CardTitle>
                                            <CardDescription>
                                                Sign up to start shortening and tracking your URLs
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={submitRegister} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Name</label>
                                                    <Input 
                                                        type="text" 
                                                        name="name"
                                                        value={data.name}
                                                        placeholder="Enter your name" 
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.name} className="mt-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Email</label>
                                                    <Input 
                                                        type="email" 
                                                        name="email"
                                                        value={data.email}
                                                        placeholder="Enter your email" 
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.email} className="mt-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Password</label>
                                                    <Input 
                                                        type="password" 
                                                        name="password"
                                                        value={data.password}
                                                        placeholder="Create a password" 
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.password} className="mt-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Confirm Password</label>
                                                    <Input 
                                                        type="password" 
                                                        name="password_confirmation"
                                                        value={data.password_confirmation}
                                                        placeholder="Confirm your password" 
                                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                                </div>
                                                <Button type="submit" className="w-full mt-4" disabled={processing}>
                                                    {processing ? 'Creating Account...' : 'Create Account'}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>

            {/* Rate Limit Modal */}
            {showRateLimitModal && (
                <AlertDialog>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                                Rate Limit Exceeded
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left space-y-3">
                                <p>You've reached the maximum number of URL shortening requests allowed.</p>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                                        Options to continue:
                                    </p>
                                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                                        <li>• Wait a few minutes and try again</li>
                                        <li>• Create an account for higher limits</li>
                                        <li>• Upgrade to premium for unlimited usage</li>
                                    </ul>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Registered users get {auth.user ? '100' : '20'} requests per hour, 
                                    while anonymous users get 5 requests per hour.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowRateLimitModal(false)}
                            >
                                Wait and Try Later
                            </Button>
                            {!auth.user && (
                                <Button 
                                    onClick={() => {
                                        setShowRateLimitModal(false);
                                        setActiveTab('auth');
                                    }}
                                >
                                    Create Account
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
