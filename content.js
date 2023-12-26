function isPopupRunning() {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({}, (response) => {
			if (chrome.runtime.lastError && chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist.") {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

var element = null;
var previousElement = null;
var elementData = null;
var popupRunning = false;
document.addEventListener("mousemove", async (event) => {
	popupRunning = await isPopupRunning(); //include if the user is in the correct input fields?
	if (popupRunning) {
		// adjust tooltip coords
		const { clientX, clientY } = event;
		tooltip.style.left = `${clientX + 10}px`;
		tooltip.style.top = `${clientY + 10}px`;

		// get element at mouse coords, ignoring APA7th-overlay elements
		if (previousElement) {
			previousElement.removeAttribute("APA7th-overlay");
		}
		element = document.elementFromPoint(clientX, clientY);
		if (previousElement) {
			previousElement.setAttribute("APA7th-overlay", "true");
		}

		// get element data, send it to the popup, and update the tooltip
		if (element) {
			elementData = getElementData(element);
			chrome.runtime.sendMessage({ type: "getCursorElement", message: elementData }, (response) => {
				if (elementData["innerText"] !== tooltip.textContent) {
					tooltip.style.display = "none";
					element.removeAttribute("APA7th-overlay");
				}
				if (response) {
					if (response.message) {
						if (previousElement) {
							previousElement.removeAttribute("APA7th-overlay");
						}
						element.setAttribute("APA7th-overlay", "true");
						previousElement = element;
						if (response.message !== "field_active") {
							//console.log(response.message);
							updateTooltip(response.message);
						}
					} 
				} else {
					tooltip.style.display = "none";
					element.removeAttribute("APA7th-overlay");
					previousElement = null;
				}
			});
		}
	} else {
		tooltip.style.display = "none";
		element.removeAttribute("APA7th-overlay");
	}
});

function getElementData(element) {
	const elementData = {};
	let childElementWithData = element.querySelector(":not(:has(*)):not(:empty)");
	childElementWithData = childElementWithData ? childElementWithData : (element.innerText && !element.querySelector("*") ? element : null);
	if (childElementWithData) {
		elementData["innerText"] = childElementWithData.innerText;
	}
	// console.log("\n\n", element, "\n", childElementWithData);
	console.log(elementData.innerText)
	return elementData;
}

// Create a div element for the tooltip
const tooltip = document.createElement("div");
tooltip.style.position = "fixed";
tooltip.style.backgroundColor = "black";
tooltip.style.color = "white";
tooltip.style.padding = "5px";
tooltip.style.borderRadius = "3px";
tooltip.style.zIndex = "9999";
tooltip.style.display = "none";
document.body.appendChild(tooltip);

// Update the tooltip content and show it
function updateTooltip(content) {
	tooltip.textContent = content;
	tooltip.style.display = "block";
}

// Hide the tooltip when the mouse moves out of the element
document.addEventListener("mouseout", (event) => {
	tooltip.style.display = "none";
	event.target.removeAttribute("APA7th-overlay");
	previousElement = null;
});

// Example usage: Update the tooltip with the current element's tag name
/*document.addEventListener("mouseover", (event) => {
	const { target } = event;
	updateTooltip(`Tag Name: ${target.tagName}`);
});*/
