"use client"

import React from 'react';
import { useEffect } from 'react';

import { Home, User, BarChart, Camera } from 'lucide-react';
import { useSession } from "next-auth/react"
import { useUserStore, convertDynamoDBToRegular } from '@/store/userStore';
import { userAPI_helper } from '@/app/lib/userAPIHelper/helperFunctions';
import { useNavigationStore } from '@/store/navigationStore';

//react components of tabs
import Camera_tab from './camera/page';
import Profile_tab from './profile/page';
import SocialPlatformClient from './social_platform/SocialPlatformClient';
import Dashboard_tab from './dashboard/page';

const Authorized_Home = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const { data: session } = useSession() 
  const { userData, setUserData } = useUserStore();
  const setNavigateToCamera = useNavigationStore(state => state.setNavigateToCamera);

  const fetchAndStoreUserData = async () => {
    if (session?.user?.email) {
      try {
        const data = await userAPI_helper.fetchUser();
        if (data) {
          const convertedData = convertDynamoDBToRegular(data);
          setUserData(convertedData);
        }
        console.log('User data fetched and stored:', data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };
  // Fetch and store user data
  useEffect(() => {
    if(!userData){
      fetchAndStoreUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, userData]);

  useEffect(() => {
    setNavigateToCamera(() => {
      setActiveTab('camera');
    });
  }, [setNavigateToCamera]);
  
    // Function to fetch user data

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <SocialPlatformClient initialPosts={[]} initialLastKey={null} />
        );
      case 'camera':
        return (
          <Camera_tab/>
        );
      case 'profile':
        return (
          <Profile_tab/>
        );
      case 'dashboard':
        return (
          <Dashboard_tab/>
        );
      //sub pages of profile tab
      default:
        return null;
    }
  };

  /* front end */
  return (
    <div className="fixed inset-0 bg-white">
      {/* Main Content */}
      <main className="max-w-lg mx-auto bg-white min-h-screen pb-20">
        <div className="absolute inset-0 bottom-16 overflow-y-auto bg-white p-4">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-around py-3">
            <button 
              onClick={() => setActiveTab('home')}
              className={`p-2 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <Home size={24} />
            </button>
            <button 
              onClick={() => setActiveTab('camera')}
              className={`p-2 ${activeTab === 'camera' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <Camera size={24} />
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`p-2 ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <BarChart size={24} />
            </button>
            <button 
              onClick={() => {
                setActiveTab('profile');
                // fetchAndStoreUserData();
              }}
              className={`p-2 ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <User size={24} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Authorized_Home;