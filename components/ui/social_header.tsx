import React from "react";

// can add slogan later, or corresponding pages 
export default function Header() {
  return (
    <header className="w-full py-4 px-8 flex items-center justify-between shadow-md bg-white">
      {/* Logo / Brand Name */}
      <h1 className="text-2xl font-bold">
        <span className="text-blue-600">SnapNutrient</span>
      </h1>

      {/* Navigation (Can expand these pages later)
      <nav>
        <ul className="flex space-x-6 text-gray-700">
          <li className="hover:text-blue-600 cursor-pointer">Home</li>
          <li className="hover:text-blue-600 cursor-pointer">About</li>
          <li className="hover:text-blue-600 cursor-pointer">Contact</li>
        </ul>
      </nav> */}
    </header>
  );
}