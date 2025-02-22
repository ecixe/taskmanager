package com.company.taskmanager.mapper;

import com.company.taskmanager.dto.TaskDTO;
import com.company.taskmanager.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {
    public TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        return dto;
    }

    public Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        return task;
    }
}
