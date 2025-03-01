import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Task interfaces
export interface Task {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  createdAt: Date;
  category: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  category: string;
}

// Task API calls
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/tasks`);
  return response.data.map((task: any) => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    createdAt: new Date(task.createdAt)
  }));
};

export const createTask = async (task: CreateTaskDto): Promise<Task> => {
  const response = await axios.post(`${API_URL}/tasks`, task);
  return {
    ...response.data,
    dueDate: response.data.dueDate ? new Date(response.data.dueDate) : null,
    createdAt: new Date(response.data.createdAt)
  };
};

export const updateTask = async (id: string, task: Partial<CreateTaskDto>): Promise<Task> => {
  const response = await axios.patch(`${API_URL}/tasks/${id}`, task);
  return {
    ...response.data,
    dueDate: response.data.dueDate ? new Date(response.data.dueDate) : null,
    createdAt: new Date(response.data.createdAt)
  };
};

export const deleteTask = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/tasks/${id}`);
};

// Category API calls
export const fetchCategories = async (): Promise<string[]> => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data;
};

export const createCategory = async (name: string): Promise<string> => {
  const response = await axios.post(`${API_URL}/categories`, { name });
  return response.data.name;
};

export const deleteCategory = async (name: string): Promise<void> => {
  await axios.delete(`${API_URL}/categories/${name}`);
};