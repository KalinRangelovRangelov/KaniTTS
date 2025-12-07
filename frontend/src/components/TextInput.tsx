interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function TextInput({ value, onChange, disabled, placeholder, maxLength = 5000 }: TextInputProps) {
  const charCount = value.length;
  const charPercentage = (charCount / maxLength) * 100;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Enter Text to Synthesize
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || "Type or paste the text you want to convert to speech..."}
          maxLength={maxLength}
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border-2 border-slate-700
            text-white placeholder-slate-500 resize-none
            focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200"
        />

        {/* Character count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                charPercentage > 90 ? 'bg-red-500' :
                charPercentage > 70 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${
            charPercentage > 90 ? 'text-red-400' : 'text-slate-500'
          }`}>
            {charCount.toLocaleString()}/{maxLength.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Helpful tips */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>For best results, keep text under 1000 characters. Longer texts may have reduced quality.</p>
      </div>
    </div>
  );
}
