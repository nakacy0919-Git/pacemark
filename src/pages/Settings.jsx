import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounterButton from '../components/CounterButton';

export default function Settings() {
  const [students, setStudents] = useState(40);
  const [questions, setQuestions] = useState(10);
  const [timer, setTimer] = useState(15);
  const navigate = useNavigate();

  const handleStart = () => {
    // ※後でここにFirebaseへのデータ保存処理を追加します
    navigate('/teacher');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">PaceMark</h1>
          <p className="text-slate-500 mt-2 font-medium">クラスの進捗をリアルタイムに</p>
        </div>
        
        <div className="space-y-6 mb-10">
          <CounterButton label="生徒の人数（人）" value={students} onChange={setStudents} max={100} />
          <CounterButton label="問題数（問）" value={questions} onChange={setQuestions} max={50} />
          <CounterButton label="制限時間（分）" value={timer} onChange={setTimer} max={120} />
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-[0_4px_0_rgb(59,130,246,0.5)] hover:bg-blue-400 hover:shadow-[0_4px_0_rgb(96,165,250,0.5)] active:translate-y-1 active:shadow-none transition-all"
        >
          授業をスタートする
        </button>
      </div>
    </div>
  );
}