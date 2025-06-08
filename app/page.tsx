"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
//pages
import Unauthorized_Home from "@/app/pages/unauthorized_client/page"
import Authorized_Home from "@/app/pages/authorized_client/page"
import ProfileSetup from "@/app/pages/unauthorized_client/profiile_setup/page"
// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

export default function Home() {
  const { data: session, status } = useSession() 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  if (isLoading || status === 'loading') {
    return <LoadingSpinner />;
  }
  /*
  logic first check if the user is logged in
  if the user is logged in, check if the user is a new user
  */
  return (
    <div className="min-h-screen flex flex-col">
      {session? null : <Navbar />}
      <div className="container mx-auto px-4 py-12">
        {session ?  
        (session.user.isNewUser ? <ProfileSetup /> : <Authorized_Home />)
        : <Unauthorized_Home />}
      </div>
      {session ? null: <Footer /> }
    </div>
  )
}