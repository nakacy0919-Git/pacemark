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

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) setSessionData(snapshot.val());
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleToggleQuestion = async (qId) => {
    if (!sessionId || !myId) return;
    const isCompleted = sessionData?.progress?.[myId]?.[qId] || false;
    const updates = {};
    updates[`sessions/${sessionId}/progress/${myId}/${qId}`] = !isCompleted;
    await update(ref(db), updates);
  };

  const handleToggleSos = async () => {
    if (!sessionId || !myId) return;
    const isSos = sessionData?.sos?.[myId] || false;
    const updates = {};
    updates[`sessions/${sessionId}/sos/${myId}`] = !isSos;
    await update(ref(db), updates);
  };

  const handleSelectName = async (numStr) => {
    setMyId(numStr);
    if (sessionId) await update(ref(db, `sessions/${sessionId}/activeUsers`), { [numStr]: true });
  };

  const handleChangeName = async () => {
    if (sessionId && myId) await update(ref(db, `sessions/${sessionId}/activeUsers`), { [myId]: null });
    setMyId('');
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <p className="text-slate-500 font-bold">セッションIDが見つかりません。</p>
        <Link to="/" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-[0_4px_0_rgb(59,130,246,0.5)] hover:bg-blue-400 active:translate-y-1 active:shadow-none transition-all">トップ画面に戻る</Link>
      </div>
    );
  }
  
  if (!sessionData || !sessionData.settings) return <div className="p-8 text-center text-slate-500 font-bold">授業データを読み込み中...</div>;

  const { settings, names = {}, progress = {}, sos = {}, absentUsers = {} } = sessionData;

  // ★ 独自形式の問題リストを取得（古いデータの場合は互換用リストを生成）
  const finalQuestionsList = settings.questionsList || 
    Array.from({ length: settings.questionsCount }, (_, i) => ({ id: (i + 1).toString(), label: `問 ${i + 1}` }));

  if (!myId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl w-full text-center">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-6">自分の名前を選んでね</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-2">
            {Array.from({ length: settings.studentsCount }, (_, i) => i + 1).map(num => {
              if (absentUsers[num]) return null;
              const studentName = names[num] || `生徒 ${num}`;
              return (
                <button key={num} onClick={() => handleSelectName(num.toString())} className="py-3 px-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
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

  let completedQuestions = 0;
  let activeStudentCount = 0;
  for (let i = 1; i <= settings.studentsCount; i++) {
    if (!absentUsers[i]) {
      activeStudentCount++;
      const p = progress[i] || {};
      finalQuestionsList.forEach(q => { if (p[q.id]) completedQuestions++; });
    }
  }
  const totalQuestions = activeStudentCount * finalQuestionsList.length;
  const classProgressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full">
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
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${classProgressPercent}%` }}></div>
            </div>
          </div>
        )}

        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">{myName}</h1>
              <button onClick={handleChangeName} className="mt-2 text-sm text-slate-400 hover:text-slate-600 font-bold underline whitespace-nowrap">名前を変える</button>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <button onClick={handleToggleSos} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${isMySos ? 'bg-red-500 text-white animate-pulse shadow-[0_4px_0_rgb(220,38,38,0.5)] active:translate-y-1 active:shadow-none' : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 active:scale-95'}`}>
                <AlertCircle size={18} /> {isMySos ? '先生を呼んでいます...' : '先生、教えて！'}
              </button>
              {settings.startTime ? <CountdownTimer startTime={settings.startTime} timerMinutes={settings.timerMinutes} /> : <div className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold font-mono">待機中...</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 border-t border-slate-100 pt-6">
            {finalQuestionsList.map(q => {
              const isCompleted = myProgress[q.id] || false;
              return (
                <button
                  key={q.id} onClick={() => handleToggleQuestion(q.id)}
                  className={`relative p-4 rounded-2xl font-extrabold text-sm md:text-base transition-all active:scale-95 break-words ${isCompleted ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(59,130,246,0.5)] active:translate-y-1 active:shadow-none' : 'bg-white text-slate-600 border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240,1)] hover:border-blue-200 hover:text-blue-500 active:translate-y-1 active:shadow-none'}`}
                >
                  {isCompleted && <span className="absolute top-2 right-2 bg-white text-blue-500 rounded-full p-0.5"><Check size={14} strokeWidth={4} /></span>}
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}