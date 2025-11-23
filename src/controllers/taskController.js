const Task = require("../models/Task");

const createTask = async (req, res, next) => {
  try {
    const { body } = req.body;

    if (!body || body.trim() === "") {
      return res.status(400).json({ error: "Task body is required" });
    }

    const taskId = await Task.create(body, req.user.id);
    const task = await Task.findById(taskId);

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTasks = async (req, res, next) => {
  try {
    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.findAll();
    } else {
      tasks = await Task.findByUserId(req.user.id);
    }

    res.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Provera vlasništva - uporedi kao integer
    if (
      req.user.role !== "admin" &&
      parseInt(task.userId) !== parseInt(req.user.id)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || body.trim() === "") {
      return res.status(400).json({ error: "Task body is required" });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Provera vlasništva - uporedi kao integer
    if (
      req.user.role !== "admin" &&
      parseInt(task.userId) !== parseInt(req.user.id)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await Task.update(id, body);
    const updatedTask = await Task.findById(id);

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Provera vlasništva - uporedi kao integer
    if (
      req.user.role !== "admin" &&
      parseInt(task.userId) !== parseInt(req.user.id)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await Task.delete(id);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
