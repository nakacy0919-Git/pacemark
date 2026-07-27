import { Minus, Plus } from 'lucide-react';

export default function CounterButton({ label, value, onChange, min = 1, max = 100 }) {
  return (
    <div className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
      <span className="text-slate-600 font-bold mb-3">{label}</span>
      <div className="flex items-center gap-6">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-14 h-14 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 active:bg-slate-200 transition-all"
        >
          <Minus size={28} />
        </button>
        <span className="text-4xl font-extrabold text-slate-700 w-16 text-center tracking-tight">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.max(min, Math.min(max, value + 1)))}
          className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 active:scale-95 active:bg-blue-200 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}