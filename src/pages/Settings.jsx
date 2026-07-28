import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounterButton from '../components/CounterButton';
import { db } from '../lib/firebase';
import { ref, set } from 'firebase/database';

export default function Settings() {
  const [students, setStudents] = useState(40);
  const [questions, setQuestions] = useState(10);
  const [timer, setTimer] = useState(15);
  const [showProgressToAll, setShowProgressToAll] = useState(false);
  const [namesText, setNamesText] = useState('');
  
  const navigate = useNavigate();

  const handleNamesChange = (e) => {
    const text = e.target.value;
    setNamesText(text);
    const validLines = text.split('\n').filter(line => line.trim() !== '');
    if (validLines.length > 0) {
      setStudents(validLines.length);
    }
  };

  const handleStart = async () => {
    const sessionId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const namesArray = namesText.split('\n').filter(line => line.trim() !== '');
    const namesObj = {};
    for (let i = 0; i < students; i++) {
      if (namesArray[i]) {
        namesObj[i + 1] = namesArray[i];
      }
    }
    
    const initialData = {
      settings: {
        studentsCount: students,
        questionsCount: questions,
        timerMinutes: timer,
        showProgressToAll: showProgressToAll,
        startTime: Date.now(),
      },
      progress: {},
      names: namesObj
    };

    try {
      await set(ref(db, `sessions/${sessionId}`), initialData);
      navigate(`/teacher?session=${sessionId}`);
    } catch (error) {
      console.error("Firebase保存エラー:", error);
      alert("授業の作成に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-8 px-4 font-sans">
      <div className="max-w-4xl w-full">
        
        {/* ▼ タイトルのデザイン（ロゴ画像への差し替え） ▼ */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* imgタグを使ってオリジナルのロゴを表示します */}
            <img src="/pacemarklogo.png" alt="PaceMark Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain" />
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 tracking-tighter pb-1">
              PaceMark
            </h1>
          </div>
          <p className="text-slate-500 mt-1 font-bold tracking-widest text-sm">
            クラスの進捗をリアルタイムに
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6 flex flex-col">
            <CounterButton label="生徒の人数（人）" value={students} onChange={setStudents} max={100} />
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-grow">
              <label className="block text-slate-600 font-bold mb-3 text-center">生徒の氏名（任意）</label>
              <p className="text-xs text-slate-400 mb-3 text-center">
                エクセル等から改行区切りで貼り付けると、上の人数も自動で連動します。
              </p>
              <textarea
                className="w-full h-40 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-400 focus:outline-none transition-colors resize-none"
                value={namesText}
                onChange={handleNamesChange}
                placeholder="1行につき1名分の名前を入力&#13;&#10;（例）&#13;&#10;山田太郎&#13;&#10;佐藤花子"
              />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <CounterButton label="問題数（問）" value={questions} onChange={setQuestions} max={50} />
            <CounterButton label="制限時間（分）" value={timer} onChange={setTimer} max={120} />
            
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100 mt-auto">
              <span className="text-slate-600 font-bold">全員に進捗を公開</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={showProgressToAll}
                  onChange={() => setShowProgressToAll(!showProgressToAll)}
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-center max-w-md mx-auto">
          <button 
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-[0_4px_0_rgb(59,130,246,0.5)] hover:bg-blue-400 hover:shadow-[0_4px_0_rgb(96,165,250,0.5)] active:translate-y-1 active:shadow-none transition-all"
          >
            授業をスタートする
          </button>
        </div>
      </div>
    </div>
  );
}