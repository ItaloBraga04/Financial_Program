const DEFAULT_EXPENSES = [
  { id: "1", name: "Aluguel e Condomínio", value: 0, category: "50" },
  { id: "2", name: "Energia elétrica", value: 0, category: "50" },
  { id: "3", name: "Internet", value: 0, category: "50" },
  { id: "4", name: "Gás", value: 0, category: "50" },
  { id: "5", name: "Plano de telefone", value: 0, category: "50" },
  { id: "6", name: "Seguro de carro", value: 0, category: "50" },
  { id: "7", name: "Combustível", value: 0, category: "50" },
  { id: "8", name: "Cartão de Crédito", value: 0, category: "30" },
  { id: "9", name: "Lazer e Entretenimento", value: 0, category: "30" },
  { id: "10", name: "Supermercado", value: 0, category: "30" },
  { id: "11", name: "Investimentos", value: 0, category: "20" }
];

let currentMonth = new Date().toISOString().slice(0, 7);
let state = { salary: 0, expenses: [] };
let chartInstance = null;

// Elementos da DOM
const elMonth = document.getElementById("monthPicker");
const elSalary = document.getElementById("salaryInput");
const elContainer = document.getElementById("expenseContainer");
const elBtnAdd = document.getElementById("btnAddExpense");
const elBtnCalculate = document.getElementById("btnCalculate");

const elFeedbackContainer = document.getElementById("feedbackContainer");
const elFeedbackTitle = document.getElementById("feedbackTitle");
const elFeedbackText = document.getElementById("feedbackText");

function formatBRL(val) {
  return (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function init() {
  elMonth.value = currentMonth;
  initChart();
  loadMonthData(currentMonth);

  // Troca de mês no seletor
  elMonth.addEventListener("change", (e) => {
    currentMonth = e.target.value;
    loadMonthData(currentMonth);
  });

  // Atualização dos dados sem recalcular na hora
  elSalary.addEventListener("change", (e) => {
    state.salary = parseFloat(e.target.value) || 0;
    persist();
  });

  // Botão para adicionar despesa
  elBtnAdd.addEventListener("click", () => {
    state.expenses.push({
      id: Date.now().toString(),
      name: "Nova despesa",
      value: 0,
      category: "50"
    });
    persist();
    renderExpenses();
  });

  // Botão de clique para disparar o cálculo e o parecer
  elBtnCalculate.addEventListener("click", () => {
    state.salary = parseFloat(elSalary.value) || 0;
    persist();
    recalculate();
  });
}

function loadMonthData(monthKey) {
  const data = localStorage.getItem(`fin_data_${monthKey}`);
  if (data) {
    state = JSON.parse(data);
  } else {
    state = {
      salary: 0,
      expenses: JSON.parse(JSON.stringify(DEFAULT_EXPENSES))
    };
  }
  elSalary.value = state.salary || "";
  renderExpenses();
  recalculate();
}

function persist() {
  localStorage.setItem(`fin_data_${currentMonth}`, JSON.stringify(state));
}

function renderExpenses() {
  elContainer.innerHTML = "";
  state.expenses.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "expense-row";

    row.innerHTML = `
      <div>
        <input type="text" value="${item.name}" onchange="updateItemName(${index}, this.value)">
      </div>
      <div>
        <input type="number" value="${item.value || ""}" placeholder="0" min="0" step="0.01" onchange="updateItemValue(${index}, this.value)">
      </div>
      <div>
        <select onchange="updateItemCat(${index}, this.value)">
          <option value="50" ${item.category === "50" ? "selected" : ""}>50% Essencial</option>
          <option value="30" ${item.category === "30" ? "selected" : ""}>30% Estilo</option>
          <option value="20" ${item.category === "20" ? "selected" : ""}>20% Invest</option>
        </select>
      </div>
      <div>
        <button class="btn-del" onclick="deleteItem(${index})" title="Remover">&times;</button>
      </div>
    `;
    elContainer.appendChild(row);
  });
}

window.updateItemName = (idx, val) => {
  state.expenses[idx].name = val;
  persist();
};

window.updateItemValue = (idx, val) => {
  state.expenses[idx].value = parseFloat(val) || 0;
  persist();
};

window.updateItemCat = (idx, val) => {
  state.expenses[idx].category = val;
  persist();
};

window.deleteItem = (idx) => {
  state.expenses.splice(idx, 1);
  persist();
  renderExpenses();
};

// Motor principal de cálculos e parecer
function recalculate() {
  const sal = state.salary;

  if (sal <= 0) {
    renderEmptyState();
    return;
  }

  // 1. Metas Patrimoniais
  document.getElementById("targetFixed").textContent = formatBRL(sal / 2);
  document.getElementById("targetLife").textContent = formatBRL(sal * 0.3);
  document.getElementById("targetInvest").textContent = formatBRL(sal * 0.2);
  document.getElementById("targetReserve").textContent = formatBRL(sal * 6);
  document.getElementById("targetFreedom").textContent = formatBRL(sal * 120);

  // 2. Agrupamento por Categoria
  let total50 = 0, total30 = 0, total20 = 0;
  let biggest = { name: "-", value: 0 };

  state.expenses.forEach(item => {
    const val = Number(item.value) || 0;
    if (item.category === "50") total50 += val;
    if (item.category === "30") total30 += val;
    if (item.category === "20") total20 += val;

    if (val > biggest.value) {
      biggest = { name: item.name, value: val };
    }
  });

  const totalGeral = total50 + total30 + total20;
  const pct50 = (total50 / sal) * 100;
  const pct30 = (total30 / sal) * 100;
  const pct20 = (total20 / sal) * 100;

  // 3. Barras de Progresso
  const barEss = document.getElementById("barEss");
  document.getElementById("labelEss").textContent = `${formatBRL(total50)} (${pct50.toFixed(1)}%)`;
  barEss.style.width = `${Math.min(pct50, 100)}%`;
  barEss.style.background = pct50 > 50 ? "var(--danger)" : "var(--essential)";

  const barLife = document.getElementById("barLife");
  document.getElementById("labelLife").textContent = `${formatBRL(total30)} (${pct30.toFixed(1)}%)`;
  barLife.style.width = `${Math.min(pct30, 100)}%`;
  barLife.style.background = pct30 > 30 ? "var(--danger)" : "var(--lifestyle)";

  const barInv = document.getElementById("barInv");
  document.getElementById("labelInv").textContent = `${formatBRL(total20)} (${pct20.toFixed(1)}%)`;
  barInv.style.width = `${Math.min(pct20, 100)}%`;

  // 4. Detecção de Maior Gasto e Vazamento
  if (biggest.value > 0) {
    const bPct = ((biggest.value / sal) * 100).toFixed(1);
    document.getElementById("biggestExpenseTxt").textContent = `${biggest.name}: ${formatBRL(biggest.value)} (${bPct}%)`;
  } else {
    document.getElementById("biggestExpenseTxt").textContent = "-";
  }

  const over50 = Math.max(0, total50 - (sal * 0.5));
  const over30 = Math.max(0, total30 - (sal * 0.3));
  const totalLeak = over50 + over30;

  document.getElementById("leakAmountTxt").textContent = formatBRL(totalLeak);
  if (totalLeak > 0) {
    document.getElementById("leakDetailTxt").textContent = `Excesso: Essenciais (+${formatBRL(over50)}) | Desejos (+${formatBRL(over30)})`;
  } else {
    document.getElementById("leakDetailTxt").textContent = "Nenhum teto de gastos estourado.";
  }

  // 5. Atualização do Gráfico e Parecer Técnico
  updateChart(total50, total30, total20, sal);
  generateFeedbackReport(sal, totalGeral, total50, total30, total20, pct50, pct30, pct20, totalLeak, biggest);
}

function renderEmptyState() {
  document.getElementById("biggestExpenseTxt").textContent = "-";
  document.getElementById("leakAmountTxt").textContent = "R$ 0,00";
  document.getElementById("leakDetailTxt").textContent = "Insira o salário para processar.";
  elFeedbackContainer.className = "card feedback-card hidden";
  if (chartInstance) {
    chartInstance.data.datasets[0].data = [0, 0, 0, 100];
    chartInstance.update();
  }
}

// Geração de Parecer e Recomendações
function generateFeedbackReport(sal, totalGeral, t50, t30, t20, p50, p30, p20, totalLeak, biggest) {
  elFeedbackContainer.className = "card feedback-card";
  let statusClass = "feedback-healthy";
  let title = "Parecer Técnico: Situação Equilibrada";
  let text = "";

  const balance = sal - totalGeral;

  if (totalGeral > sal) {
    statusClass = "feedback-critical";
    title = "🚨 Parecer Técnico: Déficit Financeiro (Contas Estouradas)";
    text = `Você está gastando <strong>${formatBRL(Math.abs(balance))}</strong> a mais do que recebe no mês. As despesas consomem <strong>${((totalGeral / sal) * 100).toFixed(1)}%</strong> da sua renda líquida. `;
    
    if (p50 > 50) {
      text += `Seus custos essenciais consomem <strong>${p50.toFixed(1)}%</strong> (teto recomendado: 50%). `;
    }
    if (p30 > 30) {
      text += `Seus gastos com estilo de vida consomem <strong>${p30.toFixed(1)}%</strong> (teto recomendado: 30%). `;
    }
    text += `<strong>Plano de Ação:</strong> Priorize renegociar despesas fixas ou cortar gastos variáveis em estilo de vida imediatamente para evitar acúmulo de dívidas. O item mais pesado é <strong>${biggest.name}</strong> (${formatBRL(biggest.value)}).`;

  } else if (totalLeak > 0) {
    statusClass = "feedback-warning";
    title = "⚠️ Parecer Técnico: Alerta de Desvio de Padrão";
    text = `Suas contas cabem no salário, mas você está tendo um desvio de <strong>${formatBRL(totalLeak)}</strong> em relação à Regra 50-30-20. `;
    
    if (p50 > 50) {
      text += `Gastos essenciais estão em <strong>${p50.toFixed(1)}%</strong> (+${formatBRL(t50 - sal * 0.5)} além do ideal). `;
    }
    if (p30 > 30) {
      text += `Estilo de vida está em <strong>${p30.toFixed(1)}%</strong> (+${formatBRL(t30 - sal * 0.3)} além do ideal). `;
    }
    text += `Esse vazamento está drenando sua capacidade de poupança (investimentos atuais em ${p20.toFixed(1)}%). Corrigir esse desvio liberaria <strong>${formatBRL(totalLeak)}</strong> todo mês para sua Reserva de Emergência.`;

  } else {
    statusClass = "feedback-healthy";
    title = "✅ Parecer Técnico: Orçamento Saudável e Eficiente";
    text = `Parabéns! Seus gastos estão estritamente dentro das diretrizes recomendadas. Seus custos essenciais estão em <strong>${p50.toFixed(1)}%</strong> e o estilo de vida em <strong>${p30.toFixed(1)}%</strong>. `;
    
    if (p20 >= 20) {
      text += `Você está atingindo ou superando a meta de 20% para o futuro (${p20.toFixed(1)}% aplicados). Com esse ritmo constante de <strong>${formatBRL(t20)}</strong>/mês, seu caminho até a meta de liberdade financeira (${formatBRL(sal * 120)}) segue sólido.`;
    } else {
      text += `Você tem uma sobra livre de <strong>${formatBRL(balance)}</strong>. Considere direcionar esse saldo restante diretamente para investimentos e reserva de emergência para consolidar a cota de 20%.`;
    }
  }

  elFeedbackContainer.classList.add(statusClass);
  elFeedbackTitle.innerHTML = title;
  elFeedbackText.innerHTML = text;
}

function initChart() {
  const ctx = document.getElementById("gaugeChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Essenciais (50%)", "Desejos (30%)", "Investimentos (20%)", "Saldo Livre"],
      datasets: [{
        data: [0, 0, 0, 100],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#334155"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#94a3b8", boxWidth: 12 }
        }
      }
    }
  });
}

function updateChart(c50, c30, c20, sal) {
  if (!chartInstance) return;
  const totalExpenses = c50 + c30 + c20;
  const free = Math.max(0, sal - totalExpenses);

  chartInstance.data.datasets[0].data = [c50, c30, c20, free];
  chartInstance.update();
}

init();