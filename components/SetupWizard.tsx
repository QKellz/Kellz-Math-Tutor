
import React, { useState } from 'react';
import { Difficulty, Rigor } from '../types';
import { DIFFICULTIES, RIGORS } from '../constants';
import { BrainIcon, EditIcon, SparklesIcon } from './Icons';

interface SetupWizardProps {
  onSetupComplete: (difficulty: Difficulty, rigor: Rigor, mode: 'solver' | 'practice') => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [rigor, setRigor] = useState<Rigor | null>(null);

  const handleDifficultySelect = (d: Difficulty) => {
    setDifficulty(d);
    setStep(1);
  };

  const handleRigorSelect = (r: Rigor) => {
    setRigor(r);
    setStep(2);
  };

  const handleModeSelect = (mode: 'solver' | 'practice') => {
    if (difficulty && rigor) {
      onSetupComplete(difficulty, rigor, mode);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose a Difficulty Level</h2>
            <div className="grid grid-cols-2 gap-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDifficultySelect(d)}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span className="text-lg font-semibold text-gray-700">{d}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selected: <span className="text-indigo-600">{difficulty}</span></h2>
            <h3 className="text-xl text-gray-600 mb-4">Now, pick a level of rigor.</h3>
            <div className="flex justify-center gap-4">
              {RIGORS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRigorSelect(r)}
                  className="p-4 w-40 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span className="text-lg font-semibold text-gray-700">{r}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Go!</h2>
            <p className="text-gray-600 mb-6">Level: <span className="font-semibold text-indigo-600">{difficulty}</span> | Rigor: <span className="font-semibold text-indigo-600">{rigor}</span></p>
            <h3 className="text-xl text-gray-700 mb-4">How would you like to start?</h3>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleModeSelect('solver')}
                className="flex flex-col items-center justify-center p-6 w-52 h-40 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl hover:border-teal-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <EditIcon className="w-12 h-12 text-teal-500 mb-2" />
                <span className="text-lg font-semibold text-gray-800">Solve a Problem</span>
                <span className="text-sm text-gray-500">Get step-by-step help</span>
              </button>
              <button
                onClick={() => handleModeSelect('practice')}
                className="flex flex-col items-center justify-center p-6 w-52 h-40 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl hover:border-sky-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <BrainIcon className="w-12 h-12 text-sky-500 mb-2" />
                <span className="text-lg font-semibold text-gray-800">Practice a Topic</span>
                <span className="text-sm text-gray-500">Take a short quiz</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center text-4xl font-bold text-gray-800 mb-8">
        <SparklesIcon className="w-10 h-10 text-amber-500 mr-3" />
        <h1>Welcome to Kellz Math!</h1>
      </div>
      <div className="w-full max-w-2xl p-8 bg-gray-50 rounded-xl shadow-md">
        {renderStep()}
      </div>
    </div>
  );
};

export default SetupWizard;
