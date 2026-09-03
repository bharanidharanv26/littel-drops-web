const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data: T; message?: string }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const result = await this.request<T>(endpoint);
    return result.data;
  }

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return result.data;
  }

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return result.data;
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return result.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const result = await this.request<T>(endpoint, {
      method: 'DELETE',
    });
    return result.data;
  }
}

export const api = new ApiClient();

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: any; token: string; mustChangePassword?: boolean }>('/auth/login', { username, password }),

  getMe: () => api.get<{ user: any }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  logout: () => api.post('/auth/logout'),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: () => api.get<any[]>('/users'),
  getById: (id: string) => api.get<any>(`/users/${id}`),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.put<any>(`/users/${id}`, data),
  toggleStatus: (id: string) => api.patch<any>(`/users/${id}/status`),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }),

  // Branch assignments
  getAssignments: (userId: string) => api.get<any[]>(`/users/${userId}/assignments`),
  createAssignment: (data: any) => api.post<any>('/users/assignments', data),
  removeAssignment: (assignmentId: string) => api.delete(`/users/assignments/${assignmentId}`),
};

// ─── Branches ────────────────────────────────────────────────────────────────

export const branchesApi = {
  getAll: () => api.get<any[]>('/branches'),
  getById: (id: string) => api.get<any>(`/branches/${id}`),
  create: (data: { name: string; address?: string; phone?: string }) =>
    api.post<any>('/branches', data),
  update: (id: string, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) =>
    api.put<any>(`/branches/${id}`, data),
  toggleStatus: (id: string) => api.patch<any>(`/branches/${id}/status`),
};

// ─── Elders ──────────────────────────────────────────────────────────────────

export const eldersApi = {
  getAll: (params?: { branch_id?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.branch_id) searchParams.set('branch_id', params.branch_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return api.get<{ data: any[]; total: number; page: number; pages: number }>(`/elders${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<any>(`/elders/${id}`),

  // Admission workflow
  submitAdmission: (data: any) => api.post<any>('/elders/admission/submit', data),
  approveAdmission: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/admission/${id}/approve`, { reviewComment }),
  rejectAdmission: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/admission/${id}/reject`, { reviewComment }),

  // Edit workflow
  editElder: (id: string, data: any) => api.put<any>(`/elders/${id}/edit`, data),
  approveEdit: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/edit/${id}/approve`, { reviewComment }),
  rejectEdit: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/edit/${id}/reject`, { reviewComment }),

  // Transfer workflow
  submitTransfer: (data: any) => api.post<any>('/elders/transfer/submit', data),
  approveTransfer: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/transfer/${id}/approve`, { reviewComment }),
  rejectTransfer: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/transfer/${id}/reject`, { reviewComment }),

  // Death workflow
  submitDeath: (data: any) => api.post<any>('/elders/death/submit', data),
  approveDeath: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/death/${id}/approve`, { reviewComment }),
  rejectDeath: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/death/${id}/reject`, { reviewComment }),

  // Return home workflow
  submitReturnHome: (data: any) => api.post<any>('/elders/return-home/submit', data),
  approveReturnHome: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/return-home/${id}/approve`, { reviewComment }),

  // Other outcome workflow
  submitOtherOutcome: (data: any) => api.post<any>('/elders/other/submit', data),
  approveOtherOutcome: (id: string, reviewComment?: string) =>
    api.post<any>(`/elders/other/${id}/approve`, { reviewComment }),

  // Cancel request
  cancelRequest: (id: string) => api.post<any>(`/elders/request/${id}/cancel`),
};

// ─── Requests ────────────────────────────────────────────────────────────────

export const requestsApi = {
  getAll: (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return api.get<{ data: any[]; total: number }>(`/requests${query ? `?${query}` : ''}`);
  },

  review: (id: string, data: { action: 'approve' | 'reject'; reviewComment?: string }) =>
    api.put<any>(`/requests/${id}/review`, data),
};

// ─── Dashboard / Reports ─────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get<any>('/reports/stats'),
  getReports: (params: {
    report_type: string;
    branch_id?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams({ report_type: params.report_type });
    if (params.branch_id) searchParams.set('branch_id', params.branch_id);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    return api.get<any[]>(`/reports/reports?${searchParams.toString()}`);
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: () => api.get<any[]>('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditApi = {
  getAll: (params?: { dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    const query = searchParams.toString();
    return api.get<any[]>(`/audit-logs${query ? `?${query}` : ''}`);
  },
};

// ─── Import ──────────────────────────────────────────────────────────────────

export const importApi = {
  preview: (rows: any[], fileName?: string) =>
    api.post<{ results: any[]; summary: any }>('/import/preview', { rows, fileName }),
  confirm: (rows: any[], fileName?: string) =>
    api.post<{ imported: number; skipped: number; errors: number; errorDetails: any[] }>('/import/confirm', { rows, fileName }),
  getJobs: () => api.get<any[]>('/import/jobs'),
};
