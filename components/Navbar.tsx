"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
// Mock session data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockSession = {
  data: {
    user: {
      name: "David Wang",
      email: "david@example.com",
      image: "https://github.com/shadcn.png"
    }
  }
}
export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-colors">
            SnapNutrient
          </Link>
          <div className="hidden md:flex items-center space-x-8">
                {/* <Link href="/features" className="text-gray-600 hover:text-gray-900">
                  Features
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </Link> */}
                <Link href="/auth/signin">
                  <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
                </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}