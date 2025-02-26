const taskModal = document.getElementById("taskModal");
const taskDetailsModal = document.getElementById("taskDetailsModal");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskListElement = document.getElementById("taskList");
let tasks = [];
let editTaskId = null;


document.addEventListener("DOMContentLoaded", function () {
    const usernameElement = document.getElementById("username");
    if (usernameElement) {
        const username = localStorage.getItem("username") || "Qonaq";
        usernameElement.textContent = username;
    }

    if (!window.location.href.includes("login.html")) {
        fetchTasks();
    }
});



async function fetchTasks() {
    const token = localStorage.getItem("token");

    if (!token && !window.location.href.includes("register.html")) {
        console.warn("Token tapılmadı! Login səhifəsinə yönləndirilir...");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:9090/taskmanager/tasks/all", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            }
        });

        if (response.status === 401) {
            console.warn("Token müddəti bitib və ya səhvdir! Login səhifəsinə yönləndirilir...");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error("Məlumatları əldə etmək mümkün olmadı");

        let data = await response.json();

        if (!Array.isArray(data)) {
            console.error("Gələn data array formatında deyil!", data);
            tasks = []; 
        } else {
            
            tasks = data
                .filter(task => task !== null)
                .map(task => ({
                    id: task.id,
                    title: task.title || "Untitled Task",
                    description: task.description || "No Description",
                    completed: task.completed || false
                }));
        }

        renderTasks(tasks);
    } catch (error) {
        console.error("Xəta:", error.message);
    }
}



function renderTasks(taskList) {
    console.log("Gələn taskList:", taskList);

    if (!taskList || !Array.isArray(taskList)) {
        console.error("taskList düzgün massiv deyil!", taskList);
        return;
    }

    if (!taskListElement) {
        console.error("taskListElement tapılmadı!");
        return;
    }

    taskListElement.innerHTML = "";
    taskList.forEach((task) => {
        if (!task || !task.title) {
            console.warn("Boş və ya səhv formatda task aşkarlandı:", task);
            return;
        }

        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        if (task.completed) {
            taskElement.classList.add("completed");
        }

        taskElement.innerHTML = `
            <div onclick="showTaskDetails(${task.id})">
                <p class="task-title">${task.title || "Untitled Task"}</p>
                <p class="task-description">${task.description || "No Description"}</p>
            </div>
            <div class="task-actions">
                <input
                    type="checkbox"
                    id="checkbox-${task.id}"
                    ${task.completed ? "checked" : ""}
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



async function saveTask() {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    if (!title || !description) {
        alert("Task title and description cannot be empty!");
        return;
    }

    const task = { title, description };
    const token = localStorage.getItem("token");

    const url = editTaskId === null
        ? "http://localhost:9090/taskmanager/tasks/create"
        : `http://localhost:9090/taskmanager/tasks/update/${editTaskId}`;
    const method = editTaskId === null ? "POST" : "PUT";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(task),
        });

        if (!response.ok) throw new Error("Task saxlanmadı!");

        const savedTask = await response.json();
        console.log("Yeni yaradılmış task:", savedTask);

        setTimeout(fetchTasks, 500);
        closeCreateEditModal();
    } catch (error) {
        console.error("Error:", error);
    }
}



async function deleteTask(taskId) {
    if (!confirm("Bu tapşırığı silmək istədiyinizə əminsiniz?")) return;

    try {
        const response = await fetch(`http://localhost:9090/taskmanager/tasks/${taskId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) throw new Error("Task silinmədi!");

        await fetchTasks();
    } catch (error) {
        console.error("Xəta baş verdi:", error);
    }
}

async function toggleTaskCompletion(taskId, checkbox) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) throw new Error("Task tapılmadı!");

        const updatedTask = {
            id: task.id,
            title: task.title,
            description: task.description,
            completed: checkbox.checked
        };

        const response = await fetch(`http://localhost:9090/taskmanager/tasks/update/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) throw new Error("Taskın tamamlanma statusu yenilənmədi!");

    
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        }
    } catch (error) {
        console.error("Error:", error);
        checkbox.checked = !checkbox.checked;
    }
}




function showTaskDetails(taskId) {
    const task = tasks.find((task) => task.id === taskId);
    if (!task) return;

    document.getElementById("modalTaskTitle").textContent = task.title;
    document.getElementById("modalTaskDescription").textContent = task.description;
    document.getElementById("modalTaskStatus").textContent = task.completed ? "Completed" : "Not Completed";
    taskDetailsModal.style.display = "flex";
}

function openCreateModal() {
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    editTaskId = null;
    taskModal.style.display = "flex";
}

function closeCreateEditModal() { taskModal.style.display = "none"; }
function closeDetailsModal() { taskDetailsModal.style.display = "none"; }

function searchTasks() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.querySelector("input[name='statusFilter']:checked").value;

    let filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) || task.description.toLowerCase().includes(searchTerm)
    );

    if (statusFilter !== "all") {
        const isCompleted = statusFilter === "completed";
        filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
    }

    renderTasks(filteredTasks);
}

function logout() {
    fetch('http://localhost:9090/taskmanager/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    }).then(response => {
        if (response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');

            window.location.href = 'http://localhost:63342/taskmanager/static/login.html';
        } else {
            console.error("Logout failed");
        }
    }).catch(error => console.error("Error:", error));
}

let failedAttempts = 0;

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:9090/taskmanager/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            failedAttempts++;
            document.getElementById("errorMessage").style.display = "block";

            if (failedAttempts >= 3) {
                document.getElementById("forgot-password").style.display = "block";
            }
        } else {
            failedAttempts = 0;
            const data = await response.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            console.log("Login successful:", data);

            window.location.href = "http://localhost:63342/taskmanager/static/index.html";
        }
    } catch (error) {
        console.error("Xəta:", error);
    }
}


function forgotPassword() {
    const email = prompt("Emailinizi daxil edin:");
    if (email) {
        fetch("http://localhost:9090/taskmanager/password/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        }).then(() => alert("Email göndərildi!"))
            .catch(() => alert("Xəta baş verdi!"));
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

function openPasswordModal() {
    document.getElementById("passwordModal").style.display = "block";
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
}

async function updatePassword() {
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert("Bütün sahələri doldurun!");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert("Yeni parollar uyğun gəlmir!");
        return;
    }

    try {
        const response = await fetch("http://localhost:9090/taskmanager/auth/update-password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.text();

        if (!response.ok) {
            throw new Error(result || "Parol dəyişdirilmədi!");
        }

        alert("Parol uğurla dəyişdirildi!");
        closePasswordModal();
    } catch (error) {
        alert(error.message);
    }
}
