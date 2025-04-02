import { apiRequest } from '@/lib/queryClient';
import { Dashboard, Widget, WidgetPosition } from '../../../shared/schema';

// API Response types
interface ApiResponse<T> {
  ok: boolean;
  json: () => Promise<T>;
}

// Error response type 
interface ErrorResponse {
  error: string;
}

// Union type to handle both success and error responses
type ApiResponseBody<T> = T | ErrorResponse;

/**
 * Interface for dashboard widget configuration with optional data
 */
export interface DashboardWidget extends Widget {
  data?: any;
}

/**
 * Interface for dashboard configuration (for create/update)
 */
export interface DashboardConfig {
  name: string;
  widgets: DashboardWidget[];
  description?: string;
}

/**
 * Interface for available widget types
 */
export interface WidgetType {
  type: string;
  name: string;
  description: string;
  defaultSize?: WidgetPosition;
  category?: string;
  previewImage?: string;
}

/**
 * Service for managing user dashboards
 */
export class DashboardService {
  /**
   * Helper method to safely handle error responses
   * @param responseData The response data from API
   * @returns The error message if it exists, otherwise a default message
   */
  private static getErrorMessage(responseData: unknown): string {
    if (responseData && typeof responseData === 'object' && 'error' in responseData && typeof responseData.error === 'string') {
      return responseData.error;
    }
    return 'Unknown error occurred';
  }
  /**
   * Save a new dashboard configuration for a user
   * @param userId User ID
   * @param config Dashboard configuration
   * @returns Saved dashboard with ID
   */
  static async saveUserDashboard(userId: number, config: DashboardConfig): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save dashboard: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all dashboards for a user
   * @param userId User ID
   * @returns Array of user dashboards (without widget data)
   */
  static async getUserDashboards(userId: number): Promise<Dashboard[]> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard[]>>(`/api/dashboards?userId=${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch dashboards: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      // Return empty array instead of throwing to make UI handling easier
      return [];
    }
  }

  /**
   * Get dashboard data with populated widgets
   * @param dashboardId Dashboard ID
   * @returns Dashboard with populated widget data
   */
  static async getDashboardData(dashboardId: string): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}/data`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch dashboard data: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Update an existing dashboard
   * @param dashboardId Dashboard ID
   * @param config Updated dashboard configuration
   * @returns Updated dashboard
   */
  static async updateDashboard(dashboardId: string, config: Partial<DashboardConfig>): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update dashboard: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw error;
    }
  }

  /**
   * Delete a dashboard
   * @param dashboardId Dashboard ID
   * @returns Success status
   */
  static async deleteDashboard(dashboardId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiRequest<ApiResponse<{ success: boolean }>>(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete dashboard: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      return { success: false };
    }
  }

  /**
   * Get available widget types for dashboard
   * @returns Array of available widget types
   */
  static async getAvailableWidgets(): Promise<WidgetType[]> {
    try {
      const response = await apiRequest<ApiResponse<WidgetType[]>>('/api/dashboards/widgets', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch available widgets: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available widgets:', error);
      return [];
    }
  }

  /**
   * Update widget position in a dashboard
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @param position New position
   * @returns Updated dashboard
   */
  static async updateWidgetPosition(
    dashboardId: string,
    widgetId: string,
    position: WidgetPosition
  ): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}/widgets/${widgetId}/position`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(position),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update widget position: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating widget position:', error);
      throw error;
    }
  }

  /**
   * Add widget to dashboard
   * @param dashboardId Dashboard ID
   * @param widget Widget configuration
   * @returns Updated dashboard
   */
  static async addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}/widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(widget),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add widget: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }

  /**
   * Remove widget from dashboard
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @returns Updated dashboard
   */
  static async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to remove widget: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  }

  /**
   * Update widget settings
   * @param dashboardId Dashboard ID
   * @param widgetId Widget ID
   * @param settings Widget settings
   * @returns Updated dashboard
   */
  static async updateWidgetSettings(
    dashboardId: string,
    widgetId: string,
    settings: Record<string, any>
  ): Promise<Dashboard> {
    try {
      const response = await apiRequest<ApiResponse<Dashboard>>(`/api/dashboards/${dashboardId}/widgets/${widgetId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update widget settings: ${DashboardService.getErrorMessage(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }
  }
}