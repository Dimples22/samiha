const content = document.getElementById("content");
let currentGame = null;
let platforms = [];

//Fetch Platforms
async function getPlatforms() {
  try {
    const res = await fetch('https://api.rawg.io/api/platforms?key=74dd4139e83a4b979485dcccc545c8d8');
    const data = await res.json();
    platforms = data.results;
  } catch (err) {
    console.error("Error fetching platforms:", err);
  }
}
getPlatforms();

//NAV
function showHome() {
  content.innerHTML = `
    <h2>Welcome to GameBoxd</h2>
    <p>Use the navigation above to search for games or view your reviews.</p>
    <p> The current rating system uses 5 stars, no half stars.</p>
    <p> Your reviews should save on your browser/device.</p>
  `;
}

function showSearch() {
  content.innerHTML = `
    <div class="search-bar">
      <input id="searchInput" placeholder="Search games..." />
      <button onclick="searchGames()">Search</button>
      <select id="platformSelect">
        <option value="">All Platforms</option>
        ${platforms.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
    </div>
    <div id="searchResults" class="flex-games"></div>
  `;
}

function showReviews() {
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  content.innerHTML = "<h2>Your Reviews</h2>";

  if (!reviews.length) {
    content.innerHTML += "<p>You haven't added any reviews yet.</p>";
    return;
  }

  const flexDiv = document.createElement("div");
  flexDiv.className = "user-reviews-flex";

  reviews.forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "review-card";

    const dateObj = new Date(r.date);
    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

    div.innerHTML = `
      <img src="${r.image || ''}" alt="${r.name}">
      <h3>${r.name}</h3>
      <p>⭐ ${r.rating}</p>
      <p>${r.text}</p>
      <small>${formattedDate}</small>
      <div class="review-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    div.querySelector(".edit-btn").onclick = () => {
      openGame({ id: r.gameId, name: r.name, background_image: r.image });
      document.getElementById("review").value = r.text;
      selectedRating = r.rating;
      highlightStars(selectedRating);
      reviews.splice(index, 1);
      localStorage.setItem("reviews", JSON.stringify(reviews));
    };

    div.querySelector(".delete-btn").onclick = () => {
      if (confirm("Delete this review?")) {
        reviews.splice(index, 1);
        localStorage.setItem("reviews", JSON.stringify(reviews));
        showReviews();
      }
    };

    flexDiv.appendChild(div);
  });

  content.appendChild(flexDiv);
}

//Search Games 
async function searchGames() {
  const query = document.getElementById("searchInput").value.trim();
  const platform = document.getElementById("platformSelect").value;

  let url = `https://api.rawg.io/api/games?key=74dd4139e83a4b979485dcccc545c8d8`;
  if (platform) url += `&platforms=${platform}`;
  if (query) url += `&search=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = "";

    if (!data.results || !data.results.length) {
      resultsDiv.innerHTML = `<p>No games found for "${query}"</p>`;
      return;
    }

    data.results.forEach(game => {
      const div = document.createElement("div");
      div.className = "game";
      div.innerHTML = `
        <img src="${game.background_image || ''}" alt="${game.name}">
        <p>${game.name}</p>
      `;
      div.onclick = () => openGame(game);
      resultsDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    content.innerHTML = "<p>Failed to fetch games. Try again later.</p>";
  }
}

//Open Game 
let selectedRating = 0;

function openGame(game) {
  currentGame = game;

  content.innerHTML = `
    <h2>${game.name}</h2>
    <img src="${game.background_image || ''}" width="300" alt="${game.name}">
    <div class="review-container">
      <div class="star-rating" id="star-rating"></div>
      <textarea id="review" placeholder="Write a review..."></textarea>
      <button id="save-review-btn">Save Review</button>
      <div id="reviews"></div>
    </div>
  `;

  const starContainer = document.getElementById("star-rating");
  starContainer.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const label = document.createElement("label");
    label.textContent = "★";
    label.dataset.value = i;

    label.addEventListener("mouseenter", () => highlightStars(i));
    label.addEventListener("mouseleave", () => highlightStars(selectedRating));
    label.addEventListener("click", () => {
      selectedRating = i;
      highlightStars(selectedRating);
    });

    starContainer.appendChild(label);
  }

  function highlightStars(rating) {
    Array.from(starContainer.children).forEach(star => {
      star.classList.toggle("selected", star.dataset.value <= rating);
    });
  }

  highlightStars(selectedRating);

  const reviews = getReviews(game.id);
  const reviewsDiv = document.getElementById("reviews");
  reviewsDiv.innerHTML = reviews.length
    ? reviews.map(r => {
        const d = new Date(r.date);
        const formatted = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        return `<p>⭐ ${r.rating} - ${r.text} <small>${formatted}</small></p>`;
      }).join("")
    : "<p>No reviews yet</p>";

  document.getElementById("save-review-btn").onclick = () => {
    const text = document.getElementById("review").value.trim();
    if (!selectedRating || !text) return alert("Please select a rating and write a review.");

    const allReviews = JSON.parse(localStorage.getItem("reviews")) || [];
    allReviews.push({
      gameId: game.id,
      name: game.name,
      image: game.background_image || '',
      rating: selectedRating,
      text,
      date: new Date()
    });
    localStorage.setItem("reviews", JSON.stringify(allReviews));
    selectedRating = 0;

    openGame(game);
  };
}

function getReviews(gameId) {
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  return reviews.filter(r => r.gameId === gameId);
}

showHome();