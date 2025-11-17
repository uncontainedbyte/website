


export function setup(){
	const savedTab = localStorage.getItem("active-tool");
	
	if (savedTab) {
		const savedBtn = document.querySelector(`.nav-bar button[data-tab="${savedTab}"]`);
		const savedTool = document.getElementById(savedTab);
		
		if (savedBtn && savedTool) {
			savedBtn.classList.add("active");
			savedTool.classList.add("active");
		}
	} else {
		const firstBtn = document.querySelector('.nav-bar button');
		const firstTool = document.querySelector('.tool');
		
		if (firstBtn) firstBtn.classList.add('active');
		if (firstTool) firstTool.classList.add('active');
	}
	
	document.querySelectorAll('.nav-bar button').forEach(btn => {
		btn.addEventListener('click', () => {
			const tab = btn.dataset.tab;
			
			if (tab === 'home') {
				window.location.href = "../index.html";
				return;
			}
			
			localStorage.setItem("active-tool", tab);
			
			document.querySelectorAll('.nav-bar button').forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
		
			document.querySelectorAll('.tool').forEach(div => div.classList.remove('active'));
			document.getElementById(tab).classList.add('active');
		});
	});
}









const listsContainer = document.querySelector("#lists");
const addListBtn = document.querySelector("#todo-add");
const tododownloadBtn = document.querySelector("#todo-download");
const todouploadBtn = document.querySelector("#todo-upload");
const lockBtn = document.querySelector("#todo-lock");
let locked = false;
function saveToLocal() {
	if (!listsContainer) return;
	
	const all = [...listsContainer.querySelectorAll(".todo-list")].map(list => {
		const name = list.querySelector(".list-name").value;
		
		const tasks = [...list.querySelectorAll(".task")].map(t => ({
			text: t.querySelector(".task-input, .task-input-done").value,
			done: t.querySelector("input[type='checkbox']").checked
		}));
		
		return { name, tasks };
	});
	
	const payload = {
		locked,
		lists: all
	};
	
	localStorage.setItem("todo-data", JSON.stringify(payload));
}
function loadFromLocal() {
	const raw = localStorage.getItem("todo-data");
	if (!raw) return false;
	
	try {
		const data = JSON.parse(raw);
		
		locked = data.locked ?? false;
		lockBtn.innerHTML = locked ? "<img src=\"small-tools-todo-locked.png\">" : "<img src=\"small-tools-todo-unlocked.png\">";
		
		listsContainer.innerHTML = "";
		
		for (const list of data.lists) {
			createList(list);
		}
		
		return true;
	} catch (e) {
		console.error("Failed to load todo lists:", e);
		return false;
	}
}
function updateCount(listElem) {
	const checkboxes = listElem.querySelectorAll(".task input[type='checkbox']");
	const done = [...checkboxes].filter(c => c.checked).length;
	const total = checkboxes.length;
	
	listElem.querySelector(".todo-count").textContent = `${done}/${total}`;
}
function bindTaskEvents(taskElem, listElem) {
	const checkbox = taskElem.querySelector("input[type='checkbox']");
	const deleteBtn = taskElem.querySelector("button");
	
	checkbox.addEventListener("change", () => {
		if (checkbox.checked) {
			const input = taskElem.querySelector(".task-input");
			input.classList.remove("task-input");
			input.classList.add("task-input-done");
		} else {
			const input = taskElem.querySelector(".task-input-done");
			input.classList.remove("task-input-done");
			input.classList.add("task-input");
		}
		
		updateCount(listElem);
		saveToLocal();
	});
	
	deleteBtn.addEventListener("click", () => {
		if (locked) return;
		taskElem.remove();
		updateCount(listElem);
		saveToLocal();
	});
}
function addTask(listElem) {
	const tasksContainer = listElem.querySelector(".tasks");
	
	const task = document.createElement("div");
	task.className = "task";
	task.innerHTML = `
		<input type="checkbox">
		<input class="task-input" type="text">
		<button>✖</button>
	`;
	
	tasksContainer.appendChild(task);
	bindTaskEvents(task, listElem);
	
	// Save typing in task input
	task.querySelector(".task-input").addEventListener("input", saveToLocal);
	
	updateCount(listElem);
	saveToLocal();
}
function bindListEvents(listElem) {
	const deleteListBtn = listElem.querySelector(".list-delete");
	const addItemBtn = listElem.querySelector(".add-item");
	const nameInput = listElem.querySelector(".list-name");
	
	deleteListBtn.addEventListener("click", () => {
		if (locked) return;
		if (!confirm("Are you sure you want to delete this list?")) return;
		listElem.remove();
		saveToLocal();
	});
	
	addItemBtn.addEventListener("click", () => {
		if (locked) return;
		addTask(listElem);
	});
	
	nameInput.addEventListener("input", saveToLocal);
	
	listElem.querySelectorAll(".task").forEach(task => {
		bindTaskEvents(task, listElem);
		task.querySelector(".task-input")?.addEventListener("input", saveToLocal);
	});
	
	updateCount(listElem);
}
function createList(initialData = null) {
	const listElem = document.createElement("div");
	listElem.className = "todo-list";
	listElem.innerHTML = `
		<div class="todo-list-body">
			<div class="todo-header">
				<div class="todo-count">0/0</div>
				<input class="list-name" type="text" value="${initialData?.name || ""}">
				<button class="list-delete" title="delete list">✖</button>
			</div>
			
			<div class="tasks"></div>
		</div>
		<button class="add-item"><strong>+</strong></button>
	`;
	
	listsContainer.appendChild(listElem);
	bindListEvents(listElem);
	
	if (initialData?.tasks) {
		for (const task of initialData.tasks) {
			addTask(listElem);
			const last = listElem.querySelector(".tasks").lastElementChild;
			last.querySelector(".task-input").value = task.text;
			last.querySelector("input[type='checkbox']").checked = task.done;
			const input = last.querySelector(".task-input");
			if (task.done) {
				input.classList.remove("task-input");
				input.classList.add("task-input-done");
			}
		}
		updateCount(listElem);
	}

	saveToLocal();
}
tododownloadBtn.addEventListener("click", () => {
	const raw = localStorage.getItem("todo-data") ?? "{}";
	
	const blob = new Blob([raw], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	
	const a = document.createElement("a");
	a.href = url;
	a.download = "todo-lists.json";
	a.click();
	
	URL.revokeObjectURL(url);
});
todouploadBtn.addEventListener("click", () => {
	if (locked) return;
	
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".json";
	
	input.onchange = () => {
		const file = input.files[0];
		const reader = new FileReader();
		
		reader.onload = () => {
			try {
				localStorage.setItem("todo-data", reader.result);
				listsContainer.innerHTML = ""; // reset UI
				loadFromLocal(); // load new data
			} catch {
				alert("Invalid file format.");
			}
		};
		
		reader.readAsText(file);
	};
	
	input.click();
});
lockBtn.addEventListener("click", () => {
	locked = !locked;
	lockBtn.innerHTML = locked ? "<img src=\"small-tools-todo-locked.png\">" : "<img src=\"small-tools-todo-unlocked.png\">";
	saveToLocal();
});
addListBtn.addEventListener("click", () => {
	if (locked) return;
	createList();
});
if (!loadFromLocal()) {
	// If no save, bind the list that exists in HTML
	const defaultList = listsContainer.querySelector(".todo-list");
	if (defaultList) bindListEvents(defaultList);
}
















































const alarmSound = new Audio("small-tools-time-alarm.wav");
alarmSound.preload = "auto";

const pomoWork = document.getElementById('pomo-work');
const pomoBreak = document.getElementById('pomo-break');
const pomoDisplay = document.getElementById('pomo-display');
const pomoToggle = document.getElementById('pomo-toggle');
const pomoReset = document.getElementById('pomo-reset');
const pomoIcon = document.getElementById('pomo-icon');
let pomoTimer = null;
let pomoRemaining = 0;
let pomoMode = 'work';
let pomoRunning = false;
function loadPomoSettings() {
	pomoWork.value = localStorage.getItem('pomo_work') || 25;
	pomoBreak.value = localStorage.getItem('pomo_break') || 5;
}
loadPomoSettings();
function savePomoSettings() {
	localStorage.setItem('pomo_work', pomoWork.value);
	localStorage.setItem('pomo_break', pomoBreak.value);
}
function pomoFormat(sec) {
	const m = String(Math.floor(sec / 60)).padStart(2, '0');
	const s = String(sec % 60).padStart(2, '0');
	return `${m}:${s}`;
}
function startPomoPeriod() {
	pomoMode = pomoMode === 'work' ? 'work' : 'break';
	pomoRemaining = (pomoMode === 'work' ? pomoWork.value : pomoBreak.value) * 60;
	pomoDisplay.textContent = pomoFormat(pomoRemaining);
}
pomoWork.addEventListener('input', () => {
	savePomoSettings();
	
	if(!pomoRunning){
		pomoMode = "work";
		pomoRemaining = pomoWork.value * 60;
		pomoDisplay.textContent = pomoFormat(pomoRemaining);
	}
});
pomoBreak.addEventListener('input', () => {
	savePomoSettings();
	
	if(!pomoRunning){
		pomoMode = "work";
	}
});
pomoToggle.addEventListener('click', () => {
	if(!pomoRunning){
		pomoIcon.src = "small-tools-time-pause.png";
		if(pomoRemaining <= 0){
			startPomoPeriod();
		}
		pomoRunning = true;
		pomoTimer = setInterval(() => {
			pomoRemaining--;
			
			if(pomoRemaining <= 0){
				alarmSound.play();
				pomoMode = pomoMode === 'work' ? 'break' : 'work';
				startPomoPeriod();
			}
			
			pomoDisplay.textContent = pomoFormat(pomoRemaining);
			
		}, 1000);
		
	} else {
		pomoRunning = false;
		pomoIcon.src = "small-tools-time-play.png";
		clearInterval(pomoTimer);
	}
});
pomoReset.addEventListener('click', () => {
	clearInterval(pomoTimer);
	pomoRunning = false;
	startPomoPeriod();
	pomoIcon.src = "small-tools-time-play.png";
});
startPomoPeriod();






const stdHours = document.getElementById('std-hours');
const stdMins = document.getElementById('std-minutes');
const stdSecs = document.getElementById('std-seconds');
const stdDisplay = document.getElementById('std-display');
const stdToggle = document.getElementById('std-toggle');
const stdReset = document.getElementById('std-reset');
const stdIcon = document.getElementById('std-icon');
let stdTimer = null;
let stdRunning = false;
let stdCountdown = true;
let stdTotalSeconds = 0;
function loadStdSettings() {
	stdHours.value = localStorage.getItem('std_h') || 0;
	stdMins.value = localStorage.getItem('std_m') || 0;
	stdSecs.value = localStorage.getItem('std_s') || 0;
}
loadStdSettings();
function saveStdSettings() {
	localStorage.setItem('std_h', stdHours.value);
	localStorage.setItem('std_m', stdMins.value);
	localStorage.setItem('std_s', stdSecs.value);
	
	stdRunning = false;
	clearInterval(stdTimer);
	loadStdValue();
}
stdHours.addEventListener('input', saveStdSettings);
stdMins.addEventListener('input', saveStdSettings);
stdSecs.addEventListener('input', saveStdSettings);
function stdFormat(sec) {
	const h = String(Math.floor(sec / 3600)).padStart(2, '0');
	const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
	const s = String(sec % 60).padStart(2, '0');
	return `${h}:${m}:${s}`;
}
function loadStdValue() {
	const h = Number(stdHours.value);
	const m = Number(stdMins.value);
	const s = Number(stdSecs.value);
	stdTotalSeconds = h * 3600 + m * 60 + s;
	
	stdCountdown = stdTotalSeconds !== 0;
	stdDisplay.textContent = stdFormat(stdTotalSeconds);
}
loadStdValue();
stdToggle.addEventListener('click', () => {
	if(!stdRunning){
		stdRunning = true;
		stdIcon.src = "small-tools-time-pause.png";
		stdTimer = setInterval(() => {
			if(stdCountdown){
				stdTotalSeconds--;
				if(stdTotalSeconds <= 0){
					alarmSound.play();
					stdTotalSeconds = 0;
					stdDisplay.textContent = stdFormat(loadStdValue());
					clearInterval(stdTimer);
					stdRunning = false;
					stdIcon.src = "small-tools-time-play.png";
				}
			}else{
				stdTotalSeconds++;
			}
			
			stdDisplay.textContent = stdFormat(stdTotalSeconds);
			
		}, 1000);
		
	}else{
		stdRunning = false;
		stdIcon.src = "small-tools-time-play.png";
		clearInterval(stdTimer);
	}
});
stdReset.addEventListener('click', () => {
	stdRunning = false;
	clearInterval(stdTimer);
	stdIcon.src = "small-tools-time-play.png";
	loadStdValue();
});







const noteArea = document.getElementById('note-area');
const titleDisplay = document.getElementById('note-title');
const prevBtn = document.getElementById('prev-note');
const nextBtn = document.getElementById('next-note');
const newBtn = document.getElementById('new-note');
const renameBtn = document.getElementById('rename-note');
const deleteBtn = document.getElementById('delete-note');
const downloadBtn = document.getElementById('download-note');
const uploadBtn = document.getElementById('upload-note');
const fileInput = document.getElementById('note-file-input');



const NOTES_KEY = 'toolbox_notes_multi';

// Load notes or default
let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || [
	{ title: 'Note', content: '' }
];
let currentIndex = 0;

// Save to localStorage
function saveNotes() {
	localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// Display current note
function showNote() {
	const note = notes[currentIndex];
	titleDisplay.textContent = note.title;
	noteArea.value = note.content;
	saveNotes();
}

// Auto-save content
noteArea.addEventListener('input', () => {
	notes[currentIndex].content = noteArea.value;
	saveNotes();
});

// Navigation
prevBtn.addEventListener('click', () => {
	currentIndex = (currentIndex - 1 + notes.length) % notes.length;
	showNote();
});

nextBtn.addEventListener('click', () => {
	currentIndex = (currentIndex + 1) % notes.length;
	showNote();
});

// New note
newBtn.addEventListener('click', () => {
	const name = prompt('Enter note name:') || `Note ${notes.length + 1}`;
	notes.push({ title: name, content: '' });
	currentIndex = notes.length - 1;
	showNote();
});

// Rename note
renameBtn.addEventListener('click', () => {
	const newName = prompt('Rename note:', notes[currentIndex].title);
	if (newName) {
	notes[currentIndex].title = newName;
	showNote();
	}
});

deleteBtn.addEventListener('click', () => {
	if (notes.length === 1) {
	if (confirm('Delete the only note? It will be cleared.')) {
	  notes[0] = { title: 'Note 1', content: '' };
	  currentIndex = 0;
	} else return;
	} else if (confirm(`Delete "${notes[currentIndex].title}"?`)) {
	notes.splice(currentIndex, 1);
	currentIndex = Math.max(0, currentIndex - 1);
	}
	showNote();
});

// Download
downloadBtn.addEventListener('click', () => {
	const note = notes[currentIndex];
	const blob = new Blob([note.content], { type: 'text/plain' });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = `${note.title}.txt`;
	a.click();
	URL.revokeObjectURL(a.href);
});

// Upload
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = ev => {
	notes.push({ title: file.name.replace('.txt', ''), content: ev.target.result });
	currentIndex = notes.length - 1;
	showNote();
	};
	reader.readAsText(file);
});

showNote(); // initial display
































