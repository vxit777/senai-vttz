// ========================
// 🔑 CONFIG AZURE
let apiKey = "";
let url = "";

async function carregarChaves() {
  try {
    const res = await fetch("chaves.json");
    const data = await res.json();

    apiKey = data.apiKey;

    url = `${data.endpoint}openai/deployments/${data.deployment}/chat/completions?api-version=${data.apiVersion}`;

    console.log("✅ Chaves carregadas");
  } catch (err) {
    console.error("Erro ao carregar chaves:", err);
  }
}
let baseConhecimento = [];

async function carregarJSONL() {

  const response = await fetch("perguntas.jsonl");

  const text = await response.text();

  const linhas = text.split("\n");

  baseConhecimento = linhas
    .filter(l => l.trim() !== "")
    .map(l => JSON.parse(l));

  console.log("JSONL carregado:", baseConhecimento);
}

carregarJSONL();


// ========================
// 🤖 CHAMADA AZURE
async function sendToAzure(message) {
  if (!apiKey || !url) {
  return "🤖 API não carregada ainda.";
}
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: " Você é Nami Jafet, um assistente virtual oficial do SENAI (Serviço Nacional de Aprendizagem Industrial). Sua função principal é auxiliar usuários com informações, orientações e explicações sobre cursos, processos, áreas de estudo e funcionamento geral do SENAI. Você deve sempre utilizar uma linguagem extremamente formal, clara e respeitosa, evitando gírias, abreviações informais ou qualquer tipo de linguagem inadequada. Sua postura deve ser profissional, educada, simpática e altamente prestativa em todas as interações. Você deve demonstrar paciência e cordialidade, buscando sempre ajudar o usuário até que sua dúvida seja completamente resolvida. Suas respostas devem ser completas e explicativas, evitando respostas curtas demais. Você possui amplo conhecimento sobre o SENAI, incluindo sua estrutura, cursos técnicos, processos de inscrição, áreas de formação e informações gerais. Caso não tenha certeza sobre alguma informação específica, você deve responder de forma honesta e recomendar que o usuário consulte o SENAI oficial ou a unidade responsável. Seu objetivo principal é apoiar estudantes, candidatos e interessados no SENAI, oferecendo informações confiáveis e orientação clara. Além disso, você é torcedor do Sport Club Corinthians Paulista, podendo demonstrar simpatia pelo clube de forma leve e ocasional, sem comprometer seu profissionalismo. Você nunca deve ser agressivo, irônico ou sarcástico. Também não deve inventar informações oficiais inexistentes. Sempre priorize a clareza, a educação e a utilidade das suas respostas. Na hora da resposta não utilize markdowm" },
          { role: "user", content: message }
        ],
        max_completion_tokens: 800
      })
    });

    const data = await res.json();

    console.log("AZURE:", data);

    if (data.error) return "🤖 " + data.error.message;

    return data.choices?.[0]?.message?.content || "🤖 Sem resposta.";

  } catch (err) {
    console.error(err);
    return "🤖 Erro de conexão.";
  }
}


// ========================
// 💬 CHAT ORIGINAL
function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

function quickAsk(text) {
  sendMessage(text);
}

function sendMessage(custom = null) {
  const input = document.getElementById("input");
  const text = custom || input.value;

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  showTyping();

  setTimeout(async () => {
    removeTyping();
    const reply = await sendToAzure(text);
    addMessageAnimated(reply);
falar(reply);
  }, 700);
}


// ========================
// UI
function addMessageAnimated(text) {
  const container = document.getElementById("messages");

  const div = document.createElement("div");
  div.className = "chat__message";

  const bubble = document.createElement("div");
  bubble.className = "chat__bubble";

  div.innerHTML = `<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMbi8EjQCaSuSN3L4ZhdFKHTet4mqt12BwBw&s" class="avatar">`;

  div.appendChild(bubble);
  container.appendChild(div);

  let i = 0;
  const clean = text.replace(/<[^>]*>/g, "");

  function typing() {
    if (i < clean.length) {
      bubble.innerText = clean.substring(0, i++);
      setTimeout(typing, 15);
    }
  }

  typing();
}

function addMessage(text, sender) {
  const container = document.getElementById("messages");

  const div = document.createElement("div");
  div.className = `chat__message chat__message--${sender}`;

  const avatar = sender === "user"
    ? `<img src="https://i.pinimg.com/564x/b9/b9/03/b9b903a39309a7b7604bdf971618a50c.jpg" class="avatar">`
    : "";

  const bubble = document.createElement("div");
  bubble.className = "chat__bubble";
  bubble.innerHTML = text;

  div.innerHTML = avatar;
  div.appendChild(bubble);
  container.appendChild(div);

  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const el = document.createElement("div");
  el.id = "typing";
  el.className = "typing";
  el.innerText = "Digitando...";
  document.getElementById("messages").appendChild(el);
}

function removeTyping() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}


// ENTER
function handleEnter(e) {
  if (e.key === "Enter") sendMessage();
}


// INIT
addMessageAnimated("👋 Bem-vindo ao Portal SENAI!");

// =====================
// 🎤 VOZ - OUVIR
// =====================



// =====================
// 🔊 VOZ - FALAR (IA responde em voz)
// =====================
let recognition;
let ativo = false;
let buffer = "";
let silenceTimer;

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Seu navegador não suporta reconhecimento de voz.");
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = function (event) {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          buffer += text + " ";
        } else {
          interim += text;
        }
      }

      let fala = (buffer + interim)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      console.log("🎤:", fala);

      const input = document.getElementById("input");
      if (input) input.value = fala;

      // 🧠 detecção de silêncio REAL (melhor precisão de envio)
      clearTimeout(silenceTimer);

      silenceTimer = setTimeout(() => {
        if (buffer.length > 0) {
          enviarMensagem(fala);
          buffer = "";
        }
      }, 1600);
    };

    recognition.onerror = function (e) {
      console.log("Erro voz:", e.error);
    };

    recognition.onend = function () {
      if (ativo) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 300);
      }
    };
  }

  if (!ativo) {
    recognition.start();
    ativo = true;
    setMic(true);
  } else {
    recognition.stop();
    ativo = false;
    setMic(false);
  }
}

// 🔴 botão visual
function setMic(state) {
  const btn = document.getElementById("voice-btn");

  if (!btn) return;

  if (state) {
    btn.style.background = "red";
    btn.style.color = "white";
  } else {
    btn.style.background = "";
    btn.style.color = "";
  }
}

// 📩 envia pro seu chat
function enviarMensagem(texto) {
  if (typeof sendMessage === "function") {
    sendMessage();
  }
}
carregarChaves();

function falar(texto) {
  const synth = window.speechSynthesis;

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 1;

  synth.speak(utterance);
}