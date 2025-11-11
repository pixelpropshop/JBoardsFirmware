import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { BoardInfo } from '../types/board';
import { boardService } from '../services/boardService';

interface BoardContextType {
  board: BoardInfo | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function useBoardConfig(): BoardContextType {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardConfig must be used within BoardProvider');
  }
  return context;
}

interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoardInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await boardService.getBoardInfo();
      setBoard(info);
    } catch (err) {
      setError('Failed to load board configuration');
      console.error('Board config error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardInfo();
  }, []);

  const value: BoardContextType = {
    board,
    loading,
    error,
    reload: loadBoardInfo,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}
