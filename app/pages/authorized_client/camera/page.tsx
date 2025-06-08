"use client"

import React, { useState } from 'react';
import { Camera, X, Upload, Loader2, Utensils, Edit2, Save, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import {dietAPI_helper} from '@/app/lib/dietAPIHelper/helperFunctions';
/*
meal analysis result
format:
{
"name": "[Dish Name]",
"nutrients": {
"calories": [calories in kcal],
"protein": [protein in grams],
"carbohydrates": [carbohydrates in grams],
"fat": [fat in grams],
"fiber": [fiber in grams],
"sugar": [sugar in grams],
"sodium": [sodium in mg]
}
 */
interface AnalysisResult {
  name: string;
  nutrients: Nutrients;
}
interface Nutrients {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};
// Define a default Nutrients object
const defaultNutrients: Nutrients = {
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

interface NutrientBarProps {
  value: number | string;
  maxValue: number;
  label: string;
  color?: string;
  onEdit: (value: string) => void;
  isEditing: boolean;
  unit?: string;
}

const NutrientBar: React.FC<NutrientBarProps> = ({ value, maxValue, label, color = "bg-blue-500", onEdit, isEditing, unit = "" }) => {
  // Safely parse the numeric value
  const parseNumericValue = (val: number|string) => {
    if (val === null || val === undefined || val === '') {
      return 0;
    }
    return parseFloat(val.toString()) || 0;
  };

  const numericValue = parseNumericValue(value);
  
  const handleValueChange = (e: { target: { value: string; }; }) => {
    onEdit(e.target.value);
  };

  // Get the appropriate unit based on label if not explicitly provided
  const getUnit = () => {
    if (unit) return unit;
    
    if (label.toLowerCase() === "calories") return "kcal";
    if (label.toLowerCase() === "sodium") return "mg";
    return "g"; // Default unit for protein, carbs, fat, fiber, sugar
  };

  const displayUnit = getUnit();

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm items-center">
        <span className="font-medium">{label}</span>
        {isEditing ? (
          <div className="flex items-center">
            <Input
              type="number"
              value={numericValue.toString()}
              onChange={handleValueChange}
              className="w-20 h-6 text-right"
              min="0"
              max={maxValue}
            />
            <span className="ml-1 text-xs text-gray-500">{displayUnit}</span>
          </div>
        ) : (
          <span className="text-gray-500">{value || '0'} {displayUnit}</span>
        )}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min((numericValue / maxValue) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

const CameraTab = () => {
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult|null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNutrients, setEditedNutrients] = useState<Nutrients|null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setAnalysisResult(null);
      setEditedNutrients(null);
      
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
        setSelectedImage(reader.result);
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
    setEditedNutrients(null);
    setIsEditing(false);
  };

  const analyzeMeal = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setEditedNutrients(null);
      setIsSaved(false);

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
      console.log('Analysis result:', result);
      setAnalysisResult(result.response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Use the correct nutrients path
    setEditedNutrients(
      analysisResult ? { ...analysisResult.nutrients } : null
    );
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving edited nutrients:', editedNutrients);
    setAnalysisResult({
      ...analysisResult!,
      nutrients: editedNutrients ?? defaultNutrients,
    });
    console.log('Analysis result updated:', analysisResult);
  };

  const handleNutrientEdit = (nutrient: keyof Nutrients, value: string) => {
    setEditedNutrients(prev => {
      if (!prev) return defaultNutrients;
      return {
        ...prev,
        [nutrient]: parseInt(value) || 0
      };
    });
  };
  

  const handleSaveMeal = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving meal:', editedNutrients);
      // Get the current nutrients (either edited or original)
      const currentNutrients = {
        calories: parseInt(isEditing ? editedNutrients?.calories?.toString() ?? defaultNutrients.calories.toString() : analysisResult?.nutrients.calories.toString() || defaultNutrients.calories.toString()),
        protein: parseFloat(isEditing ? editedNutrients?.protein?.toString() ?? defaultNutrients.protein.toString() : analysisResult?.nutrients.protein.toString() || defaultNutrients.protein.toString()),
        carbohydrates: parseFloat(isEditing ? editedNutrients?.carbohydrates?.toString() ?? defaultNutrients.carbohydrates.toString() : analysisResult?.nutrients.carbohydrates.toString() || defaultNutrients.carbohydrates.toString()),
        fat: parseFloat(isEditing ? editedNutrients?.fat?.toString() ?? defaultNutrients.fat.toString() : analysisResult?.nutrients.fat.toString() || defaultNutrients.fat.toString()),
        fiber: parseFloat(isEditing ? editedNutrients?.fiber?.toString() ?? defaultNutrients.fiber.toString() : analysisResult?.nutrients.fiber.toString() || defaultNutrients.fiber.toString()),
        sugar: parseFloat(isEditing ? editedNutrients?.sugar?.toString() ?? defaultNutrients.sugar.toString() : analysisResult?.nutrients.sugar.toString() || defaultNutrients.sugar.toString()),
        sodium: parseInt(isEditing ? editedNutrients?.sodium?.toString() ?? defaultNutrients.sodium.toString() : analysisResult?.nutrients.sodium.toString() || defaultNutrients.sodium.toString()),
      };
  
      if (!selectedImage) {
        throw new Error('No image selected');
      }
  
      // Convert base64 to File
      const file = dietAPI_helper.base64ToFile(
        typeof selectedImage === 'string' ? selectedImage : '',
        `meal_${Date.now()}.jpg`
      );
  
      const mealData = {
        name: analysisResult?.name || '',
        nutrients: currentNutrients,
        createdAt: new Date().toISOString()
      };
  
      const result = await dietAPI_helper.uploadMealImage(mealData, file);
  
      if (!result?.success) {
        throw new Error('Failed to save meal');
      }
  
      console.log('Meal saved:', result.data);
      setIsSaved(true);
  
      // Clear form after a delay
      setTimeout(() => {
        clearImage();
      }, 2000);
  
    } catch (err) {
      console.error('Error saving meal:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to save meal');
      } else {
        setError('Failed to save meal');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderActionButton = () => {
    if (!selectedImage) return null;

    if (!analysisResult) {
      return (
        <Button 
          className="w-full"
          onClick={analyzeMeal}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Meal'
          )}
        </Button>
      );
    }

    if (isSaved) {
      return (
        <Button 
          className="w-full"
          variant="outline"
          disabled
        >
          <Check className="mr-2 h-4 w-4" />
          Meal Saved
        </Button>
      );
    }

    return (
      <Button 
        className="w-full"
        onClick={handleSaveMeal}
        disabled={isSaving || isEditing}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Meal
          </>
        )}
      </Button>
    );
  };

  // ... (keep existing renderAnalysisResults)

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const nutrients = isEditing ? editedNutrients : analysisResult.nutrients;

    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blue-500" />
              <CardTitle>{analysisResult.name}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={isEditing ? handleSave : handleEdit}
              className="h-8 px-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main nutrients display */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {isEditing ? (
                <Input
                  type="number"
                  value={(parseInt(nutrients?.calories?.toString() || '0') || 0).toString()}
                  onChange={(e) => handleNutrientEdit('calories', e.target.value)}
                  className="w-24 h-8 text-center mx-auto"
                  min="0"
                />
                ) : nutrients?.calories || 0}
              </div>
              <div className="text-sm text-gray-600">Calories(kcal)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {isEditing ? (
                  <Input
                    type="text"
                    value={nutrients?.protein || 0}
                    onChange={(e) => handleNutrientEdit('protein', e.target.value)}
                    className="w-24 h-8 text-center mx-auto"
                  />
                ) : nutrients?.protein}
              </div>
              <div className="text-sm text-gray-600">Protein(g)</div>
            </div>
          </div>

          {/* Nutrient bars */}
          <div className="space-y-3">
            <NutrientBar 
              label="Carbohydrates" 
              value={nutrients?.carbohydrates || 0}
              maxValue={100}
              color="bg-orange-400"
              onEdit={(value) => handleNutrientEdit('carbohydrates', value)}
              isEditing={isEditing}
              unit="g"
            />
            <NutrientBar 
              label="Fat" 
              value={nutrients?.fat || 0}
              maxValue={50}
              color="bg-yellow-400"
              onEdit={(value) => handleNutrientEdit('fat', value)}
              isEditing={isEditing}
              unit="g"
            />
            <NutrientBar 
              label="Fiber" 
              value={nutrients?.fiber || 0}
              maxValue={30}
              color="bg-green-400"
              onEdit={(value) => handleNutrientEdit('fiber', value)}
              isEditing={isEditing}
              unit="g"
            />
            <NutrientBar 
              label="Sugar" 
              value={nutrients?.sugar || 0}
              maxValue={30}
              color="bg-pink-400"
              onEdit={(value) => handleNutrientEdit('sugar', value)}
              isEditing={isEditing}
              unit="g"
            />
            <NutrientBar 
              label="Sodium" 
              value={nutrients?.sodium || 0}
              maxValue={2300}
              color="bg-purple-400"
              onEdit={(value) => handleNutrientEdit('sodium', value)}
              isEditing={isEditing}
              unit="mg"
            />
          </div>

        </CardContent>
      </Card>
    );
  };

  // ... (keep existing return JSX with camera/upload UI)
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-160px)]">
      {error && (
        <Alert variant="destructive" className="mb-4 w-full max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedImage ? (
        <div className="w-full max-w-md space-y-4">
          <div className="relative">
            <Image 
              src={typeof selectedImage === 'string' ? selectedImage : ''}
              alt="Selected meal"
              width={1024}
              height={1024}
              className="w-full rounded-lg shadow-lg 
                sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 
                h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[550px]
                object-cover mx-auto"
            />
            {analysisResult ? null:
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg"
                disabled={isAnalyzing}
              >
                <X size={24} className="text-gray-600" />
              </button>
            }

          </div>

          {analysisResult && renderAnalysisResults()}
          {renderActionButton()}

          {!isSaved && (
            <Button 
              variant="outline"
              className="w-full"
              onClick={clearImage}
              disabled={isAnalyzing || isSaving}
            >
              Take New Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-6 p-4">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera size={48} className="text-gray-400" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Track Your Meal</h3>
            <p className="text-gray-500">
              Take a photo or select an image of your meal to get instant nutritional insights
            </p>
          </div>

          <input 
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            id="camera-upload"
            onChange={handleImageSelect}
          />
          <label 
            htmlFor="camera-upload"
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
          >
            <Camera size={20} />
            Take Photo
          </label>

          <div className="relative w-full max-w-xs">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              id="file-upload"
              onChange={handleImageSelect}
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 w-full bg-white text-blue-500 border-2 border-blue-500 px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <Upload size={20} />
              Select from Gallery
            </label>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Supported formats: JPG, PNG (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraTab;