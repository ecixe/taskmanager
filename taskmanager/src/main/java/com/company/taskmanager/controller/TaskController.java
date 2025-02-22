package com.company.taskmanager.controller;

import com.company.taskmanager.dto.TaskDTO;
import com.company.taskmanager.entity.Task;
import com.company.taskmanager.exception.ResourceNotFoundException;
import com.company.taskmanager.mapper.TaskMapper;
import com.company.taskmanager.repository.TaskRepo;
import com.company.taskmanager.repository.TaskRepository;
import com.company.taskmanager.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.stream.*;
import java.util.*;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskMapper taskMapper;

    private final TaskRepository taskRepository;

    public TaskController(TaskMapper taskMapper, TaskRepository taskRepository) {
        this.taskMapper = taskMapper;
        this.taskRepository = taskRepository;
    }

    @GetMapping("/all")
    public List<TaskDTO> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream().map(taskMapper::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<TaskDTO> getList(@RequestParam(required = false) String title,
                                 @RequestParam(required = false) String description,
                                 @RequestParam(required = false) Boolean completed) {
        if (title == null) title = "";
        if (description == null) description = "";

        List<Task> tasks;
        if (completed == null) {
            tasks = taskRepository.findByTitleContainingAndDescriptionContaining(title, description);
        } else {
            tasks = taskRepository.findByTitleContainingAndDescriptionContainingAndCompleted(title, description, completed);
        }

        return tasks.stream().map(taskMapper::toDTO).collect(Collectors.toList());
    }

    @PostMapping("/create")
    public TaskDTO createTask(@RequestBody TaskDTO taskDTO) {
        Task task = taskMapper.toEntity(taskDTO);
        task = taskRepository.save(task);
        return taskMapper.toDTO(task);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Integer id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        taskRepository.delete(task);
        return ResponseEntity.ok("Task deleted successfully");
    }

    @GetMapping("/{id}")
    public TaskDTO getTask(@PathVariable Integer id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        return taskMapper.toDTO(task);
    }

    @PutMapping("/update/{id}")
    public TaskDTO updateTask(@PathVariable Integer id, @RequestBody Task task) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        existingTask.setTitle(task.getTitle());
        existingTask.setDescription(task.getDescription());

        Task updatedTask = taskRepository.save(existingTask);
        return taskMapper.toDTO(updatedTask);
    }
}
