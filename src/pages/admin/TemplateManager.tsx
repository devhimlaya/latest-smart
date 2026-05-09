import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, Download, Trash2, Power, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

interface ExcelTemplate {
  id: string;
  formType: string;
  formName: string;
  description: string | null;
  filePath: string;
  fileName: string;
  fileSize: number;
  sheetName: string | null;
  placeholders: string[] | null;
  instructions: string | null;
  isActive: boolean;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

const FORM_TYPES = [
  {
    value: 'SF1_10_BUNDLE',
    label: 'SF1-SF10 Bundle (All-in-One Workbook)',
    description: 'Upload one workbook containing sheets for SF1 to SF10',
    isBundle: true
  },
  { value: 'SF1', label: 'SF1 - School Register (Student Master List)', description: 'Complete roster of all enrolled students' },
  { value: 'SF2', label: 'SF2 - Daily Attendance Record', description: 'Daily attendance tracking with P/A/L/E marks' },
  { value: 'SF3', label: 'SF3 - Individual Learner Monitoring', description: 'Track individual student progress' },
  { value: 'SF4', label: 'SF4 - Quarterly Assessment Report', description: 'Quarter exam results and assessments' },
  { value: 'SF5', label: 'SF5 - Promotion/Completion Report', description: 'End of year advancement report' },
  { value: 'SF6', label: 'SF6 - Learner Information System', description: 'Comprehensive learner data' },
  { value: 'SF7', label: 'SF7 - School Personnel Assignment List', description: 'Personnel assignments and profiles' },
  { value: 'SF8', label: 'SF8 - Report on Learning Progress and Achievement (JHS)', description: 'Quarterly report on student learning progress for junior high school' },
  { value: 'SF9', label: 'SF9 - Progress Report (JHS/SHS)', description: 'Report card for junior and senior high school students' },
  { value: 'SF10', label: 'SF10 - Learner\'s Permanent Record', description: 'Student transcript and permanent record' }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<ExcelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExcelTemplate | null>(null);
  
  // Upload form state
  const [uploadFormType, setUploadFormType] = useState('');
  const [uploadFormName, setUploadFormName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadInstructions, setUploadInstructions] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFormType || !uploadFormName || !uploadFile) {
      setUploadError('Please fill in all required fields and select a file');
      return;
    }

    // Check for existing templates
    const existingTemplates: string[] = [];
    if (uploadFormType === 'SF1_10_BUNDLE') {
      const bundleForms = ['SF1', 'SF2', 'SF3', 'SF4', 'SF5', 'SF6', 'SF7', 'SF8', 'SF9', 'SF10'];
      bundleForms.forEach(formType => {
        if (templates.some(t => t.formType === formType)) {
          existingTemplates.push(formType);
        }
      });
    } else {
      if (templates.some(t => t.formType === uploadFormType)) {
        existingTemplates.push(uploadFormType);
      }
    }

    if (existingTemplates.length > 0) {
      const confirmed = window.confirm(
        `WARNING: The following form template(s) already exist: ${existingTemplates.join(', ')}\n\n` +
        `Uploading will REPLACE the existing template(s).\n\n` +
        `Do you want to continue and overwrite?`
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('formName', uploadFormName);

      if (uploadFormType === 'SF1_10_BUNDLE') {
        formData.append('uploadMode', 'bundle');
        formData.append('formType', 'SF1_10_BUNDLE');
        formData.append('formTypes', JSON.stringify(['SF1', 'SF2', 'SF3', 'SF4', 'SF5', 'SF6', 'SF7', 'SF8', 'SF9', 'SF10']));
      } else {
        formData.append('uploadMode', 'single');
        formData.append('formType', uploadFormType);
      }

      if (uploadDescription) formData.append('description', uploadDescription);
      if (uploadInstructions) formData.append('instructions', uploadInstructions);

      const token = sessionStorage.getItem('token');
      const response = await axios.post(`${SERVER_URL}/api/templates/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess(response.data.message || 'Template uploaded successfully');
      
      // Refresh template list
      await fetchTemplates();
      
      // Reset form
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadFormType('');
        setUploadFormName('');
        setUploadDescription('');
        setUploadInstructions('');
        setUploadFile(null);
        setUploadSuccess('');
      }, 2000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || 'Failed to upload template';
      
      if (errorData?.missingForms && errorData?.availableSheets) {
        errorMessage += `\n\nCould not map: ${errorData.missingForms.join(', ')}`;
        errorMessage += `\n\nAvailable sheets in file: ${errorData.availableSheets.join(', ')}`;
        errorMessage += '\n\nPlease ensure your workbook has sheets named like "School Form 1 (SF1)", "SF2", etc.';
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (template: ExcelTemplate) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${SERVER_URL}/api/templates/${template.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTemplates();
    } catch (error: any) {
      console.error('Failed to toggle template:', error);
      alert(error.response?.data?.error || 'Failed to toggle template');
    }
  };

  const handleDelete = async (template: ExcelTemplate) => {
    if (!confirm(`Are you sure you want to delete the ${template.formName} template?`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${SERVER_URL}/api/templates/${template.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleDownload = async (template: ExcelTemplate) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/templates/${template.formType}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', template.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Failed to download template:', error);
      alert('Failed to download template');
    }
  };

  const showInfo = (template: ExcelTemplate) => {
    setSelectedTemplate(template);
    setInfoDialogOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Excel Template Manager</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage DepEd School Form templates (SF1-SF10)
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Template
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Template System Benefits</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Upload Excel templates with placeholders like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{SCHOOL_NAME}}'}</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{DATE}}'}</code></li>
              <li>• System automatically fills templates with real data when generating reports</li>
              <li>• Update forms without code changes - just upload new template!</li>
              <li>• Loop through data with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{#STUDENTS}} ... {{/STUDENTS}}'}</code></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Templates Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No templates uploaded yet</p>
                  <Button onClick={() => setUploadDialogOpen(true)} variant="link">
                    Upload your first template
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge variant="outline">{template.formType}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{template.formName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      {template.fileName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatFileSize(template.fileSize)}</TableCell>
                  <TableCell className="text-sm">{template.uploadedByName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(template.updatedAt)}
                  </TableCell>
                  <TableCell>
                    {template.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => showInfo(template)}
                        title="View Details"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(template)}
                        title="Download Template"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(template)}
                        title={template.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className={`w-4 h-4 ${template.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template)}
                        title="Delete Template"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Excel Template</DialogTitle>
            <DialogDescription>
              Upload a DepEd School Form template with placeholders for dynamic data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {uploadError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">Upload Failed</p>
                  <p className="text-sm whitespace-pre-line">{uploadError}</p>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-sm font-semibold">{uploadSuccess}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="formType" className="text-sm font-semibold">Form Type *</Label>
              <select
                id="formType"
                value={uploadFormType}
                onChange={(e) => {
                  setUploadFormType(e.target.value);
                  const selectedForm = FORM_TYPES.find((f) => f.value === e.target.value);
                  if (selectedForm && !uploadFormName) {
                    setUploadFormName(selectedForm.label);
                  } else if (selectedForm?.value === 'SF1_10_BUNDLE') {
                    setUploadFormName('School Forms 1-10 Bundle Template');
                  }
                }}
                className="w-full px-3 py-2.5 border rounded-md text-sm bg-white"
              >
                <option value="">Select a form type...</option>
                {FORM_TYPES.map((form) => (
                  <option key={form.value} value={form.value}>
                    {form.label}
                  </option>
                ))}
              </select>
              {uploadFormType && (
                <p className="text-sm text-muted-foreground">
                  {FORM_TYPES.find((f) => f.value === uploadFormType)?.description}
                </p>
              )}
              {uploadFormType === 'SF1_10_BUNDLE' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  The system will auto-map sheets to SF1-SF10 using sheet names (for example, "School Form 1 (SF1)").
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="formName" className="text-sm font-semibold">Template Name *</Label>
              <Input
                id="formName"
                value={uploadFormName}
                onChange={(e) => setUploadFormName(e.target.value)}
                placeholder="e.g., School Form 2 - Daily Attendance Record"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
              <Input
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of this template"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-sm font-semibold">Usage Instructions (Optional)</Label>
              <textarea
                id="instructions"
                value={uploadInstructions}
                onChange={(e) => setUploadInstructions(e.target.value)}
                placeholder="How to use this template and what data it expects"
                rows={4}
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-semibold">Excel File *</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Upload an Excel file (.xlsx or .xls).
                {uploadFormType === 'SF1_7_BUNDLE'
                  ? ' For all-in-one files, include separate sheets for SF1 to SF7.'
                  : ` Use placeholders like {{SCHOOL_NAME}}, {{DATE}}, etc.`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.formName}</DialogTitle>
            <DialogDescription>{selectedTemplate?.formType}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm mt-1">{selectedTemplate.description || 'No description provided'}</p>
              </div>

              <div>
                <Label className="text-sm font-semibold">File Information</Label>
                <div className="mt-1 text-sm space-y-1">
                  <p>• File: {selectedTemplate.fileName}</p>
                  <p>• Size: {formatFileSize(selectedTemplate.fileSize)}</p>
                  {selectedTemplate.sheetName && <p>• Sheet Mapping: {selectedTemplate.sheetName}</p>}
                  <p>• Uploaded by: {selectedTemplate.uploadedByName}</p>
                  <p>• Created: {formatDate(selectedTemplate.createdAt)}</p>
                  <p>• Last updated: {formatDate(selectedTemplate.updatedAt)}</p>
                </div>
              </div>

              {selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Available Placeholders</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.placeholders.map((placeholder) => (
                      <code key={placeholder} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {`{{${placeholder}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.instructions && (
                <div>
                  <Label className="text-sm font-semibold">Instructions</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTemplate.instructions}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
