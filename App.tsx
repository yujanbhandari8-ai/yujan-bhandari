import React, { useState, useCallback, useEffect } from 'react';
import { ImageFile } from './types';
import { generateReziImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import { SparklesIcon, DownloadIcon, CreditIcon, ShareIcon } from './components/icons';

const nostalgiaFacts = [
  "Nostalgia can counteract loneliness and anxiety, making you feel more connected and optimistic.",
  "The term 'nostalgia' was coined in 1688 to describe intense homesickness felt by soldiers.",
  "Listening to old music is a powerful trigger for vivid nostalgic memories, often bringing back rich emotions.",
  "Smell is the sense most closely linked to memory, which is why a scent can instantly transport you back in time.",
  "Engaging with your 'inner child' through play is linked to improved problem-solving skills and reduced stress.",
  "Sharing nostalgic stories with loved ones can strengthen relationships and create a sense of shared history.",
  "The brain often edits memories, making nostalgic moments feel even more perfect and meaningful than they actually were."
];

const GeneratingView: React.FC = () => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFactIndex((prevIndex) => (prevIndex + 1) % nostalgiaFacts.length);
        }, 4000); // Change fact every 4 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center bg-transparent p-8">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-purple-200 dark:border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-purple-500 border-r-purple-500 rounded-full animate-spin border-l-transparent border-b-transparent"></div>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-800 dark:text-gray-100">
                Crafting your moment...
            </h3>
            <div className="mt-4 text-gray-600 dark:text-gray-300 min-h-[80px] flex items-center justify-center px-4">
                 <p key={currentFactIndex} className="animate-fade-in text-center">
                    {nostalgiaFacts[currentFactIndex]}
                 </p>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [childhoodImage, setChildhoodImage] = useState<ImageFile | null>(null);
    const [currentImage, setCurrentImage] = useState<ImageFile | null>(null);
    const [prompt, setPrompt] = useState<string>('Create a nostalgic, dreamlike scene.');
    const [generatedImage, setGeneratedImage] = useState<ImageFile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [credits, setCredits] = useState<number>(100);
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');


    // Load credits from localStorage on mount
    useEffect(() => {
        const savedCredits = localStorage.getItem('rezi-credits');
        if (savedCredits !== null) {
            setCredits(parseInt(savedCredits, 10));
        } else {
            localStorage.setItem('rezi-credits', '100');
            setCredits(100);
        }
    }, []);

    // Update localStorage when credits change
    useEffect(() => {
        localStorage.setItem('rezi-credits', credits.toString());
    }, [credits]);


    const handleChildImageUpload = useCallback((file: ImageFile | null) => {
        setChildhoodImage(file);
    }, []);

    const handleCurrentImageUpload = useCallback((file: ImageFile | null) => {
        setCurrentImage(file);
    }, []);

    const handleGenerate = async () => {
        if (!childhoodImage || !currentImage || !prompt) {
            setError('Please upload both images and provide a prompt.');
            return;
        }

        if (credits < 10) {
            setError('You do not have enough credits to generate an image.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const result = await generateReziImage(childhoodImage, currentImage, prompt);
            setGeneratedImage(result);
            setCredits(prev => prev - 10);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
    
        const link = document.createElement('a');
        link.href = `data:${generatedImage.mimeType};base64,${generatedImage.base64}`;
        
        const extension = generatedImage.mimeType.split('/')[1] || 'png';
        link.download = `rezi-memory.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (!generatedImage) return;
    
        try {
            const response = await fetch(`data:${generatedImage.mimeType};base64,${generatedImage.base64}`);
            const blob = await response.blob();
            const extension = generatedImage.mimeType.split('/')[1] || 'png';
            const file = new File([blob], `rezi-memory.${extension}`, { type: generatedImage.mimeType });
    
            const shareData = {
                title: 'My REZI Memory',
                text: 'I created this beautiful image with REZI, bringing my past and present together. #REZI #InnerChild',
                files: [file],
            };
    
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData);
            } else if (navigator.clipboard?.write) {
                // Fallback to copying to clipboard
                const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([clipboardItem]);
                setShareStatus('copied');
                setTimeout(() => setShareStatus('idle'), 2500); // Reset after 2.5 seconds
            } else {
                throw new Error("Sharing is not supported on your browser. Please download the image.");
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') { // Don't show error if user cancels share dialog
                setError(err.message || 'Could not share image. Please try downloading it.');
            }
        }
    };

    const isButtonDisabled = !childhoodImage || !currentImage || !prompt || isLoading || credits < 10;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="relative text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-red-500 tracking-tight">
                        REZI
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Embrace Your Inner Child. Generate a heartfelt image of your present and past selves together.
                    </p>
                    <div className="absolute top-0 right-0 mt-0 sm:mt-2 flex items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200 dark:border-gray-700">
                        <CreditIcon />
                        <span className="ml-2 font-bold text-lg text-gray-800 dark:text-gray-100">{credits}</span>
                        <span className="ml-1.5 text-sm text-gray-500 dark:text-gray-400">Credits</span>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side - Inputs */}
                    <div className="space-y-8 p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageUploader id="child-photo" title="Childhood Photo" onImageUpload={handleChildImageUpload} />
                            <ImageUploader id="current-photo" title="Current Photo" onImageUpload={handleCurrentImageUpload} />
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Describe the Scene
                            </label>
                            <textarea
                                id="prompt"
                                rows={3}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Make them hug in a sunny park..."
                            />
                        </div>
                        
                        {error && <p className="text-red-500 text-center font-medium">{error}</p>}

                        <button
                            onClick={handleGenerate}
                            disabled={isButtonDisabled}
                            className={`w-full flex items-center justify-center py-4 px-6 text-lg font-bold text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out
                                ${isButtonDisabled
                                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105'
                                }`}
                        >
                            {isLoading ? 'Generating...' : `Generate Image (10 Credits)`}
                            {!isLoading && <SparklesIcon />}
                        </button>
                    </div>

                    {/* Right Side - Output */}
                    <div className="flex items-center justify-center p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg min-h-[400px] lg:min-h-0">
                        {isLoading ? (
                            <GeneratingView />
                        ) : generatedImage ? (
                            <div className="w-full text-center">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Memory, Reimagined</h2>
                                <img
                                    src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                                    alt="Generated Rezi"
                                    className="w-full h-auto object-contain rounded-xl shadow-2xl"
                                />
                                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <button
                                        onClick={handleDownload}
                                        className="inline-flex items-center justify-center w-full sm:w-auto py-3 px-8 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transform hover:scale-105"
                                    >
                                        Download
                                        <DownloadIcon />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        disabled={shareStatus === 'copied'}
                                        className="inline-flex items-center justify-center w-full sm:w-auto py-3 px-8 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none disabled:cursor-wait"
                                    >
                                        {shareStatus === 'copied' ? 'Copied!' : 'Share'}
                                        {shareStatus !== 'copied' && <ShareIcon />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <h3 className="text-xl font-medium">Your generated image will appear here</h3>
                                <p className="mt-2 max-w-sm mx-auto">Upload your photos, describe your vision, and let our AI bring your past and present together.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;