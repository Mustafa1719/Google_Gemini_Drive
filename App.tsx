import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GeminiFile } from './types';
import { formatBytes, groupFilesByDate } from './utils/helpers';
import { FileIcon } from './components/FileIcon';
import { auth, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";

// --- Auth Components ---

const AuthFormCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path fillRule="evenodd" d="M11.213 2.434a.75.75 0 011.574 0l1.826 5.612a.75.75 0 00.705.513l5.817.456a.75.75 0 01.42 1.28l-4.32 3.948a.75.75 0 00-.224.787l1.22 5.72a.75.75 0 01-1.1.814l-5.123-2.912a.75.75 0 00-.82 0l-5.123 2.912a.75.75 0 01-1.1-.814l1.22-5.72a.75.75 0 00-.224-.787L.79 10.295a.75.75 0 01.42-1.28l5.817-.456a.75.75 0 00.705-.513l1.826-5.612z" clipRule="evenodd" />
                    </svg>
                    Gemini Drive
                </h1>
                <p className="text-slate-400 mt-2">{title}</p>
            </header>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl shadow-2xl p-8 backdrop-blur-lg">
                {children}
            </div>
        </div>
    </div>
);

const LoginPage: React.FC<{ onSwitch: () => void; onForgotPassword: (email: string) => void; }> = ({ onSwitch, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                setError("Lütfen devam etmeden önce e-postanızı doğrulayın. Gelen kutunuzu kontrol edin.");
                await signOut(auth); // Sign them out so they can't access the app
                return;
            }
        } catch (err: any) {
            setError("Şifre veya E-posta Hatalı");
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle successful login
        } catch (err) {
            setError("Google ile giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };


    return (
        <AuthFormCard title="Oturum Açın">
            <form onSubmit={handleLogin} className="space-y-6">
                {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center text-sm">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="email">E-posta</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <label className="block text-sm font-medium text-slate-300" htmlFor="password">Şifre</label>
                         <button type="button" onClick={() => onForgotPassword(email)} className="text-sm font-medium text-sky-400 hover:underline focus:outline-none">Şifremi unuttum?</button>
                    </div>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                <button type="submit" className="w-full px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors">Giriş Yap</button>
            </form>
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">VEYA</span>
                <div className="flex-grow border-t border-slate-600"></div>
            </div>
            <button
                onClick={handleGoogleSignIn}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-gray-200 text-slate-700 font-semibold rounded-lg transition-colors shadow-sm"
            >
                <img src="https://storage.googleapis.com/gemini-drive-storage/Logo/google%20logo.png" alt="Google logosu" className="w-5 h-5"/>
                Google ile Giriş Yap
            </button>
            <p className="text-center text-sm text-slate-400 mt-6">
                Hesabın yok mu? <button onClick={onSwitch} className="font-semibold text-sky-400 hover:underline">Kayıt ol</button>
            </p>
        </AuthFormCard>
    );
};

const ForgotPasswordPage: React.FC<{ onSwitchToLogin: () => void; initialEmail?: string; }> = ({ onSwitchToLogin, initialEmail }) => {
    const [email, setEmail] = useState(initialEmail || '');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage(`Size bir parola sıfırlama bağlantısı gönderdik. Lütfen e-posta gelen kutunuzu kontrol edin.`);
        } catch (err: any) {
             if (err.code === 'auth/user-not-found') {
                setError("Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.");
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        }
    };

    return (
        <AuthFormCard title={message ? "Bağlantı Gönderildi" : "Şifrenizi Sıfırlayın"}>
            {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center text-sm">{error}</p>}
            
            {message ? (
                <div className="text-center space-y-6">
                    <p className="text-green-400 bg-green-900/30 p-3 rounded-md text-sm">{message}</p>
                    <button 
                        onClick={onSwitchToLogin} 
                        className="w-full px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        Giriş Yap
                    </button>
                </div>
            ) : (
                <>
                    <form onSubmit={handleReset} className="space-y-6">
                        <p className="text-sm text-slate-400 text-center">Şifre sıfırlama bağlantısı göndereceğimiz e-posta adresinizi girin.</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="reset-email">E-posta</label>
                            <input 
                                type="email" 
                                id="reset-email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <button type="submit" className="w-full px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors">Sıfırlama Linki Gönder</button>
                    </form>
                    <p className="text-center text-sm text-slate-400 mt-6">
                        <button onClick={onSwitchToLogin} className="font-semibold text-sky-400 hover:underline">Giriş ekranına geri dön</button>
                    </p>
                </>
            )}
        </AuthFormCard>
    );
};

const VerificationPage: React.FC<{ email: string; onSwitchToLogin: () => void }> = ({ email, onSwitchToLogin }) => {
    return (
        <AuthFormCard title="E-postanızı Doğrulayın">
            <div className="text-center text-slate-300 space-y-6">
                <p>
                    <span className="font-semibold text-sky-400">{email}</span> adresine bir doğrulama e-postası gönderdik.
                </p>
                <p>Lütfen doğrulayın ve giriş yapın.</p>
                <button 
                    onClick={onSwitchToLogin} 
                    className="w-full px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
                >
                    Giriş Yap
                </button>
            </div>
        </AuthFormCard>
    );
};


const SignUpPage: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor");
            return;
        }
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            setVerificationEmail(email);
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Kullanıcı zaten mevcut. Giriş yapılsın mı?");
            } else {
                setError("Kayıt başarısız oldu. Lütfen tekrar deneyin.");
            }
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle successful registration
        } catch (err) {
            setError("Google ile kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    if (verificationEmail) {
        return <VerificationPage email={verificationEmail} onSwitchToLogin={onSwitch} />;
    }

    return (
        <AuthFormCard title="Yeni Hesap Oluşturun">
            <form onSubmit={handleSignUp} className="space-y-4">
                 {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center text-sm">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="name">Ad</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="signup-email">E-posta</label>
                    <input type="email" id="signup-email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="signup-password">Şifre</label>
                    <input type="password" id="signup-password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="confirm-password">Şifre Tekrar</label>
                    <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="profile-photo">Profil Fotoğrafı (İsteğe bağlı)</label>
                    <input type="file" id="profile-photo" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500/10 file:text-sky-300 hover:file:bg-sky-500/20"/>
                </div>
                <button type="submit" className="w-full px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors !mt-6">Hesap Oluştur</button>
            </form>
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">VEYA</span>
                <div className="flex-grow border-t border-slate-600"></div>
            </div>
            <button
                onClick={handleGoogleSignUp}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-gray-200 text-slate-700 font-semibold rounded-lg transition-colors shadow-sm"
            >
                <img src="https://storage.googleapis.com/gemini-drive-storage/Logo/google%20logo.png" alt="Google logosu" className="w-5 h-5"/>
                Google ile Kayıt Ol
            </button>
             <p className="text-center text-sm text-slate-400 mt-6">
                Zaten hesabın var mı? <button onClick={onSwitch} className="font-semibold text-sky-400 hover:underline">Giriş yap</button>
            </p>
        </AuthFormCard>
    );
};

const AuthPage: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
    const [emailForReset, setEmailForReset] = useState('');

    const handleForgotPassword = (email: string) => {
        setEmailForReset(email);
        setView('forgot');
    }

    if (view === 'signup') {
        return <SignUpPage onSwitch={() => setView('login')} />;
    }
    
    if (view === 'forgot') {
        return <ForgotPasswordPage 
            onSwitchToLogin={() => setView('login')} 
            initialEmail={emailForReset}
        />;
    }
    
    return <LoginPage onSwitch={() => setView('signup')} onForgotPassword={handleForgotPassword} />;
};


// --- Drive Components ---

const DriveApp: React.FC<{ user: User }> = ({ user }) => {
  const [files, setFiles] = useState<GeminiFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<GeminiFile | null>(null);
  const [selectedFileForEdit, setSelectedFileForEdit] = useState<GeminiFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load files from localStorage on initial mount
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem(`geminiDriveFiles_${user.uid}`);
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      }
    } catch (error) {
      console.error("Failed to load files from localStorage:", error);
    }
  }, [user.uid]);

  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`geminiDriveFiles_${user.uid}`, JSON.stringify(files));
    } catch (error) {
      console.error("Failed to save files to localStorage:", error);
    }
  }, [files, user.uid]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };
  
  const processFiles = (fileList: File[]) => {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: GeminiFile = {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
          previewUrl: event.target?.result as string,
          note: '',
        };
        setFiles(prev => [...prev, newFile].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For non-image files, we don't store a data URL to save space
         const newFile: GeminiFile = {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
          previewUrl: '',
          note: '',
        };
        setFiles(prev => [...prev, newFile].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
      }
    });
  };

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleUpdateFile = (updatedFile: GeminiFile) => {
    setFiles(prev => prev.map(f => (f.id === updatedFile.id ? updatedFile : f)));
    setSelectedFileForEdit(null);
  };
  
  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };


  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || file.type.startsWith(filterType);
      
      const matchesDate = !filterDate || new Date(file.uploadDate).toISOString().slice(0, 10) === filterDate;
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [files, searchTerm, filterType, filterDate]);

  const groupedFiles = useMemo(() => groupFilesByDate(filteredFiles), [filteredFiles]);
  
  const fileTypes = useMemo(() => {
    const types = new Set(files.map(f => f.type.split('/')[0]));
    return ['all', ...Array.from(types)];
  }, [files]);

  return (
    <div className="min-h-screen" onDragEnter={handleDragEnter}>
      <div className="container mx-auto p-4 md:p-8">
        <Header user={user} />
        <Filters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          fileTypes={fileTypes}
        />
        <FileUploadZone 
            handleFileChange={handleFileChange} 
            isDragging={isDragging}
        />
        
        <FileList
          groupedFiles={groupedFiles}
          onPreview={setSelectedFileForPreview}
          onEdit={setSelectedFileForEdit}
          onDelete={handleDeleteFile}
        />
      </div>

      {isDragging && (
          <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center z-50 transition-opacity duration-300"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
          >
              <div className="text-center p-10 border-2 border-dashed border-sky-400 rounded-2xl bg-sky-500/10">
                  <svg className="mx-auto h-16 w-16 text-sky-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-4 text-2xl font-bold text-sky-300">Yüklemek için dosyaları bırakın</p>
              </div>
          </div>
      )}

      {selectedFileForPreview && (
        <FilePreviewModal file={selectedFileForPreview} onClose={() => setSelectedFileForPreview(null)} />
      )}
      {selectedFileForEdit && (
        <EditFileModal
          file={selectedFileForEdit}
          onClose={() => setSelectedFileForEdit(null)}
          onSave={handleUpdateFile}
        />
      )}
    </div>
  );
};

const Header: React.FC<{ user: User }> = ({ user }) => {
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Çıkış yaparken hata oluştu:", error);
        }
    };
    
    return (
        <header className="mb-10">
            <div className="flex justify-between items-center mb-4">
                 <div className="text-sm text-slate-400">Giriş yapıldı: <span className="font-semibold text-slate-200">{user.email}</span></div>
                 <button onClick={handleSignOut} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md transition-colors">
                     Çıkış Yap
                </button>
            </div>
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path fillRule="evenodd" d="M11.213 2.434a.75.75 0 011.574 0l1.826 5.612a.75.75 0 00.705.513l5.817.456a.75.75 0 01.42 1.28l-4.32 3.948a.75.75 0 00-.224.787l1.22 5.72a.75.75 0 01-1.1.814l-5.123-2.912a.75.75 0 00-.82 0l-5.123 2.912a.75.75 0 01-1.1-.814l1.22-5.72a.75.75 0 00-.224-.787L.79 10.295a.75.75 0 01.42-1.28l5.817-.456a.75.75 0 00.705-.513l1.826-5.612z" clipRule="evenodd" />
                    </svg>
                  Gemini Drive
                </h1>
                <p className="text-slate-400 mt-2">Akıllı dosya alanınız.</p>
            </div>
        </header>
    );
}

// --- Unchanged Components (with minor adjustments if needed) ---
// Note: Components below this line are largely the same as the original file,
// but are included here to form a complete, single file for clarity.

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  fileTypes: string[];
}

const Filters: React.FC<FiltersProps> = ({ searchTerm, setSearchTerm, filterType, setFilterType, filterDate, setFilterDate, fileTypes }) => (
  <div className="mb-8 p-4 bg-slate-800/60 rounded-xl flex flex-col md:flex-row gap-4 items-center sticky top-4 z-10 backdrop-blur-lg border border-slate-700/50">
    <div className="relative w-full md:flex-1">
      <input
        type="text"
        placeholder="İsme göre ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-900/70 text-slate-200 placeholder-slate-400 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
      />
      <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    </div>
    <select
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
      className="w-full md:w-auto bg-slate-900/70 text-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 capitalize"
    >
      {fileTypes.map(type => <option key={type} value={type}>{type === 'all' ? 'Tüm Türler' : type}</option>)}
    </select>
    <input
      type="date"
      value={filterDate}
      onChange={(e) => setFilterDate(e.target.value)}
      className="w-full md:w-auto bg-slate-900/70 text-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
    />
  </div>
);

interface FileUploadZoneProps {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDragging: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ handleFileChange }) => (
    <div className="mb-10">
        <label htmlFor="file-upload" className="cursor-pointer group block p-6 text-center border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl transition-all duration-300 bg-slate-800/50 hover:bg-slate-800">
            <svg className="mx-auto h-12 w-12 text-slate-500 group-hover:text-sky-400 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" />
            </svg>
            <span className="mt-2 block text-sm font-semibold text-slate-300">Yüklemek için tıklayın veya <span className="text-sky-400">sürükleyip bırakın</span></span>
            <span className="mt-1 block text-xs text-slate-500">Tüm dosya türleri desteklenir</span>
            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
        </label>
    </div>
);


interface FileListProps {
  groupedFiles: Record<string, GeminiFile[]>;
  onPreview: (file: GeminiFile) => void;
  onEdit: (file: GeminiFile) => void;
  onDelete: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ groupedFiles, onPreview, onEdit, onDelete }) => (
  <div className="space-y-8">
    {Object.keys(groupedFiles).length > 0 ? (
      Object.keys(groupedFiles).map(date => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-slate-400 mb-4 pb-2 border-b border-slate-700/50">{date}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {groupedFiles[date].map(file => (
              <FileItem key={file.id} file={file} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-16 text-slate-500 bg-slate-800/30 rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <p className="mt-4 text-lg font-semibold">Sürücünüz boş</p>
        <p className="text-sm text-slate-400">Başlamak için bir dosya yükleyin.</p>
      </div>
    )}
  </div>
);

interface FileItemProps {
  file: GeminiFile;
  onPreview: (file: GeminiFile) => void;
  onEdit: (file: GeminiFile) => void;
  onDelete: (fileId: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onPreview, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative group bg-slate-800/50 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-sky-500/20 hover:-translate-y-1 hover:border-sky-500/60 hover:bg-slate-800">
      <div onClick={() => onPreview(file)} className="cursor-pointer">
        <div className="aspect-w-1 aspect-h-1 w-full bg-slate-900/30 flex items-center justify-center h-36">
          {file.type.startsWith('image/') && file.previewUrl ? (
            <img src={file.previewUrl} alt={file.name} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileIcon filename={file.name} className="w-16 h-16" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
        </div>
      </div>
      
      <div ref={menuRef} className="absolute top-2 right-2">
        <button onClick={toggleMenu} className="p-1.5 rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
        </button>
        {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20 py-1">
                <a onClick={(e) => { e.stopPropagation(); onEdit(file); setIsMenuOpen(false); }} className="cursor-pointer flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/80">Detayları Düzenle</a>
                <a onClick={(e) => { e.stopPropagation(); onDelete(file.id); setIsMenuOpen(false); }} className="cursor-pointer flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/80">Dosyayı Sil</a>
            </div>
        )}
      </div>
    </div>
  );
};


interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, title }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-lg flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

interface FilePreviewModalProps {
  file: GeminiFile;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white z-20 bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className="max-w-6xl max-h-[90vh] w-full h-full flex flex-col md:flex-row gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex-1 bg-black/50 flex items-center justify-center rounded-lg overflow-hidden">
             {file.type.startsWith('image/') && file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-center p-8">
                  <FileIcon filename={file.name} className="w-32 h-32 mx-auto" />
                  <p className="mt-4 text-slate-400">Bu dosya türü için önizleme mevcut değil.</p>
                </div>
              )}
        </div>
        <div className="w-full md:w-80 bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 p-4 rounded-lg flex flex-col space-y-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white truncate border-b border-slate-700 pb-3">{file.name}</h3>
            <div>
              <p className="text-sm text-slate-400">Dosya Boyutu</p>
              <p className="text-slate-200 font-medium">{formatBytes(file.size)}</p>
            </div>
             <div>
              <p className="text-sm text-slate-400">Yükleme Tarihi</p>
              <p className="text-slate-200 font-medium">{new Date(file.uploadDate).toLocaleString('tr-TR')}</p>
            </div>
             <div>
              <p className="text-sm text-slate-400">Dosya Türü</p>
              <p className="text-slate-200 font-medium">{file.type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Notlar</p>
              <p className="text-slate-200 whitespace-pre-wrap break-words bg-slate-900/50 p-3 rounded-md min-h-[6rem]">
                {file.note || <span className="text-slate-500">Henüz not yok.</span>}
              </p>
            </div>
        </div>
      </div>
    </div>
);


interface EditFileModalProps {
  file: GeminiFile;
  onClose: () => void;
  onSave: (file: GeminiFile) => void;
}

const EditFileModal: React.FC<EditFileModalProps> = ({ file, onClose, onSave }) => {
  const [name, setName] = useState(file.name);
  const [note, setNote] = useState(file.note);

  const handleSave = () => {
    onSave({ ...file, name, note });
  };

  return (
    <Modal onClose={onClose} title="Dosya Detaylarını Düzenle">
      <div className="space-y-4">
        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-slate-300 mb-1">Dosya Adı</label>
          <input
            id="fileName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-700/80 text-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="fileNote" className="block text-sm font-medium text-slate-300 mb-1">Notlar</label>
          <textarea
            id="fileNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className="w-full bg-slate-700/80 text-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
            placeholder="Bu dosya hakkında bir not ekleyin..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-md transition-colors">İptal</button>
          <button onClick={handleSave} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md transition-colors">Değişiklikleri Kaydet</button>
        </div>
      </div>
    </Modal>
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
    </div>
);

// --- Main App Component (Auth Router) ---
const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // For email/password, only set user if email is verified.
            // For Google Sign-In, email is verified by default.
            if (currentUser) {
                if (currentUser.providerData.some(p => p.providerId === 'password') && !currentUser.emailVerified) {
                    setUser(null);
                } else {
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return user ? <DriveApp user={user} /> : <AuthPage />;
};


export default App;