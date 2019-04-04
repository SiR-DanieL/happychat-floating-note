// ==UserScript==
// @name         Happychat Floating Note
// @namespace    https://github.com/samiff/happychat-floating-note
// @version      1.1.1
// @description  Creates a floating note entry for each Happychat.
// @author       samifett
// @downloadURL  none
// @grant        none
// @match        https://hud.happychat.io/*
// ==/UserScript==

// Script Options - Customize Me!
const options = {
    NOTE_TOGGLE_BTN_TXT: '👻 Floating Note',
    NOTE_TEMPLATE: '', // Customize a new note's starting text, or leave blank. Use "\n" for line breaks.
    STYLE: {
        NOTE_BACKGROUND_COLOR: '#fff59d',
        NOTE_TEXT_COLOR: '#2e4453',
        NOTE_WIDTH: '340px',
        NOTE_FONT_SIZE: '16px'
    },
    USE_GRAMMARLY: false, // Changing this to true wiil enable Grammarly for note input, but there bugs with that.
    LOCAL_STORAGE_KEY: 'hcfn_', // Locale storage key prefix
    NS: 'hcfn-', // CSS namespace prefix
    STORAGE_FLUSH_INTERVAL_MS: 86400000 // 24 hours
};

// Script state
const state = {
    activeChatId: null,
    noteIsOpen: false,
    noteRef: null,
    noteInputRef: null
};

// Monkey patch history.pushState() so we can see URL changes in the SPA
const pushState = history.pushState;
history.pushState = function () {
    pushState.apply(history, arguments);
    handleNoteClose();
};

// Attach floating note element to page, attach listeners, and store element references
const floatingNoteHtml = `
<div class="${options.NS}note">
    <div class="${options.NS}note__container-inner">
        <textarea class="${options.NS}note__input" data-enable-grammarly="${options.USE_GRAMMARLY}"></textarea>
        <div class="${options.NS}note__controls">
            <div class="${options.NS}note__controls__control-container">
                <button class="${options.NS}note__controls__control ${options.NS}note__controls__close">Close</button>
            </div>
            <div class="${options.NS}note__controls__control-container">
                <button class="${options.NS}note__controls__control ${options.NS}note__controls__send">Send</button>
            </div>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', floatingNoteHtml);
document.getElementsByClassName(`${options.NS}note__controls__close`)[0]
    .onclick = handleNoteClose;
document.getElementsByClassName(`${options.NS}note__controls__send`)[0]
    .onclick = window._.throttle(handleNoteSend, 500, { 'trailing': false });
state.noteRef = document.getElementsByClassName(`${options.NS}note`)[0];
state.noteInputRef = document.getElementsByClassName(`${options.NS}note__input`)[0];

// Attach the note toggle button near the "+1" button
const attachNoteToggleBtnIntervalId = window.setInterval(() => {
    if (document.getElementsByClassName('chat-list__title-bar')[0]) {
        const noteToggleBtnHtml = `<button class="${options.NS}note-toggle-btn"`
            + `title="Click to toggle floating note for active chat">${options.NOTE_TOGGLE_BTN_TXT}</button>`;
        document.getElementsByClassName('chat-list__title-bar')[0]
            .insertAdjacentHTML('afterend', noteToggleBtnHtml);
        document.getElementsByClassName(`${options.NS}note-toggle-btn`)[0]
            .onclick = handleNoteToggleBtnClicked;
        window.clearInterval(attachNoteToggleBtnIntervalId);
    }
}, 150);

// Initialize localStorage and flushes it out periodically
function initializeLocalStorage() {
    let storedChatIds = localStorage.getItem(`${options.LOCAL_STORAGE_KEY}chatIds`);

    if (!storedChatIds) {
        // Initialize local storage if it doesn't exist
        localStorage.setItem(`${options.LOCAL_STORAGE_KEY}chatIds`, JSON.stringify({ resetTimestamp: Date.now() }));
    } else {
        storedChatIds = JSON.parse(storedChatIds);
        if (Date.now() > (parseInt(storedChatIds.resetTimestamp) + options.STORAGE_FLUSH_INTERVAL_MS)) {
            localStorage.setItem(`${options.LOCAL_STORAGE_KEY}chatIds`, JSON.stringify({ resetTimestamp: Date.now() }));
        }
    }
}
initializeLocalStorage();

// Opens and closes note for an active chat
function handleNoteToggleBtnClicked() {
    if (!state.noteIsOpen) {
        const chatId = getActiveChatId();
        if (chatId) {
            const noteData = getNoteDataByChatId(chatId);
            state.noteInputRef.value = noteData.note;
            state.noteRef.classList.toggle(`${options.NS}note--is-visible`);
            state.noteIsOpen = !state.noteIsOpen;
            state.activeChatId = chatId;
        }
    } else {
        handleNoteClose();
    }
}

// Returns active chat ID from URL
function getActiveChatId() {
    let chatId = null;
    const path = location.pathname.split('/');

    if (path[1] === 'chat' && path[2]) {
        chatId = path[2];
    }

    return chatId;
}

// Returns stored note data
function getNoteDataByChatId(chatId) {
    let noteData = null;
    const storedChatIds = JSON.parse(localStorage.getItem(`${options.LOCAL_STORAGE_KEY}chatIds`));

    if (storedChatIds.hasOwnProperty(chatId)) {
        noteData = storedChatIds[chatId];
    } else {
        const username = document.querySelector('.user-data-panel__login input') ?
            document.querySelector('.user-data-panel__login input').value : 'Not captured.'; // May not be in DOM yet
        noteData = {
            username,
            createdAt: new Date(Date.now()).toLocaleString(),
            note: options.NOTE_TEMPLATE,
        };

        handleNoteSave(chatId, noteData);
    }

    return noteData;
}

// Saves note data to browser's local storage
function handleNoteSave(chatId, noteData) {
    const storedChatIds = JSON.parse(localStorage.getItem(`${options.LOCAL_STORAGE_KEY}chatIds`));

    if (!storedChatIds.hasOwnProperty(chatId)) {
        storedChatIds[chatId] = noteData;
    } else {
        storedChatIds[chatId].note = state.noteInputRef.value;
    }

    localStorage.setItem(`${options.LOCAL_STORAGE_KEY}chatIds`, JSON.stringify(storedChatIds));
}

// Notes are saved when they are closed
function handleNoteClose() {
    if (state.noteIsOpen) {
        const noteData = getNoteDataByChatId(state.activeChatId);
        handleNoteSave(state.activeChatId, noteData);
        state.noteRef.classList.remove(`${options.NS}note--is-visible`);
        state.noteIsOpen = false;
        state.activeChatId = null;
    }
}

// Submits note data to an active chat
function handleNoteSend() {
    const happychatCompose = document.querySelector('.chat-actions__current-chat-action-compose textarea');
    if (happychatCompose) {
        const noteMessage = '/note ' + state.noteInputRef.value;
        happychatCompose.value = noteMessage;

        const syntehticChangeEvent = new Event('input', { bubbles: true });
        syntehticChangeEvent.simulated = true;
        const syntehticKeyboardEvent = new KeyboardEvent('keydown', { bubbles: true, keyCode: 13 });
        syntehticKeyboardEvent.simulated = true;
        happychatCompose.dispatchEvent(syntehticChangeEvent);
        happychatCompose.dispatchEvent(syntehticKeyboardEvent);

        const storedChatIds = JSON.parse(localStorage.getItem(`${options.LOCAL_STORAGE_KEY}chatIds`));
        storedChatIds[state.activeChatId] = undefined;
        localStorage.setItem(`${options.LOCAL_STORAGE_KEY}chatIds`, JSON.stringify(storedChatIds));
        state.noteRef.classList.remove(`${options.NS}note--is-visible`);
        state.noteIsOpen = false;
        state.activeChatId = null;
    }
}

// Styles that are specific to Happychat Floating Note
const styles = `
<style type="text/css">
.${options.NS}note-toggle-btn {
    margin: 0;
    margin-bottom: 14px;
    width: 100%;
}

.${options.NS}note {
    position: fixed;
    z-index: 9999;
    top: 0;
    right: -${options.STYLE.NOTE_WIDTH};
    height: 100%;
    width: ${options.STYLE.NOTE_WIDTH};
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: right .5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.${options.NS}note--is-visible {
    right: 0;
}

.${options.NS}note__container-inner {
    height: 95%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px 0 rgba(60,64,67,0.302), 0 4px 8px 3px rgba(60,64,67,0.149);
}

.${options.NS}note__input {
    flex: 1;
    background: ${options.STYLE.NOTE_BACKGROUND_COLOR};
    color: ${options.STYLE.NOTE_TEXT_COLOR};
    font-size: ${options.STYLE.NOTE_FONT_SIZE};
    padding: 12px;
    resize: none;
    border: none;
    outline: none;
}

.${options.NS}note__controls {
    display: flex;
    background: ${options.STYLE.NOTE_BACKGROUND_COLOR};
}

.${options.NS}note__controls__control-container {
    width: 50%;
    padding: 8px 16px;
}

.${options.NS}note__controls__control {
    width: 100%;
    height: 100%;
}
</style>
`;

// Attach styles to <head>
document.head.insertAdjacentHTML('beforeend', styles);
