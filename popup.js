var formatted;
var type;
const displayAuthor = 1;
const displayDate = 1;
const authorArray = [];
const dateArray = [];
var modDate = 0;

//stay open until clicked?
document.addEventListener("DOMContentLoaded", function () {
	// display default type
	displaySuggestions([defaultType]);
	type = defaultType;
	updateUserGUI();
	document.getElementById("searchInput").focus();

	document.getElementById("generateReferenceButton").addEventListener("click", async function () {
		// auto type
		if (type) {
			semiAutoFetch();
		}
	});
	document.getElementById("copyReferenceButton").addEventListener("click", async function () {
		CopyToClipboard();
	});
});

// define asynchronous variables (note: if adding more, remember to add them to the updateDataFormat() function)
function fetchHtml() {
	return new Promise(async (resolve) => {
		try {
			chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
				const tab = tabs[0];
				const response = await fetch(tab.url);
				const data = await response.text();
				const html = new DOMParser().parseFromString(data, "text/html");
				resolve([html, tab]);
			});
		} catch {
			resolve(false);
		}
	});
}
var html;
var tab;
var url;

/* example usage:
(async () => {
	const data = await fetchHtml();
	console.log(await data[1].url);
})();
*/

// inject CSS
try {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.scripting.executeScript(
			{
				target: { tabId: tabs[0].id },
				files: ["content.js"],
			},
			() => {
				console.log("Javascript injected");
			}
		);
		chrome.scripting.insertCSS(
			{
				target: { tabId: tabs[0].id },
				files: ["inject.css"],
			},
			() => {
				console.log("CSS injected");
			}
		);
	});
} catch (e) {
	console.log("CSS not injected:", e);
}

const authorPattern = /\b[A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+/g; // /^(?=.*[ -])(?:[A-ZÆØÅ][a-zæøå][a-zA-ZæøåÆØÅ]{1,}|[A-ZÆØÅ]\.)+(?:[ -](?:[A-ZÆØÅ][a-zæøå][a-zA-ZæøåÆØÅ]{1,}|[A-ZÆØÅ]\.)+)*$/g
function getAuthor(html) {
	const elements = Array.from(html.getElementsByTagName("*")).filter((el) => /^<[^>]*(author|name[^="]|contrib|byline)[^>]*>/i.test(el.outerHTML)); // add?: /i | remove?: name
	for (const element of elements) {
		if (displayAuthor) {
			console.log("\n\nPotential author:", element);
		}
		if (stringInParent(element)) {
			continue;
		}
		//search element attributes
		const elementAttributes = element.attributes;
		for (let l = 0; l < elementAttributes.length; l++) {
			const author = elementAttributes[l].value;
			let validName = author.match(authorPattern) ? elementAttributes[l].value.match(authorPattern)[0] : false;
			if (validName && !authorArray.includes(validName)) {
				authorArray.push(validName);
			}
			if (displayAuthor) {
				if (validName && !authorArray.includes(validName)) {
					console.log("Element attribute:", validName, ";", true);
				}
			} // else { console.log("Element attribute:", author, ";", false) } };
		}
		//search element text
		{
			const author = element.innerHTML.trim();
			let validName = author.match(authorPattern) ? element.innerHTML.trim().match(authorPattern)[0] : false;
			if (validName && !authorArray.includes(validName)) {
				authorArray.push(validName);
			}
			if (displayAuthor) {
				if (validName && !authorArray.includes(validName)) {
					console.log("Element text:", validName, ";", true);
				}
			} // else { console.log("Element text:", author, ";", false) } };
		}
		//search child elements attributes
		const childElementAttributes = element.querySelectorAll("*");
		for (let i = 0; i < childElementAttributes.length; i++) {
			const attributes = childElementAttributes[i].attributes;
			for (let j = 0; j < attributes.length; j++) {
				const author = attributes[j].value;
				let validName = author.match(authorPattern) ? attributes[j].value.match(authorPattern)[0] : false;
				if (validName && !authorArray.includes(validName)) {
					authorArray.push(validName);
				}
				if (displayAuthor) {
					if (validName && !authorArray.includes(validName)) {
						console.log("Child element attribute:", validName, ";", true);
					}
				} // else { console.log("Child element attribute:", author, ";", false) } };
			}
		}
		//search child elements text
		const childElementText = element.querySelectorAll("*");
		for (let k = 0; k < childElementText.length; k++) {
			const author = childElementText[k].innerHTML.trim();
			let validName = author.match(authorPattern) ? childElementText[k].innerHTML.trim().match(authorPattern)[0] : false;
			if (validName && !authorArray.includes(validName)) {
				authorArray.push(validName);
			}
			if (displayAuthor) {
				if (validName && !authorArray.includes(validName)) {
					console.log("Child element text:", validName, ";", true);
				}
			} // else { console.log("Child element text:", author, ";", false) } };
		}
	}
	//if empty?
	return authorArray;
}

function getDate(html) {
	console.log("\n\n====================================================================================================================\n\n\n");
	const elements = Array.from(html.getElementsByTagName("*")).filter((el) => /^<[^>]*(time|date|mod[i>:_/"'\- ])[^>]*>/gi.test(el.outerHTML)); // add?: /i | /if you change the mod-selector, you need to also change it in dateFormat()
	for (const element of elements) {
		if (element.length > 200) {
			continue;
		}
		if (displayDate) {
			console.log("\n\nPotential date:", element);
		}
		if (stringInParent(element)) {
			continue;
		}
		//search element attributes
		const elementAttributes = element.attributes;
		for (let l = 0; l < elementAttributes.length; l++) {
			const content = elementAttributes[l].value;
			if (displayDate) {
				console.log("Element attribute:", content);
			}
			dateFormat(content, element);
		}
		//search element text
		{
			const content = element.innerHTML.trim();
			if (displayDate) {
				console.log("Element text:", content);
			}
			dateFormat(content, element);
		}
		//search child elements attributes
		const childElementAttributes = element.querySelectorAll("*");
		for (let i = 0; i < childElementAttributes.length; i++) {
			const attributes = childElementAttributes[i].attributes;
			for (let j = 0; j < attributes.length; j++) {
				const content = attributes[j].value;
				if (displayDate) {
					console.log("Child element attribute:", content);
				}
				dateFormat(content, element);
			}
		}
		//search child elements text
		const childElementText = element.querySelectorAll("*");
		for (let k = 0; k < childElementText.length; k++) {
			const content = childElementText[k].innerHTML.trim();
			if (displayDate) {
				console.log("Child element text:", content);
			}
			dateFormat(content, element);
		}
	}
	//return modified date (move up under for-loop to prevent further dates or not???)
	if (modDate) {
		dateArray.unshift(modDate);
		return dateArray; //dateArray[0] for modDate (modDate is first)
	}
	//find youngest date
	//if (dateArray.length > 1) { dateArray.sort(function (a, b) { return new Date(a) - new Date(b) }) };

	//final return
	return dateArray; //dateArray[0] for most probable
}

function dateFormat(input, element) {
	// replace with neural network scanning html code for dates
	const datePattern = /\b\d{1,4}[ ,./-]{1,2}[a-zA-Z\d]+[ ,./-]{1,2}\d{2,4}(?=\W|$)?/i;
	const match = input.match(datePattern);
	if (input.length > 5 && input.length < 500 && match) {
		var date = new Date(match).toLocaleDateString("nb-NO", {
			day: "numeric",
			year: "numeric",
			month: "long",
		});
		var validDate = date.match(datePattern);
		if (!validDate) {
			//incomplete date
			const reMatch = match[0].match(/\d{4,}/i);
			if (reMatch) {
				dateArray.push(reMatch[0]);
				console.log("DEBUG!: ", match[0], validDate, date)
				return;
			}
		}
		if (validDate && element.outerHTML.match(/mod[i>:_/"'\- ]/i)) {
			//complete mod date
			if (displayDate) {
				console.log("Input «", input, "» under «", element, "» accepted modified date as:", date, "\n\n");
			}
			modDate = date;
			// console.log("DEBUG!: ", modDate)
			return;
		}
		if (validDate && !dateArray.includes(date) && date != modDate) {
			//complete date
			if (displayDate) {
				console.log("Input «", input, "» under «", element, "» accepted as:", date, "\n\n");
			}
			dateArray.push(date);
			// console.log("DEBUG!: ", date)
			return;
		}
	}
	if (displayDate) {
		console.log("Input «", input, "» rejected | match =", match ? true : false, "| already present =", dateArray.includes(date), "\n\n");
	}
	return "Invalid date";
}

function stringInParent(element) {
	const matchReg = /(comment|picture|image|cit[ea]{1}|figure|authoritative|hidden|credit|editor|reference|identif|copyright|privacy)/gi; //FUTURE ME: LIKELY SOURCE OF ERRORS!! | add?: contributor, interview, review, edit, source, reference, | remove?:
	let parentElement = element;
	while (parentElement) {
		const openingTag = parentElement.outerHTML.match(/<[^>]*>/g)[0];
		if (openingTag.match(matchReg)) {
			if (displayAuthor || displayDate) {
				console.log("Found illegal string «", parentElement, "» above or at «", element, "»");
			}
			return true;
		}
		parentElement = parentElement.parentElement;
	}
	let childElement = element.querySelectorAll("*");
	if (childElement) {
		for (let c = 0; c < childElement.length; c++) {
			const openingTag = childElement[c].outerHTML.match(/<[^>]*>/g)[0];
			if (openingTag.match(matchReg)) {
				if (displayAuthor || displayDate) {
					console.log("Found illegal string «", childElement, "» below «", element, "»");
				}
				return true;
			}
		}
	}
	return false;
}

/*
async function evaluateText(text) {
	try {
		const response = await fetch("http://localhost:5000/predict", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(text),
		});
		const result = await response.json();
		//console.log('\''+text+'\'', "prediction: ", result);
		return result === "true";
	} catch (error) {
		throw new Error("Server unavailable: failed to evaluate text");
	}
}

async function formatData(authors, dates, title, url) {
	//authors
	const promises = authors.map(async function (element) {
		try {
			const evaluation = await evaluateText(element);
			return evaluation;
		} catch (error) {
			console.error(error);
		}
	});
	const results = await Promise.all(promises);
	if (results.includes(true) || results.includes(false)) {
		var authorArray = authors.filter((_, i) => results[i]);
		console.log("Approved authors:", authorArray);
	} else {
		var authorArray = authors;
		console.log("Approving all authors.");
	}
}
*/

function CopyToClipboard() {
	console.log("Trying to copy to clipboard...");
	if (document.hasFocus()) {
		try {
			const blob = new Blob([document.getElementById("copyReferenceButton").innerHTML], { type: "text/html" });
			const clipboardItem = new window.ClipboardItem({
				"text/html": blob,
			});
			navigator.clipboard.write([clipboardItem]);
			console.log("Copied to clipboard!");
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
		var copyReferenceButton = document.getElementById("copyReferenceButton");
		copyReferenceButton.setAttribute("data-copied", "true");
		setTimeout(function () {
			copyReferenceButton.setAttribute("data-copied", "false");
		}, 2000);
	} else {
		console.log("Document is not in focus.");
	}
}

// Javascript event handling --------------------------------------------------------------------------------------------------------------

const dataObject = {};
var dataObjectFormatted = {};
const searchInput = document.getElementById("searchInput");
const suggestionsContainer = document.getElementById("suggestions");
const dataCollectionContainer = document.getElementById("dataCollection");
var currentIndex = 0;

/*const classes = {
	Oppslagsverk: "format1",
	Artikkel: "author.date.title.url",
	Avis: "format3",
	Blogg: "format4",
	Bok: "format5",
	Film: "format6",
	"Kunstig intelligens": "format7",
	Lovtekster: "format8",
	"Pers. kom.": "format9",
	Podcast: "format10",
	Rapport: "format11",
	Video: "format12",
	Nettside: "format13",
};*/

// Categories and their formats
const classes = {
	Nettside: {
		collection: "author.date.title.url",
		format: `author. date. <i>title</i>. <a href="url">url </a>`,
	},
	Avis: {
		collection: "author.date.title.paper.url",
		format: `author. date. title. <i>paper</i>. <a href="url">url </a>`,
	},
};
const defaultType = "Nettside";
const allowedLastCharactersInData = /[ A-ZÆØÅa-zæøå:)]/;
const GUI_Blacklist = ["url"];

// Converting data to correct format (e.g. Erlend Skaarberg to Skaarberg, E.)
async function formatDataObject() {
	dataObjectFormatted = {};
	for (const [fieldName, data] of Object.entries(dataObject)) {
		if (data.length > 0) {
			// if field-array is not empty
			switch (fieldName) {
				/* How to add new data types:
				case "dataName": 
					format the data first
					define dataObjectFormatted[dataName] as the formatted data
					break;
				*/

				case "author": //author (uses all authors)
					// if author is one word
					const formattedAuthors = [];
					data.map(function (el) {
						const parts = el.split(/[\s-]/);
						let lastName = parts.pop();
						lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
						const initials = parts.map((part) => part.charAt(0).toUpperCase()).join(". ");
						const formattedAuthor = `${lastName}, ${initials}.`;
						formattedAuthors.push(formattedAuthor);
					});
					const author = formattedAuthors.join(" & ");
					dataObjectFormatted[fieldName] = author;
					break;

				case "date": //date (uses first date if multiple dates)
					for (const el of data) {
						var date;
						console.log(data)
						console.log(el)
						if (el.match(/\d+[ -./]+\d+[ -./]+\d+/g)) {
							// numerical date with european format that needs to be converted to american format
							//console.log("1")
							const parts = el.split(/[ -./]/);
							date = parts[1] + "." + parts[0] + "." + parts[2];
							date = new Date(parts[1] + "." + parts[0] + "." + parts[2]).toLocaleDateString("nb-NO", {
								day: "numeric",
								year: "numeric",
								month: "long",
							});
						} else if (el.match(/.+[ -./]+/g)) {
							// complete date
							//console.log("2")
							date = new Date(el).toLocaleDateString("nb-NO", {
								day: "numeric",
								year: "numeric",
								month: "long",
							});
						} else if (el.match(/\d{4}/g)) {
							// partial date
							//console.log("3")
							date = " (" + el + ").";
							dataObjectFormatted[fieldName] = date;
							break;
						}
						if (date) {
							//console.log("4")
							const parts = date.split(/[\s]/);
							const partStr = `${parts[2]}, ${parts[0]} ${parts[1]}`;
							date = " (" + partStr + ").";
							dataObjectFormatted[fieldName] = date;
							break;
						}
					}
					break;

				case "title": //title (uses first title if multiple titles)
					const title = data[0].trim().charAt(0).toUpperCase() + data[0].trim().slice(1);
					dataObjectFormatted[fieldName] = title;
					break;

				case "url": //url (uses first url if multiple urls)
					const url = data[0].trim();
					dataObjectFormatted[fieldName] = url;
					break;

				default:
					break;
			}
		} else if (html) {
			// if field-array is empty (AND FIRST RUN OF FORMATDATAOBJECT??????????????????????????????????????????????????????????) add other criteria, might get annoying if added every time when empty
			// automatically appears if field is empty
			//console.log("fieldName:", fieldName, "data:", data)
			switch (fieldName) {
				/* Recipe: 
				case "dataName": 
					add to GUI_Blacklist (?), the blacklist removes the field from the GUI
					define default value of dataName as string(!)
					break;
				*/
				case "author": //needs work
					const domain = new URL(url).hostname;
					const domainName = domain.match(/\w+(?=\.[^.]+$)/u);
					const capitalized = domainName[0].charAt(0).toUpperCase() + domainName[0].slice(1) + " bidragsytere";
					dataObjectFormatted[fieldName] = `${capitalized}.`;
					break;

				case "date":
					dataObjectFormatted[fieldName] = "(u.å.).";
					break;

				case "url":
					// also not showed in GUI
					dataObjectFormatted[fieldName] = url;
					break;

				default:
					break;
			}
		}
	}
	console.log("Formatted data object:", dataObjectFormatted, "\n\n");
}

// Automatically fetch data from website on button click (using old functionality)
function semiAutoFetch() {
	if (html) {
		const { collection, _ } = classes[type];
		const fields = collection.split(".");
		fields.forEach((fieldName) => {
			switch (fieldName) {
				/* How to add new data types:
					case "dataName": 
						get the data first from something
						check if the data is already in dataObject
						add data to dataObject if the above is false
						break;
					*/

				case "author":
					const authors = getAuthor(html); // returns array of authors
					for (const author of authors) {
						if (!dataObject[fieldName].includes(author)) {
							dataObject[fieldName].unshift(author);
						}
					}
					break;

				case "date":
					const dates = getDate(html); // returns array of dates
					console.log(dates)
					for (const date of dates) {
						if (!dataObject[fieldName].includes(date)) {
							dataObject[fieldName].unshift(date);
						}
					}
					break;

				case "title":
					const title = tab.title; // returns title as string
					if (!dataObject[fieldName].includes(title)) {
						dataObject[fieldName].unshift(title);
					}
					break;

				case "url":
					const url = tab.url; // returns url as string
					if (!dataObject[fieldName].includes(url)) {
						dataObject[fieldName].unshift(url);
					}
					break;

				default:
					break;
			}
		});
		updateUserGUI();
	} else {
		console.log("Failed to fetch data from website.");
	}
}

// Cursor element

let cursorElement = null;
let cursorText;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	cursorElement = message.message;
	if (message.type === "getCursorElement" && cursorElement) {
		if (cursorElement.innerText) {
			cursorText = filterCursorElement(cursorElement.innerText);
			sendResponse({ message: cursorText });
		}
	}
});

// filter the cursor element text based on the active input field name
function filterCursorElement(text) {
	let updatedText = false;
	let textUpdated = false;
	const { collection, _ } = classes[type];
	collection.split(".").forEach((fieldName) => {
		if (textUpdated) {
			return;
		}
		const inputField = document.getElementsByName(fieldName)[0];
		if (document.activeElement === inputField) {
			updatedText = "field_active";
			if (text.trim().split(" ").length == 1 && text.match(/[A-ZÆØÅa-zæøå]+/g)) {
				updatedText = text;
				textUpdated = true;
				return;
			}
			switch (fieldName) {
				case "author":
					var match = text.match(authorPattern);
					console.log("Text:", text, "Match:", match)
					updatedText = match ? match[0] : updatedText;
					textUpdated = true;
					break;

				case "date":
					var date;
					var match = text.match(/\d+[ -./]+\d+[ -./]+\d+/g)[0];
					if (match) {
						// numerical date with european format that needs to be converted to american format
						const parts = match.split(/[ -./]/);
						date = parts[1] + "." + parts[0] + "." + parts[2];
						date = new Date(parts[1] + "." + parts[0] + "." + parts[2]).toLocaleDateString("nb-NO", {
							day: "numeric",
							year: "numeric",
							month: "long",
						});
					} else {
						date = new Date(text).toLocaleDateString("nb-NO", {
							day: "numeric",
							year: "numeric",
							month: "long",
						});
					}
					if (date !== "Invalid Date") {
						updatedText = date ? date : updatedText;
						textUpdated = true;
					}
					break;
			}
		}
	});
	return updatedText; // Return the updated text value
}

// Type selector

// Update suggestions on input
searchInput.addEventListener("keyup", function (event) {
	if (event.key === "Tab" || event.key === "Enter") {
		return;
	}
	const inputText = event.target.value;
	suggestionsContainer.innerHTML = "";
	const matchingSuggestions = findMatchingSuggestions(inputText);
	if (searchInput.value !== "" && matchingSuggestions.length > 0) {
		displaySuggestions(matchingSuggestions);
		type = matchingSuggestions[currentIndex];
		updateUserGUI();
	} else if (searchInput.value === "") {
		currentIndex = 0;
		displaySuggestions([defaultType]);
		type = defaultType;
		updateUserGUI();
	} else {
		currentIndex = 0;
		type = null;
		dataCollectionContainer.innerHTML = "";
		document.getElementById("copyReferenceButton").style.display = "none";
	}
});

// Update suggestions on tab or enter
searchInput.addEventListener("keydown", function (event) {
	const suggestions = suggestionsContainer.querySelectorAll("li");
	if (event.key === "Tab" && suggestionsContainer.children.length > 0 && searchInput.value !== "") {
		event.preventDefault();
		if (suggestions && searchInput.value === suggestions[currentIndex].textContent) {
			currentIndex = (currentIndex + 1) % suggestions.length;
			searchInput.value = suggestions[currentIndex].textContent;
			type = suggestions[currentIndex].textContent;
			updateUserGUI();
		} else {
			searchInput.value = suggestions[0].textContent;
			type = suggestions[0].textContent;
			updateUserGUI();
		}
	}
	if (event.key === "Enter") {
		event.preventDefault();
		searchInput.value = suggestions[currentIndex].textContent;
		type = suggestions[currentIndex].textContent;
		updateUserGUI();
		searchInput.blur();
	}
});

// Find matching suggestions from input text
function findMatchingSuggestions(inputText) {
	const matchingSuggestions = [];
	for (const cls of Object.keys(classes)) {
		if (cls.toLowerCase().startsWith(inputText.toLowerCase())) {
			matchingSuggestions.push(cls);
		}
	}
	return matchingSuggestions.slice(0, 2);
}

// Display suggestions
function displaySuggestions(suggestions) {
	suggestions.forEach((suggestion) => {
		const suggestionItem = document.createElement("li");
		suggestionItem.textContent = suggestion;
		suggestionItem.addEventListener("click", handleSuggestionClick);
		suggestionsContainer.appendChild(suggestionItem);
	});
}

// Handle if suggestion is clicked from displayed suggestions
function handleSuggestionClick(event) {
	const suggestionText = event.target.textContent;
	searchInput.value = suggestionText;
	type = suggestionText;
	updateUserGUI();
}

// Update user GUI
function updateUserGUI() {
	console.log("Category:", type);
	const { collection, format } = classes[type]; //use classes[currentIndex] instead of type?
	// add data fields to dataObject
	const fields = collection.split(".");
	fields.forEach((fieldName) => {
		if (!dataObject[fieldName]) {
			dataObject[fieldName] = [];
		}
	});
	generateDataFields(collection);
	updateDataFormat();
}

// Data collection and display

// Generate data collection elements
function generateDataFields(collection) {
	dataCollectionContainer.innerHTML = "";
	const fields = collection.split(".").filter((field) => {
		return !GUI_Blacklist.includes(field);
	});
	fields.forEach((fieldName) => {
		const fieldDiv = document.createElement("div");
		fieldDiv.id = `${fieldName}`;

		const input = document.createElement("input");
		input.type = "text";
		input.id = "dataInput";
		input.name = fieldName;
		input.placeholder = `Add ${fieldName}`;
		input.autocomplete = "off";

		const listDiv = document.createElement("div");
		listDiv.id = "dataList";
		listDiv.className = fieldName;
		if (dataObject[fieldName]) {
			//if data already exists, add to list element
			dataObject[fieldName].forEach((data) => {
				const listElement = document.createElement("li");
				listElement.textContent = data;
				listDiv.appendChild(listElement);
				listElement.addEventListener("click", handleDataListClick);
			});
		}

		fieldDiv.appendChild(input);
		fieldDiv.appendChild(listDiv);
		dataCollectionContainer.appendChild(fieldDiv);
		input.addEventListener("keydown", handleInputByEnterOrTab.bind(null, fieldName, input));
	});
}

// Save input data on exit from input field
function handleInputByEnterOrTab(fieldName, element) {
	//convert to use event instead of variables
	if (element.value !== "" && (event.key === "Enter" || event.key === "Tab")) {
		AddDataToDataObject(fieldName, element.value);
		const list = document.getElementsByClassName(fieldName);
		list[0].innerHTML = "";
		dataObject[fieldName].forEach((data) => {
			const listElement = document.createElement("li");
			listElement.textContent = data;
			list[0].appendChild(listElement);
			listElement.addEventListener("click", handleDataListClick);
		});
		element.value = "";
	}
}

// Remove data if data list is clicked
function handleDataListClick(event) {
	const fieldName = event.target.parentElement.className;
	const data = event.target.textContent;
	RemoveDataFromDataObject(fieldName, data);
	// set focus to fieldName input
	const input = document.getElementById(fieldName).firstChild;
	input.focus();
	event.target.remove();
}

// Add data to data object
function AddDataToDataObject(fieldName, data) {
	if (!dataObject[fieldName].includes(data)) {
		dataObject[fieldName].unshift(data);
	}
	updateUserGUI();
}

// Remove data from data object
function RemoveDataFromDataObject(fieldName, data) {
	dataObject[fieldName].splice(dataObject[fieldName].indexOf(data), 1);
	updateUserGUI();
}

// Update data format at the bottom of the page
async function updateDataFormat() {
	if (!html || !url) {
		const list = await fetchHtml();
		if (list) {
			// add more variables here
			html = await list[0];
			tab = await list[1];
			url = await list[1].url;
		}
	}
	console.log("Data object:", dataObject);
	await formatDataObject();
	let { collection, format } = classes[type];
	const fields = collection.split(".");
	fields.forEach((fieldName) => {
		let data = dataObjectFormatted[fieldName];
		if (data) {
			// remove all characters from end of string that are not allowed
			let lastCharacter = data.slice(-1);
			while (!lastCharacter.match(allowedLastCharactersInData)) {
				data = data.slice(0, -1);
				lastCharacter = data.slice(-1);
			}
			const matches = format.match(new RegExp(fieldName, "g"));
			if (matches) {
				matches.forEach((match) => {
					format = format.replace(match, data);
				});
			}
		}
	});
	document.getElementById("copyReferenceButton").style.display = "block";
	document.getElementById("copyReferenceButton").innerHTML = format;
	//console.log("Formatted data:", format);
}

// Misc

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape") {
		event.preventDefault();
		document.activeElement.blur();
	}
	if (event.key === "Tab" && !(document.activeElement === searchInput) && suggestionsContainer.children.length === 0) {
		event.preventDefault();
		searchInput.focus();
	}
	if (event.key === "Enter") {
		const { collection, _ } = classes[type];
		console.log("Enter pressed\n")
		collection.split(".").forEach((fieldName) => {
			const inputField = document.getElementsByName(fieldName)[0];
			if (inputField) {
				console.log(document.activeElement, inputField, inputField.value, cursorText)
				if (document.activeElement === inputField && inputField.value === "" && (cursorText && cursorText !== "" && cursorText !== "field_active")) {
					event.preventDefault();
					document.activeElement === inputField;
					AddDataToDataObject(fieldName, cursorText);
				}
			}
		});
	}
});

//document.addEventListener("keyup", function (event) {});
