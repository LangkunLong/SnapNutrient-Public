"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserStore, VALIDATION } from '@/store/userStore';
import { ActivityLevel, Goal } from '@/lib/usersFunctions';
import { userAPI_helper } from '@/app/lib/userAPIHelper/helperFunctions';
const formatEnumValue = (value: any): string => {
    if (!value || typeof value !== 'string'){
        console.log('value is not a string: ',value);
        return '';
    } 
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
};

interface UserInfoPageProps {
  onBack: () => void;
}

const UserInfoPage: React.FC<UserInfoPageProps> = ({ onBack }) => {
  const { userData, setUserData } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  interface ValidationErrors {
    [key: string]: boolean;
  }
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    age: false,
    weight: false,
    height: false
  });
  const [editedData, setEditedData] = useState({
    name: userData?.name || '',
    email: userData?.id || '',
    gender: userData?.gender || '',
    age: userData?.age || '',
    weight: userData?.weight || '',
    height: userData?.height || '',
    goal: userData?.goal || '',
    activityLevel: userData?.activityLevel || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };


  // Effect to handle success message timing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showSuccess) {
      console.log('SHOW SUCESS');
      timeoutId = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  
    // Cleanup timeout when component unmounts or showRefreshSuccess changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showSuccess]);
  const handleSave = async () => {
    const result = await userAPI_helper.updateUser({
      ...editedData,
      weight: Number(editedData.weight),
      height: Number(editedData.height),
      age: Number(editedData.age),
    });
    if (!result) {
      console.error('Failed to update user data');
      return;
    }
    setUserData({
      ...editedData,
      id: editedData.email,
    });
    console.log('User data updated:', userData);
    setIsEditing(false);
    setShowSuccess(true);
  };

  const validateField = (field: any, value: any) => {
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
  const handleChange = (field: any) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditedData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if(field === 'weight' || field === 'height' || field === 'age'){
      const error = validateField(field, e.target.value);
      setValidationErrors(prev => ({ ...prev, [field]: error}));
    }
  };


  const renderField = (field: string, value: any) => {
    if (!isEditing) {
      if (field === 'goal' || field === 'activityLevel') {
        return <p className="text-gray-800">{value ? formatEnumValue(value) : '-'}</p>;
      }
      return <p className="text-gray-800">{value || '-'}</p>;
    }

    if (field === 'activityLevel') {
      return (
        <select
          value={value}
          onChange={handleChange(field)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(ActivityLevel).map((level) => (
            <option key={level} value={level}>
              {formatEnumValue(level)}
            </option>
          ))}
        </select>
      );
    }

    if (field === 'goal') {
      return (
        <select
          value={value}
          onChange={handleChange(field)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(Goal).map((goal) => (
            <option key={goal} value={goal}>
              {formatEnumValue(goal)}
            </option>
          ))}
        </select>
      );
    }
    if (field === 'email' || field === 'name') {
      return (
        <Input
          value={value}
          className="w-full"
          disabled={true}
        />
      );
    }
    if(field === 'gender'){
      return (
        <select
        value={value || ''}
        onChange={handleChange(field)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        <option value="male">Male</option>
        <option value="female">Female</option>
        </select>
      );
    }
    
    // Define a dynamic className that includes 'border-red-500' if there's an error in validationErrors for the field
    const inputClassName = `w-full rounded-md border ${
        validationErrors[field] ? 'border-red-500' : 'border-gray-300'
    } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`;
    return (
      <Input
        value={value || ''}
        onChange={handleChange(field)}
        className={inputClassName}
        placeholder={`Enter your ${field.toLowerCase()}`}
        type={field === 'age' || field === 'weight' || field === 'height' ? 'number' : 'text'}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 p-2"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-semibold">User Information</h1>
          <Button
            variant="ghost"
            className="p-2"
            onClick={isEditing ? handleSave : handleEdit}
            disabled={isEditing && (validationErrors.age || validationErrors.weight || validationErrors.height)}
            >
            {isEditing ? <Save size={24} /> : <Edit2 size={24} />}
          </Button>
        </div>
        {showSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 shadow-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Changes saved successfully!</span>
          </div>
        )}
        <Card className="p-6 space-y-4">
          {Object.entries(editedData).map(([field, value]) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium text-gray-600">
                {field}
              </label>
              {renderField(field, value)}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default UserInfoPage;