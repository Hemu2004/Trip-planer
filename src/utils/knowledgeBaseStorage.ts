import { KnowledgeBaseFile, KnowledgeFileStatus } from '../types';

const STORAGE_KEY = 'trip_planner_knowledge_base_files_v2';

export const DEFAULT_KNOWLEDGE_FILES: KnowledgeBaseFile[] = [
  {
    id: 'kb_doc_01',
    name: 'Kyoto_Local_Cultural_Etiquette_Guide.pdf',
    fileType: 'pdf',
    sizeBytes: 245760, // ~240 KB
    uploadedAt: '2026-09-15T10:30:00.000Z',
    status: 'Ready',
    statusMessage: 'Processed and vector indexed for Gemini RAG',
    contentSnippet:
      'Kyoto Temple Etiquette: Remove shoes when entering historic engawa verandas. Photography is prohibited inside Main Sanctuaries. Pre-booking is required for Saiho-ji (Moss Temple). Respect geiko and maiko in Gion—do not obstruct walking paths.',
    category: 'guidelines',
    tags: ['Japan', 'Kyoto', 'Etiquette', 'Culture'],
    uploadedBy: 'System Administrator',
    tokenEstimate: 620,
    lastProcessedAt: '2026-09-15T10:31:12.000Z',
  },
  {
    id: 'kb_doc_02',
    name: 'Amalfi_Coast_Ferry_Schedules_&_Bus_Routes.docx',
    fileType: 'docx',
    sizeBytes: 112640, // ~110 KB
    uploadedAt: '2026-09-16T14:15:00.000Z',
    status: 'Ready',
    statusMessage: 'Processed and vector indexed for Gemini RAG',
    contentSnippet:
      'High season hydrofoils connect Salerno, Amalfi, and Positano. SITA buses require pre-purchased tickets before boarding at tabaccherie. Recommend taking morning ferries from Salerno Piazza Concordia to avoid coastal road congestion.',
    category: 'destinations',
    tags: ['Italy', 'Amalfi', 'Transit', 'Ferries'],
    uploadedBy: 'System Administrator',
    tokenEstimate: 410,
    lastProcessedAt: '2026-09-16T14:16:05.000Z',
  },
  {
    id: 'kb_doc_03',
    name: 'Paris_Secret_Bistros_and_Hidden_Passages.txt',
    fileType: 'txt',
    sizeBytes: 18432, // ~18 KB
    uploadedAt: '2026-09-17T09:00:00.000Z',
    status: 'Ready',
    statusMessage: 'Processed and vector indexed for Gemini RAG',
    contentSnippet:
      'Passage des Panoramas: 2nd arrondissement historic covered arcade built in 1799. Bistro recommendations: Chez Georges (Rue du Mail), Le Petit Châtelet next to Shakespeare and Company. Tip: Most traditional bistros close Sunday evening.',
    category: 'tips',
    tags: ['France', 'Paris', 'Food', 'Passages'],
    uploadedBy: 'System Administrator',
    tokenEstimate: 195,
    lastProcessedAt: '2026-09-17T09:01:20.000Z',
  },
  {
    id: 'kb_doc_04',
    name: 'Travel_Insurance_Emergency_Assistance_Procedures.pdf',
    fileType: 'pdf',
    sizeBytes: 389120, // ~380 KB
    uploadedAt: '2026-09-17T18:40:00.000Z',
    status: 'Ready',
    statusMessage: 'Processed and vector indexed for Gemini RAG',
    contentSnippet:
      'Emergency medical evacuation contact hotline: +1-800-TRIP-SOS. Claims must retain itemized hospital receipts, official police reports for stolen valuables, and airline delayed baggage receipts with PIR (Property Irregularity Report) numbers.',
    category: 'policies',
    tags: ['Insurance', 'Safety', 'Emergency', 'Hotline'],
    uploadedBy: 'System Administrator',
    tokenEstimate: 850,
    lastProcessedAt: '2026-09-17T18:42:00.000Z',
  },
];

export function detectFileType(filename: string): KnowledgeBaseFile['fileType'] {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'doc':
      return 'doc';
    case 'docx':
      return 'docx';
    case 'txt':
      return 'txt';
    case 'md':
    case 'markdown':
      return 'md';
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    default:
      return 'other';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function loadKnowledgeFiles(): KnowledgeBaseFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE_FILES));
      return DEFAULT_KNOWLEDGE_FILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_KNOWLEDGE_FILES;
  } catch (err) {
    console.warn('Failed to parse knowledge base files from localStorage:', err);
    return DEFAULT_KNOWLEDGE_FILES;
  }
}

export function saveKnowledgeFiles(files: KnowledgeBaseFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Failed to save knowledge base files to localStorage:', err);
  }
}

export function deleteKnowledgeFile(id: string): KnowledgeBaseFile[] {
  const current = loadKnowledgeFiles();
  const updated = current.filter((f) => f.id !== id);
  saveKnowledgeFiles(updated);
  return updated;
}

export function addKnowledgeFile(file: KnowledgeBaseFile): KnowledgeBaseFile[] {
  const current = loadKnowledgeFiles();
  const updated = [file, ...current];
  saveKnowledgeFiles(updated);
  return updated;
}

export function updateKnowledgeFile(id: string, patch: Partial<KnowledgeBaseFile>): KnowledgeBaseFile[] {
  const current = loadKnowledgeFiles();
  const updated = current.map((f) => (f.id === id ? { ...f, ...patch } : f));
  saveKnowledgeFiles(updated);
  return updated;
}

export async function reprocessKnowledgeFile(id: string): Promise<KnowledgeBaseFile[]> {
  // Step 1: Mark file as Processing
  let updated = updateKnowledgeFile(id, {
    status: 'Processing',
    statusMessage: 'Re-extracting text, semantic chunking, and recalculating embeddings...',
  });

  // Step 2: Simulate parsing and indexing pipeline
  await new Promise((resolve) => setTimeout(resolve, 800));

  const target = updated.find((f) => f.id === id);
  if (!target) return updated;

  // Step 3: Complete processing with updated metadata
  updated = updateKnowledgeFile(id, {
    status: 'Ready',
    statusMessage: 'Successfully re-processed and vector indexed for RAG retrieval',
    lastProcessedAt: new Date().toISOString(),
    tokenEstimate: Math.max(80, Math.round(target.sizeBytes / 380)),
  });

  return updated;
}

export async function readFileSnippet(file: File): Promise<string> {
  const fileType = detectFileType(file.name);
  if (fileType === 'txt' || fileType === 'md' || fileType === 'json' || fileType === 'csv') {
    try {
      const text = await file.text();
      return text.slice(0, 500).trim();
    } catch {
      return `Text document (${formatFileSize(file.size)}) parsed and ready for tokenization and RAG chunking.`;
    }
  }

  return `${file.name} [${fileType.toUpperCase()}] document (${formatFileSize(
    file.size
  )}) parsed and vector embedded for Trip Planner RAG pipeline.`;
}
