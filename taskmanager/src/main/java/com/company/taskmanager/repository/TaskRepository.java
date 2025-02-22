package com.company.taskmanager.repository;

import com.company.taskmanager.entity.Task;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Integer> {

    List<Task> findByTitleContainingAndDescriptionContaining(String title, String description);

    List<Task> findByTitleContainingAndDescriptionContainingAndCompleted(String title, String description, boolean completed);

}
