"use client"
export default function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4 text-gray-600">SnapNutrient</h3>
            <p className="text-gray-600">
              AI-powered nutrition tracking for a healthier you
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-gray-600">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/privacy-policy" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} SnapNutrient. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}