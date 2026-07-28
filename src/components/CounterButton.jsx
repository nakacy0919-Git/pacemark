import { Minus, Plus } from 'lucide-react';

export default function CounterButton({ label, value, onChange, max }) {
  // 直接入力されたときの処理
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    // 一旦空欄にする操作を許容する
    if (rawValue === '') {
      onChange('');
      return;
    }
    const val = parseInt(rawValue, 10);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  // 入力枠からフォーカスが外れたときに、異常な数値を補正する
  const handleBlur = () => {
    let val = parseInt(value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (max && val > max) val = max;
    onChange(val);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
      <label className="text-slate-600 font-bold mb-4">{label}</label>
      <div className="flex items-center gap-6">
        <button
          onClick={() => onChange(Math.max(1, (parseInt(value) || 1) - 1))}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <Minus size={24} />
        </button>
        
        {/* 数字を表示するだけでなく、直接入力できるように input タグに変更 */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-16 text-center text-4xl font-extrabold text-slate-800 bg-transparent focus:outline-none focus:border-b-4 focus:border-blue-400 transition-colors"
        />

        <button
          onClick={() => onChange(max ? Math.min(max, (parseInt(value) || 1) + 1) : (parseInt(value) || 1) + 1)}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-200 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}