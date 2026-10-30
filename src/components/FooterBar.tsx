import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FooterBar: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#DCDAD4] bg-[#FFFFFF] py-2.5 px-4 md:px-6 text-xs text-[#88857C] print:hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto text-left">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#D9822B] shrink-0" />
          <span className="font-semibold text-[#171B1F]">
            Prototype for education. Matches are leads, not proof.
          </span>
          <span className="text-[#88857C] hidden sm:inline">
            
          </span>
        </div>
        <div className="text-xs font-mono text-[#88857C] shrink-0">
          SENTINEL v2.5 · Maharashtra Police · Demo data
        </div>
      </div>
    </footer>
  );
};
