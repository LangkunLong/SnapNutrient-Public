"use client"

import React, { useState } from 'react';
import { Camera, X, Upload, Loader2, Utensils, LogIn, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface NutrientBarProps {
  value: number;
  maxValue: number;
  label: string;
  color?: string;
  unit?: string;
}

const NutrientBar: React.FC<NutrientBarProps> = ({ 
  value, 
  maxValue, 
  label, 
  color = "bg-blue-500", 
  unit = "" 
}) => {
  const getUnit = () => {
    if (unit) return unit;
    if (label.toLowerCase() === "calories") return "kcal";
    if (label.toLowerCase() === "sodium") return "mg";
    return "g";
  };

  const displayUnit = getUnit();

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm items-center">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{value || '0'} {displayUnit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

const LandingImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setAnalysisResult(null);
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setError(null);
    setAnalysisResult(null);
  };

  const analyzeMeal = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/openai/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      
      setAnalysisResult({
        name: result.response.name || 'Unknown Meal',
        calories: result.response.calories || 0,
        protein: result.response.protein || 0,
        carbohydrates: result.response.carbohydrates || 0,
        fat: result.response.fat || 0,
        fiber: result.response.fiber || 0,
        sugar: result.response.sugar || 0,
        sodium: result.response.sodium || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAttempt = () => {
    setShowSignInPrompt(true);
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <Card className="w-full mt-4">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-blue-500" />
            <CardTitle>{analysisResult.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main nutrients display */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysisResult.calories}
              </div>
              <div className="text-sm text-gray-600">Calories (kcal)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analysisResult.protein}
              </div>
              <div className="text-sm text-gray-600">Protein (g)</div>
            </div>
          </div>

          {/* Nutrient bars */}
          <div className="space-y-3">
            <NutrientBar 
              label="Carbohydrates" 
              value={analysisResult.carbohydrates}
              maxValue={100}
              color="bg-orange-400"
            />
            <NutrientBar 
              label="Fat" 
              value={analysisResult.fat}
              maxValue={50}
              color="bg-yellow-400"
            />
            <NutrientBar 
              label="Fiber" 
              value={analysisResult.fiber}
              maxValue={30}
              color="bg-green-400"
            />
            <NutrientBar 
              label="Sugar" 
              value={analysisResult.sugar}
              maxValue={30}
              color="bg-pink-400"
            />
            <NutrientBar 
              label="Sodium" 
              value={analysisResult.sodium}
              maxValue={2300}
              color="bg-purple-400"
            />
          </div>

          {/* Call to action */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              Want to save this analysis and track your nutrition?
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Sign up to save your meals, get personalized recommendations, and track your progress over time.
            </p>
            <Button 
              onClick={handleSaveAttempt}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign Up to Save Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Try Our AI Food Analysis</h2>
        <p className="text-gray-600">
          Upload a photo of your meal and see instant nutritional insights powered by AI
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedImage ? (
        <div className="space-y-4">
          <div className="relative">
            <Image 
              src={selectedImage}
              alt="Selected meal"
              width={600}
              height={400}
              className="w-full rounded-lg shadow-lg h-[300px] object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
              disabled={isAnalyzing}
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {!analysisResult && (
            <Button 
              className="w-full"
              onClick={analyzeMeal}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your meal...
                </>
              ) : (
                'Analyze My Meal'
              )}
            </Button>
          )}

          {analysisResult && renderAnalysisResults()}

          <Button 
            variant="outline"
            className="w-full"
            onClick={clearImage}
            disabled={isAnalyzing}
          >
            Try Another Photo
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Camera size={32} className="text-gray-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Upload a Food Photo</h3>
              <p className="text-gray-500 text-sm">
                Take a photo or select an image to see our AI in action
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <input 
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="camera-upload-landing"
                onChange={handleImageSelect}
              />
              <label 
                htmlFor="camera-upload-landing"
                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm"
              >
                <Camera size={16} />
                Take Photo
              </label>

              <input 
                type="file"
                accept="image/*"
                className="hidden"
                id="file-upload-landing"
                onChange={handleImageSelect}
              />
              <label 
                htmlFor="file-upload-landing"
                className="flex items-center justify-center gap-2 bg-white text-blue-500 border-2 border-blue-500 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors text-sm"
              >
                <Upload size={16} />
                Upload Image
              </label>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Supported: JPG, PNG (max 5MB)
            </p>
          </div>
        </div>
      )}

      {/* Sign-in prompt modal */}
      <Dialog open={showSignInPrompt} onOpenChange={setShowSignInPrompt}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign Up to Continue
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              To save your meal analysis and access personalized nutrition tracking, you&apos;ll need to create an account.
            </p>
            <div className="space-y-3">
              <h4 className="font-medium">With an account, you can:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-green-500" />
                  Save meal analyses and build your food history
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-green-500" />
                  Get personalized nutrition recommendations
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-green-500" />
                  Track your progress over time
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-green-500" />
                  Share your journey on our social platform
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowSignInPrompt(false)}
                className="flex-1"
              >
                Continue Browsing
              </Button>
              <Link href="/auth/signin" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Sign Up Now
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingImageAnalysis;