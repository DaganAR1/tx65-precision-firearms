import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const TABLES_TO_BACKUP = ['products', 'orders', 'order_items', 'blog_posts', 'site_content', 'profiles'];

export default function AdminBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backupData: Record<string, any[]> = {};
      
      for (const table of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        backupData[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `65guns_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Database backup downloaded successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export database: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm('WARNING: This will overwrite existing data with the same IDs. Are you sure you want to proceed?');
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      const tables = Object.keys(backupData);
      setImportProgress({ current: 0, total: tables.length });

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const data = backupData[table];
        
        if (data && data.length > 0) {
          // Upsert data to handle existing records
          const { error } = await supabase.from(table).upsert(data);
          if (error) throw new Error(`Error importing table ${table}: ${error.message}`);
        }
        
        setImportProgress({ current: i + 1, total: tables.length });
      }

      toast.success('Database restored successfully');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to restore database: ' + error.message);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-brand-muted p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-primary text-white">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Database Backup & Restore</h1>
              <p className="text-gray-500 text-sm">Manage your website data snapshots and disaster recovery.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="bg-white p-10 border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-2">Export Data</h3>
              <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tighter">
                Download a complete snapshot of your website data (Products, Orders, Blogs, etc.) as a JSON file for safe keeping.
              </p>
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full btn-primary py-4 flex items-center justify-center space-x-3 group"
              >
                {isExporting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Download className="group-hover:-translate-y-1 transition-transform" size={20} />
                )}
                <span>Download JSON Backup</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white p-10 border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-2">Import Data</h3>
              <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tighter">
                Restore your website from a previously saved backup file. <span className="text-red-500 font-bold">Warning: This will overwrite current data.</span>
              </p>
            </div>
            
            <div className="mt-auto">
              <label className={cn(
                "w-full btn-primary py-4 flex items-center justify-center space-x-3 cursor-pointer transition-all",
                isImporting ? "opacity-50 cursor-not-allowed" : "hover:bg-black"
              )}>
                {isImporting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload className="group-hover:-translate-y-1 transition-transform" size={20} />
                )}
                <span>{isImporting ? `Restoring (${importProgress?.current}/${importProgress?.total})...` : 'Upload & Restore'}</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  disabled={isImporting}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Safety Measures Info */}
        <div className="mt-12 bg-brand-primary text-white p-8 border border-white/10">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-brand-accent text-white rounded-full">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Safety & Compliance Measures</h4>
              <ul className="text-[10px] uppercase tracking-widest text-gray-400 space-y-2 leading-relaxed">
                <li>• Automated Soft-Deletes: Records are marked as deleted rather than removed from the database.</li>
                <li>• Foreign Key Constraints: Critical data relationships are protected from accidental cascading deletions.</li>
                <li>• Row Level Security (RLS): Strict access control ensures only authorized administrators can perform destructive actions.</li>
                <li>• Audit Logging: All major database changes are tracked for accountability.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
