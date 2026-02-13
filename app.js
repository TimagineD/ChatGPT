/* =========================
   Data helpers and constants
   ========================= */

// Define all supported gear types with emoji + name.
const GEAR_TYPES = [
  "🎿 СКИИ",
  "🏂 БОРД",
  "🛷 САНКА",
  "🦯 СТАПОВИ",
  "⛸️ КОНД.",
  "🪖КАЦИГА",
  "🥽 НАОЧАРИ",
  "🧤 РАКВИЦИ",
];

// Define all possible gear statuses.
const GEAR_STATUSES = ["Rented", "Available", "Archived"];

// Define all possible history event types.
const EVENT_TYPES = [
  "NEW",
  "CHANGED",
  "DELETED",
  "ARCHIVED",
  "RENTED",
  "RETURNED",
];

// Define the localStorage key for persistence.
const STORAGE_KEY = "ski-rental-data";

/* =========================
   Utility functions
   ========================= */

// Convert a date string into a human-friendly format for display.
const formatDateTime = (value) => {
  // Convert the provided ISO timestamp into a Date object.
  const date = new Date(value);
  // Use Intl.DateTimeFormat to build a readable string.
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Convert a value into a normalized lowercase string for search.
const normalizeText = (value) => {
  // Turn empty values into empty strings so we can safely normalize.
  const safeValue = value ?? "";
  // Convert to string, trim whitespace, and lowercase.
  return safeValue.toString().trim().toLowerCase();
};

// Transliterate Cyrillic to Latin for search matching.
const transliterateToLatin = (value) => {
  // Provide a mapping table for common Cyrillic characters.
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    ђ: "dj",
    е: "e",
    ж: "z",
    з: "z",
    и: "i",
    ј: "j",
    к: "k",
    л: "l",
    љ: "lj",
    м: "m",
    н: "n",
    њ: "nj",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    ћ: "c",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "c",
    џ: "dz",
    ш: "s",
  };
  // Normalize the incoming value first.
  const normalized = normalizeText(value);
  // Build the transliterated output one character at a time.
  return normalized
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
};

// Normalize a search term so it matches both Latin and Cyrillic input.
const normalizeSearch = (value) => {
  // Normalize the raw value first.
  const normalized = normalizeText(value);
  // Transliterate the normalized value into Latin for matching.
  const latin = transliterateToLatin(normalized);
  // Return both versions so we can compare against either.
  return { normalized, latin };
};

// Generate a zero-padded ID like #001, #002, etc.
const generateIncrementalId = (prefix, currentCount) => {
  // Increase the count by one to create the next ID.
  const nextNumber = currentCount + 1;
  // Pad the number to three digits.
  const padded = nextNumber.toString().padStart(3, "0");
  // Return the formatted ID string with prefix.
  return `${prefix}${padded}`;
};

// Safely read the saved app data or fall back to defaults.
const loadAppData = () => {
  // Read the stored string from localStorage.
  const raw = localStorage.getItem(STORAGE_KEY);
  // If there is stored data, parse it; otherwise, build defaults.
  if (raw) {
    return JSON.parse(raw);
  }
  // Build default data with example entries.
  return {
    gear: [
      {
        id: "#001",
        name: "Atomic Prime",
        type: "🎿 СКИИ",
        status: "Available",
        rentedAt: null,
        rentedBy: null,
      },
      {
        id: "#002",
        name: "Burton Flight",
        type: "🏂 БОРД",
        status: "Rented",
        rentedAt: new Date().toISOString(),
        rentedBy: "C001",
      },
    ],
    clients: [
      {
        id: "C001",
        name: "Mila",
        surname: "Petrovic",
        phone: "+389 70 123 456",
      },
      {
        id: "C002",
        name: "Ivan",
        surname: "Stojanov",
        phone: "+389 70 654 321",
      },
    ],
    events: [
      {
        id: "E001",
        type: "RENTED",
        createdAt: new Date().toISOString(),
        gearId: "#002",
        clientId: "C001",
        message: "Burton Flight rented by Mila Petrovic.",
      },
    ],
  };
};

// Persist the current app data to localStorage.
const saveAppData = (data) => {
  // Convert the data to a string and save it in localStorage.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Create a new event entry and store it with the rest.
const addEvent = (data, details) => {
  // Build a new event ID using the current event count.
  const id = generateIncrementalId("E", data.events.length);
  // Create the event object with the provided details.
  const newEvent = {
    id,
    createdAt: new Date().toISOString(),
    ...details,
  };
  // Add the event to the array.
  data.events.unshift(newEvent);
};

// Find a client by ID and return a full name string.
const getClientName = (data, clientId) => {
  // Find the matching client entry.
  const client = data.clients.find((item) => item.id === clientId);
  // Return the combined name or a fallback.
  return client ? `${client.name} ${client.surname}` : "Unknown client";
};

// Find a gear item by ID and return the gear name.
const getGearName = (data, gearId) => {
  // Find the matching gear entry.
  const gear = data.gear.find((item) => item.id === gearId);
  // Return the name or a fallback.
  return gear ? gear.name : "Unknown gear";
};

/* =========================
   Rendering helpers
   ========================= */

// Create a DOM element with optional class names.
const createElement = (tag, className) => {
  // Create the element by tag name.
  const element = document.createElement(tag);
  // Apply the class name if provided.
  if (className) {
    element.className = className;
  }
  // Return the new element.
  return element;
};

// Remove all children from a DOM node.
const clearElement = (element) => {
  // Loop while the element has a first child.
  while (element.firstChild) {
    // Remove the first child node.
    element.removeChild(element.firstChild);
  }
};

// Build the bottom navigation bar and wire up events.
const renderBottomNav = (activeSection) => {
  // Create the navigation container.
  const nav = createElement("nav", "bottom-nav");
  // Define the sections for the nav buttons.
  const sections = [
    { id: "gear", label: "GEAR" },
    { id: "clients", label: "CLIENTS" },
    { id: "history", label: "HISTORY" },
  ];
  // Create a button for each section.
  sections.forEach((section) => {
    // Create the button element.
    const button = createElement("button", "nav-button");
    // Set the button text.
    button.textContent = section.label;
    // Highlight the button if it is active.
    if (section.id === activeSection) {
      button.classList.add("active");
    }
    // Add a click handler to update the hash.
    button.addEventListener("click", () => {
      // Update the location hash to trigger navigation.
      window.location.hash = section.id;
    });
    // Attach the button to the nav.
    nav.appendChild(button);
  });
  // Return the nav element.
  return nav;
};

// Build the modal overlay container.
const createModalOverlay = () => {
  // Create the overlay element.
  const overlay = createElement("div", "modal-overlay");
  // Return the overlay element.
  return overlay;
};

// Show a modal with provided content.
const openModal = (overlay, modalContent) => {
  // Clear any existing content in the overlay.
  clearElement(overlay);
  // Add the modal content to the overlay.
  overlay.appendChild(modalContent);
  // Display the overlay.
  overlay.classList.add("active");
};

// Close any open modal overlay.
const closeModal = (overlay) => {
  // Hide the overlay.
  overlay.classList.remove("active");
  // Remove the contents for clean state.
  clearElement(overlay);
};

/* =========================
   Gear page rendering
   ========================= */

// Render the gear management page.
const renderGearPage = (data, overlay, root) => {
  // Create the page container.
  const page = createElement("div", "page");
  // Create and append the page title.
  const title = createElement("div", "page-title");
  title.textContent = "Gear";
  page.appendChild(title);

  // Create the search and add row.
  const controlsRow = createElement("div", "controls-row");
  // Build the search input.
  const searchInput = createElement("input", "input");
  searchInput.placeholder = "Search gear...";
  // Build the add gear button.
  const addGearButton = createElement("button", "button");
  addGearButton.textContent = "ADD GEAR";
  // Append controls to the row.
  controlsRow.appendChild(searchInput);
  controlsRow.appendChild(addGearButton);
  page.appendChild(controlsRow);

  // Create the filter row.
  const filterRow = createElement("div", "controls-row");
  // Build the type filter dropdown.
  const typeFilter = createElement("select", "select");
  // Insert the default option.
  typeFilter.innerHTML = `<option value="">All Types</option>`;
  // Add each gear type option.
  GEAR_TYPES.forEach((type) => {
    // Create the option element.
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
  // Build the status filter dropdown.
  const statusFilter = createElement("select", "select");
  statusFilter.innerHTML = `<option value="">All Statuses</option>`;
  // Add each status option.
  GEAR_STATUSES.forEach((status) => {
    // Create the option element.
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusFilter.appendChild(option);
  });
  // Append filters to the row.
  filterRow.appendChild(typeFilter);
  filterRow.appendChild(statusFilter);
  page.appendChild(filterRow);

  // Create the grid container for gear cards.
  const cardGrid = createElement("div", "card-grid");
  page.appendChild(cardGrid);

  // Define a function to refresh the card list based on filters.
  const updateCards = () => {
    // Clear existing cards.
    clearElement(cardGrid);
    // Prepare the search normalization.
    const search = normalizeSearch(searchInput.value);
    // Filter the gear list.
    const filtered = data.gear.filter((gear) => {
      // Check type filter match.
      const matchesType = typeFilter.value ? gear.type === typeFilter.value : true;
      // Check status filter match.
      const matchesStatus = statusFilter.value ? gear.status === statusFilter.value : true;
      // Prepare normalized values for search matching.
      const combined = `${gear.type} ${gear.name} ${gear.id}`;
      const normalized = normalizeText(combined);
      const latin = transliterateToLatin(combined);
      // Check search match across both normalized versions.
      const matchesSearch =
        normalized.includes(search.normalized) || latin.includes(search.latin);
      // Return true if all filters match.
      return matchesType && matchesStatus && matchesSearch;
    });
    // Create a card for each matching gear entry.
    filtered.forEach((gear) => {
      // Create the card container.
      const card = createElement("div", "card");
      // Highlight the card if it is rented.
      if (gear.status === "Rented") {
        card.classList.add("rented");
      }

      // Create the card header with type and status.
      const header = createElement("div", "card-header");
      // Add the gear type.
      const typeText = createElement("div", "muted");
      typeText.textContent = gear.type;
      // Add the status badge.
      const statusBadge = createElement("div", "badge");
      statusBadge.textContent = gear.status;
      header.appendChild(typeText);
      header.appendChild(statusBadge);
      card.appendChild(header);

      // Add the gear name as a clickable link.
      const nameButton = createElement("button", "link");
      nameButton.textContent = gear.name;
      nameButton.addEventListener("click", () => {
        // Open the gear detail modal.
        openModal(overlay, buildGearDetailModal(data, overlay, gear));
      });
      card.appendChild(nameButton);

      // Add the gear ID.
      const idText = createElement("div", "muted");
      idText.textContent = `Gear ID ${gear.id}`;
      card.appendChild(idText);

      // If rented, show rental details.
      if (gear.status === "Rented" && gear.rentedAt && gear.rentedBy) {
        // Add the rental date line.
        const rentedAtText = createElement("div", "muted");
        rentedAtText.textContent = `Rented: ${formatDateTime(gear.rentedAt)}`;
        card.appendChild(rentedAtText);
        // Add the renter name line.
        const renterButton = createElement("button", "link");
        renterButton.textContent = `Rented by: ${getClientName(data, gear.rentedBy)}`;
        renterButton.addEventListener("click", () => {
          // Open the client detail page in a new tab.
          openClientDetailPage(gear.rentedBy);
        });
        card.appendChild(renterButton);
      }

      // Create the card actions container.
      const actions = createElement("div", "card-actions");
      // Create the rent/return button.
      const rentButton = createElement("button", "button");
      // Decide text based on status.
      rentButton.textContent = gear.status === "Rented" ? "RETURN GEAR" : "RENT GEAR";
      // Disable button if archived.
      if (gear.status === "Archived") {
        rentButton.disabled = true;
      }
      // Handle rent/return action.
      rentButton.addEventListener("click", () => {
        // If gear is available, open the rent modal.
        if (gear.status === "Available") {
          openModal(overlay, buildRentModal(data, overlay, gear));
        }
        // If gear is rented, mark it returned.
        if (gear.status === "Rented") {
          // Set gear status to available.
          gear.status = "Available";
          // Capture the previous renter for logging.
          const previousRenter = gear.rentedBy;
          // Clear rental fields.
          gear.rentedAt = null;
          gear.rentedBy = null;
          // Log the return event.
          addEvent(data, {
            type: "RETURNED",
            gearId: gear.id,
            clientId: previousRenter,
            message: `${gear.name} returned by ${getClientName(data, previousRenter)}.`,
          });
          // Save updated data.
          saveAppData(data);
          // Refresh the card list.
          updateCards();
        }
      });
      actions.appendChild(rentButton);
      card.appendChild(actions);

      // Append the card to the grid.
      cardGrid.appendChild(card);
    });
  };

  // Wire up filter and search events.
  searchInput.addEventListener("input", updateCards);
  typeFilter.addEventListener("change", updateCards);
  statusFilter.addEventListener("change", updateCards);

  // Open the add gear modal when button is clicked.
  addGearButton.addEventListener("click", () => {
    openModal(overlay, buildAddGearModal(data, overlay, updateCards));
  });

  // Render the initial card list.
  updateCards();

  // Append the page content to the root.
  root.appendChild(page);
};

/* =========================
   Clients page rendering
   ========================= */

// Render the clients management page.
const renderClientsPage = (data, overlay, root) => {
  // Create the page container.
  const page = createElement("div", "page");
  // Add the page title.
  const title = createElement("div", "page-title");
  title.textContent = "Clients";
  page.appendChild(title);

  // Create search row for clients.
  const controlsRow = createElement("div", "controls-row");
  // Build the search input.
  const searchInput = createElement("input", "input");
  searchInput.placeholder = "Search clients...";
  controlsRow.appendChild(searchInput);
  page.appendChild(controlsRow);

  // Create the grid container for client cards.
  const cardGrid = createElement("div", "card-grid");
  page.appendChild(cardGrid);

  // Build a helper to get client rentals.
  const getClientRentals = (clientId) => {
    // Filter gear items that are currently rented by this client.
    return data.gear.filter((gear) => gear.rentedBy === clientId);
  };

  // Build a helper to get client events sorted by date.
  const getClientEvents = (clientId) => {
    // Filter events related to the client.
    return data.events.filter((event) => event.clientId === clientId);
  };

  // Render the cards based on current search.
  const updateCards = () => {
    // Clear existing cards.
    clearElement(cardGrid);
    // Prepare the search normalization.
    const search = normalizeSearch(searchInput.value);
    // Filter clients by search input.
    const filtered = data.clients.filter((client) => {
      // Combine client data for search matching.
      const combined = `${client.name} ${client.surname} ${client.phone} ${client.id}`;
      // Normalize and transliterate for matching.
      const normalized = normalizeText(combined);
      const latin = transliterateToLatin(combined);
      // Check if the search term matches.
      return normalized.includes(search.normalized) || latin.includes(search.latin);
    });

    // Create a card for each client.
    filtered.forEach((client) => {
      // Create the card container.
      const card = createElement("div", "card");
      // Determine current rentals for status color.
      const currentRentals = getClientRentals(client.id);
      // Apply status class based on rentals.
      card.classList.add(
        currentRentals.length ? "client-active" : "client-inactive"
      );

      // Build the card header with name and ID.
      const header = createElement("div", "card-header");
      // Create a clickable client name link.
      const nameButton = createElement("button", "link");
      nameButton.textContent = `${client.name} ${client.surname}`;
      nameButton.addEventListener("click", () => {
        // Open the client detail page in a new tab.
        openClientDetailPage(client.id);
      });
      // Add ID badge.
      const idBadge = createElement("div", "badge");
      idBadge.textContent = client.id;
      header.appendChild(nameButton);
      header.appendChild(idBadge);
      card.appendChild(header);

      // Show phone number.
      const phoneText = createElement("div", "muted");
      phoneText.textContent = client.phone;
      card.appendChild(phoneText);

      // If client has active rentals, list them.
      currentRentals.forEach((gear) => {
        // Create a row for the rental entry.
        const rentalRow = createElement("div", "event-row rented");
        // Format the rental line.
        rentalRow.textContent = `${formatDateTime(gear.rentedAt)} - RENTED - ${gear.type} - ${gear.name}`;
        card.appendChild(rentalRow);
      });

      // Add the expandable events section.
      const eventsToggle = createElement("button", "button secondary");
      eventsToggle.textContent = "Events";
      // Create the events container.
      const eventsContainer = createElement("div", "events");
      // Populate events list.
      getClientEvents(client.id).forEach((event) => {
        // Build a row for the event.
        const eventRow = createElement("div", "event-row");
        // Apply class based on event type.
        if (event.type === "RETURNED") {
          eventRow.classList.add("returned");
        }
        if (event.type === "RENTED") {
          eventRow.classList.add("rented");
        }
        // Fill text with event details.
        eventRow.textContent = `${formatDateTime(event.createdAt)} - ${event.type} - ${event.message}`;
        eventsContainer.appendChild(eventRow);
      });
      // Toggle events on click.
      eventsToggle.addEventListener("click", () => {
        // Toggle expanded class.
        eventsContainer.classList.toggle("expanded");
      });
      card.appendChild(eventsToggle);
      card.appendChild(eventsContainer);

      // Append the card to the grid.
      cardGrid.appendChild(card);
    });
  };

  // Wire up search input event.
  searchInput.addEventListener("input", updateCards);

  // Render initial cards.
  updateCards();

  // Append page to root.
  root.appendChild(page);
};

/* =========================
   History page rendering
   ========================= */

// Render the history timeline page.
const renderHistoryPage = (data, root, clientFilterId = "") => {
  // Create the page container.
  const page = createElement("div", "page");
  // Create the title.
  const title = createElement("div", "page-title");
  title.textContent = "History";
  page.appendChild(title);

  // Create search input row.
  const controlsRow = createElement("div", "controls-row");
  // Build the search input.
  const searchInput = createElement("input", "input");
  searchInput.placeholder = "Search history...";
  controlsRow.appendChild(searchInput);
  page.appendChild(controlsRow);

  // Create the card grid for history entries.
  const cardGrid = createElement("div", "card-grid");
  page.appendChild(cardGrid);

  // Define helper to render cards.
  const updateCards = () => {
    // Clear existing cards.
    clearElement(cardGrid);
    // Normalize search input.
    const search = normalizeSearch(searchInput.value);
    // Filter events with optional client filter.
    const filtered = data.events.filter((event) => {
      // Skip events not matching the client filter.
      if (clientFilterId && event.clientId !== clientFilterId) {
        return false;
      }
      // Build a combined searchable string.
      const clientName = getClientName(data, event.clientId);
      const gearName = getGearName(data, event.gearId);
      const combined = `${event.type} ${clientName} ${event.clientId ?? ""} ${gearName} ${event.gearId ?? ""} ${event.message}`;
      // Normalize for matching.
      const normalized = normalizeText(combined);
      const latin = transliterateToLatin(combined);
      // Match either normalized or transliterated.
      return normalized.includes(search.normalized) || latin.includes(search.latin);
    });

    // Create cards for each event.
    filtered.forEach((event) => {
      // Create the card container.
      const card = createElement("div", "card");
      // Add the event type badge.
      const header = createElement("div", "card-header");
      const badge = createElement("div", "badge");
      badge.textContent = event.type;
      const timestamp = createElement("div", "muted");
      timestamp.textContent = formatDateTime(event.createdAt);
      header.appendChild(badge);
      header.appendChild(timestamp);
      card.appendChild(header);

      // Add the message line.
      const message = createElement("div", "card-title");
      message.textContent = event.message;
      card.appendChild(message);

      // Add client and gear references.
      const reference = createElement("div", "muted");
      reference.textContent = `Client: ${getClientName(data, event.clientId)} | Gear: ${getGearName(data, event.gearId)}`;
      card.appendChild(reference);

      // Append the card to the grid.
      cardGrid.appendChild(card);
    });
  };

  // Wire search input changes to update cards.
  searchInput.addEventListener("input", updateCards);

  // Render initial cards.
  updateCards();

  // Append page to root.
  root.appendChild(page);
};

/* =========================
   Modals for gear actions
   ========================= */

// Build the modal for adding new gear.
const buildAddGearModal = (data, overlay, onSave) => {
  // Create modal container.
  const modal = createElement("div", "modal");
  // Add title.
  const title = createElement("div", "card-title");
  title.textContent = "Add Gear";
  modal.appendChild(title);

  // Create ID display field.
  const idRow = createElement("div", "form-row");
  const idLabel = createElement("label", "muted");
  idLabel.textContent = "ID";
  const idValue = createElement("div", "card-title");
  const newId = generateIncrementalId("#", data.gear.length);
  idValue.textContent = newId;
  idRow.appendChild(idLabel);
  idRow.appendChild(idValue);
  modal.appendChild(idRow);

  // Create name input field.
  const nameRow = createElement("div", "form-row");
  const nameLabel = createElement("label", "muted");
  nameLabel.textContent = "Name";
  const nameInput = createElement("input", "input");
  nameInput.placeholder = "Enter gear name";
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  modal.appendChild(nameRow);

  // Create type dropdown field.
  const typeRow = createElement("div", "form-row");
  const typeLabel = createElement("label", "muted");
  typeLabel.textContent = "Type";
  const typeSelect = createElement("select", "select");
  GEAR_TYPES.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(typeSelect);
  modal.appendChild(typeRow);

  // Build action buttons row.
  const actions = createElement("div", "card-actions");
  const cancelButton = createElement("button", "button secondary");
  cancelButton.textContent = "Cancel";
  const saveButton = createElement("button", "button");
  saveButton.textContent = "Save";
  actions.appendChild(cancelButton);
  actions.appendChild(saveButton);
  modal.appendChild(actions);

  // Close modal on cancel.
  cancelButton.addEventListener("click", () => {
    closeModal(overlay);
  });

  // Save new gear on click.
  saveButton.addEventListener("click", () => {
    // Build the gear record.
    const newGear = {
      id: newId,
      name: nameInput.value || "Unnamed Gear",
      type: typeSelect.value,
      status: "Available",
      rentedAt: null,
      rentedBy: null,
    };
    // Add gear to data store.
    data.gear.push(newGear);
    // Log the creation event.
    addEvent(data, {
      type: "NEW",
      gearId: newGear.id,
      clientId: null,
      message: `${newGear.name} added to inventory.`,
    });
    // Persist data.
    saveAppData(data);
    // Refresh cards.
    onSave();
    // Close modal.
    closeModal(overlay);
  });

  // Return the modal element.
  return modal;
};

// Build the modal for editing gear details.
const buildGearDetailModal = (data, overlay, gear) => {
  // Create modal container.
  const modal = createElement("div", "modal");
  // Add title.
  const title = createElement("div", "card-title");
  title.textContent = "Gear Details";
  modal.appendChild(title);

  // Create ID display.
  const idRow = createElement("div", "form-row");
  const idLabel = createElement("label", "muted");
  idLabel.textContent = "ID";
  const idValue = createElement("div", "card-title");
  idValue.textContent = gear.id;
  idRow.appendChild(idLabel);
  idRow.appendChild(idValue);
  modal.appendChild(idRow);

  // Create name input.
  const nameRow = createElement("div", "form-row");
  const nameLabel = createElement("label", "muted");
  nameLabel.textContent = "Name";
  const nameInput = createElement("input", "input");
  nameInput.value = gear.name;
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  modal.appendChild(nameRow);

  // Create type select.
  const typeRow = createElement("div", "form-row");
  const typeLabel = createElement("label", "muted");
  typeLabel.textContent = "Type";
  const typeSelect = createElement("select", "select");
  GEAR_TYPES.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    if (type === gear.type) {
      option.selected = true;
    }
    typeSelect.appendChild(option);
  });
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(typeSelect);
  modal.appendChild(typeRow);

  // Create status select.
  const statusRow = createElement("div", "form-row");
  const statusLabel = createElement("label", "muted");
  statusLabel.textContent = "Status";
  const statusSelect = createElement("select", "select");
  GEAR_STATUSES.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    if (status === gear.status) {
      option.selected = true;
    }
    statusSelect.appendChild(option);
  });
  statusRow.appendChild(statusLabel);
  statusRow.appendChild(statusSelect);
  modal.appendChild(statusRow);

  // Create action buttons.
  const actions = createElement("div", "card-actions");
  const archiveButton = createElement("button", "button secondary");
  archiveButton.textContent = "ARCHIVE";
  const deleteButton = createElement("button", "button danger");
  deleteButton.textContent = "DELETE";
  const saveButton = createElement("button", "button");
  saveButton.textContent = "SAVE";
  actions.appendChild(archiveButton);
  actions.appendChild(deleteButton);
  actions.appendChild(saveButton);
  modal.appendChild(actions);

  // Archive the gear item.
  archiveButton.addEventListener("click", () => {
    // Set status to archived.
    gear.status = "Archived";
    // Clear rental data.
    gear.rentedAt = null;
    gear.rentedBy = null;
    // Log the archive event.
    addEvent(data, {
      type: "ARCHIVED",
      gearId: gear.id,
      clientId: null,
      message: `${gear.name} archived.`,
    });
    // Save data.
    saveAppData(data);
    // Close modal.
    closeModal(overlay);
    // Refresh the page.
    renderApp();
  });

  // Delete the gear item.
  deleteButton.addEventListener("click", () => {
    // Remove the gear from data.
    data.gear = data.gear.filter((item) => item.id !== gear.id);
    // Log the delete event.
    addEvent(data, {
      type: "DELETED",
      gearId: gear.id,
      clientId: null,
      message: `${gear.name} deleted.`,
    });
    // Save data.
    saveAppData(data);
    // Close modal.
    closeModal(overlay);
    // Refresh the page.
    renderApp();
  });

  // Save changes to gear.
  saveButton.addEventListener("click", () => {
    // Update gear fields.
    gear.name = nameInput.value || gear.name;
    gear.type = typeSelect.value;
    gear.status = statusSelect.value;
    // Log the change event.
    addEvent(data, {
      type: "CHANGED",
      gearId: gear.id,
      clientId: gear.rentedBy,
      message: `${gear.name} updated.`,
    });
    // Save data.
    saveAppData(data);
    // Close modal.
    closeModal(overlay);
    // Refresh page.
    renderApp();
  });

  // Return modal.
  return modal;
};

// Build the modal to rent gear to a client.
const buildRentModal = (data, overlay, gear) => {
  // Create modal container.
  const modal = createElement("div", "modal");
  // Add title.
  const title = createElement("div", "card-title");
  title.textContent = "Rent Gear";
  modal.appendChild(title);

  // Create client select row.
  const clientRow = createElement("div", "form-row");
  const clientLabel = createElement("label", "muted");
  clientLabel.textContent = "Client";
  const clientSelect = createElement("select", "select");
  data.clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = `${client.name} ${client.surname}`;
    clientSelect.appendChild(option);
  });
  clientRow.appendChild(clientLabel);
  clientRow.appendChild(clientSelect);
  modal.appendChild(clientRow);

  // Build action buttons.
  const actions = createElement("div", "card-actions");
  const cancelButton = createElement("button", "button secondary");
  cancelButton.textContent = "Cancel";
  const rentButton = createElement("button", "button");
  rentButton.textContent = "Confirm Rent";
  actions.appendChild(cancelButton);
  actions.appendChild(rentButton);
  modal.appendChild(actions);

  // Close modal on cancel.
  cancelButton.addEventListener("click", () => {
    closeModal(overlay);
  });

  // Confirm rent action.
  rentButton.addEventListener("click", () => {
    // Assign gear status and rental data.
    gear.status = "Rented";
    gear.rentedAt = new Date().toISOString();
    gear.rentedBy = clientSelect.value;
    // Log the rent event.
    addEvent(data, {
      type: "RENTED",
      gearId: gear.id,
      clientId: gear.rentedBy,
      message: `${gear.name} rented by ${getClientName(data, gear.rentedBy)}.`,
    });
    // Save data.
    saveAppData(data);
    // Close modal.
    closeModal(overlay);
    // Refresh the page.
    renderApp();
  });

  // Return modal.
  return modal;
};

/* =========================
   Client detail page
   ========================= */

// Build the client detail page for editing.
const renderClientDetailPage = (data, root, clientId) => {
  // Locate the client record.
  const client = data.clients.find((item) => item.id === clientId);
  // Create the page container.
  const page = createElement("div", "page");
  // Create title.
  const title = createElement("div", "page-title");
  title.textContent = "Client Details";
  page.appendChild(title);

  // If client does not exist, show error message.
  if (!client) {
    const message = createElement("div", "card");
    message.textContent = "Client not found.";
    page.appendChild(message);
    root.appendChild(page);
    return;
  }

  // Build the detail card.
  const detailCard = createElement("div", "detail-card");

  // ID display field.
  const idRow = createElement("div", "form-row");
  const idLabel = createElement("label", "muted");
  idLabel.textContent = "Client ID";
  const idValue = createElement("div", "card-title");
  idValue.textContent = client.id;
  idRow.appendChild(idLabel);
  idRow.appendChild(idValue);
  detailCard.appendChild(idRow);

  // Name field.
  const nameRow = createElement("div", "form-row");
  const nameLabel = createElement("label", "muted");
  nameLabel.textContent = "Name";
  const nameInput = createElement("input", "input");
  nameInput.value = client.name;
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  detailCard.appendChild(nameRow);

  // Surname field.
  const surnameRow = createElement("div", "form-row");
  const surnameLabel = createElement("label", "muted");
  surnameLabel.textContent = "Surname";
  const surnameInput = createElement("input", "input");
  surnameInput.value = client.surname;
  surnameRow.appendChild(surnameLabel);
  surnameRow.appendChild(surnameInput);
  detailCard.appendChild(surnameRow);

  // Phone field.
  const phoneRow = createElement("div", "form-row");
  const phoneLabel = createElement("label", "muted");
  phoneLabel.textContent = "Phone";
  const phoneInput = createElement("input", "input");
  phoneInput.value = client.phone;
  phoneRow.appendChild(phoneLabel);
  phoneRow.appendChild(phoneInput);
  detailCard.appendChild(phoneRow);

  // Divider line.
  const divider = createElement("hr", "section-divider");
  detailCard.appendChild(divider);

  // Action buttons row.
  const actions = createElement("div", "card-actions");
  const saveButton = createElement("button", "button success");
  saveButton.textContent = "SAVE";
  const deleteButton = createElement("button", "button danger");
  deleteButton.textContent = "DELETE";
  actions.appendChild(saveButton);
  actions.appendChild(deleteButton);
  detailCard.appendChild(actions);

  // Build history button row.
  const historyButton = createElement("button", "button secondary");
  historyButton.textContent = "HISTORY";
  // Only show history button if client has any events.
  const hasHistory = data.events.some((event) => event.clientId === client.id);
  if (hasHistory) {
    detailCard.appendChild(historyButton);
  }

  // Save client changes.
  saveButton.addEventListener("click", () => {
    // Update client fields.
    client.name = nameInput.value || client.name;
    client.surname = surnameInput.value || client.surname;
    client.phone = phoneInput.value || client.phone;
    // Log change event.
    addEvent(data, {
      type: "CHANGED",
      clientId: client.id,
      gearId: null,
      message: `Client ${client.name} ${client.surname} updated.`,
    });
    // Save data.
    saveAppData(data);
    // Refresh page.
    renderApp();
  });

  // Delete the client.
  deleteButton.addEventListener("click", () => {
    // Remove client from data.
    data.clients = data.clients.filter((item) => item.id !== client.id);
    // Remove any gear rented by client.
    data.gear.forEach((gear) => {
      if (gear.rentedBy === client.id) {
        gear.status = "Available";
        gear.rentedAt = null;
        gear.rentedBy = null;
      }
    });
    // Log delete event.
    addEvent(data, {
      type: "DELETED",
      clientId: client.id,
      gearId: null,
      message: `Client ${client.name} ${client.surname} deleted.`,
    });
    // Save data.
    saveAppData(data);
    // Redirect to main app.
    window.location.href = "./";
  });

  // Open history filtered by client.
  historyButton.addEventListener("click", () => {
    // Open the history page in a new tab.
    openHistoryForClient(client.id);
  });

  // Append detail card to page.
  page.appendChild(detailCard);

  // Append page to root.
  root.appendChild(page);
};

/* =========================
   Navigation helpers
   ========================= */

// Open the client detail page in a new browser tab.
const openClientDetailPage = (clientId) => {
  // Build the URL with a query parameter.
  const url = `./?view=client&clientId=${clientId}`;
  // Open in a new tab.
  window.open(url, "_blank");
};

// Open the history page filtered by a specific client.
const openHistoryForClient = (clientId) => {
  // Build the URL with a query parameter.
  const url = `./?view=history&clientId=${clientId}`;
  // Open in a new tab.
  window.open(url, "_blank");
};

/* =========================
   App rendering entry point
   ========================= */

// Render the application based on URL and hash.
const renderApp = () => {
  // Load current data.
  const data = loadAppData();
  // Persist data in case defaults were created.
  saveAppData(data);

  // Get the root element.
  const root = document.getElementById("app");
  // Clear previous content.
  clearElement(root);

  // Create a modal overlay and append it.
  const overlay = createModalOverlay();
  root.appendChild(overlay);

  // Parse query parameters.
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const clientId = params.get("clientId");

  // Render client detail view if requested.
  if (view === "client" && clientId) {
    renderClientDetailPage(data, root, clientId);
    return;
  }

  // Render history view if requested via query param.
  if (view === "history") {
    renderHistoryPage(data, root, clientId ?? "");
    return;
  }

  // Determine the active section from the hash.
  const hash = window.location.hash.replace("#", "");
  const section = hash || "gear";

  // Render the selected section.
  if (section === "gear") {
    renderGearPage(data, overlay, root);
  }
  if (section === "clients") {
    renderClientsPage(data, overlay, root);
  }
  if (section === "history") {
    renderHistoryPage(data, root);
  }

  // Append the bottom navigation bar.
  root.appendChild(renderBottomNav(section));
};

// Re-render the app on hash change for navigation.
window.addEventListener("hashchange", renderApp);

// Render the app when the page finishes loading.
window.addEventListener("load", renderApp);
