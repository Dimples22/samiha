const unlockBtn = document.getElementById('unlockBtn');
const keyInput = document.getElementById('keyInput');
const puzzles = document.getElementById('puzzles');
const errorMsg = document.getElementById('errorMsg');

const SECRET_KEY = "NANU";

unlockBtn.addEventListener('click', () => {
  if (keyInput.value.trim().toUpperCase() === SECRET_KEY) {
    puzzles.style.display = "block";
    errorMsg.textContent = "";
  } else {
    puzzles.style.display = "none";
    errorMsg.textContent = "Incorrect key! Only readers can solve the puzzles.";
  }
});

const cells = document.querySelectorAll(".cell[data-letter]");
const result = document.getElementById("crosswordResult");
const checkBtn = document.getElementById("checkCrosswordBtn");

checkBtn.addEventListener("click", () => {
  let correct = 0;
  cells.forEach(cell => {
    const input = cell.querySelector("input");
    if (!input) return;
    if (input.value.toUpperCase() === cell.dataset.letter) {
      cell.style.background = "green";
      correct++;
    } else {
      cell.style.background = "red";
    }
  });

  if (correct === cells.length) {
    result.textContent = "Congratulations! You solved the crossword.";
    result.style.color = "var(--accent)";
  } else {
    result.textContent = `You got ${correct} out of ${cells.length} letters right.`;
    result.style.color = "var(--secondary)";
  }
});
