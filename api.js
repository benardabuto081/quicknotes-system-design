const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Elements
const loadBtn = document.getElementById("load-btn");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const notesList = document.getElementById("notes-list");

// Helper function to update status banner messages
function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = type; // 'success' or 'error'
}

// Reusable async request function with error checking
async function request(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Return both data and status code for comprehensive messaging
    const data = await response.json().catch(() => ({}));
    return { data, status: response.status };
}

// Render notes securely using textContent to prevent XSS vulnerabilities
function renderNotes(notes) {
    notesList.innerHTML = "";
    
    if (!notes || notes.length === 0) {
        const emptyLi = document.createElement("li");
        emptyLi.className = "empty-state";
        emptyLi.textContent = "No notes available.";
        notesList.appendChild(emptyLi);
        return;
    }

    notes.forEach(note => {
        const li = document.createElement("li");
        li.className = "note-item";
        li.dataset.id = note.id;

        const contentDiv = document.createElement("div");
        contentDiv.className = "note-content";

        const h3 = document.createElement("h3");
        h3.textContent = note.title; // Safe against injection

        const p = document.createElement("p");
        p.textContent = note.body || ""; // Safe against injection

        contentDiv.appendChild(h3);
        contentDiv.appendChild(p);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteNote(note.id, li));

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        notesList.appendChild(li);
    });
}

// Task 1: GET (Load notes)
async function loadNotes() {
    loadBtn.disabled = true;
    showStatus("Loading notes...", "success");

    try {
        const { data } = await request(`${API_URL}?_limit=10`);
        renderNotes(data);
        showStatus(`Loaded ${data.length} notes from the server.`, "success");
    } catch (error) {
        console.error("Failed to load notes:", error);
        showStatus("Failed to load notes. Please check your network connection.", "error");
        renderNotes([]); // Show empty/error state gracefully
    } finally {
        loadBtn.disabled = false;
    }
}

// Task 2: POST (Create note)
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validation check
    if (!title) {
        showStatus("Note title is required.", "error");
        return;
    }
    if (title.length > 100) {
        showStatus("Note title cannot exceed 100 characters.", "error");
        return;
    }

    submitBtn.disabled = true;
    showStatus("Creating note...", "success");

    try {
        const payload = { title, body, userId: 1 };
        const { data, status } = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify(payload)
        });

        // Prepend new note locally to the UI list
        const existingItems = notesList.querySelectorAll(".note-item");
        // Remove empty state placeholder if present
        if (notesList.querySelector(".empty-state")) {
            notesList.innerHTML = "";
        }

        const newNoteObj = { id: data.id || Date.now(), title: payload.title, body: payload.body };
        
        // Create element for new note
        const li = document.createElement("li");
        li.className = "note-item";
        li.dataset.id = newNoteObj.id;

        const contentDiv = document.createElement("div");
        contentDiv.className = "note-content";
        const h3 = document.createElement("h3");
        h3.textContent = newNoteObj.title;
        const p = document.createElement("p");
        p.textContent = newNoteObj.body;
        contentDiv.appendChild(h3);
        contentDiv.appendChild(p);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteNote(newNoteObj.id, li));

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        notesList.insertBefore(li, notesList.firstChild);

        noteForm.reset();
        showStatus(`Note created (status ${status}, id ${newNoteObj.id}).`, "success");
    } catch (error) {
        console.error("Failed to create note:", error);
        showStatus("Failed to create note. Please try again.", "error");
    } finally {
        submitBtn.disabled = false;
    }
}

// Task 3: DELETE (Remove note)
/* 
  Approach Note regarding JSONPlaceholder behavior:
  JSONPlaceholder simulates resource deletion and returns status 200/204, but it 
  does NOT permanently mutate server data. If a user deletes a note that was pre-loaded 
  from the initial GET fetch, we remove it directly from the local DOM tree using `li.remove()`. 
  For dynamically created posts, they exist only in client state / mock memory anyway, 
  so removing the element ensures instant UI feedback matching user expectations.
*/
async function deleteNote(id, listItemElement) {
    const deleteButton = listItemElement.querySelector(".delete-btn");
    deleteButton.disabled = true;

    try {
        await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // Remove from DOM successfully
        listItemElement.remove();
        
        // Check if list is empty now
        if (notesList.children.length === 0) {
            renderNotes([]);
        }
        
        showStatus(`Note ${id} deleted successfully.`, "success");
    } catch (error) {
        console.error(`Failed to delete note ${id}:`, error);
        showStatus("Failed to delete note from server.", "error");
        deleteButton.disabled = false;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
