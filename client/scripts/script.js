import bot from "../assets/ai.ico";
import user from "../assets/user.svg";
import done from "../assets/done.svg";
import edit from "../assets/edit.svg";
import deleteImg from "../assets/delete.svg";
import close from "../assets/close.svg";
import minimize from "../assets/minimize.svg";
import expand from "../assets/expand.svg";
import chat from "../assets/chat.svg";

// Preloading images
var images = [bot, user, done, edit, deleteImg, close, minimize, expand, chat];
function preload() {
    for (var i = 0; i < arguments.length; i++) {
        images[i] = new Image();
        images[i].src = preload.arguments[i];
    }
}

preload()

const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");
const inputArea = document.querySelector("#inputArea");
const inputSubmit = document.querySelector("#submit");
const inputExpand = document.querySelector("#expand");

const newChat = document.querySelector("#new-chat");
const storedChats = document.querySelector("#stored-chats");
const navChats = document.getElementsByClassName("nav-chat");

const display = document.querySelector("#display");

// Settings
const modelSelect = document.querySelector("#settings__model__select");
const tempValue = document.querySelector("#settings__temp__value");
const tempRange = document.querySelector("#settings__temp__range");
const tokensValue = document.querySelector("#settings__tokens__value");
const tokensRange = document.querySelector("#settings__tokens__range");

const models = {
  "text-davinci-003": { MaxTokens: 4000, Temperature: 0.7 },
  "text-curie-001": { MaxTokens: 2048, Temperature: 0.7 },
  "text-babbage-001": { MaxTokens: 2048, Temperature: 0.7 },
  "text-ada-001": { MaxTokens: 2048, Temperature: 0.7 },
  "code-davinci-002": { MaxTokens: 8000, Temperature: 0 },
  "code-cushman-001": { MaxTokens: 2048, Temperature: 0 },
};

let selectedChat;
let editingName = false;
let deletingChat = false;
let chatHidden = true;
let loadInterval;
let submitting = false;
let numOfChats = 0;

let settingsData = JSON.parse(localStorage.getItem("settings"));

const settingsTemplate = {
  Model: "text-davinci-003",
  MaxTokens: 1000,
  Temp: 0.7,
};

if (!settingsData) {
  localStorage.setItem("settings", JSON.stringify(settingsTemplate));
  settingsData = settingsTemplate;
}

let savedChats = JSON.parse(localStorage.getItem("savedChats"));

if (!savedChats) {
  localStorage.setItem("savedChats", JSON.stringify([]));
}

chatContainer.style.display = "none";

function clearData() {
  localStorage.setItem("savedChats", JSON.stringify([]));
}

function showChat() {
  chatContainer.style.display = "block";
  display.style.display = "none";
}

function hideChat() {
  chatContainer.style.display = "none";
  display.style.display = "flex";
}

function loader(element) {
  element.textContent = "";

  loadInterval = setInterval(() => {
    element.textContent += ".";

    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let speed = 20;

  if (text.length > 500) {
    speed = 5;
  } else if (text.length > 1000) {
    speed = 1;
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);

      const scrollTop = chatContainer.scrollTop;
      const scrollHeight = chatContainer.scrollHeight;
      const offsetHeight = chatContainer.offsetHeight;

      if (
        scrollTop == scrollHeight - offsetHeight ||
        (scrollTop < scrollHeight - offsetHeight &&
          scrollTop > scrollHeight - offsetHeight - 35)
      ) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      index++;
    } else {
      clearInterval(interval);
      saveChat();
    }
  }, speed);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
      <div class="wrapper ${isAi ? "ai" : "user"}">
          <div class="chat">
              <div class="profile">
                  <img 
                    src=${isAi ? bot : user} 
                    alt="${isAi ? "bot" : "user"}"
                    class="${isAi ? "botImg" : "userImg"}"
                  />
              </div>
              <div class="message" id=${uniqueId}>${value}</div>
          </div>
      </div>
  `;
}

const handleSubmit = async (e) => {
  if (submitting == false) {
    e.preventDefault();

    const data = new FormData(form);
    if (data.get("prompt") == "") return;

    // submitting = true;

    if (chatHidden == true) {
      chatHidden = false;
      showChat();
    }

    if (expanded == true) {
      minimizeInput();
    }

    let chatElement;

    if (!selectedChat) {
      chatElement = addChat("New Chat");
      chatContainer.innerHTML = "";
      selectChat(chatElement);
      selectedChat = chatElement;
    }

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get("prompt"));

    form.reset();

    // bot's chatstripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, "...", uniqueId);
    saveChat(chatElement);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);

    loader(messageDiv);

    // fetch data from server -> bot's response

    const response = await fetch("https://assistant-p3wj.vercel.app/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: data.get("prompt"),
        model: modelSelect.value,
        maxTokens: tokensValue.value,
        temp: tempValue.value,
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = "";

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim();

      typeText(messageDiv, parsedData);
    } else {
      const err = await response.json();

      if (err.error.status) {
        messageDiv.innerHTML = `Something went wrong (Error code ${err.error.status})`;
      } else {
        messageDiv.innerHTML = `Something went wrong (No Error Code)`;
      }
      saveChat(chatElement);
      console.log(err);
    }
    submitting = false;
  }
};

form.addEventListener("submit", handleSubmit);
form.addEventListener("keydown", (e) => {
  if (e.keyCode == 13 && !e.shiftKey) {
    handleSubmit(e);
  }
});
inputSubmit.addEventListener("click", handleSubmit);

inputArea.addEventListener("keydown", (e) => {
  if (e.keyCode == 13 && !e.shiftKey) {
    e.preventDefault();
  }
});

let expanded = false;

function expandInput() {
  expanded = true;
  inputExpand.src = minimize;
  inputArea.style.height = `350px`;

  inputSubmit.classList.add("flex-start");
  inputExpand.classList.add("flex-start");
}

function minimizeInput() {
  expanded = false;
  inputExpand.src = expand;
  inputArea.style.height = `41px`;

  inputSubmit.classList.remove("flex-start");
  inputExpand.classList.remove("flex-start");
}

inputExpand.addEventListener("click", (e) => {
  expanded == true ? minimizeInput() : expandInput();
});

function selectChat(element) {
  element.classList.add("nav-chat-selected");
  element.querySelector(".nav-chat__btns").style.display = "flex";
}

function removeSelectOnChat(element) {
  element.classList.remove("nav-chat-selected");
  element.querySelector(".nav-chat__btns").style.display = "none";
}

function switchBtnsImg(chatElement, btn1Img, btn2Img) {
  const btn1 = chatElement
    .querySelector(".nav-chat__btns")
    .querySelector(".chat-btn1");
  const btn2 = chatElement
    .querySelector(".nav-chat__btns")
    .querySelector(".chat-btn2");

  btn1.src = btn1Img;
  btn2.src = btn2Img;
}

function editName(chatElement) {
  editingName = true;
  switchBtnsImg(chatElement, done, close);
  const navChatName = chatElement.querySelector(".nav-chat__name");
  const name = navChatName.querySelector("input");
  navChatName.classList.remove("fade-text");
  name.classList.add("cursor-text");
  name.removeAttribute("readonly");
  name.blur();
  name.focus();
}

function stopEdit(chatElement) {
  editingName = false;
  switchBtnsImg(chatElement, edit, deleteImg);
  const navChatName = chatElement.querySelector(".nav-chat__name");
  const name = navChatName.querySelector("input");
  navChatName.classList.add("fade-text");
  name.classList.remove("cursor-text");
  name.setAttribute("readonly", "true");
}

function navChatClicked(e) {
  if (selectedChat == this || deletingChat == true || editingName == true)
    return;
  if (e.target.classList[0] == "chat-btn1") return;

  if (!(typeof selectedChat === "undefined")) {
    saveChat();
    removeSelectOnChat(selectedChat);
  }
  selectedChat = this;
  selectChat(this);
  loadChat(this);
}

function deleteChat(element, id) {
  let data = JSON.parse(localStorage.getItem("savedChats"));
  data.splice(id, 1);
  localStorage.setItem("savedChats", JSON.stringify(data));
  element.remove();
  resetChatIds();

  chatContainer.innerHTML = "";
  selectedChat = undefined;
  chatHidden = true;
  hideChat();
}

function saveChatName(element) {
  const id = element.id.charAt(element.id.length - 1);
  let data = JSON.parse(localStorage.getItem("savedChats"));

  data[id].Name = element.querySelector(".nav-chat__name > input").value;
  localStorage.setItem("savedChats", JSON.stringify(data));
}

function confirmDelete(element) {
  deletingChat = true;
  switchBtnsImg(element, done, close);
  element.querySelector("img").src = deleteImg;
}

function stopDelete(element) {
  deletingChat = false;
  switchBtnsImg(element, edit, deleteImg);
  element.querySelector("img").src = chat;
}

function addChatListeners(element) {
  element.addEventListener("click", navChatClicked);

  const id = element.id.charAt(element.id.length - 1);
  const btn1 = element.querySelector(".nav-chat__btns > .chat-btn1");
  const btn2 = element.querySelector(".nav-chat__btns > .chat-btn2");
  const input = element.querySelector(".nav-chat__name > input");

  btn1.addEventListener("click", function () {
    if (editingName == true) {
      saveChatName(element);
      stopEdit(element);
    } else if (deletingChat == true) {
      deleteChat(element, id);
      deletingChat = false;
    } else {
      editName(element);
    }
  });

  btn2.addEventListener("click", function () {
    if (editingName == true) {
      stopEdit(element);
      input.value = JSON.parse(localStorage.getItem("savedChats"))[id].Name;
    } else if (deletingChat == true) {
      stopDelete(element);
    } else {
      confirmDelete(element);
    }
  });

  input.addEventListener("keyup", (e) => {
    if (editingName == true && e.keyCode == 13) {
      saveChatName(element);
      stopEdit(element);
    }
  });
}

function roundNumber(num, digit) {
  return Math.round(num * 10 ** digit) / 10 ** digit;
}

document.addEventListener("mouseup", function (event) {
  if (selectedChat && !selectedChat.contains(event.target)) {
    if (editingName == true) {
      stopEdit(selectedChat);
    } else if (deletingChat == true) {
      stopDelete(selectedChat);
    }
  } else {
    if (selectedInput && !selectedInput.contains(event.target)) {
      let val = selectedInput.value;
      const range = selectedInput.parentNode.parentNode.querySelector(
        "input[type='range']"
      );
      const min = range.min;
      const max = range.max;
      const data = getSettingData(selectedInput);

      let decimalInput = selectedInput.classList.contains("decimal-input")
        ? true
        : false;

      val = parseFloat(val);

      if (decimalInput == true) {
        val = roundNumber(val, 2);
      } else {
        val = roundNumber(val, 0);
      }

      if (isNaN(val)) {
        val = data; // Set it to previous value once you finish those datastores
      } else if (val < min) {
        val = min;
      } else if (val > max) {
        val = max;
      }

      selectedInput.value = val;
      range.value = val;
      updateRangeBackground(range);
      saveSettings();
      selectedInput = undefined;
    }
  }
});

function newChatClicked() {
  if (chatHidden == false) {
    chatHidden = true;
    hideChat();
    removeSelectOnChat(selectedChat);
    selectedChat = undefined;
  }
}

newChat.addEventListener("click", newChatClicked);

function savedChatComponent(id) { // here
  return `
    <div class="nav-chat" id="${id}">
      <img src="${chat}" draggable="false">
      <div class="nav-chat__name fade-text">
        <input type="text" readonly="false" maxlength="50">
      </div>
      <div class="nav-chat__btns">
        <img src="${edit}" class="chat-btn1" draggable="false">
        <img src="${deleteImg}" class="chat-btn2" draggable="false">
      </div>
    </div>
  `;
}

function addChat(name) {
  const chatId = `nav-chat${numOfChats}`;
  const chatHtlm = savedChatComponent(chatId);
  storedChats.insertAdjacentHTML("beforeend", chatHtlm);

  const chatElement = storedChats.querySelector(`#${chatId}`);
  addChatListeners(chatElement);

  const input = chatElement
    .querySelector(".nav-chat__name")
    .querySelector("input");
  input.value = name;

  numOfChats += 1;

  return chatElement;
}

function loadData() {
  savedChats.forEach((data) => {
    addChat(data.Name);
  });
}

function resetChatIds() {
  const chats = chatContainer.getElementsByClassName("new-chat");
  numOfChats = 0;
  Array.from(chats).forEach((chat) => {
    chat.id = `nav-chat${numOfChats}`;
    numOfChats++;
  });
}

function loadChat(element) {
  if (chatHidden == true) {
    showChat();
  }
  const id = element.id.charAt(element.id.length - 1);
  const data = JSON.parse(localStorage.getItem("savedChats"))[id];

  chatContainer.innerHTML = "";

  let isAi = false;

  data.Messages.forEach((message) => {
    chatContainer.innerHTML += chatStripe(isAi, message);
    isAi = !isAi;
  });

  if (chatHidden == true) {
    chatHidden = false;
    showChat();
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function saveChat() {
  const messages = chatContainer.getElementsByClassName("wrapper");
  let messageContents = [];
  Array.from(messages).forEach((message) => {
    const content = message.querySelector(".message").textContent;
    messageContents.push(content);
  });

  let data = JSON.parse(localStorage.getItem("savedChats"));
  const id = selectedChat.id.charAt(selectedChat.id.length - 1);

  data[id] = {
    Name: selectedChat.querySelector(".nav-chat__name > input").value,
    Messages: messageContents,
  };
  localStorage.setItem("savedChats", JSON.stringify(data));
}

if (savedChats && !Object.keys(savedChats).length == 0) {
  loadData();
}

Object.keys(models).forEach((name) => {
  const modelHtml = `<option>${name}</option>`;
  modelSelect.innerHTML += modelHtml;
});

// Range CSS

const rangeInputs = document.querySelectorAll('input[type="range"]');
const numberInputs = document.querySelectorAll(".settings-input");
let selectedInput;

function updateRangeBackground(element) {
  const min = element.min;
  const max = element.max;
  const val = element.value;
  element.style.backgroundSize = `${((val - min) * 100) / (max - min)}% 100%`;
}

function checkDecimalPlaces(num) {
  let decimal = num.toString().split(".")[1];
  if (decimal) {
    return decimal.length;
  }
}

function handleInputChange(e) {
  let rangeInput;
  let numberInput;
  let input = "number";
  let newVal;
  let isOk = true;

  if (e.target.type == "number") {
    input = "number";
    numberInput = e.target;
    rangeInput = e.target.parentNode.parentNode.querySelector(
      'input[type="range"]'
    );

    let decimalInput = numberInput.classList.contains("decimal-input")
      ? true
      : false;

    if (numberInput.value) {
      newVal = parseFloat(numberInput.value);
      if (decimalInput == true && checkDecimalPlaces(newVal) > 2) {
        isOk = false;
        selectedInput = numberInput;
      } else if (decimalInput == false && !Number.isInteger(newVal)) {
        isOk = false;
        selectedInput = numberInput;
      } else if (newVal > rangeInput.max) {
        isOk = false;
        selectedInput = numberInput;
      } else if (newVal < rangeInput.min) {
        isOk = false;
        selectedInput = numberInput;
      } else if (isNaN(newVal)) {
        isOk = false;
        selectedInput = numberInput;
      } else {
        selectedInput = undefined;
      }
    } else if (!numberInput.value) {
      isOk = false;
      selectedInput = numberInput;
    }
  } else if (e.target.type == "range") {
    input = "range";
    numberInput = e.target.parentNode.querySelector(".settings-input");
    rangeInput = e.target;
    newVal = rangeInput.value;
  }

  if (isOk == true) {
    if (input == "number") {
      rangeInput.value = newVal;
    } else if (input == "range") {
      numberInput.value = newVal;
    }
    saveSettings();
    updateRangeBackground(rangeInput);
  }
}



function resetSettings() {
  localStorage.setItem("settings", JSON.stringify(settingsTemplate));
}

function saveSettings() {
  const data = {
    Model: document.querySelector("#settings__model__select").value,
    MaxTokens: document.querySelector("#settings__tokens__value").value,
    Temp: document.querySelector("#settings__temp__value").value,
  };
  localStorage.setItem("settings", JSON.stringify(data));
}

function getSettingData(element) {
  let data;
  if (element.classList.contains("temp")) {
    data = JSON.parse(localStorage.getItem("settings")).Temp;
  } else if (element.classList.contains("tokens")) {
    data = JSON.parse(localStorage.getItem("settings")).MaxTokens;
  }
  return data;
}

modelSelect.value = settingsData.Model;

rangeInputs.forEach((input) => {
  let data = getSettingData(input);
  if (input.classList.contains("tokens")) {
    input.max = models[modelSelect.value].MaxTokens;
  }
  input.value = data;
  updateRangeBackground(input);
  input.addEventListener("input", handleInputChange);
});

numberInputs.forEach((input) => {
  let data = getSettingData(input);
  if (data) {
    input.value = data;
  }
  input.addEventListener("change", handleInputChange);
});

modelSelect.addEventListener("change", function () {
  if (this.value == "code-davinci-002" || this.value == "code-cushman-001") {
    tempValue.value = 0;
    tempRange.value = 0;
  } else {
    tempValue.value = 0.7;
    tempRange.value = 0.7;
  }

  const max = models[this.value].MaxTokens;
  tokensRange.max = max;

  if (tokensValue.value > max) {
    tokensValue.value = max;
    tokensRange.value = max;
  }

  updateRangeBackground(tempRange);
  updateRangeBackground(tokensRange);
  saveSettings();
});
