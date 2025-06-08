"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserStore, convertDynamoDBToRegular } from '@/store/userStore';
import { userAPI_helper } from '@/app/lib/userAPIHelper/helperFunctions';
import { ActivityLevel, Goal, VALIDATION } from '@/store/userStore';

export default function ProfileSetupComponent() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    age: null,
    weight: null,
    height: null
  });

  const router = useRouter();

  const [profile, setProfile] = useState({
    gender: '',
    weight: '',
    height: '',
    age: '',
    activityLevel: '',
    goal: ''
  });
  const { setUserData } = useUserStore();
  
  const validateField = (field: string, value: string) => {
    const numValue = Number(value);
    if (!value || isNaN(numValue) || !isFinite(numValue)) {
        return 'Please enter a valid number';
    }
  
    switch (field) {
      case 'weight':
        if (numValue < VALIDATION.MIN_WEIGHT || numValue > VALIDATION.MAX_WEIGHT) {
          return `Invalid weight`;
        }
        break;
      case 'height':
        if (numValue < VALIDATION.MIN_HEIGHT || numValue > VALIDATION.MAX_HEIGHT) {
          return `Invalid height`;
        }
        break;
      case 'age':
        if (numValue < 10 || numValue > 120) { // Common age range
          return 'Invalid age';
        }
        break;
    }
    
    return null;
  };

  const updateProfile = (field: keyof typeof profile, value: string | number | ActivityLevel | Goal) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if(field === 'age' || field === 'weight' || field === 'height'){
      const error = validateField(field, String(value));
      setValidationErrors(prev => ({ ...prev, [field]: error}));
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.email) return;
    setIsLoading(true);
    setError(null);

    try {
        // Format the profile data for the API
        const profileData = {
            email: session.user.email,
            name: session.user.name || '',
            gender: profile.gender,
            weight: Number(profile.weight),
            height: Number(profile.height),
            age: Number(profile.age),
            activityLevel: profile.activityLevel,
            goal: profile.goal
        };

        // Create the user profile in the database
        console.log('Creating user profile in database');
        const newUserData = await userAPI_helper.createUser(profileData);
        
        if (newUserData) {
            // Convert and store the user data if necessary
            const convertedData = typeof newUserData === 'object' && 'S' in newUserData 
                ? convertDynamoDBToRegular(newUserData) 
                : newUserData;
            
            setUserData(convertedData);
            console.log('User data stored:', convertedData);
            
            // Update the session to indicate user is no longer new
            const updatedSession = {
                ...session,
                user: {
                    ...session.user,
                    isNewUser: false
                }
            };

            // Update the session
            try {
                const result = await update(updatedSession);
                console.log('Session update attempted:', result);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const event = new Event('visibilitychange');
                document.dispatchEvent(event);
                
                router.push('/');
                router.refresh();
                
            } catch (sessionError) {
                console.error('Error updating session:', sessionError);
                throw new Error('Failed to update session status');
            }
        } else {
            throw new Error('Failed to create user profile');
        }
    } catch (error) {
        console.error('Error in submission:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Back button, only visible if step is greater than 1 */}
        {step > 1 && (
            <Button
            variant="ghost"
            className="relative top-4 left-4 text-blue-500 underline"
            onClick={() => setStep(step - 1)}
            >
            &larr; Back
            </Button>
        )}
        <CardHeader>
          
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </CardTitle>
          <div className="flex justify-between mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1/4 h-1 rounded-full mx-1 ${
                  i <= step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What is your biological gender?</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={profile.gender === 'male' ? 'default' : 'outline'}
                  onClick={() => {
                    updateProfile('gender', 'male');
                    setStep(2);
                  }}
                >
                  Male
                </Button>
                <Button
                  variant={profile.gender === 'female' ? 'default' : 'outline'}
                  onClick={() => {
                    updateProfile('gender', 'female');
                    setStep(2);
                  }}
                >
                  Female
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What are your measurements?</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => updateProfile('age', e.target.value)}
                    placeholder="25"
                    min="13"
                    max="120"
                    className={validationErrors.age ? 'border-red-500' : ''}
                  />
                  {validationErrors.age && (
                    <p className="text-sm text-red-500">{validationErrors.age}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight}
                    onChange={(e) => updateProfile('weight', e.target.value)}
                    placeholder="70"
                    min={VALIDATION.MIN_WEIGHT}
                    max={VALIDATION.MAX_WEIGHT}
                    className={validationErrors.weight ? 'border-red-500' : ''}
                  />
                  {validationErrors.weight && (
                    <p className="text-sm text-red-500">{validationErrors.weight}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => updateProfile('height', e.target.value)}
                    placeholder="175"
                    min={VALIDATION.MIN_HEIGHT}
                    max={VALIDATION.MAX_HEIGHT}
                    className={validationErrors.height ? 'border-red-500' : ''}
                  />
                  {validationErrors.height && (
                    <p className="text-sm text-red-500">{validationErrors.height}</p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => setStep(3)}
                  disabled={
                    !profile.weight || 
                    !profile.height || 
                    !profile.age || 
                    !!validationErrors.weight || 
                    !!validationErrors.height || 
                    !!validationErrors.age
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What&apos;s your activity level?</h2>
              <div className="space-y-2">
                {Object.values(ActivityLevel).map((level) => (
                  <Button
                    key={level}
                    variant={profile.activityLevel === level ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => {
                      updateProfile('activityLevel', level);
                      setStep(4);
                    }}
                  >
                    {level.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">What are your goals?</h2>
                <p className="text-sm text-gray-500">Select one</p>
                <div className="space-y-2">
                {Object.values(Goal).map((goal) => (
                    <Button
                    key={goal}
                    variant={profile.goal === goal ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => updateProfile('goal', goal)}
                    >
                    {goal.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ')}
                    </Button>
                ))}
                </div>
                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <Button
                variant="default"
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={handleSubmit}
                disabled={!profile.goal || isLoading}
                >
                {isLoading ? 'Saving...' : 'Complete Profile'}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}