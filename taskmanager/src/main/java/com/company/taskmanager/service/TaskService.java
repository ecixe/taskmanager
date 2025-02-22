package com.company.taskmanager.service;

import com.company.taskmanager.entity.Task;
import com.company.taskmanager.repository.TaskRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @Transactional
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Integer id) {
        taskRepository.deleteById(id);
    }

    public Task getTaskById(Integer id) {
        return taskRepository.findById(id).orElse(new Task());
    }

    @Transactional
    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }
}
