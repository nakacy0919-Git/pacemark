import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Check, Flame, AlertCircle } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';

export default function StudentView() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [sessionData, setSessionData] = useState(null);
  const [myId, setMyId] = useState('');

  // 以前はバラバラに取得していましたが、全体の進捗を計算するためにセッション丸ごと取得に変更
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSessionData(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleToggleQuestion = async (qNum) => {
    if (!sessionId || !myId) return;
    const isCompleted = sessionData?.progress?.[myId]?.[qNum] || false;
    const updates = {};
    updates[`sessions/${sessionId}/progress/${myId}/${qNum}`] = !isCompleted;
    await update(ref(db), updates);
  };

  // SOSボタンの処理
  const handleToggleSos = async () => {
    if (!sessionId || !myId) return;
    const isSos = sessionData?.sos?.[myId] || false;
    const updates = {};
    updates[`sessions/${sessionId}/sos/${myId}`] = !isSos;
    await update(ref(db), updates);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <p className="text-slate-500 font-bold">セッションIDが見つかりません。</p>
        <Link to="/" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-[0_4px_0_rgb(59,130,246,0.5)] hover:bg-blue-400 active:translate-y-1 active:shadow-none transition-all">
          トップ画面に戻る
        </Link>
      </div>
    );
  }
  
  if (!sessionData || !sessionData.settings) return <div className="p-8 text-center text-slate-500 font-bold">授業データを読み込み中...</div>;

  const { settings, names = {}, progress = {}, sos = {} } = sessionData;

  if (!myId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl w-full text-center">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-6">自分の名前を選んでね</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-2">
            {Array.from({ length: settings.studentsCount }, (_, i) => i + 1).map(num => {
              const studentName = names[num] || `生徒 ${num}`;
              return (
                <button
                  key={num}
                  onClick={() => setMyId(num.toString())}
                  className="py-3 px-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xs font-bold text-slate-400">{num}番</span>
                  <span className="font-extrabold truncate w-full">{studentName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const myName = names[myId] || `生徒 ${myId}`;
  const myProgress = progress[myId] || {};
  const isMySos = sos[myId] || false;

  // クラス全体の進捗率を計算（生徒用）
  const totalQuestions = settings.studentsCount * settings.questionsCount;
  let completedQuestions = 0;
  for (let i = 1; i <= settings.studentsCount; i++) {
    const p = progress[i] || {};
    for (let j = 1; j <= settings.questionsCount; j++) {
      if (p[j]) completedQuestions++;
    }
  }
  const classProgressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full">
        
        {/* ★ 設定でONの場合のみ、生徒画面にもプログレスバーを表示 */}
        {settings.showProgressToAll && (
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Flame size={16} className={classProgressPercent === 100 ? "text-orange-500 animate-bounce" : ""} />
                <span>クラス全体のミッション</span>
              </div>
              <span className="text-lg font-extrabold text-slate-700">{classProgressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${classProgressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">{myName}</h1>
              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={() => setMyId('')}
                  className="text-sm text-slate-400 hover:text-slate-600 font-bold underline whitespace-nowrap"
                >
                  名前を変える
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {/* ★ SOSボタン */}
              <button
                onClick={handleToggleSos}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                  isMySos 
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_4px_0_rgb(220,38,38,0.5)] active:translate-y-1 active:shadow-none' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 active:scale-95'
                }`}
              >
                <AlertCircle size={18} />
                {isMySos ? '先生を呼んでいます...' : '先生、教えて！'}
              </button>

              {settings.startTime && (
                <CountdownTimer startTime={settings.startTime} timerMinutes={settings.timerMinutes} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 border-t border-slate-100 pt-6">
            {Array.from({ length: settings.questionsCount }, (_, i) => i + 1).map(qNum => {
              const isCompleted = myProgress[qNum] || false;
              return (
                <button
                  key={qNum}
                  onClick={() => handleToggleQuestion(qNum)}
                  className={`relative p-4 md:p-5 rounded-2xl font-extrabold text-base md:text-lg transition-all active:scale-95 ${
                    isCompleted 
                      ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(59,130,246,0.5)] active:translate-y-1 active:shadow-none' 
                      : 'bg-white text-slate-600 border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240,1)] hover:border-blue-200 hover:text-blue-500 active:translate-y-1 active:shadow-none'
                  }`}
                >
                  {isCompleted && (
                    <span className="absolute top-2 right-2 bg-white text-blue-500 rounded-full p-0.5">
                      <Check size={14} strokeWidth={4} />
                    </span>
                  )}
                  問 {qNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}