import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CounterButton from '../components/CounterButton';
import { db } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { Trash2, Plus, Settings2 } from 'lucide-react';

export default function Settings() {
  const [students, setStudents] = useState(40);
  const [timer, setTimer] = useState(15);
  const [showProgressToAll, setShowProgressToAll] = useState(false);
  const [namesText, setNamesText] = useState('');
  
  const [savedLists, setSavedLists] = useState([]);
  const [saveName, setSaveName] = useState('');

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [questions, setQuestions] = useState(10);
  
  const [questionGroups, setQuestionGroups] = useState([
    { id: 'g1', mainLabel: '問1', subs: [] },
    { id: 'g2', mainLabel: '問2', subs: [] }
  ]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loaded = localStorage.getItem('pacemark_saved_lists');
    if (loaded) setSavedLists(JSON.parse(loaded));
  }, []);

  const handleNamesChange = (e) => {
    const text = e.target.value;
    setNamesText(text);
    const validLines = text.split('\n').filter(line => line.trim() !== '');
    if (validLines.length > 0) setStudents(validLines.length);
  };

  const handleSaveList = () => {
    if (!namesText.trim() || !saveName.trim()) {
      alert("名簿と保存名を入力してください。");
      return;
    }
    const newList = { id: Date.now(), name: saveName, data: namesText };
    const updatedLists = [...savedLists, newList];
    setSavedLists(updatedLists);
    localStorage.setItem('pacemark_saved_lists', JSON.stringify(updatedLists));
    setSaveName('');
  };

  const handleLoadList = (list) => {
    setNamesText(list.data);
    const validLines = list.data.split('\n').filter(line => line.trim() !== '');
    setStudents(validLines.length > 0 ? validLines.length : 40);
  };

  const handleDeleteList = (id) => {
    if(!window.confirm("削除してもよろしいですか？")) return;
    const updatedLists = savedLists.filter(list => list.id !== id);
    setSavedLists(updatedLists);
    localStorage.setItem('pacemark_saved_lists', JSON.stringify(updatedLists));
  };

  const handleAddGroup = () => {
    setQuestionGroups([...questionGroups, { id: `g${Date.now()}`, mainLabel: `問${questionGroups.length + 1}`, subs: [] }]);
  };

  const handleRemoveGroup = (groupId) => {
    setQuestionGroups(questionGroups.filter(g => g.id !== groupId));
  };

  const handleUpdateMainLabel = (groupId, newLabel) => {
    setQuestionGroups(questionGroups.map(g => g.id === groupId ? { ...g, mainLabel: newLabel } : g));
  };

  const handleAddSubsPreset = (groupId, type) => {
    let newSubs = [];
    if (type === 'abc') newSubs = ['A', 'B', 'C'];
    if (type === '123') newSubs = ['(1)', '(2)', '(3)'];
    if (type === 'custom') newSubs = [...questionGroups.find(g => g.id === groupId).subs, ''];
    setQuestionGroups(questionGroups.map(g => g.id === groupId ? { ...g, subs: newSubs } : g));
  };

  const handleUpdateSub = (groupId, subIndex, newSubLabel) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id === groupId) {
        const newSubs = [...g.subs];
        newSubs[subIndex] = newSubLabel;
        return { ...g, subs: newSubs };
      }
      return g;
    }));
  };

  const handleRemoveSub = (groupId, subIndex) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id === groupId) {
        const newSubs = [...g.subs];
        newSubs.splice(subIndex, 1);
        return { ...g, subs: newSubs };
      }
      return g;
    }));
  };

  const customQuestionsList = questionGroups.flatMap(g => {
    if (g.subs.length === 0) return [{ id: g.id, label: g.mainLabel }];
    return g.subs.filter(s => s.trim() !== '').map((sub, i) => ({ id: `${g.id}-${i}`, label: `${g.mainLabel} - ${sub}` }));
  });

  const handleStart = async () => {
    let finalQuestionsList = [];
    if (isCustomMode) {
      finalQuestionsList = customQuestionsList;
    } else {
      finalQuestionsList = Array.from({ length: questions }, (_, i) => ({
        id: (i + 1).toString(),
        label: `問 ${i + 1}`
      }));
    }

    if (finalQuestionsList.length === 0) {
      alert("問題が設定されていません。");
      return;
    }

    const sessionId = Math.floor(100000 + Math.random() * 900000).toString();
    const namesArray = namesText.split('\n').filter(line => line.trim() !== '');
    const namesObj = {};
    for (let i = 0; i < students; i++) {
      if (namesArray[i]) namesObj[i + 1] = namesArray[i];
    }
    
    const initialData = {
      settings: {
        studentsCount: students,
        questionsCount: finalQuestionsList.length,
        questionsList: finalQuestionsList,
        timerMinutes: timer,
        showProgressToAll: showProgressToAll,
        startTime: null,
        isEnded: false, // ★ 追加：初期状態は終了していない
      },
      progress: {},
      names: namesObj,
      activeUsers: {},
      absentUsers: {}
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
      <div className="max-w-5xl w-full">
        
        {/* ▼ ロゴとタイトルのサイズを大幅に大きく調整しました ▼ */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
            <img src="/pacemarklogo.png" alt="PaceMark Logo" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
            <h1 className="text-7xl md:text-[6rem] leading-none font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 tracking-tighter pb-1 md:pb-2">
              PaceMark
            </h1>
          </div>
          <p className="text-slate-500 font-bold tracking-widest text-sm md:text-base mt-2">
            クラスの進捗をリアルタイムに
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* 左カラム：生徒設定 */}
          <div className="space-y-6 flex flex-col">
            <CounterButton label="生徒の人数（人）" value={students} onChange={setStudents} max={100} />
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-grow flex flex-col">
              <label className="block text-slate-600 font-bold mb-3 text-center">生徒の氏名（任意）</label>
              <p className="text-[13px] text-slate-400 mb-4 text-left tracking-tight">
                エクセル等から改行区切りで貼り付けると、上の人数も自動で連動します。
              </p>
              
              {/* 名簿の保存・読込UI */}
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={saveName} 
                    onChange={(e) => setSaveName(e.target.value)} 
                    placeholder="保存名 (例: 1年A組)" 
                    className="flex-grow p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" 
                  />
                  <button 
                    onClick={handleSaveList} 
                    className="px-4 py-2 bg-blue-100 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-200 active:scale-95 transition-all whitespace-nowrap"
                  >
                    保存する
                  </button>
                </div>
                {savedLists.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
                    {savedLists.map(list => (
                      <div key={list.id} className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <button 
                          onClick={() => handleLoadList(list)} 
                          className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {list.name}
                        </button>
                        <button 
                          onClick={() => handleDeleteList(list.id)} 
                          className="px-2 py-1.5 bg-slate-50 text-slate-300 hover:bg-red-100 hover:text-red-500 transition-colors border-l border-slate-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <textarea
                className="w-full flex-grow p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-400 focus:outline-none transition-colors resize-none"
                value={namesText} 
                onChange={handleNamesChange} 
                placeholder="山田太郎&#13;&#10;佐藤花子" 
                style={{ minHeight: '120px' }}
              />
            </div>
          </div>

          {/* 右カラム：授業・問題設定 */}
          <div className="space-y-6 flex flex-col relative">
            <div className="absolute right-0 -top-12 md:-top-4 z-10">
              <button 
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-colors ${
                  isCustomMode 
                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Settings2 size={16} />
                {isCustomMode ? 'シンプル設定に戻す' : 'カスタム編集'}
              </button>
            </div>
            
            {!isCustomMode ? (
               <div className="pt-8 md:pt-0">
                 <CounterButton label="問題数（問）" value={questions} onChange={setQuestions} max={100} />
               </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-grow flex flex-col max-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-slate-600 font-bold">問題の構成</label>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    合計: {customQuestionsList.length} 問
                  </span>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                  {questionGroups.map((group, index) => (
                    <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                      <button 
                        onClick={() => handleRemoveGroup(group.id)} 
                        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="mb-3 pr-8">
                        <input 
                          type="text" 
                          value={group.mainLabel} 
                          onChange={(e) => handleUpdateMainLabel(group.id, e.target.value)}
                          className="w-full font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-blue-400"
                          placeholder="例: 大問1、Task 1"
                        />
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-slate-100">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs text-slate-400 font-bold self-center mr-1">小問の追加:</span>
                          <button 
                            onClick={() => handleAddSubsPreset(group.id, 'abc')} 
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                          >
                            A, B, C...
                          </button>
                          <button 
                            onClick={() => handleAddSubsPreset(group.id, '123')} 
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                          >
                            (1), (2), (3)...
                          </button>
                          <button 
                            onClick={() => handleAddSubsPreset(group.id, 'custom')} 
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded transition-colors border border-blue-100 flex items-center gap-1"
                          >
                            <Plus size={12}/> 自由に追加
                          </button>
                        </div>

                        {group.subs.length > 0 && (
                          <div className="space-y-2">
                            {group.subs.map((sub, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm">↳</span>
                                <input 
                                  type="text" 
                                  value={sub} 
                                  onChange={(e) => handleUpdateSub(group.id, sIdx, e.target.value)}
                                  className="flex-grow text-sm bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-400"
                                  placeholder="例: (1) や A"
                                />
                                <button 
                                  onClick={() => handleRemoveSub(group.id, sIdx)} 
                                  className="text-slate-300 hover:text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {group.subs.length === 0 && (
                          <p className="text-xs text-slate-400">小問がない場合は「{group.mainLabel}」として1問になります。</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddGroup} 
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> グループ（大問など）を追加
                  </button>
                </div>
              </div>
            )}

            <CounterButton label="制限時間（分）" value={timer} onChange={setTimer} max={120} />
            
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
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