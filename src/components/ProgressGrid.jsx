import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Check, Flame, AlertCircle, CheckCircle2, UserX } from 'lucide-react';

export default function ProgressGrid({ sessionId }) {
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) setSessionData(snapshot.val());
    });
    return () => unsubscribe();
  }, [sessionId]);

  if (!sessionData || !sessionData.settings) {
    return <div className="text-center p-10 text-slate-500 font-bold">データを読み込み中...</div>;
  }

  const { settings, progress = {}, names = {}, sos = {}, activeUsers = {}, absentUsers = {} } = sessionData;
  
  const allStudents = Array.from({ length: settings.studentsCount }, (_, i) => i + 1);
  const activeStudents = allStudents.filter(id => !absentUsers[id]);
  
  // ★ 独自形式の問題リストを取得
  const finalQuestionsList = settings.questionsList || 
    Array.from({ length: settings.questionsCount }, (_, i) => ({ id: (i + 1).toString(), label: `Q${i + 1}` }));

  const handleRemoveStudent = async (studentId) => {
    const studentName = names[studentId] || `生徒 ${studentId}`;
    if(!window.confirm(`${studentName} さんを欠席としてリストから削除しますか？`)) return;
    await update(ref(db, `sessions/${sessionId}/absentUsers`), { [studentId]: true });
  };

  const totalQuestions = activeStudents.length * finalQuestionsList.length;
  let completedQuestions = 0;
  activeStudents.forEach(studentId => {
    const studentProgress = progress[studentId] || {};
    finalQuestionsList.forEach(q => { if (studentProgress[q.id]) completedQuestions++; });
  });
  const classProgressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="bg-white p-2 md:p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="mb-8 px-4 md:px-0">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-4">進捗一覧</h2>
        <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Flame size={20} className={classProgressPercent === 100 ? "text-orange-500 animate-bounce" : ""} />
              <span>クラス全体のミッション達成率 (出席: {activeStudents.length}名)</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-700">{classProgressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${classProgressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr>
              <th className="p-4 border-b-2 border-slate-200 text-left text-slate-500 font-bold whitespace-nowrap sticky left-0 bg-white/90 backdrop-blur-sm z-10 min-w-[160px]">
                生徒名
              </th>
              {finalQuestionsList.map(q => (
                // ★ ヘッダーに独自ラベルを表示
                <th key={q.id} className="p-3 border-b-2 border-slate-200 text-center text-slate-600 font-bold min-w-[5rem] text-sm break-words whitespace-pre-wrap leading-tight">
                  {q.label}
                </th>
              ))}
              <th className="p-4 border-b-2 border-slate-200 text-center text-slate-500 font-bold min-w-[5rem]">
                達成率
              </th>
            </tr>
          </thead>
          <tbody>
            {activeStudents.map(studentId => {
              const studentProgress = progress[studentId] || {};
              const isSos = sos[studentId] || false;
              const isOnline = activeUsers[studentId] || false;
              
              const completedCount = finalQuestionsList.filter(q => studentProgress[q.id]).length;
              const percentage = Math.round((completedCount / finalQuestionsList.length) * 100);

              return (
                <tr key={studentId} className={`transition-colors group ${isSos ? 'bg-red-50 animate-pulse' : 'hover:bg-slate-50'}`}>
                  <td className={`p-3 border-b border-slate-100 font-extrabold text-slate-700 whitespace-nowrap sticky left-0 transition-colors ${isSos ? 'bg-red-50 text-red-700' : 'bg-white group-hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {isOnline ? <CheckCircle2 size={20} className="text-green-500 fill-green-50" title="ログイン完了" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" title="未ログイン"></div>}
                        <span>{names[studentId] || `生徒 ${studentId}`}</span>
                        {isSos && <AlertCircle size={18} className="text-red-500" />}
                      </div>
                      <button onClick={() => handleRemoveStudent(studentId)} className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors" title="欠席として削除">
                        <UserX size={16} />
                      </button>
                    </div>
                  </td>
                  {finalQuestionsList.map(q => {
                    const isCompleted = studentProgress[q.id];
                    return (
                      <td key={q.id} className="p-2 border-b border-slate-100 text-center">
                        {isCompleted ? (
                          <div className="w-8 h-8 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm scale-110 transition-transform">
                            <Check size={16} strokeWidth={3.5} />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 mx-auto rounded-full border-2 ${isSos ? 'bg-red-100 border-red-200' : 'bg-slate-100 border-slate-200'}`}></div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`p-3 border-b border-slate-100 text-center font-extrabold ${isSos ? 'text-red-500' : 'text-slate-500'}`}>
                    {percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}