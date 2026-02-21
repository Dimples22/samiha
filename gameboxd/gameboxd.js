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
    <p>The current rating system uses 5 stars.</p>
    <p>Your reviews are saved on your device.</p>
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

//REVIEWS PAGE 
function showReviews() {
  let reviews = JSON.parse(localStorage.getItem("reviews")) || [];

  content.innerHTML = `
    <h2>Your Reviews</h2>

    <div class="review-controls">
      <select id="sortSelect">
        <option value="new">Newest</option>
        <option value="old">Oldest</option>
        <option value="high">Highest Rated</option>
        <option value="low">Lowest Rated</option>
      </select>

      <input id="franchiseInput" placeholder="Filter by franchise (e.g. Pokemon)" />
      <button id="applyFilters">Apply</button>
    </div>

    <div class="user-reviews-flex" id="reviewsContainer"></div>
  `;

  const container = document.getElementById("reviewsContainer");

  function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  function renderReviews(list) {
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = "<p>No matching reviews</p>";
      return;
    }

    list.forEach((r, index) => {
      const div = document.createElement("div");
      div.className = "review-card";

      div.innerHTML = `
        <img src="${r.image || ''}" alt="${r.name}">
        <h3>${r.name}</h3>
        <p>⭐ ${r.rating}</p>
        <p>${r.text}</p>
        <small>${formatDate(r.date)}</small>
        <div class="review-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      // EDIT
      div.querySelector(".edit-btn").onclick = () => {
        openGame({ id: r.gameId, name: r.name, background_image: r.image });

        setTimeout(() => {
          document.getElementById("review").value = r.text;
          selectedRating = r.rating;
          highlightStars(selectedRating);
        }, 50);

        reviews.splice(index, 1);
        localStorage.setItem("reviews", JSON.stringify(reviews));
      };

      // DELETE
      div.querySelector(".delete-btn").onclick = () => {
        if (confirm("Delete this review?")) {
          reviews.splice(index, 1);
          localStorage.setItem("reviews", JSON.stringify(reviews));
          showReviews();
        }
      };

      container.appendChild(div);
    });
  }

  function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

  function applyFilters() {
  const sort = document.getElementById("sortSelect").value;
  const franchiseInput = document.getElementById("franchiseInput").value;

  let reviews = JSON.parse(localStorage.getItem("reviews")) || [];

  //Filter
  if (franchiseInput) {
    const search = normalizeText(franchiseInput);

    reviews = reviews.filter(r =>
      normalizeText(r.name).includes(search)
    );
  }

  //Sort
  if (sort === "new") {
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (sort === "old") {
    reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (sort === "high") {
    reviews.sort((a, b) => b.rating - a.rating);
  }

  if (sort === "low") {
    reviews.sort((a, b) => a.rating - b.rating);
  }

  renderReviews(reviews);
}


  document.getElementById("applyFilters").onclick = applyFilters;

  applyFilters();
}

//SEARCH 
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
    content.innerHTML = "<p>Failed to fetch games.</p>";
  }
}

//OPEN GAME 
let selectedRating = 0;

function openGame(game) {
  currentGame = game;

  content.innerHTML = `
    <h2>${game.name}</h2>
    <img src="${game.background_image || ''}" width="300">
    <div class="review-container">
      <div class="star-rating" id="star-rating"></div>
      <textarea id="review" placeholder="Write a review..."></textarea>
      <button id="save-review-btn">Save Review</button>
      <div id="reviews"></div>
    </div>
  `;

  const starContainer = document.getElementById("star-rating");

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("label");
    star.textContent = "★";
    star.dataset.value = i;

    star.addEventListener("mouseenter", () => highlightStars(i));
    star.addEventListener("mouseleave", () => highlightStars(selectedRating));
    star.addEventListener("click", () => {
      selectedRating = i;
      highlightStars(selectedRating);
    });

    starContainer.appendChild(star);
  }

  window.highlightStars = function (rating) {
    Array.from(starContainer.children).forEach(star => {
      star.classList.toggle("selected", star.dataset.value <= rating);
    });
  };

  highlightStars(selectedRating);

  const reviews = getReviews(game.id);
  const reviewsDiv = document.getElementById("reviews");

  reviewsDiv.innerHTML = reviews.length
    ? reviews.map(r => {
        const d = new Date(r.date);
        return `<p>⭐ ${r.rating} - ${r.text} <small>${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}</small></p>`;
      }).join("")
    : "<p>No reviews yet</p>";

  document.getElementById("save-review-btn").onclick = () => {
    const text = document.getElementById("review").value.trim();
    if (!selectedRating || !text) return alert("Add rating and review");

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

//GET REVIEWS 
function getReviews(gameId) {
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  return reviews.filter(r => r.gameId === gameId);
}

//START 
showHome();


