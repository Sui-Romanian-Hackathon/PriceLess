// src/components/AccessBlocker.tsx

import React, { type FC } from "react";
import { Link } from "react-router-dom";

const AccessBlocker: FC = () => {
  return (
    <div className="p-10 text-center min-h-screen bg-red-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Access Restricted! 🚫
      </h1>
      <p className="text-lg text-red-500 max-w-xl">
        To view the full product list and access the best deals from Agents,
        you must **buy the subscription** (User) or **stake SUI** (Agent).
      </p>
      <Link
        to="/access-gate" // Asigură-te că aceasta este ruta corectă
        className="mt-8 inline-block py-3 px-8 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg"
      >
        Go to Access Gate
      </Link>
    </div>
  );
};

export default AccessBlocker;