// Conversor de Moedas - JavaScript
class CurrencyConverter {
  constructor() {
    this.apiKey = null; // API gratuita sem chave
    this.baseUrl = "https://api.exchangerate-api.com/v4/latest/";
    this.rates = {};
    this.currentBaseCurrency = null;
    this.lastUpdate = null;

    this.initElements();
    this.bindEvents();
    this.loadInitialData();
  }

  initElements() {
    this.fromCurrency = document.getElementById("fromCurrency");
    this.toCurrency = document.getElementById("toCurrency");
    this.fromAmount = document.getElementById("fromAmount");
    this.toAmount = document.getElementById("toAmount");
    this.swapBtn = document.getElementById("swapBtn");
    this.rateDisplay = document.getElementById("rateDisplay");
    this.lastUpdateDisplay = document.getElementById("lastUpdate");
    this.loadingStatus = document.getElementById("loadingStatus");
    this.errorStatus = document.getElementById("errorStatus");
    this.retryBtn = document.getElementById("retryBtn");
  }

  bindEvents() {
    // Event listeners para inputs e selects
    this.fromAmount.addEventListener("input", () =>
      this.debounce(this.convert.bind(this), 300)()
    );
    this.fromCurrency.addEventListener("change", () => this.convert());
    this.toCurrency.addEventListener("change", () => this.convert());

    // Botão de inversão
    this.swapBtn.addEventListener("click", () => this.swapCurrencies());

    // Botão de retry
    this.retryBtn.addEventListener("click", () => this.loadInitialData());

    // Formatação do input de valor
    this.fromAmount.addEventListener("blur", () => this.formatInput());
  }

  // Função debounce para evitar muitas requisições
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  async loadInitialData() {
    try {
      this.showLoading(true);
      this.hideError();

      // Carrega taxas baseado na moeda origem atual
      const baseCurrency = this.fromCurrency.value;
      await this.fetchRates(baseCurrency);

      this.convert();
      this.showLoading(false);
    } catch (error) {
      this.showError("Erro ao carregar dados iniciais");
      console.error("Erro ao carregar dados:", error);
    }
  }

  async fetchRates(baseCurrency) {
    try {
      const response = await fetch(`${this.baseUrl}${baseCurrency}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.rates) {
        throw new Error("Formato de resposta inválido");
      }

      this.rates = data.rates;
      this.lastUpdate = new Date(data.date);
      this.updateLastUpdateDisplay();
    } catch (error) {
      console.error("Erro ao buscar taxas:", error);
      throw error;
    }
  }

  async convert() {
    const amount = parseFloat(this.fromAmount.value);
    const fromCurr = this.fromCurrency.value;
    const toCurr = this.toCurrency.value;

    // Limpa resultado se não há valor
    if (!amount || amount <= 0) {
      this.toAmount.value = "";
      this.updateRateDisplay(fromCurr, toCurr);
      return;
    }

    try {
      // Sempre busca novas taxas se a moeda base mudou
      if (
        !this.rates ||
        !this.currentBaseCurrency ||
        this.currentBaseCurrency !== fromCurr
      ) {
        this.showLoading(true);
        await this.fetchRates(fromCurr);
        this.currentBaseCurrency = fromCurr;
        this.showLoading(false);
      }

      // Calcula conversão
      let convertedAmount;
      let rate;

      if (fromCurr === toCurr) {
        convertedAmount = amount;
        rate = 1;
      } else {
        rate = this.rates[toCurr];
        if (!rate) {
          // Se não encontrou a taxa, força nova busca
          this.showLoading(true);
          await this.fetchRates(fromCurr);
          this.currentBaseCurrency = fromCurr;
          rate = this.rates[toCurr];
          this.showLoading(false);
        }
        convertedAmount = amount * rate;
      }

      // Formata e exibe resultado
      this.toAmount.value = this.formatNumber(convertedAmount);
      this.updateRateDisplay(fromCurr, toCurr, rate);
    } catch (error) {
      console.error("Erro na conversão:", error);
      this.showError("Erro ao converter moedas");
    }
  }

  async swapCurrencies() {
    // Salva valores atuais
    const tempFromCurrency = this.fromCurrency.value;
    const tempToAmount = this.toAmount.value;

    // Troca as moedas
    this.fromCurrency.value = this.toCurrency.value;
    this.toCurrency.value = tempFromCurrency;

    // Se há um valor convertido, usa ele como novo valor de entrada
    if (tempToAmount && tempToAmount !== "") {
      this.fromAmount.value = this.parseFormattedNumber(tempToAmount);
    }

    // Adiciona animação ao botão
    this.swapBtn.style.transform = "scale(0.9) rotate(180deg)";
    setTimeout(() => {
      this.swapBtn.style.transform = "";
    }, 200);

    // Limpa o cache de rates para forçar nova busca com a nova moeda base
    this.rates = {};
    this.currentBaseCurrency = null;

    // Reconverte com as novas configurações
    await this.convert();
  }

  updateRateDisplay(fromCurr, toCurr, rate) {
    if (!fromCurr || !toCurr) {
      this.rateDisplay.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <span>Selecione as moedas para ver a taxa</span>
      `;
      return;
    }

    if (!rate || fromCurr === toCurr) {
      this.rateDisplay.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <span>1 ${fromCurr} = 1 ${toCurr}</span>
      `;
    } else {
      this.rateDisplay.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <span>1 ${fromCurr} = ${this.formatNumber(rate)} ${toCurr}</span>
      `;
    }
  }

  updateLastUpdateDisplay() {
    if (this.lastUpdate) {
      const now = new Date();
      const diffInMinutes = Math.floor((now - this.lastUpdate) / (1000 * 60));

      let timeText;
      if (diffInMinutes < 1) {
        timeText = "Agora mesmo";
      } else if (diffInMinutes < 60) {
        timeText = `${diffInMinutes} min atrás`;
      } else {
        const hours = Math.floor(diffInMinutes / 60);
        timeText = `${hours}h atrás`;
      }

      this.lastUpdateDisplay.innerHTML = `
        <i class="fas fa-clock"></i>
        <span>Atualizado ${timeText}</span>
      `;
    }
  }

  formatNumber(number) {
    if (isNaN(number)) return "0,00";

    // Determina número de casas decimais baseado no valor
    let decimals = 2;
    if (number < 0.01) decimals = 6;
    else if (number < 1) decimals = 4;

    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  }

  parseFormattedNumber(formattedNumber) {
    if (!formattedNumber) return "";
    // Remove formatação brasileira e converte para número
    return formattedNumber.replace(/\./g, "").replace(",", ".");
  }

  formatInput() {
    const value = parseFloat(this.fromAmount.value);
    if (value && !isNaN(value)) {
      this.fromAmount.value = value.toFixed(2);
    }
  }

  showLoading(show) {
    this.loadingStatus.style.display = show ? "flex" : "none";
  }

  showError(message) {
    this.errorStatus.style.display = "flex";
    this.errorStatus.querySelector("span").textContent = message;
    this.showLoading(false);
  }

  hideError() {
    this.errorStatus.style.display = "none";
  }

  // Método para atualizar taxas periodicamente
  startPeriodicUpdate() {
    // Atualiza a cada 5 minutos
    setInterval(() => {
      if (document.visibilityState === "visible") {
        this.loadInitialData();
      }
    }, 5 * 60 * 1000);
  }

  // Método para detectar mudanças de conectividade
  handleOnlineOffline() {
    window.addEventListener("online", () => {
      this.loadInitialData();
    });

    window.addEventListener("offline", () => {
      this.showError("Sem conexão com a internet");
    });
  }
}

// Função auxiliar para obter símbolo da moeda
function getCurrencySymbol(currency) {
  const symbols = {
    USD: "",
    EUR: "€",
    BRL: "R",
    GBP: "£",
    JPY: "¥",
    CAD: "C",
    AUD: "A",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    KRW: "₩",
    MXN: "",
    SGD: "S",
    NZD: "NZ",
    NOK: "kr",
    SEK: "kr",
    RUB: "₽",
    ZAR: "R",
    TRY: "₺",
    ARS: "",
  };
  return symbols[currency] || currency;
}

// Função para formatar moeda com símbolo
function formatCurrency(amount, currency) {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formattedAmount}`;
}

// Inicialização quando o DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  const converter = new CurrencyConverter();

  // Inicia atualizações periódicas
  converter.startPeriodicUpdate();

  // Configura detecção de conectividade
  converter.handleOnlineOffline();

  // Atualiza o display de tempo a cada minuto
  setInterval(() => {
    converter.updateLastUpdateDisplay();
  }, 60000);
});

// Adiciona algumas funcionalidades extras para melhor UX
document.addEventListener("DOMContentLoaded", () => {
  // Adiciona animação de foco nos inputs
  const inputs = document.querySelectorAll(".amount-input, .currency-select");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "scale(1)";
    });
  });

  // Adiciona efeito de ripple nos botões
  const buttons = document.querySelectorAll(".swap-btn, .retry-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.classList.add("ripple");

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // CSS para o efeito ripple
  const style = document.createElement("style");
  style.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .swap-btn, .retry-btn {
      position: relative;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
});
