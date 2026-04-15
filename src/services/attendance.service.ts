import { apiClient } from './api-client';
import type {
  AttendanceHeadcountResponse,
  AttendanceListResponse,
  AttendanceTimelineResponse,
} from './types';

interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  siteId?: string;
  userId?: string;
  status?: string;
  validationStatus?: string;
  from?: string;
  to?: string;
}

class AttendanceService {
  async getActiveSessions(
    businessCode: string,
    params?: Omit<AttendanceQueryParams, 'status' | 'validationStatus' | 'from' | 'to'>
  ): Promise<AttendanceListResponse> {
    return apiClient.get<AttendanceListResponse>(
      `/business/${businessCode}/attendance/active`,
      params
    );
  }

  async getLogs(
    businessCode: string,
    params?: AttendanceQueryParams
  ): Promise<AttendanceListResponse> {
    return apiClient.get<AttendanceListResponse>(
      `/business/${businessCode}/attendance/logs`,
      params
    );
  }

  async getHeadcount(
    businessCode: string,
    siteId?: string
  ): Promise<AttendanceHeadcountResponse> {
    const params = siteId ? { siteId } : undefined;
    return apiClient.get<AttendanceHeadcountResponse>(
      `/business/${businessCode}/attendance/headcount`,
      params
    );
  }

  async getEmployeeTimeline(
    businessCode: string,
    userId: string,
    params?: { sessionId?: string; from?: string; to?: string }
  ): Promise<AttendanceTimelineResponse> {
    return apiClient.get<AttendanceTimelineResponse>(
      `/business/${businessCode}/attendance/users/${userId}/timeline`,
      params
    );
  }
}

export const attendanceService = new AttendanceService();
export { AttendanceService };
