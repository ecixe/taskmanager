const taskListElement = document.getElementById("taskList");
const taskModal = document.getElementById("taskModal");
const taskDetailsModal = document.getElementById("taskDetailsModal");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
let tasks = [];
let editTaskId = null;
document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem("username") || "Qonaq";
    console.log("Username:", username); // Debug üçün
    document.getElementById("username").textContent = username;
})
function fetchTasks() {
    fetch(`http://localhost:9090/taskmanager/tasks/all`,
        {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        }

    })

        .then((response) => response.json())

        .then((data) => {
            tasks = data;
            renderTasks(tasks);
        })
        .catch((error) => console.error("Xəta baş verdi:", error));

}


function renderTasks(filteredTasks) {
    taskListElement.innerHTML = "";
    filteredTasks.forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        if (task.completed) {
            taskElement.classList.add("completed");
        }

        taskElement.innerHTML = `
            <div onclick="showTaskDetails(${task.id})">
                <p class="task-title">${task.title}</p>
                <p class="task-description">${task.description}</p>
            </div>
            <div class="task-actions">
                <input
                    type="checkbox"
                    id="checkbox-${task.id}"
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTaskCompletion(${task.id}, this)"
                >
                <label for="checkbox-${task.id}">Completed</label>
                <button onclick="editTask(${task.id})">✏️ Edit</button>
                <button class="delete" onclick="deleteTask(${task.id})">🗑 Delete</button>
            </div>
        `;
        taskListElement.appendChild(taskElement);
    });
}

function editTask(taskId) {
    const task = tasks.find((task) => task.id === taskId);
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;

    editTaskId = taskId;
    document.getElementById("modalTitle").textContent = "Edit Task";
    taskModal.style.display = "flex";
}

function saveTask() {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    if (title === "" || description === "") {
        alert("Task title and description cannot be empty!");
        return;
    }

    const task = { title, description };

    const url = editTaskId === null
        ? "http://localhost:9090/taskmanager/tasks/create"
        : `http://localhost:9090/taskmanager/tasks/update/${editTaskId}`;

    const method = editTaskId === null ? "POST" : "PUT";

    fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(task),
    })
        .then((response) => response.json())
        .then((data) => {
            if (editTaskId === null) {
                tasks.push(data);
            } else {
                const index = tasks.findIndex((t) => t.id === editTaskId);
                tasks[index] = data;
            }
            renderTasks(tasks);
            closeCreateEditModal();
        })
        .catch((error) => console.error("Error:", error));
}


function deleteTask(taskId) {
    if (!confirm("Bu taskı silmək istədiyinizə əminsiniz?")) return;

    fetch(`http://localhost:9090/taskmanager/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token") // ✅ Token əlavə olundu
        }
    })
        .then(() => {
            tasks = tasks.filter((task) => task.id !== taskId);
            renderTasks(tasks);
        })
        .catch((error) => console.error("Xəta baş verdi:", error));
}




function toggleTaskCompletion(taskId, checkbox) {
    const task = tasks.find((task) => task.id === taskId);
    task.completed = checkbox.checked;

    fetch(`http://localhost:9090/taskmanager/tasks/update/${taskId}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(task)
    })
        .then(response => response.json())
        .then(() => {
            renderTasks(tasks);
        })
        .catch(error => console.error("Error:", error));
}


function showTaskDetails(taskId) {
    const task = tasks.find((task) => task.id === taskId);
    document.getElementById("modalTaskTitle").textContent = task.title;
    document.getElementById("modalTaskDescription").textContent = task.description;
    document.getElementById("modalTaskStatus").textContent = task.completed ? "Completed" : "Not Completed";
    taskDetailsModal.style.display = "flex";
}

function closeCreateEditModal() {
    taskModal.style.display = "none";
}

function closeDetailsModal() {
    taskDetailsModal.style.display = "none";
}

function openCreateModal() {
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    document.getElementById("modalTitle").textContent = "Create Task";
    editTaskId = null;
    taskModal.style.display = "flex";
}

function searchTasks() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.querySelector("input[name='statusFilter']:checked").value;

    let filteredTasks = tasks.filter((task) => {
        return (
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
    });

    if (statusFilter !== "all") {
        const isCompleted = statusFilter === "completed";
        filteredTasks = filteredTasks.filter((task) => task.completed === isCompleted);
    }

    renderTasks(filteredTasks);
}
async function logout() {
    fetch('http://localhost:9090/taskmanager/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    }).then(response => {
        if (response.ok) {
            localStorage.removeItem('token'); // Tokeni sil
            window.location.href = "http://localhost:63342/taskmanager/static/login.html";
        }
    });

}
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    try {
        const response = await fetch("http://localhost:9090/taskmanager/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        console.log("Login successful:", data);

        localStorage.setItem("token", data.token);

        if (data.username && data.username.trim() !== "") {
            localStorage.setItem("username", data.username);
        } else {
            localStorage.setItem("username", "İstifadəçi");
        }
        console.log(document.getElementById("username"));

        window.location.href = "index.html";

    } catch (error) {
        errorMessage.innerText = error.message;
    }
}



async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const passConfirm = document.getElementById("confirmPassword").value;
    const email = document.getElementById("email").value;
    const errorMessage = document.getElementById("errorMessage");

    if (password !== passConfirm) {
        errorMessage.innerText = "Passwords do not match!";
        return;
    }

    try {
        const response = await fetch("http://localhost:9090/taskmanager/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.text();

        if (!response.ok) {
            throw new Error(data || "Registration failed");
        }

        alert("Registration successful! Please check your email for confirmation.");
        window.location.href = "login.html";

    } catch (error) {
        errorMessage.innerText = error.message;
    }
}


fetchTasks();

