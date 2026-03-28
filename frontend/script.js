const API = "https://todo-app-k3pu.onrender.com/tasks";

const user_id = localStorage.getItem("user_id");
const username = localStorage.getItem("username");

if (!user_id) {
  window.location = "login.html";
}

// Welcome text
document.getElementById("welcomeText").innerText = "What's up, " + username + "!";

let chart;
let currentFilter = "all";

async function loadTasks() {
  const res = await fetch(`${API}/${user_id}`);
  const data = await res.json();
  render(data);
}

function render(tasks) {

  if (currentFilter !== "all") {
    tasks = tasks.filter(t => t.category === currentFilter);
  }

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  let business = 0;
  let personal = 0;
  let completed = 0;

  tasks.forEach(task => {

    if (task.category === "business") business++;
    else personal++;

    if (task.completed) completed++;

    const div = document.createElement("div");
    div.className = "task";

    div.innerHTML = `
      <div>
        <span class="circle ${task.completed ? "done" : ""}" onclick="toggle(${task.id})"></span>
        ${task.text}
      </div>
      <button onclick="removeTask(${task.id})">❌</button>
    `;

    list.appendChild(div);
  });

  document.getElementById("businessCount").innerText = business + " tasks";
  document.getElementById("personalCount").innerText = personal + " tasks";

  updateAnalytics(tasks, completed);
}

function updateAnalytics(tasks, completed) {
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressText").innerText = percent + "% Completed";

  const ctx = document.getElementById("taskChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, total - completed],
        backgroundColor: ["#ff00ff", "#4fc3f7"]
      }]
    }
  });
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const category = document.getElementById("category").value;

  if (!input.value.trim()) return;

  await fetch(API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      text: input.value,
      category: category,
      user_id: user_id
    })
  });

  input.value = "";
  loadTasks();
}

async function toggle(id) {
  await fetch(`${API}/${id}`, { method: "PUT" });
  loadTasks();
}

async function removeTask(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadTasks();
}

function toggleAnalytics() {
  document.getElementById("analyticsPanel").classList.toggle("hidden");
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}

function filterTasks(type) {
  currentFilter = type;
  loadTasks();
}

async function loadTemplate() {
  const templateTasks = [
    { text: "Team meeting", category: "business", user_id },
    { text: "Emails", category: "business", user_id },
    { text: "Workout", category: "personal", user_id }
  ];

  for (let task of templateTasks) {
    await fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(task)
    });
  }

  loadTasks();
}

loadTasks();