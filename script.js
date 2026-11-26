
// script.js — Banco Escolar Digital
// Sistema bancário escolar: contas, depósitos, saques e histórico.

// BLOCO 1 — CONFIGURAÇÃO E ESTADO
// Lista de contas cadastradas (dados de exemplo para a turma)
const contas = [
    {
        numero: 10001,
        titular: 'Ana Beatriz Souza',
        cpf: '123.456.789-01',
        tipo: 'comum',
        saldo: 0,
        limite: 0,
        movimentacoes: []
    },
    {
        numero: 10002,
        titular: 'Bruno Henrique Lima',
        cpf: '234.567.890-12',
        tipo: 'especial',
        saldo: 0,
        limite: 500,
        movimentacoes: []
    },
    {
        numero: 10003,
        titular: 'Carla Mendes Rocha',
        cpf: '345.678.901-23',
        tipo: 'especial',
        saldo: 1200,
        limite: 800,
        movimentacoes: [
            { tipo: 'Depósito', valor: 1500, data: new Date('2025-01-10T09:30:00') },
            { tipo: 'Saque', valor: 300, data: new Date('2025-01-12T14:05:00') }
        ]
    }
];

// BLOCO 2 — FUNÇÕES AUXILIARES
// Formata um número como moeda brasileira (R$)
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Formata uma data para o padrão brasileiro
function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR');
}

// Gera um número de conta de 5 dígitos que ainda não existe
function gerarNumeroConta() {
    let numero;
    do {
        numero = Math.floor(10000 + Math.random() * 90000);
    } while (contas.some(conta => conta.numero === numero));
    return numero;
}

// Busca uma conta pelo número; retorna null se não encontrar
function buscarConta(numero) {
    const encontrada = contas.find(conta => String(conta.numero) === String(numero));
    return encontrada || null;
}

// Total disponível: saldo + limite para conta especial, apenas saldo para conta comum
function calcularTotalDisponivel(conta) {
    if (conta.tipo === 'especial') {
        return arredondar(conta.saldo + conta.limite);
    }
    return conta.saldo;
}

// Quanto do limite já foi utilizado (saldo negativo)
function calcularLimiteUsado(conta) {
    return Math.max(0, -conta.saldo);
}

// Exibe uma mensagem de sucesso ou erro em um elemento e limpa após 4 segundos
function exibirMensagem(elementoId, texto, tipo) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.textContent = texto;
    el.classList.remove('sucesso', 'erro');
    el.classList.add('mensagem', tipo === 'sucesso' ? 'sucesso' : 'erro');
    setTimeout(() => limparMensagem(elementoId), 4000);
}

// Limpa o texto e as classes de uma mensagem
function limparMensagem(elementoId) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('mensagem', 'sucesso', 'erro');
}

// BLOCO 3 — NAVEGAÇÃO
// Mostra apenas a tela pedida. Se a tela não existir, volta para o menu.
function trocarTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.add('oculto', 'oculta'));

    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.classList.remove('oculto', 'oculta');
    } else {
        const menu = document.getElementById('tela-menu');
        if (menu) menu.classList.remove('oculto', 'oculta');
    }

    document.querySelectorAll('[data-tela]').forEach(botao => {
        botao.classList.toggle('ativo', botao.dataset.tela === idTela);
    });
}

// Mostra a data e hora atual e atualiza a cada segundo
function atualizarDataHora() {
    const elemento = document.getElementById('dataHora');
    if (!elemento) return;
    const atualizar = () => {
        elemento.textContent = new Date().toLocaleString('pt-BR');
    };
    atualizar();
    setInterval(atualizar, 1000);
}

// BLOCO 4 — RENDERIZAÇÃO
// Preenche o seletor de contas, preservando a seleção atual se a conta ainda existir
function atualizarSelectContas() {
    const select = document.getElementById('selectConta');
    if (!select) return;
    const selecaoAnterior = select.value;

    select.innerHTML = '';

    const padrao = document.createElement('option');
    padrao.value = '';
    padrao.textContent = 'Selecione uma conta';
    select.appendChild(padrao);

    contas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.numero;
        option.textContent = conta.numero + ' — ' + conta.titular;
        select.appendChild(option);
    });

    select.value = buscarConta(selecaoAnterior) ? selecaoAnterior : '';
}

// Mostra saldo, limite, total e histórico da conta selecionada
function renderizarPainelConta() {
    const select = document.getElementById('selectConta');
    const conta = select ? buscarConta(select.value) : null;

    const saldoEl = document.getElementById('saldoAtual');
    const limiteEl = document.getElementById('limiteDisponivel');
    const totalEl = document.getElementById('totalDisponivel');
    const historico = document.getElementById('historico');

    if (!conta) {
        if (saldoEl) { saldoEl.textContent = '—'; saldoEl.classList.remove('saldo-negativo'); }
        if (limiteEl) limiteEl.textContent = '—';
        if (totalEl) totalEl.textContent = '—';
        if (historico) historico.innerHTML = '';
        return;
    }

    if (saldoEl) {
        saldoEl.textContent = formatarMoeda(conta.saldo);
        if (conta.saldo < 0) {
            saldoEl.classList.add('saldo-negativo');
        } else {
            saldoEl.classList.remove('saldo-negativo');
        }
    }
    if (limiteEl) limiteEl.textContent = formatarMoeda(conta.limite - calcularLimiteUsado(conta));
    if (totalEl) totalEl.textContent = formatarMoeda(calcularTotalDisponivel(conta));

    renderizarHistorico(conta);
}

// Monta a lista de movimentações da conta
function renderizarHistorico(conta) {
    const historico = document.getElementById('historico');
    if (!historico) return;
    historico.innerHTML = '';

    if (conta.movimentacoes.length === 0) {
        const vazio = document.createElement('div');
        vazio.className = 'vazio';
        vazio.textContent = 'Nenhuma movimentação registrada.';
        historico.appendChild(vazio);
        return;
    }

    conta.movimentacoes.forEach(mov => {
        const item = document.createElement('div');
        item.className = 'item ' + ((mov.tipo === 'Depósito' || mov.tipo === 'Transferência recebida') ? 'mov-deposito' : ((mov.tipo === 'Saque' || mov.tipo === 'Transferência enviada') ? 'mov-saque' : ''));

        const tipo = document.createElement('span');
        tipo.textContent = mov.tipo;

        const data = document.createElement('span');
        data.className = 'data';
        data.textContent = formatarData(mov.data);

        const valor = document.createElement('span');
        valor.className = 'valor-mov';
        valor.textContent = formatarMoeda(mov.valor);

        item.appendChild(tipo);
        item.appendChild(data);
        item.appendChild(valor);
        historico.appendChild(item);
    });
}

// Monta a tabela com todas as contas
function renderizarContas() {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;
    corpo.innerHTML = '';

    if (contas.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.textContent = 'Nenhuma conta cadastrada.';
        tr.appendChild(td);
        corpo.appendChild(tr);
        return;
    }

    contas.forEach(conta => {
        const tr = document.createElement('tr');

        const tdTitular = document.createElement('td');
        tdTitular.textContent = conta.titular;

        const tdNumero = document.createElement('td');
        tdNumero.textContent = conta.numero;

        const tdTipo = document.createElement('td');
        tdTipo.textContent = conta.tipo === 'especial' ? 'Especial' : 'Comum';

        const tdSaldo = document.createElement('td');
        tdSaldo.textContent = formatarMoeda(conta.saldo);

        const tdLimite = document.createElement('td');
        tdLimite.textContent = formatarMoeda(conta.limite);

        const tdTotal = document.createElement('td');
        tdTotal.textContent = formatarMoeda(calcularTotalDisponivel(conta));

        const tdAcao = document.createElement('td');
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.dataset.conta = conta.numero;
        botao.textContent = 'Movimentar';
        tdAcao.appendChild(botao);

        tr.appendChild(tdTitular);
        tr.appendChild(tdNumero);
        tr.appendChild(tdTipo);
        tr.appendChild(tdSaldo);
        tr.appendChild(tdLimite);
        tr.appendChild(tdTotal);
        tr.appendChild(tdAcao);
        corpo.appendChild(tr);
    });
}

// ============================================================
// ===== ÁREA DO ALUNO — IMPLEMENTE AS FUNÇÕES ABAIXO =========
// ============================================================

// Mantém os valores monetários com duas casas decimais.
function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

// Valida o campo antes de qualquer alteração de saldo.
function lerValor(id, mensagem) {
    const campo = document.getElementById(id);
    const texto = campo.value.trim();
    const valor = Number(texto);
    let erro = '';
    if (campo.validity.badInput || (texto !== '' && !Number.isFinite(valor))) erro = 'Informe um valor numérico válido.';
    else if (texto === '') erro = 'Informe o valor da operação.';
    else if (valor === 0) erro = 'O valor não pode ser zero.';
    else if (valor < 0) erro = 'O valor não pode ser negativo.';
    else if (campo.validity.stepMismatch || !Number.isSafeInteger(Math.round(valor * 100))) erro = 'Informe um valor válido com até duas casas decimais.';
    if (erro) {
        exibirMensagem(mensagem, erro, 'erro');
        return null;
    }
    return valor;
}

// Realiza um depósito na conta selecionada.
function depositar() {
    const msg = 'msg-movimentacao';
    const valor = lerValor('valorDeposito', msg);
    if (valor === null) return;
    const conta = buscarConta(document.getElementById('selectConta').value);
    if (!conta) return exibirMensagem(msg, 'Selecione uma conta válida.', 'erro');
    conta.saldo = arredondar(conta.saldo + valor);
    conta.movimentacoes.push({ tipo: 'Depósito', valor, data: new Date() });
    renderizarPainelConta();
    renderizarContas();
    document.getElementById('valorDeposito').value = '';
    exibirMensagem(msg, 'Depósito realizado com sucesso!', 'sucesso');
}

// Realiza um saque respeitando o saldo e o limite da conta.
function sacar() {
    const msg = 'msg-movimentacao';
    const valor = lerValor('valorSaque', msg);
    if (valor === null) return;
    const conta = buscarConta(document.getElementById('selectConta').value);
    if (!conta) return exibirMensagem(msg, 'Selecione uma conta válida.', 'erro');
    if (valor > calcularTotalDisponivel(conta)) return exibirMensagem(msg, 'Saldo insuficiente: valor acima do total disponível.', 'erro');
    conta.saldo = arredondar(conta.saldo - valor);
    conta.movimentacoes.push({ tipo: 'Saque', valor, data: new Date() });
    renderizarPainelConta();
    renderizarContas();
    document.getElementById('valorSaque').value = '';
    exibirMensagem(msg, 'Saque realizado com sucesso!', 'sucesso');
}

// Preenche os dois seletores e preserva as escolhas anteriores.
function atualizarSelectsTransferencia() {
    ['selectOrigem', 'selectDestino'].forEach(id => {
        const select = document.getElementById(id);
        const anterior = select.value;
        select.innerHTML = '';
        const padrao = document.createElement('option');
        padrao.value = '';
        padrao.textContent = 'Selecione uma conta';
        select.appendChild(padrao);
        contas.forEach(conta => {
            const option = document.createElement('option');
            option.value = conta.numero;
            option.textContent = conta.numero + ' — ' + conta.titular;
            select.appendChild(option);
        });
        select.value = buscarConta(anterior) ? anterior : '';
    });
}

// Valida tudo antes de debitar a origem e creditar o destino.
function transferir() {
    const msg = 'msg-transferencia';
    const origem = buscarConta(document.getElementById('selectOrigem').value);
    const destino = buscarConta(document.getElementById('selectDestino').value);
    const valor = lerValor('valorTransferencia', msg);
    if (valor === null) return;
    if (!origem) return exibirMensagem(msg, 'Selecione uma conta de origem válida.', 'erro');
    if (!destino) return exibirMensagem(msg, 'Selecione uma conta de destino válida.', 'erro');
    if (origem === destino) return exibirMensagem(msg, 'Não é possível transferir para a mesma conta.', 'erro');
    const total = calcularTotalDisponivel(origem);
    if (valor > total) return exibirMensagem(msg, 'Transferência acima do total disponível.', 'erro');

    // Somente agora os saldos e os dois históricos são alterados.
    origem.saldo = arredondar(origem.saldo - valor);
    destino.saldo = arredondar(destino.saldo + valor);
    const data = new Date();
    origem.movimentacoes.push({ tipo: 'Transferência enviada', valor, data });
    destino.movimentacoes.push({ tipo: 'Transferência recebida', valor, data });
    renderizarPainelConta();
    renderizarContas();
    document.getElementById('valorTransferencia').value = '';
    exibirMensagem(msg, 'Transferência realizada com sucesso!', 'sucesso');
}

// ============================================================
// BLOCO 6 — INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // a) Listeners de navegação
    document.querySelectorAll('[data-tela]').forEach(botao => {
        botao.addEventListener('click', () => trocarTela(botao.dataset.tela));
    });

    // b) Cadastro de nova conta
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (evento) => {
            evento.preventDefault();
            limparMensagem('msg-cadastro');

            const nome = document.getElementById('nome').value.trim();
            const cpf = document.getElementById('cpf').value.trim();
            const numeroInformado = document.getElementById('numeroConta').value.trim();
            const tipoConta = document.getElementById('tipoConta');
            const campoLimite = document.getElementById('campo-limite');
            const inputLimite = document.getElementById('limite');
            const limiteInformado = inputLimite.value.trim();

            if (!nome) {
                exibirMensagem('msg-cadastro', 'Informe o nome do titular.', 'erro');
                return;
            }

            let limite = 0;
            if (tipoConta.value === 'especial') {
                limite = Number(limiteInformado);
                if (limiteInformado === '' || isNaN(limite) || limite < 0) {
                    exibirMensagem('msg-cadastro', 'Informe um limite numérico igual ou maior que zero.', 'erro');
                    return;
                }
            }

            let numero;
            if (numeroInformado === '') {
                numero = gerarNumeroConta();
            } else {
                numero = Number(numeroInformado);
                if (buscarConta(numero)) {
                    exibirMensagem('msg-cadastro', 'Já existe uma conta com este número.', 'erro');
                    return;
                }
            }

            contas.push({
                numero: numero,
                titular: nome,
                cpf: cpf,
                tipo: tipoConta.value,
                saldo: 0,
                limite: limite,
                movimentacoes: []
            });

            exibirMensagem('msg-cadastro', 'Conta ' + numero + ' cadastrada com sucesso!', 'sucesso');

            formCadastro.reset();
            tipoConta.value = 'comum';
            campoLimite.classList.add('oculto');
            inputLimite.value = '';

            renderizarContas();
            atualizarSelectContas();
            atualizarSelectsTransferencia();
            renderizarPainelConta();
        });
    }

    // c) Mostrar ou esconder o campo de limite conforme o tipo de conta
    const tipoContaSelect = document.getElementById('tipoConta');
    if (tipoContaSelect) {
        tipoContaSelect.addEventListener('change', () => {
            const campoLimite = document.getElementById('campo-limite');
            const inputLimite = document.getElementById('limite');
            if (tipoContaSelect.value === 'especial') {
                campoLimite.classList.remove('oculto');
            } else {
                campoLimite.classList.add('oculto');
                inputLimite.value = '';
            }
        });
    }

    // d) Clique em "Movimentar" na tabela de contas (delegação de evento)
    const corpoTabela = document.getElementById('corpoTabela');
    if (corpoTabela) {
        corpoTabela.addEventListener('click', (evento) => {
            const botao = evento.target.closest('[data-conta]');
            if (botao) {
                document.getElementById('selectConta').value = botao.dataset.conta;
                trocarTela('tela-movimentacoes');
                renderizarPainelConta();
            }
        });
    }

    // e) Troca de conta no seletor
    const selectConta = document.getElementById('selectConta');
    if (selectConta) {
        selectConta.addEventListener('change', renderizarPainelConta);
    }

    // f) Formulário de depósito
    const formDeposito = document.getElementById('form-deposito');
    if (formDeposito) {
        formDeposito.addEventListener('submit', (evento) => {
            evento.preventDefault();
            depositar();
        });
    }

    // g) Formulário de saque
    const formSaque = document.getElementById('form-saque');
    if (formSaque) {
        formSaque.addEventListener('submit', (evento) => {
            evento.preventDefault();
            sacar();
        });
    }

    // Formulário de transferência, sem recarregar a página.
    document.getElementById('form-transferencia').addEventListener('submit', evento => {
        evento.preventDefault();
        transferir();
    });

    // h) Chamadas finais de inicialização
    atualizarDataHora();
    atualizarSelectContas();
    atualizarSelectsTransferencia();
    renderizarContas();
    renderizarPainelConta();
    trocarTela('tela-menu');
});