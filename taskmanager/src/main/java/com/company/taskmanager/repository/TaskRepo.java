package com.company.taskmanager.repository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.*;
import com.company.taskmanager.entity.Task;
import org.springframework.stereotype.Repository;

@Repository
public class TaskRepo {

    private final EntityManager em;

    public TaskRepo(EntityManager em) {
        this.em = em;
    }

    public List<Task> getListTask(String title, String description, boolean completed) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Task> cq = cb.createQuery(Task.class);
        Root<Task> root = cq.from(Task.class);
        List<Predicate> predicates =new ArrayList<>();
        if (title != null && !title.isEmpty()) {
            predicates.add(cb.like(root.get("title"), "%" + title + "%"));
        }
        if (description != null && !description.isEmpty()) {
            predicates.add(cb.like(root.get("description"), "%" + description + "%"));
        }
        if (completed) {
            predicates.add(cb.equal(root.get("completed"), true));
        }
        Predicate predicate = cb.and(predicates.toArray(new Predicate[0]));
        cq=cq.where(predicate);
        cq=cq.select(root);
        return em.createQuery(cq).getResultList();
    }
}
