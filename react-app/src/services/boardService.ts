// Board service for detecting and managing board configuration
import { api } from './api';
import type { BoardInfo, BoardModel } from '../types/board';
import { BOARD_CONFIGS } from '../types/board';

// Mock board info for development
const mockBoardInfo: BoardInfo = {
  ...BOARD_CONFIGS['jsense'],
  firmware: '1.0.0',
};

export const boardService = {
  // Get board information
  async getBoardInfo(): Promise<BoardInfo> {
    try {
      const data = await api.fetch<{ model: BoardModel; firmware: string }>('/api/board/info');
      
      // Merge API response with preset config
      const config = BOARD_CONFIGS[data.model];
      if (!config) {
        console.warn('Unknown board model, using JSense Board as default');
        return { ...BOARD_CONFIGS['jsense'], firmware: data.firmware };
      }
      
      return {
        ...config,
        firmware: data.firmware,
      };
    } catch {
      console.log('Mock: Using JSense Board configuration');
      return mockBoardInfo;
    }
  },

  // Update board model (for development/testing)
  async updateBoardModel(model: BoardModel): Promise<{ success: boolean; message?: string }> {
    try {
      return await api.fetch<{ success: boolean; message?: string }>('/api/board/model', {
        method: 'POST',
        body: JSON.stringify({ model }),
      });
    } catch {
      console.log('Mock: Board model update (not implemented in mock mode)');
      return { success: false, message: 'Mock mode does not support board model changes' };
    }
  },
};
