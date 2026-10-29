import {
  User,
  StudyMaterial,
  EducationalVideo,
  OnlineTestItem,
  ActiveTest,
  TestEvaluationResult,
  CoinTransaction,
  Announcement,
  AdminStats,
  AiNotesRequest,
  AiNotesResponse,
} from '../types';

const TOKEN_KEY = 'lala_edu_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// Upload helper supporting progress tracking via XMLHttpRequest
function uploadFileWithProgress<T>(
  endpoint: string,
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    const token = getStoredToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
      } else {
        reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(formData);
  });
}

export const api = {
  // Auth
  async register(params: any): Promise<{ token: string; user: User; message: string }> {
    const data = await request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(data.token);
    return data;
  },

  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async adminLogin(identifier: string, password: string): Promise<{ token: string; user: User; message?: string }> {
    const data = await request<{ token: string; user: User; message?: string }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  // Study Materials & Notes
  async getMaterials(filter?: {
    classGrade?: string;
    subject?: string;
    language?: string;
    status?: string;
  }): Promise<StudyMaterial[]> {
    const query = new URLSearchParams();
    if (filter?.classGrade) query.set('classGrade', filter.classGrade);
    if (filter?.subject) query.set('subject', filter.subject);
    if (filter?.language) query.set('language', filter.language);
    if (filter?.status) query.set('status', filter.status);
    const data = await request<{ materials: StudyMaterial[] }>(`/api/materials?${query.toString()}`);
    return data.materials;
  },

  async unlockMaterial(materialId: string): Promise<{ success: boolean; coins: number; message: string }> {
    return request('/api/materials/unlock', {
      method: 'POST',
      body: JSON.stringify({ materialId }),
    });
  },

  async addMaterial(materialData: any): Promise<{ success: boolean; material: StudyMaterial }> {
    return request('/api/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
  },

  async updateMaterial(id: string, materialData: any): Promise<{ success: boolean; material: StudyMaterial }> {
    return request(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  },

  async toggleMaterialStatus(id: string, status: 'draft' | 'published'): Promise<{ success: boolean; status: string }> {
    return request(`/api/materials/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteMaterial(id: string): Promise<{ success: boolean }> {
    return request(`/api/materials/${id}`, { method: 'DELETE' });
  },

  // Upload PDF file
  async uploadMaterialFile(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<{ success: boolean; fileUrl: string; fileName: string; fileSizeMb: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFileWithProgress('/api/admin/upload-pdf', formData, onProgress);
  },

  // AI Notes Generator
  async generateAiNotes(params: AiNotesRequest): Promise<AiNotesResponse> {
    return request<AiNotesResponse>('/api/ai/generate-notes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Educational Videos
  async getVideos(filter?: { classGrade?: string; subject?: string; status?: string }): Promise<EducationalVideo[]> {
    const query = new URLSearchParams();
    if (filter?.classGrade) query.set('classGrade', filter.classGrade);
    if (filter?.subject) query.set('subject', filter.subject);
    if (filter?.status) query.set('status', filter.status);
    const data = await request<{ videos: EducationalVideo[] }>(`/api/videos?${query.toString()}`);
    return data.videos;
  },

  async completeVideo(videoId: string): Promise<{
    success: boolean;
    alreadyCompleted: boolean;
    rewardAmount?: number;
    coins: number;
    message: string;
  }> {
    return request('/api/videos/complete', {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    });
  },

  async addVideo(videoData: any): Promise<{ success: boolean; video: EducationalVideo }> {
    return request('/api/videos', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
  },

  async updateVideo(id: string, videoData: any): Promise<{ success: boolean; video: EducationalVideo }> {
    return request(`/api/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(videoData),
    });
  },

  async toggleVideoStatus(id: string, status: 'draft' | 'published'): Promise<{ success: boolean; status: string }> {
    return request(`/api/videos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteVideo(id: string): Promise<{ success: boolean }> {
    return request(`/api/videos/${id}`, { method: 'DELETE' });
  },

  // Direct video upload from Android phone or desktop
  async uploadVideoFile(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<{ success: boolean; fileUrl: string; fileName: string; fileSizeMb: number; message: string }> {
    const formData = new FormData();
    formData.append('video', file);
    return uploadFileWithProgress('/api/admin/upload-video', formData, onProgress);
  },

  // Online Tests
  async getTests(filter?: { classGrade?: string; subject?: string }): Promise<OnlineTestItem[]> {
    const query = new URLSearchParams();
    if (filter?.classGrade) query.set('classGrade', filter.classGrade);
    if (filter?.subject) query.set('subject', filter.subject);
    const data = await request<{ tests: OnlineTestItem[] }>(`/api/tests?${query.toString()}`);
    return data.tests;
  },

  async unlockTest(testId: string): Promise<{ success: boolean; coins: number; message: string }> {
    return request('/api/tests/unlock', {
      method: 'POST',
      body: JSON.stringify({ testId }),
    });
  },

  async startTest(testId: string): Promise<ActiveTest> {
    const data = await request<{ test: ActiveTest }>(`/api/tests/${testId}/start`);
    return data.test;
  },

  async submitTest(testId: string, answers: Record<string, number>): Promise<TestEvaluationResult> {
    return request<TestEvaluationResult>(`/api/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async addTest(testData: any): Promise<{ success: boolean; test: any }> {
    return request('/api/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },

  async deleteTest(id: string): Promise<{ success: boolean }> {
    return request(`/api/tests/${id}`, { method: 'DELETE' });
  },

  // Wallet
  async getWallet(): Promise<{ coins: number; transactions: CoinTransaction[] }> {
    return request('/api/wallet/transactions');
  },

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const data = await request<{ announcements: Announcement[] }>('/api/announcements');
    return data.announcements;
  },

  async addAnnouncement(data: any): Promise<{ success: boolean; announcement: Announcement }> {
    return request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return request(`/api/announcements/${id}`, { method: 'DELETE' });
  },

  // AI Guru
  async askAi(params: {
    question: string;
    language?: string;
    classGrade?: string;
    subject?: string;
  }): Promise<{ answer: string; source: string }> {
    return request('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Admin Stats
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/api/admin/stats');
  },
};
