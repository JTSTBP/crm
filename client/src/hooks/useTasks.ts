import { useState, useEffect } from "react";
import axios from "axios";

export const useTasks = (leadId: string) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leads/${leadId}/tasks`);
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    try {
      const { data } = await axios.put(`/api/tasks/${taskId}`, updates);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data : task))
      );
      return data;
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [leadId]);

  return { tasks, loading, updateTask, deleteTask, fetchTasks };
};
