export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    generalAverage: number;
    activeUsers: number;
    contentItems: number;
}

export interface RegistrationRequest {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
}

export interface ActiveUser {
    id: string | number;
    username: string;
    role: string;
    lastActive: number;
    status: 'online' | 'offline' | 'idle';
}

export interface ContentStats {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
}

export interface AdvancedMetrics {
    studentGrowth: number;
    teacherRetention: number;
    averageAttendance: number;
    platformUptime: number;
}
