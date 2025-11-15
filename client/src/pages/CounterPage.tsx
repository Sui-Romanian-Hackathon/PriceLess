// src/pages/CounterPage.tsx

import React,{ type FC }  from 'react';
import CounterDApp from '../components/CounterDapp';


const CounterPage: FC = () => {
    return (
        <div className="bg-gray-50 min-h-[calc(100vh-80px)] p-8">
            {/* Componenta principală de interacțiune cu contractul */}
            <CounterDApp />
            
            <div className="max-w-2xl mx-auto mt-6 p-4 text-center text-sm text-gray-500 border-t pt-4">
                This page demonstrates the Move Call interaction (creating and mutating a shared object) with the Sui blockchain.
            </div>
        </div>
    );
};

export default CounterPage;