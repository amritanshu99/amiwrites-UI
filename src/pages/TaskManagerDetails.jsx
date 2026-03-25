import { useEffect } from "react";
import TaskManager from '../components/Task-Manager/TaskManager';

import { applySEO, seoByRoute } from "../utils/seo";

const TaskManagerDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/task-manager"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/task-manager",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <TaskManager />
    </div>
  );
};

export default TaskManagerDetails;