import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileText, 
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/documents`;
    try {
      const docsRef = collection(db, path);
      const snap = await getDocs(docsRef);
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newDocName) return;

    const userId = auth.currentUser.uid;
    const path = `users/${userId}/documents`;
    try {
      await addDoc(collection(db, path), {
        userId,
        docName: newDocName,
        status: 'pending',
        timestamp: serverTimestamp(),
        fileUrl: selectedFile ? `mock-storage/${selectedFile.name}` : null,
        fileName: selectedFile ? selectedFile.name : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }

    setNewDocName('');
    setSelectedFile(null);
    setIsUploadModalOpen(false);
    fetchDocuments();
  };

  const handleFileChange = async (docId: string, file: File) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/documents`;
    
    try {
      await updateDoc(doc(db, path, docId), {
        status: 'pending',
        fileUrl: `mock-storage/${file.name}`,
        fileName: file.name,
        updatedAt: serverTimestamp()
      });
      fetchDocuments();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    await deleteDoc(doc(db, 'users', userId, 'documents', docId));
    fetchDocuments();
  };

  const toggleStatus = async (document: any) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const newStatus = document.status === 'verified' ? 'pending' : 'verified';
    await updateDoc(doc(db, 'users', userId, 'documents', document.id), {
      status: newStatus
    });
    fetchDocuments();
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-outline-variant" />)}
  </div>;

  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const progress = documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Document Checklist</h1>
          <p className="text-on-surface-variant mt-1">Manage and track your application documents.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={20} /> Add Document
        </button>
      </header>

      {/* Progress Bar */}
      <section className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-on-surface">Overall Completion</span>
          <span className="text-sm font-black text-primary">{progress}%</span>
        </div>
        <div className="w-full bg-surface h-3 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-primary h-full"
          />
        </div>
      </section>

      {/* Documents List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  doc.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">{doc.docName}</h4>
                  {doc.fileName && (
                    <p className="text-[10px] text-primary font-medium truncate max-w-[150px]">
                      {doc.fileName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {doc.status === 'verified' ? (
                      <CheckCircle2 size={14} className="text-green-600" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-600" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      doc.status === 'verified' ? 'text-green-600' : 'text-rose-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.status !== 'verified' && (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(doc.id, file);
                      }}
                    />
                    <button 
                      className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                      title="Upload Document"
                    >
                      <Upload size={20} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => toggleStatus(doc)}
                  className={`p-2 rounded-lg transition-all ${
                    doc.status === 'verified' ? 'text-green-600 hover:bg-green-50' : 'text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Toggle Status (Mock Verification)"
                >
                  <CheckCircle2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {documents.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-outline-variant text-center">
            <FileText size={48} className="mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-on-surface-variant font-medium">No documents added yet.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-outline-variant w-full max-w-md relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-on-surface">Add New Document</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Document Name</label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. Income Certificate"
                  />
                </div>
                <div className="relative border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center hover:border-primary transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Upload size={32} className="mx-auto text-on-surface-variant/30 mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-on-surface-variant font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select or drag & drop'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-widest">PDF, JPG, PNG (Max 5MB)</p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-sm"
                >
                  Add & Upload
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Documents;
