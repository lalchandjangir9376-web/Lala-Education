import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DB_FILE = path.resolve(process.cwd(), 'server-data.json');

// Ensure Uploads Directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const VIDEOS_UPLOAD_DIR = path.resolve(UPLOADS_DIR, 'videos');
const MATERIALS_UPLOAD_DIR = path.resolve(UPLOADS_DIR, 'materials');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_UPLOAD_DIR)) fs.mkdirSync(VIDEOS_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(MATERIALS_UPLOAD_DIR)) fs.mkdirSync(MATERIALS_UPLOAD_DIR, { recursive: true });

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer storage for Videos (100MB limit)
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, VIDEOS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for direct video upload
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-matroska',
      'video/x-msvideo',
    ];
    if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(mp4|webm|mov|mkv|avi|ogv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('अमान्य वीडियो प्रारूप! केवल MP4, WebM, MOV या MKV वीडियो फ़ाइलें समर्थित हैं।'));
    }
  },
});

// Configure Multer storage for Materials / PDFs (25MB limit)
const materialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MATERIALS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.match(/\.(pdf|txt|docx?)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('केवल PDF या दस्तावेज़ फ़ाइलें समर्थित हैं।'));
    }
  },
});

// Helper to robustly extract YouTube 11-char ID from any URL format
function extractYouTubeIdServer(input: string | undefined | null): string | null {
  if (!input) return null;
  const str = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const patterns: RegExp[] = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Helper to normalize any YouTube URL format (watch, shorts, embed, youtu.be, mobile)
function normalizeYouTubeUrl(rawUrl: string): { embedUrl: string; thumbnailUrl: string; videoId?: string } {
  if (!rawUrl) {
    return {
      embedUrl: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    };
  }
  const videoId = extractYouTubeIdServer(rawUrl);
  if (videoId) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId,
    };
  }
  return {
    embedUrl: rawUrl,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
  };
}

// Initialize Gemini API client securely on server
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.warn('Gemini client initialization notice:', e);
  }
}

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Admin Security Configurations
const ADMIN_EMAIL = 'lalajikhatilalaji@gmail.com';
const ADMIN_USERNAME = 'admin_lala';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Lal@123';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_lala_education_salt').digest('hex');
}

// Database Schema Interfaces
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'student' | 'admin';
  classGrade: '9' | '10' | '11' | '12';
  board: 'RBSE' | 'CBSE';
  preferredLanguage: 'hi' | 'en';
  coins: number;
  welcomeBonusGiven: boolean;
  unlockedMaterials: string[];
  unlockedTests: string[];
  completedVideos: string[];
  createdAt: string;
}

interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'welcome_bonus' | 'video_reward' | 'test_unlock' | 'pdf_unlock' | 'admin_adjustment';
  description: string;
  timestamp: string;
}

interface StudyMaterial {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  classGrade: '9' | '10' | '11' | '12';
  subject: string;
  subjectHi: string;
  chapter: string;
  language: 'hi' | 'en' | 'bilingual';
  coinPrice: number;
  fileUrl: string; // URL or Data URL
  pageCount: number;
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'published';
  bodyContent?: string;
  fileType?: 'pdf' | 'rich_notes';
  contentSummary?: string;
  contentSummaryHi?: string;
}

interface EducationalVideo {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  classGrade: '9' | '10' | '11' | '12';
  subject: string;
  subjectHi: string;
  chapter?: string;
  videoUrl: string; // YouTube embed or direct video
  sourceType?: 'youtube' | 'direct_upload';
  videoFileName?: string;
  fileSizeMb?: number;
  thumbnailUrl: string;
  duration: string;
  coinReward: number;
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'published';
}

interface TestQuestion {
  id: string;
  question: string;
  questionHi: string;
  options: string[];
  optionsHi: string[];
  correctAnswer: number; // 0-indexed, hidden from student before submission!
  explanation: string;
  explanationHi: string;
  marks: number;
}

interface OnlineTest {
  id: string;
  title: string;
  titleHi: string;
  classGrade: '9' | '10' | '11' | '12';
  subject: string;
  subjectHi: string;
  durationMinutes: number;
  totalMarks: number;
  coinPrice: number;
  questions: TestQuestion[];
  createdAt: string;
}

interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  answers: { [questionId: string]: number };
  submittedAt: string;
}

interface Announcement {
  id: string;
  title: string;
  titleHi: string;
  content: string;
  contentHi: string;
  category: 'exam' | 'notice' | 'scholarship' | 'materials';
  date: string;
  isImportant?: boolean;
}

interface DatabaseSchema {
  users: User[];
  transactions: CoinTransaction[];
  materials: StudyMaterial[];
  videos: EducationalVideo[];
  tests: OnlineTest[];
  attempts: TestAttempt[];
  announcements: Announcement[];
  sessions?: Record<string, string>;
}

// Initial Seed Data tailored for Rajasthan Students (RBSE & CBSE)
const initialData: DatabaseSchema = {
  users: [
    {
      id: 'admin_lala_default',
      name: 'लालाजी खाती (व्यवस्थापक / Admin)',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      classGrade: '12',
      board: 'RBSE',
      preferredLanguage: 'hi',
      coins: 1000,
      welcomeBonusGiven: true,
      unlockedMaterials: [],
      unlockedTests: [],
      completedVideos: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_demo_1',
      name: 'राहुल शर्मा (Rahul Sharma)',
      username: 'rahul_rbse',
      email: 'rahul@student.lala.edu',
      passwordHash: hashPassword('student123'),
      role: 'student',
      classGrade: '10',
      board: 'RBSE',
      preferredLanguage: 'hi',
      coins: 150,
      welcomeBonusGiven: true,
      unlockedMaterials: [],
      unlockedTests: [],
      completedVideos: ['vid_science_1'],
      createdAt: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 'tx_init_1',
      userId: 'student_demo_1',
      amount: 100,
      type: 'welcome_bonus',
      description: 'स्वागत कॉइन बोनस (Registration Welcome Bonus)',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'tx_init_2',
      userId: 'student_demo_1',
      amount: 50,
      type: 'video_reward',
      description: 'वीडियो कक्षा पूर्ण करने पर इनाम (Science Ch-1 Video Reward)',
      timestamp: new Date().toISOString(),
    },
  ],
  materials: [
    {
      id: 'mat_rbse10_sci_1',
      title: 'Chemical Reactions and Equations - Complete Revision Notes',
      titleHi: 'रासायनिक अभिक्रियाएँ एवं समीकरण - सम्पूर्ण हस्तलिखित नोट्स',
      description: 'RBSE Class 10 Science Chapter 1 detailed handwritten notes with formulas and chemical equations.',
      descriptionHi: 'आरबीएसई कक्षा 10 विज्ञान अध्याय 1 के संपूर्ण हस्तलिखित नोट्स, संतुलित समीकरण और महत्वपूर्ण परीक्षा प्रश्न।',
      classGrade: '10',
      subject: 'Science',
      subjectHi: 'विज्ञान',
      chapter: 'अध्याय 1: रासायनिक अभिक्रियाएँ',
      language: 'hi',
      coinPrice: 0,
      fileUrl: 'https://example.com/rbse10-science-ch1.pdf',
      pageCount: 14,
      createdAt: '2026-10-15T10:00:00.000Z',
      contentSummary: 'Complete coverage of Types of Reactions (Combination, Decomposition, Displacement, Redox), Rancidity, and Corrosion with RBSE board tips.',
      contentSummaryHi: 'संयोजन, वियोजन, विस्थापन एवं रेडॉक्स अभिक्रियाएँ, विकृतगंधिता व संक्षारण का विस्तृत अध्ययन बोर्ड परीक्षा उपयोगी उदाहरणों सहित।',
    },
    {
      id: 'mat_rbse10_math_1',
      title: 'Real Numbers & Polynomials - Formula Sheet & Solved Examples',
      titleHi: 'वास्तविक संख्याएँ एवं बहुपद - सूत्र बैंक और हल सहित उदाहरण',
      description: 'RBSE Class 10 Mathematics Chapter 1 and 2 quick revision formulas and board questions.',
      descriptionHi: 'आरबीएसई कक्षा 10 गणित के अध्याय 1 एवं 2 के सभी महत्वपूर्ण सूत्र, यूक्लिड विभाजन प्रमेयिका व बहुपद के शून्यक।',
      classGrade: '10',
      subject: 'Mathematics',
      subjectHi: 'गणित',
      chapter: 'अध्याय 1 व 2: वास्तविक संख्याएँ',
      language: 'hi',
      coinPrice: 20,
      fileUrl: 'https://example.com/rbse10-math-formulas.pdf',
      pageCount: 18,
      createdAt: '2026-10-18T10:00:00.000Z',
      contentSummary: 'Euclid division lemma, Fundamental theorem of arithmetic, irrationality proofs, zeroes of polynomials.',
      contentSummaryHi: 'अपरिमेय संख्या सिद्ध करने की विधियाँ, अभाज्य गुणनखंड, बहुपदों के शून्यक एवं गुणांकों में संबंध।',
    },
    {
      id: 'mat_rbse12_phy_1',
      title: 'Electric Charges and Fields - Derivations & Board Notes',
      titleHi: 'विद्युत आवेश तथा क्षेत्र - महत्वपूर्ण व्युत्पत्ति एवं नोट्स',
      description: 'Complete notes for Class 12 Physics Chapter 1 covering Gauss Law and Dipole derivations.',
      descriptionHi: 'कक्षा 12 भौतिक विज्ञान अध्याय 1 के गॉस के नियम, विद्युत द्विध्रुव व कूलॉम नियम की महत्वपूर्ण व्युत्पत्तियाँ।',
      classGrade: '12',
      subject: 'Physics',
      subjectHi: 'भौतिक विज्ञान',
      chapter: 'अध्याय 1: विद्युत आवेश एवं क्षेत्र',
      language: 'hi',
      coinPrice: 30,
      fileUrl: 'https://example.com/rbse12-physics-notes.pdf',
      pageCount: 24,
      createdAt: '2026-10-20T10:00:00.000Z',
      contentSummary: 'Coulombs law, electric field lines, electric dipole in uniform field, Gauss law applications with diagrams.',
      contentSummaryHi: 'कूलॉम नियम, विद्युत क्षेत्र रेखाएँ, एकसमान क्षेत्र में द्विध्रुव पर बल आघूर्ण, गॉस के नियम के अनुप्रयोग।',
    },
    {
      id: 'mat_rbse12_chem_1',
      title: 'Solutions (विलयन) - Numerical Problems & Theory Notes',
      titleHi: 'विलयन (Solutions) - आंकिक प्रश्न संग्रह एवं थ्योरी नोट्स',
      description: 'NCERT & RBSE Class 12 Chemistry Chapter 2 notes with Henry Law and Colligative properties formulas.',
      descriptionHi: 'कक्षा 12 रसायन विज्ञान अध्याय 2 हेनरी नियम, राउल्ट नियम एवं अणुसंख्य गुणधर्म के आंकिक प्रश्नों सहित।',
      classGrade: '12',
      subject: 'Chemistry',
      subjectHi: 'रसायन विज्ञान',
      chapter: 'अध्याय 2: विलयन',
      language: 'hi',
      coinPrice: 0,
      fileUrl: 'https://example.com/rbse12-chemistry-solutions.pdf',
      pageCount: 16,
      createdAt: '2026-10-22T10:00:00.000Z',
      contentSummary: 'Molarity, Molality, Raoult law, osmotic pressure, Van t Hoff factor with solved numerical problems.',
      contentSummaryHi: 'मोलरता, मोललता, मोल अंश, राउल्ट का नियम, क्वथनांक उन्नयन व वांट हॉफ गुणांक।',
    },
    {
      id: 'mat_rbse9_ss_1',
      title: 'Rajasthan History and Culture (राजस्थान का इतिहास एवं संस्कृति)',
      titleHi: 'राजस्थान का इतिहास, कला एवं संस्कृति - संक्षिप्त नोट्स',
      description: 'RBSE Class 9 Social Science special Rajasthan section with forts, fairs and freedom struggle.',
      descriptionHi: 'आरबीएसई कक्षा 9 सामाजिक विज्ञान राजस्थान के प्रमुख दुर्ग, लोक देवता, मेले एवं 1857 की क्रांति।',
      classGrade: '9',
      subject: 'Social Science',
      subjectHi: 'सामाजिक विज्ञान',
      chapter: 'अध्याय 1: राजस्थान के ऐतिहासिक स्रोत',
      language: 'hi',
      coinPrice: 0,
      fileUrl: 'https://example.com/rbse9-rajasthan-heritage.pdf',
      pageCount: 12,
      createdAt: '2026-10-24T10:00:00.000Z',
      contentSummary: 'Rajasthan forts (Chittorgarh, Mehrangarh, Kumbhalgarh), Folk deities, festivals, and culture.',
      contentSummaryHi: 'राजस्थान के प्रसिद्ध किले, लोक देवता (रामदेवजी, तेजाजी, पाबूजी), तीज-त्यौहार एवं ऐतिहासिक स्रोत।',
    },
    {
      id: 'mat_rbse11_bio_1',
      title: 'Cell: The Unit of Life - Diagrammatic Revision Notes',
      titleHi: 'कोशिका: जीवन की इकाई - सचित्र अध्ययन नोट्स',
      description: 'Class 11 Biology Chapter 8 Cell Structure and Organelles with labeled diagrams.',
      descriptionHi: 'कक्षा 11 जीव विज्ञान अध्याय 8 प्रोकैरियोटिक व यूकैरियोटिक कोशिका एवं कोशिकांगों का सचित्र वर्णन।',
      classGrade: '11',
      subject: 'Biology',
      subjectHi: 'जीव विज्ञान',
      chapter: 'अध्याय 8: कोशिका संरचना',
      language: 'hi',
      coinPrice: 25,
      fileUrl: 'https://example.com/rbse11-biology-cell.pdf',
      pageCount: 20,
      createdAt: '2026-10-25T10:00:00.000Z',
      contentSummary: 'Prokaryotic vs Eukaryotic cells, Mitochondria, Chloroplast, Nucleus structure and functions.',
      contentSummaryHi: 'कोशिका सिद्धांत, माइटोकॉन्ड्रिया, हरित लवक, केंद्रक संरचना व कार्य।',
    },
  ],
  videos: [
    {
      id: 'vid_science_1',
      title: 'Class 10 Science Ch-1: Chemical Reactions in One Shot (RBSE/CBSE)',
      titleHi: 'कक्षा 10 विज्ञान अ-1: रासायनिक अभिक्रियाएँ एवं समीकरण (एक ही वीडियो में सम्पूर्ण पाठ)',
      description: 'Comprehensive lecture explaining all reactions with practical experiment animations.',
      descriptionHi: 'राजस्थान बोर्ड कक्षा 10 विज्ञान का पहला पाठ आसान हिन्दी में समझें। पूरा पाठ देखकर 50 कॉइन्स प्राप्त करें।',
      classGrade: '10',
      subject: 'Science',
      subjectHi: 'विज्ञान',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Clean embed player
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
      duration: '42:15',
      coinReward: 50,
      createdAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'vid_math_1',
      title: 'Class 10 Maths: Trigonometry (त्रिकोणमिति का परिचय) - Easy Tricks',
      titleHi: 'कक्षा 10 गणित: त्रिकोणमिति का परिचय - सूत्र याद करने की आसान ट्रिक',
      description: 'Master trigonometric ratios, identities and board questions with Lalaji easy methods.',
      descriptionHi: 'त्रिकोणमितीय अनुपातों की सारणी, सर्वसमिकाएँ और सिद्ध करने वाले प्रश्नों के आसान हल।',
      classGrade: '10',
      subject: 'Mathematics',
      subjectHi: 'गणित',
      videoUrl: 'https://www.youtube.com/embed/L_LUpnjgPso',
      thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      duration: '38:40',
      coinReward: 50,
      createdAt: '2026-10-12T10:00:00.000Z',
    },
    {
      id: 'vid_physics_1',
      title: 'Class 12 Physics: Electrostatics Top 5 Derivations for Board Exams',
      titleHi: 'कक्षा 12 भौतिक विज्ञान: स्थिर वैद्युतिकी के शीर्ष 5 बोर्ड व्युत्पत्ति (Derivations)',
      description: 'Gauss Law, Electric dipole axial and equatorial fields step by step derivation for 5-mark board questions.',
      descriptionHi: 'बोर्ड परीक्षा में 5 अंक पक्के करने वाले गॉस प्रमेय एवं अक्षीय-निरक्षीय विद्युत क्षेत्र के व्युत्पत्ति।',
      classGrade: '12',
      subject: 'Physics',
      subjectHi: 'भौतिक विज्ञान',
      videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80',
      duration: '51:10',
      coinReward: 50,
      createdAt: '2026-10-16T10:00:00.000Z',
    },
    {
      id: 'vid_rajasthan_1',
      title: 'Rajasthan GK & History: Forts of Rajasthan for Class 9 & 10 Students',
      titleHi: 'राजस्थान की कला एवं संस्कृति: चित्तौड़गढ़, कुंभलगढ़ और मेहरानगढ़ दुर्ग दर्शन',
      description: 'Visual study of world heritage hill forts of Rajasthan with historical facts and exam points.',
      descriptionHi: 'राजस्थान के 6 प्रमुख पहाड़ी दुर्गों का सचित्र इतिहास और बोर्ड परीक्षा में पूछे जाने वाले तथ्य।',
      classGrade: '9',
      subject: 'Social Science',
      subjectHi: 'सामाजिक विज्ञान',
      videoUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
      duration: '29:50',
      coinReward: 50,
      createdAt: '2026-10-21T10:00:00.000Z',
    },
  ],
  tests: [
    {
      id: 'test_rbse10_sci_mock',
      title: 'RBSE Class 10 Science - Model Paper Mock Test (अध्याय 1 से 3)',
      titleHi: 'आरबीएसई कक्षा 10 विज्ञान - मॉडल पेपर मॉक टेस्ट (अध्याय 1 से 3)',
      classGrade: '10',
      subject: 'Science',
      subjectHi: 'विज्ञान',
      durationMinutes: 15,
      totalMarks: 20,
      coinPrice: 0,
      createdAt: '2026-10-19T10:00:00.000Z',
      questions: [
        {
          id: 'q1',
          question: 'What is the chemical formula of quick lime?',
          questionHi: 'बिना बुझे चूने (क्विक लाइम) का रासायनिक सूत्र क्या है?',
          options: ['CaCO3', 'CaO', 'Ca(OH)2', 'CaCl2'],
          optionsHi: ['CaCO3 (कैल्शियम कार्बोनेट)', 'CaO (कैल्शियम ऑक्साइड)', 'Ca(OH)2 (बुझा हुआ चूना)', 'CaCl2'],
          correctAnswer: 1,
          explanation: 'CaO is Calcium Oxide, commonly known as quicklime.',
          explanationHi: 'CaO को कैल्शियम ऑक्साइड या बिना बुझा चूना कहते हैं। जल से क्रिया पर यह Ca(OH)2 बनाता है।',
          marks: 4,
        },
        {
          id: 'q2',
          question: 'Which gas is released when dilute hydrochloric acid is added to zinc granules?',
          questionHi: 'दानेदार जस्ते पर तनु हाइड्रोक्लोरिक अम्ल डालने पर कौन-सी गैस उत्सर्जित होती है?',
          options: ['Oxygen', 'Hydrogen', 'Chlorine', 'Carbon Dioxide'],
          optionsHi: ['ऑक्सीजन गैस', 'हाइड्रोजन गैस (H2)', 'क्लोरीन गैस', 'कार्बन डाइऑक्साइड'],
          correctAnswer: 1,
          explanation: 'Zn + 2HCl -> ZnCl2 + H2 (Hydrogen gas burns with pop sound).',
          explanationHi: 'Zn + 2HCl → ZnCl2 + H2↑ (हाइड्रोजन गैस फट-फट ध्वनि के साथ जलती है)।',
          marks: 4,
        },
        {
          id: 'q3',
          question: 'What is the pH value of pure water at 25°C?',
          questionHi: 'शुद्ध जल का 25°C पर pH मान कितना होता है?',
          options: ['0', '7', '14', '1'],
          optionsHi: ['0 (शून्य)', '7 (उदासीन)', '14 (क्षारीय)', '1 (अम्लीय)'],
          correctAnswer: 1,
          explanation: 'Pure water is neutral with a pH of 7.',
          explanationHi: 'शुद्ध जल उदासीन होता है, इसलिए इसका pH मान 7 होता है।',
          marks: 4,
        },
        {
          id: 'q4',
          question: 'Which acid is found in curd and sour milk?',
          questionHi: 'दही तथा खट्टे दूध में कौन-सा प्राकृतिक अम्ल उपस्थित होता है?',
          options: ['Acetic acid', 'Citric acid', 'Lactic acid', 'Tartaric acid'],
          optionsHi: ['एसिटिक अम्ल', 'साइट्रिक अम्ल', 'लैक्टिक अम्ल', 'टार्टरिक अम्ल'],
          correctAnswer: 2,
          explanation: 'Curd contains lactic acid produced by Lactobacillus bacteria.',
          explanationHi: 'दही में लैक्टोबैसिलस जीवाणु द्वारा लैक्टिक अम्ल उत्पन्न होता है।',
          marks: 4,
        },
        {
          id: 'q5',
          question: 'What type of reaction is respiration?',
          questionHi: 'श्वसन किस प्रकार की रासायनिक अभिक्रिया है?',
          options: ['Endothermic', 'Exothermic', 'Decomposition', 'Reduction'],
          optionsHi: ['ऊष्माशोषी अभिक्रिया', 'ऊष्माक्षेपी अभिक्रिया (Exothermic)', 'अपघटन अभिक्रिया', 'अपचयन'],
          correctAnswer: 1,
          explanation: 'Respiration releases energy as ATP, making it an exothermic reaction.',
          explanationHi: 'श्वसन में ग्लूकोज के ऑक्सीकरण से ऊर्जा मुक्त होती है, अतः यह एक ऊष्माक्षेपी अभिक्रिया है।',
          marks: 4,
        },
      ],
    },
    {
      id: 'test_rbse12_phy_mock',
      title: 'Class 12 Physics - Electrostatics & Current Electricity Test',
      titleHi: 'कक्षा 12 भौतिक विज्ञान - स्थिर वैद्युतिकी एवं धारा विद्युत टेस्ट',
      classGrade: '12',
      subject: 'Physics',
      subjectHi: 'भौतिक विज्ञान',
      durationMinutes: 20,
      totalMarks: 20,
      coinPrice: 30, // Unlocked with coins
      createdAt: '2026-10-21T10:00:00.000Z',
      questions: [
        {
          id: 'qp1',
          question: 'What is the SI unit of electric flux?',
          questionHi: 'विद्युत फ्लक्स का SI मात्रक क्या है?',
          options: ['Volt / meter', 'Volt × meter', 'Newton / Coulomb', 'Weber'],
          optionsHi: ['वोल्ट / मीटर', 'वोल्ट × मीटर (V·m)', 'न्यूटन / कूलॉम', 'वेबर'],
          correctAnswer: 1,
          explanation: 'Electric flux = E * A = (V/m) * m^2 = Volt-meter.',
          explanationHi: 'विद्युत फ्लक्स Φ = E·A = (V/m) × m² = वोल्ट-मीटर होता है।',
          marks: 5,
        },
        {
          id: 'qp2',
          question: 'What is the dimensional formula of capacitance (धारिता)?',
          questionHi: 'विद्युत धारिता (Capacitance) का विमीय सूत्र क्या है?',
          options: ['[M^-1 L^-2 T^4 A^2]', '[M^1 L^2 T^-3 A^-1]', '[M^1 L^2 T^4 A^2]', '[M^-1 L^-1 T^2 A^1]'],
          optionsHi: ['[M⁻¹ L⁻² T⁴ A²]', '[M¹ L² T⁻³ A⁻¹]', '[M¹ L² T⁴ A²]', '[M⁻¹ L⁻¹ T² A¹]'],
          correctAnswer: 0,
          explanation: 'C = Q / V, leading to [M^-1 L^-2 T^4 A^2].',
          explanationHi: 'C = Q / V, जहाँ V = W / Q, हल करने पर विमीय सूत्र [M⁻¹ L⁻² T⁴ A²] प्राप्त होता है।',
          marks: 5,
        },
        {
          id: 'qp3',
          question: 'Which conservation law is Kirchhoff’s First Law (Junction Rule) based on?',
          questionHi: 'किरचॉफ का प्रथम नियम (संधि नियम) किस संरक्षण नियम पर आधारित है?',
          options: ['Conservation of Energy', 'Conservation of Charge', 'Conservation of Momentum', 'Conservation of Mass'],
          optionsHi: ['ऊर्जा संरक्षण', 'आवेश संरक्षण (Conservation of Charge)', 'संवेग संरक्षण', 'द्रव्यमान संरक्षण'],
          correctAnswer: 1,
          explanation: 'Kirchhoff’s junction law is based on charge conservation.',
          explanationHi: 'संधि पर आने वाली और जाने वाली धाराओं का योग शून्य होता है, जो आवेश संरक्षण पर आधारित है।',
          marks: 5,
        },
        {
          id: 'qp4',
          question: 'If the radius of a wire is halved, what happens to its resistance?',
          questionHi: 'यदि किसी चालक तार की त्रिज्या आधी कर दी जाए, तो उसका प्रतिरोध कितना हो जाएगा?',
          options: ['Halved', 'Doubled', '4 times', '16 times'],
          optionsHi: ['आधा हो जाएगा', 'दोगुना हो जाएगा', '4 गुना हो जाएगा', '16 गुना हो जाएगा (16 times)'],
          correctAnswer: 3,
          explanation: 'R is inversely proportional to Area = pi * r^2. If r becomes r/2, Area becomes 1/4, so R becomes 16x when stretched.',
          explanationHi: 'तार खींचने पर आयतन नियत रहता है, r आधी होने पर क्षेत्रफल 1/4 और लम्बाई 4 गुना होगी, जिससे R 16 गुना हो जाता है।',
          marks: 5,
        },
      ],
    },
  ],
  attempts: [],
  announcements: [
    {
      id: 'ann_1',
      title: 'RBSE Board Exam 2027 Schedule & Model Papers Released',
      titleHi: 'आरबीएसई बोर्ड परीक्षा 2027 समय-सारणी एवं आधिकारिक मॉडल पेपर्स जारी',
      content: 'Rajasthan Board of Secondary Education (Ajmer) has released the model question papers for Classes 10 and 12. Students can practice online tests in this app to evaluate their preparation.',
      contentHi: 'माध्यमिक शिक्षा बोर्ड राजस्थान (अजमेर) द्वारा कक्षा 10वीं और 12वीं के मॉडल पेपर्स जारी कर दिए गए हैं। विद्यार्थी अपनी तैयारी के लिए ऐप के टेस्ट सेक्शन में मॉक टेस्ट जरूर दें।',
      category: 'exam',
      date: '2026-10-26',
      isImportant: true,
    },
    {
      id: 'ann_2',
      title: 'Free Rajasthan Handwritten Notes Drive by Lala Education',
      titleHi: 'लाला एजुकेशन द्वारा राजस्थान के विद्यार्थियों को निःशुल्क हस्तलिखित नोट्स वितरण',
      content: 'All class 9, 10, 11, and 12 students can download curated notes. Earn 50 coins by watching video lectures and use coins to unlock premium question banks.',
      contentHi: 'राजस्थान के सभी विद्यार्थियों के लिए उच्च गुणवत्ता वाले नोट्स उपलब्ध हैं। वीडियो देखकर 50 कॉइन्स प्राप्त करें और स्पेशल टेस्ट सीरीज अनलॉक करें।',
      category: 'materials',
      date: '2026-10-24',
      isImportant: true,
    },
    {
      id: 'ann_3',
      title: 'Rajasthan Post-Matric Scholarship Portal Now Active',
      titleHi: 'राजस्थान उत्तर मैट्रिक छात्रवृत्ति योजना आवेदन पोर्टल प्रारंभ',
      content: 'Eligible SC/ST/OBC/EWS students can apply for post-matric scholarships. Keep your Jan Aadhaar and Marksheet ready.',
      contentHi: 'कक्षा 11 व 12 के पात्र विद्यार्थी जन आधार कार्ड एवं पिछली कक्षा की अंकतालिका के साथ छात्रवृत्ति पोर्टल पर आवेदन कर सकते हैं।',
      category: 'scholarship',
      date: '2026-10-20',
      isImportant: false,
    },
  ],
};

// Admin Account Synchronization Helper
function syncAdminAccount(db: DatabaseSchema) {
  const expectedHash = hashPassword(ADMIN_PASSWORD);
  let admin = db.users.find(
    (u) =>
      u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      u.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()
  );
  let changed = false;

  if (admin) {
    if (admin.passwordHash !== expectedHash) {
      admin.passwordHash = expectedHash;
      changed = true;
    }
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      changed = true;
    }
  } else {
    admin = {
      id: 'admin_lala_default',
      name: 'लालाजी खाती (व्यवस्थापक / Admin)',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash: expectedHash,
      role: 'admin',
      classGrade: '12',
      board: 'RBSE',
      preferredLanguage: 'hi',
      coins: 1000,
      welcomeBonusGiven: true,
      unlockedMaterials: [],
      unlockedTests: [],
      completedVideos: [],
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(admin);
    changed = true;
  }

  if (changed) {
    writeDb(db);
  }
}

// Sanitize video records in database to ensure proper embed format and thumbnails
function sanitizeDatabaseVideos(db: DatabaseSchema) {
  let changed = false;
  if (Array.isArray(db.videos)) {
    for (const v of db.videos) {
      if (v.sourceType === 'youtube' || v.videoUrl.includes('youtube') || v.videoUrl.includes('youtu.be')) {
        const id = extractYouTubeIdServer(v.videoUrl);
        if (id) {
          const properEmbed = `https://www.youtube-nocookie.com/embed/${id}`;
          if (v.videoUrl !== properEmbed) {
            v.videoUrl = properEmbed;
            changed = true;
          }
          if (!v.thumbnailUrl || v.thumbnailUrl.includes('unsplash')) {
            v.thumbnailUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            changed = true;
          }
        }
      }
    }
  }
  if (changed) {
    writeDb(db);
  }
}

// Read database
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialData);
      syncAdminAccount(initialData);
      sanitizeDatabaseVideos(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: DatabaseSchema = JSON.parse(raw);
    syncAdminAccount(parsed);
    sanitizeDatabaseVideos(parsed);
    return parsed;
  } catch (e) {
    console.error('Error reading DB, using initial data:', e);
    return initialData;
  }
}

// Write database atomically
function writeDb(data: DatabaseSchema) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

// Token sessions with disk persistence
const activeSessions = new Map<string, string>(); // token -> userId

function getUserIdFromToken(token: string, db: DatabaseSchema): string | undefined {
  return activeSessions.get(token) || db.sessions?.[token];
}

function saveSession(token: string, userId: string, db: DatabaseSchema) {
  activeSessions.set(token, userId);
  if (!db.sessions) db.sessions = {};
  db.sessions[token] = userId;
  writeDb(db);
}

function removeSession(token: string, db: DatabaseSchema) {
  activeSessions.delete(token);
  if (db.sessions && db.sessions[token]) {
    delete db.sessions[token];
    writeDb(db);
  }
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Login required' });
  }
  const token = authHeader.split(' ')[1];
  const db = readDb();
  const userId = getUserIdFromToken(token, db);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

function optionalAuthToken(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const db = readDb();
    const userId = getUserIdFromToken(token, db);
    if (userId) {
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        (req as any).user = user;
        (req as any).token = token;
      }
    }
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user: User = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, username, email, phone, password, classGrade, board, preferredLanguage } = req.body;

  if (!name || !username || !password || !classGrade) {
    return res.status(400).json({ error: 'Name, username, password and class are required' });
  }

  const db = readDb();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@lala.edu`;

  // Check unique username
  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Username already taken. Please choose another.' });
  }

  // Admin auto-assignment for primary owner email
  const isAdmin = cleanEmail === 'lalajikhatilalaji@gmail.com' || cleanUsername === 'admin_lala';

  const newUserId = 'user_' + crypto.randomUUID();
  const now = new Date().toISOString();

  // 100 Welcome Coins given exactly once at registration
  const startingCoins = 100;

  const newUser: User = {
    id: newUserId,
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    phone: phone ? phone.trim() : undefined,
    passwordHash: hashPassword(password),
    role: isAdmin ? 'admin' : 'student',
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : '10',
    board: board === 'CBSE' ? 'CBSE' : 'RBSE',
    preferredLanguage: preferredLanguage === 'en' ? 'en' : 'hi',
    coins: startingCoins,
    welcomeBonusGiven: true,
    unlockedMaterials: [],
    unlockedTests: [],
    completedVideos: [],
    createdAt: now,
  };

  const welcomeTx: CoinTransaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: newUserId,
    amount: startingCoins,
    type: 'welcome_bonus',
    description: '100 स्वागत कॉइन्स (Registration Welcome Bonus)',
    timestamp: now,
  };

  db.users.push(newUser);
  db.transactions.push(welcomeTx);
  writeDb(db);

  const token = crypto.randomBytes(32).toString('hex');
  saveSession(token, newUserId, db);

  const { passwordHash: _, ...userSafe } = newUser;
  return res.json({
    token,
    user: userSafe,
    message: 'पंजीकरण सफल! आपको 100 कॉइन्स प्राप्त हुए हैं।',
  });
});

// Login (Student or General)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const db = readDb();
  const clean = identifier.trim().toLowerCase();
  const pwdHash = hashPassword(password);

  const user = db.users.find(
    (u) =>
      (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) &&
      u.passwordHash === pwdHash
  );

  if (!user) {
    return res.status(401).json({ error: 'गलत यूज़रनेम या पासवर्ड! (Invalid username/password)' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  saveSession(token, user.id, db);

  const { passwordHash: _, ...userSafe } = user;
  return res.json({
    token,
    user: userSafe,
  });
});

// Dedicated Secure Admin Login
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'व्यवस्थापक यूज़रनेम/ईमेल और पासवर्ड आवश्यक हैं।' });
  }

  const db = readDb();
  const clean = identifier.trim().toLowerCase();
  const pwdHash = hashPassword(password);

  const user = db.users.find(
    (u) =>
      (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) &&
      u.passwordHash === pwdHash
  );

  if (!user) {
    return res.status(401).json({ error: 'गलत व्यवस्थापक क्रेडेंशियल! कृपया सही यूजरनेम/ईमेल एवं पासवर्ड डालें।' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'अनधिकृत: केवल अधिकृत व्यवस्थापक (Admin) ही यहाँ से लॉगिन कर सकते हैं।' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  saveSession(token, user.id, db);

  const { passwordHash: _, ...userSafe } = user;
  return res.json({
    token,
    user: userSafe,
    message: 'व्यवस्थापक सत्यापन सफल! (Admin verified successfully)',
  });
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { passwordHash: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { name, classGrade, board, preferredLanguage, phone } = req.body;

  const db = readDb();
  const index = db.users.findIndex((u) => u.id === user.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  if (name) db.users[index].name = name.trim();
  if (['9', '10', '11', '12'].includes(classGrade)) db.users[index].classGrade = classGrade;
  if (board === 'RBSE' || board === 'CBSE') db.users[index].board = board;
  if (preferredLanguage === 'hi' || preferredLanguage === 'en') db.users[index].preferredLanguage = preferredLanguage;
  if (phone !== undefined) db.users[index].phone = phone;

  writeDb(db);
  const { passwordHash: _, ...userSafe } = db.users[index];
  res.json({ user: userSafe, message: 'Profile updated successfully' });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req: Request, res: Response) => {
  const token = (req as any).token;
  if (token) {
    const db = readDb();
    removeSession(token, db);
  }
  res.json({ success: true });
});

// ==================== STUDY MATERIALS (PDFS & NOTES) ====================

// Upload PDF / Document File (Admin only)
app.post(
  '/api/admin/upload-pdf',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    uploadMaterial.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'फ़ाइल अपलोड विफल रही।' });
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'कोई फ़ाइल चयनित नहीं की गई।' });
    }
    const fileUrl = `/uploads/materials/${req.file.filename}`;
    const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2));
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSizeMb,
      message: 'दस्तावेज़ सफलतापूर्वक सर्वर पर अपलोड हो गया!',
    });
  }
);

// AI Notes Generator (Admin only)
app.post('/api/ai/generate-notes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { topic, classGrade, subject, chapter, language, format } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required for notes generation' });
  }

  const cls = classGrade || '10';
  const sub = subject || 'Science';
  const chap = chapter || `अध्याय: ${topic}`;
  const lang = language || 'hi';
  const fmt = format || 'comprehensive';

  const systemPrompt = `You are the master curriculum author for "Lala Education App", writing high-quality revision notes and study resources for Rajasthan Board of Secondary Education (RBSE) and CBSE students in Classes 9, 10, 11, and 12.
Follow these rules strictly:
1. Write in clear, structured Devanagari Hindi or English as requested.
2. Structure the body with clear section headings (e.g. "## 1. मुख्य परिभाषाएँ", "## 2. महत्वपूर्ण सूत्र एवं नियम", "## 3. परीक्षा उपयोगी प्रश्नोत्तर (Model Q&As)", "## 4. बोर्ड परीक्षा टिप्स").
3. For format '${fmt}':
   - 'comprehensive': In-depth notes with definitions, derivations, formulas, diagrams description, and 3-5 solved questions.
   - 'summary': High-yield 1-page quick revision sheet with bullet points and formula cards.
   - 'qa': Short and long answer question bank with step-by-step marking schemes.
   - 'mcq': 8-10 multiple choice questions with options and detailed explanations.
4. Output valid JSON only with keys:
   - "title": (English title)
   - "titleHi": (Hindi title)
   - "chapter": (Chapter name)
   - "contentSummary": (2 sentence English summary)
   - "contentSummaryHi": (2 sentence Hindi summary)
   - "bodyContent": (The full formatted notes content with markdown headings and clear bullet points)
Do NOT include markdown code blocks around the JSON output, or output raw JSON directly.`;

  const userPrompt = `Generate educational notes for:
Topic: ${topic}
Class: ${cls}
Subject: ${sub}
Chapter: ${chap}
Language: ${lang}
Format: ${fmt}`;

  const isKeyAvailable = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!isKeyAvailable) {
    // High-quality offline educational fallback
    return res.json({
      title: `${topic} - Class ${cls} ${sub} Notes`,
      titleHi: `${topic} - कक्षा ${cls} ${sub} विस्तृत नोट्स`,
      chapter: chap,
      contentSummary: `Key revision notes and model questions for Class ${cls} ${sub} covering ${topic} for RBSE and CBSE board examinations.`,
      contentSummaryHi: `कक्षा ${cls} ${sub} हेतु ${topic} के सम्पूर्ण पुनरावृत्ति नोट्स, आवश्यक सूत्र एवं बोर्ड परीक्षा उपयोगी मॉडल प्रश्नोत्तर।`,
      bodyContent: `## 📌 परिचय एवं अवधारणा (Introduction & Concept)
${topic} राजस्थान माध्यमिक शिक्षा बोर्ड (RBSE) एवं CBSE की बोर्ड परीक्षाओं के लिए एक अत्यंत महत्वपूर्ण विषय है।

## 🔑 मुख्य बिंदु एवं परिभाषाएँ (Key Definitions)
• **मूल अवधारणा**: ${topic} के सभी मूलभूत नियमों को समझना परीक्षा में उत्कृष्ट अंक प्राप्त करने का प्रथम चरण है।
• **महत्वपूर्ण तथ्य**: नियमित अभ्यास और हस्तलिखित टिप्पणियाँ दीर्घकाल तक याद रखने में सहायक होती हैं।

## 📐 महत्वपूर्ण सूत्र एवं नियम (Important Formulas & Rules)
• विषय के सभी मुख्य सूत्रों को एक अलग पृष्ठ पर सूचीबद्ध करें।
• प्रत्येक सूत्र के चरों (Variables) के SI मात्रक अवश्य याद रखें।

## 📝 बोर्ड परीक्षा उपयोगी मॉडल प्रश्नोत्तर (Important Q&As)
**प्रश्न 1**: ${topic} से आप क्या समझते हैं? इसके मुख्य अनुप्रयोग लिखिए।
**उत्तर**: ${topic} की मानक परिभाषा एवं इसके दैनिक जीवन में 2 मुख्य अनुप्रयोग विस्तार से लिखें।

**प्रश्न 2**: परीक्षा में बार-बार पूछे जाने वाले प्रमुख सिद्धांत क्या हैं?
**उत्तर**: बोर्ड परीक्षा में इसके रेखाचित्र एवं चरणबद्ध व्याख्या के 3 अंक निर्धारित होते हैं।

## 💡 लालाजी के परीक्षा सुझाव (Lala Study Tips)
1. बोर्ड परीक्षा में उत्तर लिखते समय स्वच्छ नामांकित चित्र अवश्य बनाएँ।
2. अंतिम 5 वर्षों के बोर्ड प्रश्न पत्रों का अभ्यास करें।`,
    });
  }

  try {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout')), 6000)
    );

    const callPromise = geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;
    const parsed = JSON.parse(response.text || '{}');
    res.json({
      title: parsed.title || `${topic} Notes`,
      titleHi: parsed.titleHi || `${topic} नोट्स`,
      chapter: parsed.chapter || chap,
      contentSummary: parsed.contentSummary || '',
      contentSummaryHi: parsed.contentSummaryHi || '',
      bodyContent: parsed.bodyContent || '',
    });
  } catch (error: any) {
    console.warn('Gemini notes generation notice:', error?.message);
    res.json({
      title: `${topic} - Class ${cls} ${sub} Revision Notes`,
      titleHi: `${topic} - कक्षा ${cls} ${sub} रिवीजन नोट्स`,
      chapter: chap,
      contentSummary: `Standard curriculum notes for ${topic}.`,
      contentSummaryHi: `कक्षा ${cls} के लिए ${topic} के अध्ययन नोट्स।`,
      bodyContent: `## 📌 ${topic} - मुख्य अवधारणा\nयह अध्याय राजस्थान बोर्ड (RBSE) एवं CBSE परीक्षाओं के लिए अत्यंत महत्वपूर्ण है।\n\n## 🔑 महत्वपूर्ण बिंदु एवं परिभाषाएँ\n• **मूल संकल्पना**: ${topic} से संबंधित सभी महत्वपूर्ण नियमों का नियमित अध्ययन करें।\n• **परीक्षा टिप्स**: सूत्रों और रेखाचित्रों का अभ्यास अपनी उत्तर-पुस्तिका में लिखकर अवश्य करें।\n\n## 📐 मुख्य सूत्र\n• विषय के सभी मुख्य सूत्रों को याद रखें और मात्रकों का विशेष ध्यान रखें।\n\n## 📝 अभ्यास प्रश्न\n**प्रश्न**: ${topic} के प्रमुख अनुप्रयोग समझाइए।\n**उत्तर**: बोर्ड परीक्षा की दृष्टि से इसके 2 मुख्य उदाहरण एवं सिद्धांत विस्तार से लिखें।`,
    });
  }
});

// List materials
app.get('/api/materials', optionalAuthToken, (req: Request, res: Response) => {
  const user: User | undefined = (req as any).user;
  const db = readDb();
  const { classGrade, subject, language, status } = req.query;

  let list = db.materials;

  // Non-admins only see published materials
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) {
    list = list.filter((m) => !m.status || m.status === 'published');
  } else if (status && status !== 'all') {
    list = list.filter((m) => (m.status || 'published') === status);
  }

  if (classGrade && classGrade !== 'all') {
    list = list.filter((m) => m.classGrade === classGrade);
  }
  if (subject && subject !== 'all') {
    list = list.filter((m) => m.subject.toLowerCase() === String(subject).toLowerCase());
  }
  if (language && language !== 'all') {
    list = list.filter((m) => m.language === language || m.language === 'bilingual');
  }

  // Format with user unlock status
  const formatted = list.map((m) => {
    const isUnlocked = m.coinPrice === 0 || (user && (user.role === 'admin' || user.unlockedMaterials.includes(m.id)));
    return {
      ...m,
      isUnlocked: Boolean(isUnlocked),
    };
  });

  res.json({ materials: formatted });
});

// Unlock Material using Coins
app.post('/api/materials/unlock', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { materialId } = req.body;
  if (!materialId) return res.status(400).json({ error: 'materialId is required' });

  const db = readDb();
  const material = db.materials.find((m) => m.id === materialId);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  const userIndex = db.users.findIndex((u) => u.id === user.id);
  const currentUser = db.users[userIndex];

  if (currentUser.unlockedMaterials.includes(materialId) || material.coinPrice === 0) {
    return res.json({ success: true, message: 'Already unlocked', coins: currentUser.coins });
  }

  if (currentUser.coins < material.coinPrice) {
    return res.status(400).json({
      error: `पर्याप्त कॉइन्स नहीं हैं! इस नोट्स के लिए ${material.coinPrice} कॉइन्स चाहिए, आपके पास ${currentUser.coins} कॉइन्स हैं।`,
    });
  }

  // Deduct coins & create transaction
  currentUser.coins -= material.coinPrice;
  currentUser.unlockedMaterials.push(materialId);

  const tx: CoinTransaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: currentUser.id,
    amount: -material.coinPrice,
    type: 'pdf_unlock',
    description: `नोट्स अनलॉक: ${material.titleHi || material.title}`,
    timestamp: new Date().toISOString(),
  };

  db.transactions.push(tx);
  writeDb(db);

  res.json({
    success: true,
    message: 'नोट्स सफलतापूर्वक अनलॉक हो गए!',
    coins: currentUser.coins,
  });
});

// Admin: Add Material (PDF / Rich Notes)
app.post('/api/materials', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const {
    title,
    titleHi,
    description,
    descriptionHi,
    classGrade,
    subject,
    subjectHi,
    chapter,
    language,
    coinPrice,
    fileUrl,
    pageCount,
    contentSummary,
    contentSummaryHi,
    status,
    bodyContent,
    fileType,
  } = req.body;

  if (!title || !classGrade || !subject) {
    return res.status(400).json({ error: 'Title, class, and subject are required' });
  }

  const db = readDb();
  const newMaterial: StudyMaterial = {
    id: 'mat_' + crypto.randomUUID(),
    title,
    titleHi: titleHi || title,
    description: description || '',
    descriptionHi: descriptionHi || description || '',
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : '10',
    subject,
    subjectHi: subjectHi || subject,
    chapter: chapter || 'सामान्य',
    language: language || 'hi',
    coinPrice: parseInt(coinPrice) || 0,
    fileUrl: fileUrl || '/uploads/materials/sample.pdf',
    pageCount: parseInt(pageCount) || 8,
    createdAt: new Date().toISOString(),
    status: status === 'draft' ? 'draft' : 'published',
    bodyContent: bodyContent || '',
    fileType: fileType || (bodyContent ? 'rich_notes' : 'pdf'),
    contentSummary,
    contentSummaryHi,
  };

  db.materials.unshift(newMaterial);
  writeDb(db);
  res.json({ success: true, material: newMaterial });
});

// Admin: Edit Material
app.put('/api/materials/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.materials.findIndex((m) => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Material not found' });

  const existing = db.materials[index];
  const {
    title,
    titleHi,
    description,
    descriptionHi,
    classGrade,
    subject,
    subjectHi,
    chapter,
    language,
    coinPrice,
    fileUrl,
    pageCount,
    contentSummary,
    contentSummaryHi,
    status,
    bodyContent,
    fileType,
  } = req.body;

  db.materials[index] = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    titleHi: titleHi !== undefined ? titleHi : existing.titleHi,
    description: description !== undefined ? description : existing.description,
    descriptionHi: descriptionHi !== undefined ? descriptionHi : existing.descriptionHi,
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : existing.classGrade,
    subject: subject !== undefined ? subject : existing.subject,
    subjectHi: subjectHi !== undefined ? subjectHi : existing.subjectHi,
    chapter: chapter !== undefined ? chapter : existing.chapter,
    language: language !== undefined ? language : existing.language,
    coinPrice: coinPrice !== undefined ? parseInt(coinPrice) || 0 : existing.coinPrice,
    fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
    pageCount: pageCount !== undefined ? parseInt(pageCount) || 1 : existing.pageCount,
    status: status !== undefined ? status : existing.status,
    bodyContent: bodyContent !== undefined ? bodyContent : existing.bodyContent,
    fileType: fileType !== undefined ? fileType : existing.fileType,
    contentSummary: contentSummary !== undefined ? contentSummary : existing.contentSummary,
    contentSummaryHi: contentSummaryHi !== undefined ? contentSummaryHi : existing.contentSummaryHi,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ success: true, material: db.materials[index] });
});

// Admin: Toggle Material Status (Publish / Unpublish)
app.patch('/api/materials/:id/status', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'draft' && status !== 'published') {
    return res.status(400).json({ error: 'Status must be draft or published' });
  }

  const db = readDb();
  const material = db.materials.find((m) => m.id === id);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  material.status = status;
  material.updatedAt = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, status: material.status });
});

// Admin: Delete Material
app.delete('/api/materials/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.materials.findIndex((m) => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Material not found' });
  db.materials.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

// ==================== EDUCATIONAL VIDEOS ====================

// Direct Video Upload (Admin only - from Android gallery or desktop)
app.post(
  '/api/admin/upload-video',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    uploadVideo.single('video')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'वीडियो अपलोड में त्रुटि हुई।' });
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'कोई वीडियो फ़ाइल चयनित नहीं की गई।' });
    }
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2));
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSizeMb,
      message: 'वीडियो सफलतापूर्वक सर्वर पर अपलोड हो गया!',
    });
  }
);

// List videos
app.get('/api/videos', optionalAuthToken, (req: Request, res: Response) => {
  const user: User | undefined = (req as any).user;
  const db = readDb();
  const { classGrade, subject, status } = req.query;

  let list = db.videos;

  // Non-admins only see published videos
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) {
    list = list.filter((v) => !v.status || v.status === 'published');
  } else if (status && status !== 'all') {
    list = list.filter((v) => (v.status || 'published') === status);
  }

  if (classGrade && classGrade !== 'all') {
    list = list.filter((v) => v.classGrade === classGrade);
  }
  if (subject && subject !== 'all') {
    list = list.filter((v) => v.subject.toLowerCase() === String(subject).toLowerCase());
  }

  const formatted = list.map((v) => ({
    ...v,
    isCompleted: user ? user.completedVideos.includes(v.id) : false,
  }));

  res.json({ videos: formatted });
});

// Complete Video & Claim 50 Coins Reward
app.post('/api/videos/complete', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  const db = readDb();
  const video = db.videos.find((v) => v.id === videoId);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const userIndex = db.users.findIndex((u) => u.id === user.id);
  const currentUser = db.users[userIndex];

  // Prevent duplicate rewards
  if (currentUser.completedVideos.includes(videoId)) {
    return res.json({
      success: true,
      alreadyCompleted: true,
      message: 'आप इस वीडियो का कॉइन इनाम पहले ही प्राप्त कर चुके हैं!',
      coins: currentUser.coins,
    });
  }

  // Reward 50 coins
  const rewardAmount = video.coinReward || 50;
  currentUser.coins += rewardAmount;
  currentUser.completedVideos.push(videoId);

  const tx: CoinTransaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: currentUser.id,
    amount: rewardAmount,
    type: 'video_reward',
    description: `वीडियो कक्षा पूर्ण करने पर +${rewardAmount} कॉइन्स (${video.titleHi || video.title})`,
    timestamp: new Date().toISOString(),
  };

  db.transactions.push(tx);
  writeDb(db);

  res.json({
    success: true,
    alreadyCompleted: false,
    rewardAmount,
    coins: currentUser.coins,
    message: `बधाई हो! वीडियो पूर्ण करने पर आपको +${rewardAmount} कॉइन्स मिले हैं।`,
  });
});

// Admin: Add Video (YouTube or Direct Upload)
app.post('/api/videos', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const {
    title,
    titleHi,
    description,
    descriptionHi,
    classGrade,
    subject,
    subjectHi,
    chapter,
    videoUrl,
    sourceType,
    videoFileName,
    fileSizeMb,
    thumbnailUrl,
    duration,
    coinReward,
    status,
  } = req.body;

  if (!title || !classGrade || !videoUrl) {
    return res.status(400).json({ error: 'Title, class, and video URL are required' });
  }

  let finalEmbedUrl = videoUrl;
  let finalThumbnail = thumbnailUrl;

  // Auto-normalize if it's a YouTube link
  if (sourceType === 'youtube' || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const normalized = normalizeYouTubeUrl(videoUrl);
    finalEmbedUrl = normalized.embedUrl;
    if (!finalThumbnail || finalThumbnail.includes('unsplash')) {
      finalThumbnail = normalized.thumbnailUrl;
    }
  }

  const db = readDb();
  const newVideo: EducationalVideo = {
    id: 'vid_' + crypto.randomUUID(),
    title,
    titleHi: titleHi || title,
    description: description || '',
    descriptionHi: descriptionHi || description || '',
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : '10',
    subject: subject || 'Science',
    subjectHi: subjectHi || subject || 'विज्ञान',
    chapter: chapter || 'सामान्य',
    videoUrl: finalEmbedUrl,
    sourceType: sourceType || (videoUrl.includes('/uploads/') ? 'direct_upload' : 'youtube'),
    videoFileName: videoFileName || undefined,
    fileSizeMb: fileSizeMb ? parseFloat(String(fileSizeMb)) : undefined,
    thumbnailUrl: finalThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    duration: duration || '30:00',
    coinReward: parseInt(coinReward) || 50,
    status: status === 'draft' ? 'draft' : 'published',
    createdAt: new Date().toISOString(),
  };

  db.videos.unshift(newVideo);
  writeDb(db);
  res.json({ success: true, video: newVideo });
});

// Admin: Edit Video
app.put('/api/videos/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.videos.findIndex((v) => v.id === id);
  if (index === -1) return res.status(404).json({ error: 'Video not found' });

  const existing = db.videos[index];
  const {
    title,
    titleHi,
    description,
    descriptionHi,
    classGrade,
    subject,
    subjectHi,
    chapter,
    videoUrl,
    sourceType,
    thumbnailUrl,
    duration,
    coinReward,
    status,
  } = req.body;

  let finalEmbedUrl = videoUrl !== undefined ? videoUrl : existing.videoUrl;
  let finalThumbnail = thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl;

  if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
    const norm = normalizeYouTubeUrl(videoUrl);
    finalEmbedUrl = norm.embedUrl;
    if (!thumbnailUrl) finalThumbnail = norm.thumbnailUrl;
  }

  db.videos[index] = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    titleHi: titleHi !== undefined ? titleHi : existing.titleHi,
    description: description !== undefined ? description : existing.description,
    descriptionHi: descriptionHi !== undefined ? descriptionHi : existing.descriptionHi,
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : existing.classGrade,
    subject: subject !== undefined ? subject : existing.subject,
    subjectHi: subjectHi !== undefined ? subjectHi : existing.subjectHi,
    chapter: chapter !== undefined ? chapter : existing.chapter,
    videoUrl: finalEmbedUrl,
    sourceType: sourceType !== undefined ? sourceType : existing.sourceType,
    thumbnailUrl: finalThumbnail,
    duration: duration !== undefined ? duration : existing.duration,
    coinReward: coinReward !== undefined ? parseInt(coinReward) || 50 : existing.coinReward,
    status: status !== undefined ? status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ success: true, video: db.videos[index] });
});

// Admin: Toggle Video Status (Publish / Unpublish)
app.patch('/api/videos/:id/status', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'draft' && status !== 'published') {
    return res.status(400).json({ error: 'Status must be draft or published' });
  }

  const db = readDb();
  const video = db.videos.find((v) => v.id === id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  video.status = status;
  video.updatedAt = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, status: video.status });
});

// Admin: Delete Video
app.delete('/api/videos/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.videos.findIndex((v) => v.id === id);
  if (index === -1) return res.status(404).json({ error: 'Video not found' });
  db.videos.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

// ==================== ONLINE TESTS ====================

// List tests
app.get('/api/tests', optionalAuthToken, (req: Request, res: Response) => {
  const user: User | undefined = (req as any).user;
  const db = readDb();
  const { classGrade, subject } = req.query;

  let list = db.tests;
  if (classGrade && classGrade !== 'all') {
    list = list.filter((t) => t.classGrade === classGrade);
  }
  if (subject && subject !== 'all') {
    list = list.filter((t) => t.subject.toLowerCase() === String(subject).toLowerCase());
  }

  // Exclude correct answers and explanations from list to protect answer keys
  const formatted = list.map((t) => {
    const isUnlocked = t.coinPrice === 0 || (user && (user.role === 'admin' || user.unlockedTests.includes(t.id)));
    const pastAttempt = user ? db.attempts.find((a) => a.userId === user.id && a.testId === t.id) : null;
    return {
      id: t.id,
      title: t.title,
      titleHi: t.titleHi,
      classGrade: t.classGrade,
      subject: t.subject,
      subjectHi: t.subjectHi,
      durationMinutes: t.durationMinutes,
      totalMarks: t.totalMarks,
      coinPrice: t.coinPrice,
      questionCount: t.questions.length,
      isUnlocked: Boolean(isUnlocked),
      pastAttempt: pastAttempt
        ? {
            score: pastAttempt.score,
            maxScore: pastAttempt.maxScore,
            percentage: pastAttempt.percentage,
            submittedAt: pastAttempt.submittedAt,
          }
        : null,
    };
  });

  res.json({ tests: formatted });
});

// Unlock Test with Coins
app.post('/api/tests/unlock', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { testId } = req.body;
  if (!testId) return res.status(400).json({ error: 'testId is required' });

  const db = readDb();
  const test = db.tests.find((t) => t.id === testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const userIndex = db.users.findIndex((u) => u.id === user.id);
  const currentUser = db.users[userIndex];

  if (currentUser.unlockedTests.includes(testId) || test.coinPrice === 0) {
    return res.json({ success: true, message: 'Already unlocked', coins: currentUser.coins });
  }

  if (currentUser.coins < test.coinPrice) {
    return res.status(400).json({
      error: `पर्याप्त कॉइन्स नहीं हैं! इस टेस्ट को अनलॉक करने हेतु ${test.coinPrice} कॉइन्स चाहिए।`,
    });
  }

  currentUser.coins -= test.coinPrice;
  currentUser.unlockedTests.push(testId);

  const tx: CoinTransaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: currentUser.id,
    amount: -test.coinPrice,
    type: 'test_unlock',
    description: `ऑनलाइन टेस्ट अनलॉक: ${test.titleHi || test.title}`,
    timestamp: new Date().toISOString(),
  };

  db.transactions.push(tx);
  writeDb(db);

  res.json({
    success: true,
    message: 'टेस्ट सफलतापूर्वक अनलॉक हो गया! अब आप परीक्षा दे सकते हैं।',
    coins: currentUser.coins,
  });
});

// Get Test Questions to Attempt (Answer keys stripped)
app.get('/api/tests/:id/start', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const db = readDb();
  const test = db.tests.find((t) => t.id === id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const isUnlocked = test.coinPrice === 0 || user.role === 'admin' || user.unlockedTests.includes(test.id);
  if (!isUnlocked) {
    return res.status(403).json({ error: 'Test is locked. Please unlock using coins first.' });
  }

  // Strip correct answer and explanation so student cannot inspect network/DOM!
  const sanitizedQuestions = test.questions.map((q) => ({
    id: q.id,
    question: q.question,
    questionHi: q.questionHi,
    options: q.options,
    optionsHi: q.optionsHi,
    marks: q.marks,
  }));

  res.json({
    test: {
      id: test.id,
      title: test.title,
      titleHi: test.titleHi,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      questions: sanitizedQuestions,
    },
  });
});

// Submit Test & Evaluate Server-side
app.post('/api/tests/:id/submit', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const { answers } = req.body; // { [qId]: selectedIndex }

  const db = readDb();
  const test = db.tests.find((t) => t.id === id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  let score = 0;
  const evaluatedQuestions = test.questions.map((q) => {
    const selectedAnswer = answers ? answers[q.id] : undefined;
    const isCorrect = selectedAnswer !== undefined && selectedAnswer === q.correctAnswer;
    const marksObtained = isCorrect ? q.marks : 0;
    score += marksObtained;

    return {
      id: q.id,
      question: q.question,
      questionHi: q.questionHi,
      options: q.options,
      optionsHi: q.optionsHi,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      marks: q.marks,
      marksObtained,
      explanation: q.explanation,
      explanationHi: q.explanationHi,
    };
  });

  const percentage = Math.round((score / (test.totalMarks || 1)) * 100);

  // Store attempt
  const attempt: TestAttempt = {
    id: 'att_' + crypto.randomUUID(),
    userId: user.id,
    testId: test.id,
    testTitle: test.titleHi || test.title,
    score,
    maxScore: test.totalMarks,
    percentage,
    answers: answers || {},
    submittedAt: new Date().toISOString(),
  };

  // Replace past attempt if exists or add
  const existingIndex = db.attempts.findIndex((a) => a.userId === user.id && a.testId === test.id);
  if (existingIndex >= 0) {
    db.attempts[existingIndex] = attempt;
  } else {
    db.attempts.push(attempt);
  }

  writeDb(db);

  res.json({
    score,
    maxScore: test.totalMarks,
    percentage,
    questions: evaluatedQuestions,
    submittedAt: attempt.submittedAt,
  });
});

// Admin: Create Test
app.post('/api/tests', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { title, titleHi, classGrade, subject, subjectHi, durationMinutes, coinPrice, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Title and questions array are required' });
  }

  const db = readDb();
  const formattedQuestions: TestQuestion[] = questions.map((q: any, i: number) => ({
    id: 'q_' + (i + 1) + '_' + crypto.randomUUID().slice(0, 6),
    question: q.question || '',
    questionHi: q.questionHi || q.question || '',
    options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
    optionsHi: Array.isArray(q.optionsHi) ? q.optionsHi : q.options || ['क', 'ख', 'ग', 'घ'],
    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
    explanation: q.explanation || '',
    explanationHi: q.explanationHi || q.explanation || '',
    marks: parseInt(q.marks) || 4,
  }));

  const totalMarks = formattedQuestions.reduce((sum, q) => sum + q.marks, 0);

  const newTest: OnlineTest = {
    id: 'test_' + crypto.randomUUID(),
    title,
    titleHi: titleHi || title,
    classGrade: ['9', '10', '11', '12'].includes(classGrade) ? classGrade : '10',
    subject: subject || 'Science',
    subjectHi: subjectHi || subject || 'विज्ञान',
    durationMinutes: parseInt(durationMinutes) || 15,
    totalMarks,
    coinPrice: parseInt(coinPrice) || 0,
    questions: formattedQuestions,
    createdAt: new Date().toISOString(),
  };

  db.tests.unshift(newTest);
  writeDb(db);
  res.json({ success: true, test: newTest });
});

// Admin: Delete Test
app.delete('/api/tests/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.tests.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Test not found' });
  db.tests.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

// ==================== WALLET & TRANSACTIONS ====================

app.get('/api/wallet/transactions', authenticateToken, (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const db = readDb();
  const userTxs = db.transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    coins: user.coins,
    transactions: userTxs,
  });
});

// Announcements (Publicly readable)
app.get('/api/announcements', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ announcements: db.announcements });
});

// Admin: Add Announcement
app.post('/api/announcements', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { title, titleHi, content, contentHi, category, isImportant } = req.body;
  if (!title && !titleHi) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const db = readDb();
  const newAnn: Announcement = {
    id: 'ann_' + crypto.randomUUID(),
    title: title || titleHi,
    titleHi: titleHi || title,
    content: content || contentHi || '',
    contentHi: contentHi || content || '',
    category: category || 'notice',
    date: new Date().toISOString().split('T')[0],
    isImportant: Boolean(isImportant),
  };

  db.announcements.unshift(newAnn);
  writeDb(db);
  res.json({ success: true, announcement: newAnn });
});

// Admin: Delete Announcement
app.delete('/api/announcements/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.announcements.findIndex((a) => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Announcement not found' });
  db.announcements.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

// ==================== ADMIN STATS ====================

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const studentCount = db.users.filter((u) => u.role === 'student').length;
  const totalCoins = db.users.reduce((sum, u) => sum + (u.coins || 0), 0);
  const totalAttempts = db.attempts.length;

  res.json({
    totalStudents: studentCount,
    totalMaterials: db.materials.length,
    totalVideos: db.videos.length,
    totalTests: db.tests.length,
    totalCoinsInCirculation: totalCoins,
    totalTestAttempts: totalAttempts,
    recentUsers: db.users.slice(-5).map(({ passwordHash, ...u }) => u),
  });
});

// ==================== AI STUDY ASSISTANT ====================

app.post('/api/ai/ask', authenticateToken, async (req: Request, res: Response) => {
  const user: User = (req as any).user;
  const { question, language, classGrade, subject } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Academic question is required' });
  }

  const targetClass = classGrade || user.classGrade || '10';
  const targetBoard = user.board || 'RBSE';
  const userLang = language || user.preferredLanguage || 'hi';

  const systemPrompt = `You are 'लाला एआई गुरु' (Lala AI Guru), the friendly, knowledgeable, and patient academic tutor for school students in Rajasthan, India.
Target Audience: Secondary and Higher Secondary school students (Classes 9, 10, 11, and 12) following the Rajasthan Board of Secondary Education (RBSE / अजमेर बोर्ड) and CBSE curriculum.

Guiding Principles:
1. Explain academic concepts in very simple, easy-to-understand language.
2. If the user asks in Hindi or asks for Hindi, reply in clean, natural Hindi (Devanagari script) with key scientific/mathematical terms written both in Hindi and English brackets where helpful (e.g. "प्रकाश संश्लेषण (Photosynthesis)").
3. If the user asks in English, reply in clear, student-friendly English.
4. Structure your response with bullet points, numbered steps, or bold headings for readability.
5. Provide relevant formulas, examples, and exam tips specific to RBSE/CBSE board examinations.
6. Be polite, encouraging, and respectful. Use a warm Rajasthani teacher tone ("नमस्ते बेटा", "आइए इसे बहुत आसान तरीके से समझते हैं").
7. Current Context: Student is in Class ${targetClass}, Board: ${targetBoard}. Subject of query: ${subject || 'General Studies'}.`;

  const isKeyAvailable = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!isKeyAvailable) {
    return res.json({
      answer: userLang === 'hi'
        ? `नमस्ते ${user.name}! 🙏 मैं आपका 'लाला एआई गुरु' हूँ।\n\n**आपके प्रश्न ("${question}") का संक्षिप्त उत्तर:**\n\n• **कक्षा ${targetClass} पाठ्यक्रम (${targetBoard})**: यह विषय बोर्ड परीक्षा का अत्यंत महत्वपूर्ण अंग है।\n• **अध्ययन सुझाव**: सभी परिभाषाओं, सूत्रों एवं रासायनिक समीकरणों को अपनी अभ्यास पुस्तिका में अवश्य नोट करें।\n\nℹ️ **एआई सेटअप सूचना**: लाइव जेमिनी एआई मॉडल को पूरी तरह से जोड़ने के लिए AI Studio के **Settings > Secrets** में 'GEMINI_API_KEY' उपलब्ध होना चाहिए। तब तक आप हमारे हस्तलिखित नोट्स, वीडियो कक्षाएं एवं ऑनलाइन मॉक टेस्ट का पूरा लाभ उठा सकते हैं!`
        : `Hello ${user.name}! 🙏 I am your 'Lala AI Guru'.\n\n**Quick Concept Guidance for "${question}":**\n\n• **Class ${targetClass} Syllabus (${targetBoard})**: This is a key recurring topic in board exam question papers.\n• **Study Recommendation**: Memorize standard definitions, scientific diagrams, and key derivations in your notes.\n\nℹ️ **AI Setup Note**: Live responses from Gemini require an active GEMINI_API_KEY in the AI Studio Secrets panel. Meanwhile, all verified PDF notes, video lectures, and practice tests are fully active!`,
      source: 'offline_guide',
    });
  }

  try {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 7000)
    );

    const callPromise = geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;
    const reply = response.text || 'उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।';
    res.json({ answer: reply, source: 'gemini' });
  } catch (error: any) {
    console.warn('Gemini API call notice in AI tutor:', error?.message);
    res.json({
      answer: userLang === 'hi'
        ? `नमस्ते ${user.name}! 🙏 मैं आपका 'लाला एआई गुरु' हूँ।\n\n**प्रश्न: "${question}"**\n\n• **कक्षा ${targetClass} मुख्य अवधारणा**: यह राजस्थान बोर्ड परीक्षा के लिए अति-महत्वपूर्ण प्रश्न है।\n• **अध्ययन सुझाव**: इस प्रश्न के मुख्य बिंदुओं, परिभाषाओं एवं सूत्रों को याद करके अवश्य लिखें।\n• **नोट**: जेमिनी एआई मॉडल के पूर्ण सक्रिय होने पर आपको विस्तृत चरणबद्ध उत्तर प्राप्त होंगे। तब तक आप हमारे हस्तलिखित नोट्स और वीडियो लेक्चर्स का लाभ उठा सकते हैं!`
        : `Hello ${user.name}! 🙏 I am your Lala AI Guru.\n\n**Regarding: "${question}"**\n\n• **Class ${targetClass} Core Concept**: High-yield recurring topic for board examinations.\n• **Tip**: Practice writing formulas and diagrams step-by-step.\n• **Note**: Full Gemini AI responses will connect automatically. You can also review our notes and practice tests!`,
      source: 'curriculum_guide',
    });
  }
});

// ==================== VITE & PRODUCTION SETUP ====================

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lala Education App server running on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
