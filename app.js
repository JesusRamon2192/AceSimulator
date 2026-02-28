/*****************************************
 * ESTADO GLOBAL
 *****************************************/
let questions = [];
let answers = [];
let currentQuestion = 0;
let showingFeedback = false;
let questionGenerator = null;

/*****************************************
 * DOM
 *****************************************/
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result-box");
const generationPanel = document.getElementById("generation-panel");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const counterEl = document.getElementById("question-counter");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

/*****************************************
 * INIT
 *****************************************/
document.addEventListener("DOMContentLoaded", () => {
  hideQuiz();
  initQuestionGenerator();
});

/*****************************************
 * VISIBILIDAD
 *****************************************/
function hideQuiz() {
  quizBox.classList.add("hidden");
  resultBox.classList.add("hidden");
  generationPanel.classList.remove("hidden");
}

function showQuiz() {
  generationPanel.classList.add("hidden");
  resultBox.classList.add("hidden");
  quizBox.classList.remove("hidden");
}

/*****************************************
 * QUESTION GENERATOR
 *****************************************/
function initQuestionGenerator() {
  questionGenerator = new QuestionGenerator();
  document
    .getElementById("generate-exam")
    .addEventListener("click", handleGenerateExam);
}

async function handleGenerateExam() {
  const sizeInput = document.getElementById("exam-size");
  const examSize = parseInt(sizeInput.value) || 10;
  const button = document.getElementById("generate-exam");

  if (examSize < 1 || examSize > 80) {
    showStatus("❌ Ingresa un número entre 1 y 80", "error");
    return;
  }

  try {
    button.disabled = true;
    showStatus("🔄 Generando examen con IA...", "loading");

    resetState();

    const generated =
      await questionGenerator.generateMultipleQuestions(examSize);

    if (!Array.isArray(generated) || generated.length === 0) {
      throw new Error("Preguntas inválidas");
    }

    questions = generated;
    answers = new Array(questions.length).fill(null);

    saveQuestionsToStorage();

    showQuiz();
    initSimulator();

    showStatus(
      `✅ Examen generado (${questions.length} preguntas)`,
      "success"
    );
  } catch (err) {
    console.error(err);
    showStatus("❌ Error generando el examen", "error");
  } finally {
    button.disabled = false;
  }
}

/*****************************************
 * SIMULADOR
 *****************************************/
function initSimulator() {
  currentQuestion = 0;
  showingFeedback = false;

  nextBtn.onclick = nextQuestion;
  prevBtn.onclick = prevQuestion;

  loadQuestion();
}

function loadQuestion() {
  const q = questions[currentQuestion];
  if (!q) return;

  counterEl.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}`;
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";
  showingFeedback = false;
  nextBtn.textContent = "Siguiente";

  removeExplanation();

  q.options.forEach((opt, i) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="option" value="${i}"
      ${answers[currentQuestion] === i ? "checked" : ""}>
      ${opt}
    `;
    label.querySelector("input").onchange = () => {
      answers[currentQuestion] = i;
    };
    optionsEl.appendChild(label);
  });
}

/*****************************************
 * FEEDBACK
 *****************************************/
function showFeedback() {
  const q = questions[currentQuestion];
  const labels = optionsEl.querySelectorAll("label");
  const inputs = optionsEl.querySelectorAll("input");

  inputs.forEach(i => (i.disabled = true));

  labels.forEach((label, i) => {
    if (i === q.answer) label.classList.add("correct");
    else if (answers[currentQuestion] === i)
      label.classList.add("incorrect");
  });

  createExplanationButton();
  showingFeedback = true;

  nextBtn.textContent =
    currentQuestion < questions.length - 1
      ? "Continuar"
      : "Ver Resultado";
}

function createExplanationButton() {
  if (document.getElementById("explanation-btn")) return;

  const btn = document.createElement("button");
  btn.id = "explanation-btn";
  btn.textContent = "Ver explicación";
  btn.onclick = showExplanation;

  document.querySelector(".buttons")?.before(btn);
}

function showExplanation() {
  const q = questions[currentQuestion];
  let box = document.getElementById("explanation-box");

  if (box) {
    box.remove();
    return;
  }

  box = document.createElement("div");
  box.id = "explanation-box";
  box.innerHTML = `<strong>💡 Explicación:</strong><p>${q.explicacion}</p>`;
  document.querySelector(".buttons")?.before(box);
}

function removeExplanation() {
  document.getElementById("explanation-btn")?.remove();
  document.getElementById("explanation-box")?.remove();
}

/*****************************************
 * NAVEGACIÓN
 *****************************************/
function nextQuestion() {
  if (!showingFeedback) {
    if (answers[currentQuestion] === null) {
      alert("Selecciona una respuesta");
      return;
    }
    showFeedback();
  } else {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      loadQuestion();
    } else {
      showResult();
    }
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    loadQuestion();
  }
}

/*****************************************
 * RESULTADO
 *****************************************/
function showResult() {
  let score = 0;
  const incorrectQuestions = [];
  
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) {
      score++;
    } else {
      incorrectQuestions.push({
        questionNumber: i + 1,
        question: q.question,
        userAnswer: answers[i],
        correctAnswer: q.answer,
        options: q.options,
        explanation: q.explicacion
      });
    }
  });

  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");

  // Calculate percentage
  const percentage = ((score / questions.length) * 100).toFixed(1);
  
  // Determine recommendation
  const isRecommended = percentage >= 70;
  const recommendationText = isRecommended
    ? "✅ ¡Estás listo! Se recomienda presentar el examen de certificación oficial."
    : "⚠️ Se recomienda estudiar más antes de presentar el examen oficial. Intenta obtener al menos 70% de aciertos.";
  
  const recommendationClass = isRecommended ? "recommendation-pass" : "recommendation-study";

  document.getElementById(
    "score"
  ).textContent = `Obtuviste ${score} / ${questions.length}`;
  
  // Add percentage and recommendation
  const scoreElement = document.getElementById("score");
  scoreElement.innerHTML = `
    Obtuviste ${score} / ${questions.length}
    <div class="percentage-score">Calificación: ${percentage}%</div>
    <div class="recommendation ${recommendationClass}">${recommendationText}</div>
  `;
  
  displayIncorrectQuestions(incorrectQuestions);
}

function displayIncorrectQuestions(incorrectQuestions) {
  const container = document.getElementById("incorrect-questions-container");
  
  if (incorrectQuestions.length === 0) {
    container.innerHTML = `
      <div class="perfect-score">
        <h3>🎉 ¡Perfecto!</h3>
        <p>No tuviste ninguna respuesta incorrecta.</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="incorrect-questions-header">
      <h3>📝 Revisión de Respuestas Incorrectas</h3>
      <p>Revisa las ${incorrectQuestions.length} pregunta(s) que respondiste incorrectamente:</p>
    </div>
  `;
  
  incorrectQuestions.forEach((item) => {
    const userAnswerText = item.userAnswer !== null 
      ? item.options[item.userAnswer] 
      : "No respondida";
    const correctAnswerText = item.options[item.correctAnswer];
    
    html += `
      <div class="incorrect-question-item">
        <div class="question-number-badge">Pregunta ${item.questionNumber}</div>
        <div class="question-text">${item.question}</div>
        
        <div class="answer-comparison">
          <div class="user-answer">
            <strong>❌ Tu respuesta:</strong>
            <p>${userAnswerText}</p>
          </div>
          
          <div class="correct-answer">
            <strong>✅ Respuesta correcta:</strong>
            <p>${correctAnswerText}</p>
          </div>
        </div>
        
        <div class="explanation">
          <strong>💡 Explicación:</strong>
          <p>${item.explanation}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/*****************************************
 * STORAGE
 *****************************************/
function saveQuestionsToStorage() {
  localStorage.setItem("ace-questions", JSON.stringify(questions));
}

function resetState() {
  localStorage.removeItem("ace-questions");
  questions = [];
  answers = [];
  currentQuestion = 0;
  showingFeedback = false;
}

/*****************************************
 * UI
 *****************************************/
function showStatus(msg, type) {
  const el = document.getElementById("generation-status");
  el.textContent = msg;
  el.className = `generation-status ${type}`;
  el.classList.remove("hidden");
}
