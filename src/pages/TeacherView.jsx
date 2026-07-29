import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Maximize2, X, Play, SquareSquare } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import ProgressGrid from '../components/ProgressGrid';
import CountdownTimer from '../components/CountdownTimer';

export default function TeacherView() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const studentUrl = `${window.location.origin}/student?session=${sessionId}`;

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // タイマーが0になったかを管理するステート
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}/settings`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  // ★ タイマーの時間を常に監視し、0になったら isTimeUp を true にする
  useEffect(() => {
    if (!settings?.startTime) {
      setIsTimeUp(false);
      return;
    }
    const endTime = settings.startTime + settings.timerMinutes * 60 * 1000;
    const checkTime = () => {
      if (Date.now() >= endTime) {
        setIsTimeUp(true);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [settings?.startTime, settings?.timerMinutes]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartTimer = async () => {
    if (!sessionId) return;
    await update(ref(db, `sessions/${sessionId}/settings`), {
      startTime: Date.now()
    });
  };

  // ★ 手動で授業を終了する処理
  const handleEndSession = async () => {
    if (!window.confirm("授業を終了しますか？\n生徒の画面がロックされ、結果発表画面に切り替わります。")) return;
    if (!sessionId) return;
    await update(ref(db, `sessions/${sessionId}/settings`), {
      isEnded: true
    });
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <p className="text-slate-500 font-bold">セッションIDが見つかりません。設定画面からやり直してください。</p>
        <Link to="/" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-[0_4px_0_rgb(59,130,246,0.5)] hover:bg-blue-400 active:translate-y-1 active:shadow-none transition-all">
          設定画面に戻る
        </Link>
      </div>
    );
  }

  // ★ 「手動終了」または「タイマー切れ」のどちらかで終了状態と判定
  const isLessonEnded = settings?.isEnded || isTimeUp;

  return (
    <>
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-all">
          <button onClick={() => setIsQRModalOpen(false)} className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-slate-300 transition-colors">
            <X size={48} strokeWidth={2} />
          </button>
          <div className="bg-white p-6 md:p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
            <QRCodeSVG value={studentUrl} size={400} level="H" className="w-[70vw] max-w-[400px] h-auto" />
            <p className="text-slate-800 text-3xl font-extrabold tracking-widest font-mono">ID: {sessionId}</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">先生用ダッシュボード</h1>
                <p className="text-slate-500 mt-2 font-medium">セッションID: <span className="text-blue-500 font-bold">{sessionId}</span></p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* 状態によって右上のボタン表示を切り替え */}
                {!settings?.startTime ? (
                  <button onClick={handleStartTimer} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white font-bold rounded-2xl shadow-sm hover:bg-slate-700 active:scale-95 transition-all">
                    <Play size={20} className="fill-white" /> タイマーを開始
                  </button>
                ) : isLessonEnded ? (
                  <div className="px-5 py-2.5 bg-slate-200 text-slate-500 font-bold rounded-2xl flex items-center gap-2">
                    授業終了
                  </div>
                ) : (
                  <>
                    <CountdownTimer startTime={settings.startTime} timerMinutes={settings.timerMinutes} />
                    <button onClick={handleEndSession} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-2xl shadow-sm hover:bg-red-400 active:scale-95 transition-all">
                      授業を終了
                    </button>
                  </>
                )}
                
                <Link to="/" className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all ml-2" title="トップ画面（設定）に戻ります">
                  トップ(新規作成)
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-blue-50/50 p-6 md:p-8 rounded-2xl border border-blue-100">
              <div className="relative group cursor-pointer" onClick={() => setIsQRModalOpen(true)} title="クリックして拡大">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 group-hover:border-blue-300 transition-colors">
                  <QRCodeSVG value={studentUrl} size={140} level="H" />
                </div>
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white p-2 rounded-full shadow-md text-blue-500">
                    <Maximize2 size={24} />
                  </div>
                </div>
              </div>
              <div className="text-center md:text-left w-full md:w-auto">
                <h2 className="text-xl font-bold text-slate-700 mb-2">生徒の参加方法</h2>
                <p className="text-slate-600 mb-4 leading-relaxed text-sm md:text-base">
                  左のQRコードを拡大して読み取るか、以下のURLを共有してください。
                </p>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-mono text-xs md:text-sm overflow-hidden text-ellipsis whitespace-nowrap shadow-sm max-w-[240px] md:max-w-md">
                    {studentUrl}
                  </div>
                  <button onClick={handleCopyLink} className="flex-shrink-0 flex items-center justify-center w-12 h-[46px] bg-slate-800 text-white rounded-xl shadow-sm hover:bg-slate-700 active:scale-95 transition-all">
                    {isCopied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ProgressGrid sessionId={sessionId} />
        </div>
      </div>
    </>
  );
}