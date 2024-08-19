const tasks = [
    { id: "task1", total: 5, name: "Explore 5 New Areas" },
    { id: "task2", total: 10, name: "Collect 10 Rock Samples" },
    { id: "task3", total: 1, name: "Make a working program" },
    { id: "task4", total: 1, name: "Establish Communication Link" },
    { id: "task5", total: 3, name: "Analyze Soil Samples" },
];

function setCookie(name, value, days) {
    console.log("Setting cookie", name, value, days);
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || 0) + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function checkCookie(name) {
    return getCookie(name) !== null;
}

function initializeTasks() {
    tasks.forEach((task) => {
        if (!checkCookie(task.id)) {
            setCookie(task.id, 0, 365);
        }
    });
}

function getTaskProgress(taskId) {
    const progress = getCookie(taskId);
    return isNaN(parseInt(progress)) ? 0 : parseInt(progress);
}

function updateTaskProgress(taskId, progress) {
    try {
        setCookie(taskId, progress, 365);
        updateTrackerUI();
        checkAndShowAchievements();
    } catch (error) {
        console.error("Error updating task progress:", error);
    }
}

function saveDividerPosition(position) {
    setCookie("dividerPosition", position, 365);
}

function getDividerPosition() {
    return getCookie("dividerPosition") || "50%";
}

function updateTrackerUI() {
    const todoList = document.querySelector(".goal-list-todo");
    const completedList = document.querySelector(".goal-list-completed");

    completedList.innerHTML = "<li><strong>Completed:</strong></li><br>";

    tasks.forEach((task) => {
        const progress = getTaskProgress(task.id);
        const isCompleted = progress >= task.total;
        const listItem = document.createElement("li");
        listItem.className = "goal-item";
        listItem.id = task.id;
        
        listItem.innerHTML = `
            <div class="goal-title">${task.name} | ${progress}/${task.total} complete</div>
            <div class="goal-progress">
                <div class="progress-bar" style="width: ${(progress / task.total) * 100}%;"></div>
            </div>
        `;

        if (isCompleted) {
            completedList.appendChild(listItem);
        } else {
            todoList.appendChild(listItem);
        }
    });
}

function showNotification(task) {
    const container = document.getElementById("notification-container");

    const notification = document.createElement("div");
    notification.className = "notification";
    
    notification.innerHTML = `
        <div class="achievement-title">Achievement Unlocked</div>
        <div class="achievement-description">${task.total}/${task.total} ${task.name}</div>
    `;
    
    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 10000);
}

function checkAndShowAchievements() {
    tasks.forEach(task => {
        const progress = getTaskProgress(task.id);
        if (progress >= task.total && !checkCookie(task.id + "_completed")) {
            setCookie(task.id + "_completed", true, 365);
            showNotification(task);
        }
    });
}

window.addEventListener("load", function () {
    initializeTasks();
    updateTrackerUI();
});
