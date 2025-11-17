


const hiddenInput = document.querySelector('.hidden-input');
const editor = document.getElementById('editor');
const fileInput = document.getElementById('fileInput');


const languages = ['cpp','json'];
function populateDropdown() {
	const dropdown = document.getElementById('language-select');
	languages.forEach(lang => {
		const option = document.createElement('option');
		option.value = lang;
		option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1); // Capitalize for display
		dropdown.appendChild(option);
	});
}
populateDropdown();



let rules = [];
async function loadLanguage(languageName){
	let patternsMap = new Map();
	let operationsMap = new Map();
	let selectionsMap = new Map();
	if(!languageName){
		console.log("No language selected. Highlighting maps cleared.");
		return { patterns: patternsMap, operations: operationsMap, selections: selectionsMap};
	}
	
	try{
		const filePath = `./language/${languageName}.json`;
		const response = await fetch(filePath);
		
		if(!response.ok){
			throw new Error(`Failed to load ${languageName}.json: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if(data.patterns){
			for(const [key, value] of Object.entries(data.patterns)){
				patternsMap.set(key, value);
			}
		}
		if(data.operations){
			for(const [key, value] of Object.entries(data.operations)){
				operationsMap.set(key, value);
			}
		}
		if(data.selections){
			for(const [key, value] of Object.entries(data.selections)){
				selectionsMap.set(key, value);
			}
		}
		
		console.log(`${languageName} rules loaded.`);
		
		return { patterns: patternsMap, operations: operationsMap, selections: selectionsMap};
	}catch(error){
		console.error("Error loading language file:", error);
		return null;
	}
}
document.getElementById('language-select').addEventListener('change', async (event) => {
	const selectedLanguage = event.target.value;
	rules = await loadLanguage(selectedLanguage);
	if(rules){
		console.log("Rules loaded successfully:", rules);
	}
	updateText();
});
rules = await loadLanguage("");




function escapeHtml(text) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		'\t': '<span class="tab-arrow" style="color: #505050">───🢂</span>',
		' ': '<span class="space-dot" style="color: #505050">·</span>',
		'\n': '</br>'
	};
	return text.replace(/[&<>"'\t \n]/g, m => map[m]);
}
function isAlphanumeric(char) {
	return (char >= 'a' && char <= 'z') || 
		   (char >= 'A' && char <= 'Z') || 
		   (char >= '0' && char <= '9') || 
		   (char === '_');
}
function Lex(data) {
	const tokens = [];
	let index = 0;
	
	const sortedOperations = Array.from(rules.operations.keys()).sort((a, b) => b.length - a.length);
	
	while (index < data.length) {
		let matched = false;
		
		// --- 1. Check for Selections (Highest Priority) ---
		for(const [startDelimiter, [endDelimiter, color]] of rules.selections){
			if(data.substring(index).startsWith(startDelimiter)){
				const searchStart = index + startDelimiter.length;
				const endIndex = data.indexOf(endDelimiter, searchStart);
				if(endIndex !== -1) {
					const blockEnd = endIndex + endDelimiter.length;
					const block = data.substring(index, blockEnd);
					tokens.push({ type: 'selection', value: block, color: color });
					index = blockEnd;
					matched = true;
					break;
				}
			}
		}
		if(matched) continue;
		
		// --- 2. Check for Alphanumeric Patterns ---
		if(isAlphanumeric(data[index])){
			let word = '';
			let wordStart = index;
			while(index < data.length && isAlphanumeric(data[index])){
				word += data[index];
				index++;
			}
			const color = rules.patterns.get(word);
			if(color){
				tokens.push({ type: 'pattern', value: word, color: color });
			}else{
				tokens.push({ type: 'default', value: word });
			}
			matched = true;
		}
		if(matched) continue;
		
		// --- 3. Check for Operations ---
		for (const op of sortedOperations) {
			if (data.substring(index).startsWith(op)) {
				const color = rules.operations.get(op);
				tokens.push({ type: 'operation', value: op, color: color });
				index += op.length;
				matched = true;
				break;
			}
		}
		if (matched) continue;
		
		// --- 4. Default Case (Single Characters) ---
		tokens.push({ type: 'default', value: data[index] });
		index++;
	}
	//console.log(tokens);
	return tokens;
}

let cursorIndex = 0;
const cursorHtml = '<span id="cursor"></span>';
function renderTokens(tokens){
	let output = '';
	let charIndex = 0;
	
	for(const token of tokens){
		// Check if the cursor is within this token's range
		if (charIndex <= cursorIndex && cursorIndex < charIndex + token.value.length) {
			const preCursorText = token.value.substring(0, cursorIndex - charIndex);
			const postCursorText = token.value.substring(cursorIndex - charIndex);
			
			// Render the token in two parts with the cursor in between
			if (token.type === 'selection' || token.type === 'pattern' || token.type === 'operation') {
				output += `<span style="color: #${token.color}">${escapeHtml(preCursorText)}</span>`;
				output += cursorHtml;
				output += `<span style="color: #${token.color}">${escapeHtml(postCursorText)}</span>`;
			} else {
				// This is the default type
				output += escapeHtml(preCursorText);
				output += cursorHtml;
				output += escapeHtml(postCursorText);
			}
		} else {
			// Render the token as a single block since the cursor is not in it
			if (token.type === 'selection' || token.type === 'pattern' || token.type === 'operation') {
				output += `<span style="color: #${token.color}">${escapeHtml(token.value)}</span>`;
			} else {
				// This is the default type
				if (token.value === '\n') {
					output += '</br>';
				} else {
					output += escapeHtml(token.value);
				}
			}
		}
		charIndex += token.value.length;
	}
	
	if (charIndex === cursorIndex) {
		output += cursorHtml;
	}
	//console.log(output);
	return output;
}

function updateText(){
	const text = hiddenInput.value;
	const tokens = Lex(text);
	cursorIndex = hiddenInput.selectionEnd;
	const htmlStr = renderTokens(tokens);
	editor.innerHTML = htmlStr;
}


hiddenInput.addEventListener('input', () => {
	updateText();
});

editor.addEventListener('click', () => {
	hiddenInput.focus();
});

hiddenInput.addEventListener('keyup', updateText);
hiddenInput.addEventListener('keydown', function(event) {
	// Check for the Tab key
	if (event.key === 'Tab') {
		// Prevent the default browser behavior
		event.preventDefault();
		
		// Get the current cursor position
		const start = this.selectionStart;
		const end = this.selectionEnd;
		
		// Get the value before and after the cursor
		const before = this.value.substring(0, start);
		const after = this.value.substring(end, this.value.length);
		
		// Insert the tab character
		this.value = before + '\t' + after;
		
		// Move the cursor to the correct position after the tab
		this.selectionStart = this.selectionEnd = start + '\t'.length;
	}
	updateText();
});





const fileSelector = document.getElementById('file-selector');
let Files = [];
let currentFile = null;

function fileExist(filename){
	const found = Files.find(file => file.name === filename);
	return found !== undefined;
}
async function fileAdd(filename,content){
	if(fileExist(filename)) return;
	Files.push({name: filename, content: content, loaded: true, status: "unsaved"});
}
async function fileGet(filename){
	if(!fileExist(filename)) return null;
	let file = Files.find(file => file.name === filename);
	if(!file.loaded){
		console.log(file);
		file.content = await fileLoad(filename);
		file.loaded = true;
	}
	return file;
}
async function fileSave(filename){
	if(!fileExist(filename)) return;
	if(!db) await openDb();
	
	const transaction = db.transaction([STORE_NAME], 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	
	const file = await fileGet(filename);
	const request = store.put(file);
	
	request.onsuccess=()=>{
		let files = filesList();
		const found = files.find(file => file === filename);
		if(!found){
			files.push(filename);
			localStorage.setItem(STORED_FILES_KEY, JSON.stringify(files));
			localStorage.setItem(LAST_OPENED_KEY, filename);
			fileSelectUpdate();
		}
		file.status = "saved";
		console.log(`File '${filename}' saved.`);
	};
	request.onerror=(event)=>{ console.error('Save failed:',event.target.error); };
}
async function fileCurrent(filename){
	currentFile = await fileGet(filename);
	hiddenInput.value = currentFile.content;
	updateText();
}
function fileUpdate(){
	if(!currentFile) return;
	currentFile.content = hiddenInput.value;
}
async function fileMake(filename){
	if(fileExist(filename)) return;
	if(!currentFile){
		await fileAdd(filename,hiddenInput.value);
		await fileCurrent(filename);
	}else{
		fileUpdate();
		await fileAdd(filename,'hi');
		await fileCurrent(filename);
	}
}
function filesList(){
	const files = localStorage.getItem(STORED_FILES_KEY);
	return files ? JSON.parse(files) : [];
}
async function fileSelectUpdate(){
	
	fileSelector.innerHTML = '';
	Files.forEach(file => {
		const option = document.createElement('option');
		option.value = file.name;
		option.textContent = file.name;
		fileSelector.appendChild(option);
	});
	
	if(currentFile){
		fileSelector.value = currentFile.name;
	}
}
async function fileLoad(filename){
	if(!db) await openDb();
	
	const transaction = db.transaction([STORE_NAME], 'readonly');
	const store = transaction.objectStore(STORE_NAME);
	
	const request = store.get(filename);
	
	
	return new Promise((resolve, reject) => {
		request.onsuccess = async (event) => {
			const result = event.target.result;
			if(result){
				console.log(`File '${filename}' loaded from IndexedDB.`);
				await fileAdd(filename,result.content);
				let file = Files.find(file => file.name === filename);
				file.loaded = true;
				file.content = result.content;
				await fileCurrent(filename);
				resolve(result.content);
			} else {
				console.warn(`File '${filename}' not found in IndexedDB.`);
				resolve(null);
			}
		};
		
		request.onerror = (event) => {
			console.error('Load failed:', event.target.error);
			reject(event.target.error);
		};
	});
	
}
async function fileINIT(){
	const fileNames = filesList();
	
	for(let i=0;i<fileNames.length;i++){
		if(!fileExist(fileNames[i])){
			Files.push({name: fileNames[i], content: '', loaded: false, status: "saved"});
		}
	}
	
	await fileSelectUpdate();
	
	const lastOpenedFile = localStorage.getItem(LAST_OPENED_KEY);
	if(lastOpenedFile){
		const content = await fileLoad(lastOpenedFile);
		if(content !== null){
			hiddenInput.value = content;
			updateText();
			console.log(`Automatically loaded last opened file: ${lastOpenedFile}`);
			fileSelector.value = lastOpenedFile;
			await fileCurrent(lastOpenedFile);
		} else {
			localStorage.removeItem(LAST_OPENED_KEY);
			if(Files.length>0){ await fileCurrent(Files[0].name); }
			console.warn(`Last opened file '${lastOpenedFile}' not found. It may have been deleted.`);
		}
	}else{
		if(Files.length>0){ await fileCurrent(Files[0].name); }
	}
}



const DB_NAME = 'Editor';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const STORED_FILES_KEY = 'IDE-stored-files';
const LAST_OPENED_KEY = 'IDE-last-opened';
let db;
function openDb(){
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'name' });
			}
		};
		request.onsuccess = (event) => {
			db = event.target.result;
			console.log('Database opened successfully');
			resolve();
		};
		request.onerror = (event) => {
			console.error('Database error:', event.target.errorCode);
			reject(event.target.errorCode);
		};
	});
}


document.getElementById("newFileName").addEventListener("keydown", async function(event) {
	if(event.key === "Enter"){
		event.preventDefault(); 
		const filename = document.getElementById("newFileName").value
		
		await fileMake(filename);
		await fileSelectUpdate()
		console.log('new file:',currentFile.name);
	}
});

function showFilenamePopup() {
	return new Promise((resolve) => {
		const modal = document.getElementById('popup-nameFile');
		const closeBtn = document.getElementById('closebtn-nameFile');
		const input = document.getElementById('input-nameFile');
		const filenameInput = document.getElementById("input-nameFile");
		
		// Clear the input and any previous messages
		filenameInput.value = '';
		filenameInput.placeholder = 'Enter filename...';
		
		modal.style.display = 'block';
		
		// Event listener for the close button
		const handleClose = () => {
			modal.style.display = 'none';
			resolve(null); // Resolve with null to indicate cancellation
			cleanupListeners();
		};
		
		// Event listener for clicking outside the modal
		const handleOutsideClick = (event) => {
			if (event.target === modal) {
				modal.style.display = 'none';
				resolve(null);
				cleanupListeners();
			}
		};
		
		// Event listener for pressing the Enter key
		const handleKeyDown = (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				const filename = filenameInput.value.trim();
				
				if (filename === '') {
					filenameInput.placeholder = 'Filename cannot be empty!';
					return;
				}
				
				if (fileExist(filename)) {
					filenameInput.placeholder = 'File already exists.';
					return;
				}
				
				modal.style.display = 'none';
				resolve(filename); // Resolve the promise with the new filename
				cleanupListeners();
			}
		};
		
		// Attach event listeners
		closeBtn.addEventListener('click', handleClose);
		window.addEventListener('click', handleOutsideClick);
		input.addEventListener('keydown', handleKeyDown);
		
		// Helper function to remove event listeners and prevent memory leaks
		const cleanupListeners = () => {
			closeBtn.removeEventListener('click', handleClose);
			window.removeEventListener('click', handleOutsideClick);
			input.removeEventListener('keydown', handleKeyDown);
		};
	});
}
document.getElementById('saveFile').addEventListener('click', async () => {
	
	if(currentFile){
		fileUpdate();
		await fileSave(currentFile.name);
		return;
	}
	
	try{
		const filename = await showFilenamePopup();
		
		if(filename){
			await fileMake(filename);
			fileUpdate();
			await fileSave(filename);
		}else{
			console.log('File save operation canceled.');
		}
	}catch(error){
		console.error('Error during file save operation:', error);
	}
});
document.getElementById('file-selector').addEventListener('change', async (event) => {
	const filename = event.target.value;
	if(filename){
		if(fileExist(filename)){
			fileUpdate();
			await fileCurrent(filename);
			updateText();
			localStorage.setItem(LAST_OPENED_KEY, filename);
		}else{
			const files = filesList();
			const filteredFiles = files.filter(f => f !== filename);
			localStorage.setItem(STORED_FILES_KEY, JSON.stringify(filteredFiles));
			
			if(localStorage.getItem(LAST_OPENED_KEY) === filename){
				localStorage.removeItem(LAST_OPENED_KEY);
			}
			await fileSelectUpdate();
		}
	}
});

document.getElementById('downloadFile').addEventListener('click', async () => {
	fileUpdate();
	
	if(!currentFile){
		console.error("No content to download.");
		return;
	}
	
	const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	
	const link = document.createElement('a');
	link.href = url;
	link.download = currentFile.name;
	link.style.display = 'none';
	
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	
	URL.revokeObjectURL(url);
	console.log(`File '${currentFile.filename}' downloaded successfully.`);
	
});

function showDeleteConfirmation(filename) {
	return new Promise((resolve) => {
		const modal = document.getElementById('popup-deleteFile');
		// Assuming you have an element to display the filename being deleted
		const messageElement = modal.querySelector('.modal-message-text'); 
		
		const closeBtn = document.getElementById('closebtn-deleteFile');
		const yesBtn = document.getElementById('yes-deleteFile');
		const noBtn = document.getElementById('no-deleteFile');
		
		// Update the message text to confirm which file is being deleted
		if (messageElement) {
			 messageElement.textContent = `Are you sure you want to delete '${filename}'?`;
		}
		
		modal.style.display = 'block';
		
		// --- Listener Handlers ---
		
		const cleanupListeners = () => {
			closeBtn.removeEventListener('click', handleCancel);
			window.removeEventListener('click', handleOutsideClick);
			yesBtn.removeEventListener('click', handleYes);
			noBtn.removeEventListener('click', handleCancel);
		};
		
		const handleCancel = () => {
			modal.style.display = 'none';
			cleanupListeners();
			resolve(false); // Cancelled
		};
		
		const handleOutsideClick = (event) => {
			if (event.target === modal) {
				handleCancel();
			}
		};
		
		const handleYes = () => {
			modal.style.display = 'none';
			cleanupListeners();
			resolve(true); // Confirmed
		};
		
		// --- Attach Listeners ---
		closeBtn.addEventListener('click', handleCancel);
		window.addEventListener('click', handleOutsideClick);
		yesBtn.addEventListener('click', handleYes);
		noBtn.addEventListener('click', handleCancel);
	});
}
async function deleteRecord(filename){
	if(!db) await openDb();
	
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		
		const request = store.delete(filename);
		
		request.onerror = (event) => {
			console.error(`Error deleting record '${filename}':`, event.target.error);
			reject(event.target.error);
		};
		
		transaction.oncomplete = () => {
			console.log(`IndexedDB record for '${filename}' successfully deleted.`);
			resolve();
		};
		
		transaction.onerror = (event) => {
			 reject(event.target.error);
		};
		transaction.onabort = () => {
			 reject(new Error(`Transaction aborted during deletion of '${filename}'.`));
		};
	});
}
document.getElementById('deleteFile').addEventListener('click', async () => {
	if (!currentFile) return;
	
	const filename = currentFile.name;
	
	try {
		const confirmed = await showDeleteConfirmation(filename);
		
		if(confirmed){
			const index = Files.findIndex(file => file.name === filename);
			
			if(currentFile.status==="unsaved"){
				Files.splice(index, 1);
				console.log(`Successfully Deleted File: ${filename}`);
				if(Files.length>0){ await fileCurrent(Files[0].name); }
				await fileSelectUpdate();
				cleanupListeners();
				return;
			}else{
				const files = filesList();
				const filteredFiles = files.filter(f => f !== filename);
				localStorage.setItem(STORED_FILES_KEY, JSON.stringify(filteredFiles));
				
				if(localStorage.getItem(LAST_OPENED_KEY) === filename){
					localStorage.removeItem(LAST_OPENED_KEY);
				}
				
				Files.splice(index, 1);
				console.log(`Successfully Deleted File: ${filename}`);
				if(Files.length>0){ await fileCurrent(Files[0].name); }
				await fileSelectUpdate();
				await deleteRecord(filename);
			}
		}else{
			console.log('File deletion cancelled by user.');
		}
		
	} catch (error) {
		console.error('Error during file deletion operation:', error);
	}
});










fileInput.addEventListener('change', (event) => {
	const file = event.target.files[0];
	if(!file) return;
	
	const reader = new FileReader();
	
	reader.onload = async (e) => {
		const content = e.target.result;
		
		fileUpdate();
		await fileAdd(file.name,content);
		await fileCurrent(file.name);
		updateText();
		await fileSelectUpdate();
	};
	
	reader.readAsText(file); // Read the file as a text string
});


















await fileINIT();
