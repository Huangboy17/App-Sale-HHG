import { create } from 'zustand';
import type { Project } from '../lib/types';
import { db } from '../lib/database';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  searchQuery: string;
  loadProjects: () => void;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Project | null;
  updateProject: (id: string, project: Partial<Project>) => Project | null;
  setSearchQuery: (query: string) => void;
  getProjectsByCustomer: (customerId: string) => Project[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  searchQuery: '',
  loadProjects: () => {
    set({ loading: true });
    try {
      const allProjects = db.getProjects();
      const { searchQuery } = get();
      
      let filtered = allProjects;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.project_name.toLowerCase().includes(lowerQuery)
        );
      }
      
      set({ projects: filtered, loading: false });
    } catch (error) {
      console.error('Failed to load projects', error);
      set({ loading: false });
    }
  },
  addProject: (projectData) => {
    const newProject = db.createProject(projectData);
    if (newProject) {
      get().loadProjects();
    }
    return newProject;
  },
  updateProject: (id, projectData) => {
    const updated = db.updateProject(id, projectData);
    if (updated) {
      get().loadProjects();
    }
    return updated;
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadProjects();
  },
  getProjectsByCustomer: (customerId) => {
    return db.getProjects().filter(p => p.customer_id === customerId);
  }
}));
