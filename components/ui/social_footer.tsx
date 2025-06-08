export default function Footer() {
    return (
      <footer className="w-full py-4 text-center bg-gray-100 text-gray-600 text-sm">
        © {new Date().getFullYear()} SnapNutrient. All rights reserved.
      </footer>
    );
  }