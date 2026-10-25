import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDataManagement } from '../hooks/useDataManagement';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportCsvDialog: React.FC<ImportCsvDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { importCsv, isImportingCsv } = useDataManagement(user?.id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload a valid .csv file.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importCsv(selectedFile);
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${result.length} transactions.`,
      });
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Could not parse or import the CSV file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Upload className="h-5 w-5" />
            </div>
            <DialogTitle>Import Transactions</DialogTitle>
          </div>
          <DialogDescription>
            Upload a CSV file containing your past financial transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#D2ECD0] hover:border-[#529E42] bg-[#F9FBF8] rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span className="font-medium text-sm text-[#1A221C]">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-[#1A221C]">
                  Click to select CSV file
                </div>
                <div className="text-xs text-muted-foreground">
                  Supported format: comma-separated (.csv)
                </div>
              </div>
            )}
          </div>

          {/* Format hints */}
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-primary" /> Required Columns:
            </div>
            <p>
              Your CSV should include headers for <span className="font-mono text-foreground">description</span> and <span className="font-mono text-foreground">amount</span>. Optional: <span className="font-mono text-foreground">date</span> and <span className="font-mono text-foreground">type</span> (income/expense).
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImportingCsv}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isImportingCsv}
            className="bg-[#529E42] hover:bg-[#438235] text-white"
          >
            {isImportingCsv ? 'Importing...' : 'Upload & Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
