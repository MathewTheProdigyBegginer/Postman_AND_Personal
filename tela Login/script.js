import { API_BASE_URL } from "../config/apiConfig.js";
import { saveToLocalStorage } from "../config/storage.js";

const acessar = document.getElementById("acessar");
const emailInput = document.getElementById("email");
const mensagemerro = document.getElementById("mensagem-erro");

acessar.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    showError("Informe um e-mail válido.");
    return;
  }

  const submitButton = acessar.querySelector("button");
  disableButton(submitButton, true);

  try {
    const response = await fetch(`${API_BASE_URL}/GetPersonByEmail?Email=${email}`);
    if (!response.ok) {
      if (response.status === 422) {
        const errorData = await response.json();
        showError(errorData.Errors[0]);
      } else {
        showError("Aconteceu um erro inesperado, tente novamente.");
      }
      return;
    }

    const userData = await response.json();
    saveToLocalStorage("user", { id: userData.Id, email: userData.Email });
    window.location.href = "InitialDevs.html";
  } catch (error) {
    showError("Falha ao se conectar com o servidor.");
  } finally {
    disableButton(submitButton, false);
  }
});

function disableButton(button, disable) {
  button.disabled = disable;
  button.textContent = disable ? "Carregando..." : "Acessar";
}

function showError(message) {
  mensagemerro.textContent = message;
  mensagemerro.classList.remove("hidden");
}
