import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';

const STORAGE_KEY = 'alitasha-selected-branch';

export type Branch = {
  id: string;
  name: string;
  location: string;
  accepting_bookings?: boolean;
};

type BranchContextValue = {
  branches: Branch[];
  branchesLoading: boolean;
  branchesError: string | null;
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  refreshBranches: () => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const setSelectedBranchId = useCallback((id: string | null) => {
    setSelectedBranchIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshBranches = useCallback(async () => {
    setBranchesLoading(true);
    setBranchesError(null);
    try {
      const res = await axios.get<Branch[]>('http://localhost:5000/api/branches');
      setBranches(res.data);
    } catch {
      setBranchesError('Could not load branches.');
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBranches();
  }, [refreshBranches]);

  const value = useMemo(
    () => ({
      branches,
      branchesLoading,
      branchesError,
      selectedBranchId,
      setSelectedBranchId,
      refreshBranches,
    }),
    [
      branches,
      branchesLoading,
      branchesError,
      selectedBranchId,
      setSelectedBranchId,
      refreshBranches,
    ]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
