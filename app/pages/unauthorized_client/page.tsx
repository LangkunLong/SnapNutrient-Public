"use client"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, Brain, Utensils, Users } from 'lucide-react'
import Link from 'next/link'
import LandingImageAnalysis from '@/components/LandingImageAnalysis'

export default function Unauthorized_Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center flex justify-center mb-16">
        <div>
          <h1 className="text-4xl font-bold mb-4">
            Track Your Nutrition with AI Precision
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Simply snap a photo of your meal and get instant nutritional insights
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="mb-16 bg-gray-50 rounded-xl p-8">
        <LandingImageAnalysis />
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="relative w-full h-[500px]">
            <Image
              src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/snap-track.png"
              alt="Camera feature - Upload and capture food photos"
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Snap & Track</h3>
            <p className="text-gray-600 text-sm">Upload food photos for instant calorie estimation</p>
          </div>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="relative w-full h-[500px]">
            <Image
              src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/ai-analysis.png"
              alt="AI Analysis - Nutritional breakdown results"
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600 text-sm">Advanced AI recognition for accurate nutritional data</p>
          </div>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="relative w-full h-[500px]">
            <Image
              src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/personalized-diet.png"
              alt="Dashboard - Track nutrition and progress"
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <Utensils className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Personalized Plans</h3>
            <p className="text-gray-600 text-sm">Get tailored dietary recommendations</p>
          </div>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="relative w-full h-[500px]">
            <Image
              src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/social-platform.png"
              alt="Social Platform - Share and connect with others"
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Social Platform</h3>
            <p className="text-gray-600 text-sm">Share progress and connect with others</p>
          </div>
        </Card>
      </section>

      {/* How It Works Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="md:w-1/3 p-6">
              <div className="relative h-[200px] mb-4">
                <Image
                  src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/step1.jpg"
                  alt="Take a photo"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Take a Photo</h3>
              <p className="text-gray-600">Snap a picture of your meal using your phone</p>
            </div>
            <div className="md:w-1/3 p-6">
              <div className="relative h-[200px] mb-4">
                <Image
                  src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/step2.jpg"
                  alt="AI Analysis"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Get Instant Analysis</h3>
              <p className="text-gray-600">Our AI identifies ingredients and calculates nutrition</p>
            </div>
            <div className="md:w-1/3 p-6">
              <div className="relative h-[200px] mb-4">
                <Image
                  src="https://snapnutrient-s3.s3.us-east-1.amazonaws.com/landing_page/step3.jpg"
                  alt="Track Progress"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Track Progress</h3>
              <p className="text-gray-600">Monitor your nutrition and achieve your goals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center bg-blue-600 text-white rounded-xl p-8 mb-16">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-xl mb-6">
          Join thousands of users who are already tracking their nutrition with AI
        </p>
        <Link href="/auth/signin">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Sign Up for Free
          </Button>
        </Link>
      </section>
    </div>
  )
}