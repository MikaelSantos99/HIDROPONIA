// Variáveis para armazenar dados e histórico
let sensorData = {
    pH: null,
    EC: null,
    temperatura: null,
    umidade: null,
    luminosidade: null,
    rele_ph: null,
    rele_ec: null,
    rele_bomb: null,
    rssi: null,
    setpoint_ph: 7.0,
    setpoint_ec: 1.2,
    lastUpdate: null
};

let previousData = {};
let relayPhHistory = [];
let relayEcHistory = [];
let relayBombHistory = [];
let updateInterval = 5000; // 5 segundos
let apiEndpoint = 'https://hidroponia-zgsr.onrender.com/api.php'; //'/api.php'; // Endpoint que simula a API

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carrega dados iniciais
    fetchData();
    
    // Configura intervalo de atualização
    setInterval(fetchData, updateInterval);
    
    // Configura listeners dos botões
    document.getElementById('updatePhBtn').addEventListener('click', updateSetpoint);
    document.getElementById('updateEcBtn').addEventListener('click', updateSetpoint);
});

// Função para buscar dados da API
function fetchData() {
    fetch(apiEndpoint)
        .then(response => response.json())
        .then(data => {
            // Verifica mudanças no estado dos relés
            checkRelayChanges(data.rele_ph, data.rele_ec, data.rele_bomb);
            
            // Salva dados anteriores para comparação
            previousData = {...sensorData};
            
            // Atualiza dados atuais
            Object.assign(sensorData, data);
            sensorData.lastUpdate = new Date();
            
            // Atualiza a interface
            updateDashboard();
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
            document.getElementById('lastUpdate').textContent = 'Erro ao atualizar dados';
        });
}

// Verifica mudanças no estado dos relés e registra no histórico
function checkRelayChanges(newPhState, newEcState, newBombState) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    
    // Verifica relé de pH
    if (sensorData.rele_ph !== null && newPhState !== sensorData.rele_ph) {
        const action = newPhState ? 'LIGADO' : 'DESLIGADO';
        const entry = `${timeString} - ${action}`;
        relayPhHistory.unshift(entry); // Adiciona no início do array
        if (relayPhHistory.length > 5) relayPhHistory.pop(); // Mantém apenas 5 entradas
    }
    
    // Verifica relé de EC
    if (sensorData.rele_ec !== null && newEcState !== sensorData.rele_ec) {
        const action = newEcState ? 'LIGADO' : 'DESLIGADO';
        const entry = `${timeString} - ${action}`;
        relayEcHistory.unshift(entry); // Adiciona no início do array
        if (relayEcHistory.length > 5) relayEcHistory.pop(); // Mantém apenas 5 entradas
    }
    
    // Verifica relé da bomba
    if (sensorData.rele_bomb !== null && newBombState !== sensorData.rele_bomb) {
        const action = newBombState ? 'LIGADO' : 'DESLIGADO';
        const entry = `${timeString} - ${action}`;
        relayBombHistory.unshift(entry); // Adiciona no início do array
        if (relayBombHistory.length > 5) relayBombHistory.pop(); // Mantém apenas 5 entradas
    }
}

// Função para atualizar a interface
function updateDashboard() {
    // Atualiza data/hora da última atualização
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    document.getElementById('lastUpdate').textContent = 
        `Última atualização: ${sensorData.lastUpdate.toLocaleString('pt-BR', options)}`;
    
    // Atualiza valores dos sensores
    updatePHDisplay();
    updateECDisplay();
    updateRelayPhDisplay();
    updateRelayEcDisplay();
    updateRelayBombDisplay();
    updateTempDisplay();
    updateHumidityDisplay();
    updateLightDisplay();
    updateStatusDisplay();
}

// Atualiza display de pH
function updatePHDisplay() {
    const phValue = sensorData.pH;
    const phSetpoint = sensorData.setpoint_ph;
    
    if (phValue !== null) {
        // Atualiza medidor
        const phGauge = document.querySelector('#phGauge .gauge-fill');
        const phCover = document.querySelector('#phGauge .gauge-cover');
        
        // pH escala de 0-14, mapeia para ângulo de 0.1 a 0.9 turn (36° a 324°)
        const rotation = (phValue / 14) * 0.8 + 0.1;
        phGauge.style.transform = `rotate(${rotation}turn)`;
        
        // Cor baseada no valor do pH
        if (phValue < 5.5 || phValue > 8.5) {
            phGauge.style.backgroundColor = 'var(--danger-color)';
        } else if (phValue < 6 || phValue > 7.5) {
            phGauge.style.backgroundColor = 'var(--warning-color)';
        } else {
            phGauge.style.backgroundColor = 'var(--secondary-color)';
        }
        
        phCover.textContent = phValue.toFixed(1);
        
        // Atualiza setpoint
        document.getElementById('phSetpoint').textContent = phSetpoint.toFixed(1);
        
        // Atualiza campo de controle
        document.getElementById('phControl').value = phSetpoint;
    }
}

// Atualiza display de EC
function updateECDisplay() {
    const ecValue = sensorData.EC;
    const ecSetpoint = sensorData.setpoint_ec;
    
    if (ecValue !== null) {
        // Atualiza valor
        document.getElementById('ecValue').textContent = ecValue.toFixed(1);
        
        // Atualiza barra de progresso (assumindo faixa de 0-5 mS/cm)
        const ecProgress = document.getElementById('ecProgress');
        const progressPercent = Math.min((ecValue / 5) * 100, 100);
        ecProgress.style.width = `${progressPercent}%`;
        
        // Cor baseada no valor
        if (ecValue < ecSetpoint * 0.8 || ecValue > ecSetpoint * 1.2) {
            ecProgress.style.backgroundColor = 'var(--danger-color)';
        } else if (ecValue < ecSetpoint * 0.9 || ecValue > ecSetpoint * 1.1) {
            ecProgress.style.backgroundColor = 'var(--warning-color)';
        } else {
            ecProgress.style.backgroundColor = 'var(--secondary-color)';
        }
        
        // Atualiza setpoint
        document.getElementById('ecSetpoint').textContent = ecSetpoint.toFixed(1);
        
        // Atualiza campo de controle
        document.getElementById('ecControl').value = ecSetpoint;
    }
}

// Atualiza display do relé de pH
function updateRelayPhDisplay() {
    const relayState = sensorData.rele_ph;
    
    if (relayState !== null) {
        const relayStatus = document.getElementById('relayPhStatus');
        const indicator = relayStatus.querySelector('.relay-indicator');
        const label = relayStatus.querySelector('.relay-label');
        
        if (relayState) {
            indicator.className = 'relay-indicator on';
            label.textContent = 'LIGADO';
            label.style.color = '#4caf50';
        } else {
            indicator.className = 'relay-indicator off';
            label.textContent = 'DESLIGADO';
            label.style.color = '#f44336';
        }
        
        // Atualiza histórico
        const historyList = document.getElementById('relayPhHistory');
        historyList.innerHTML = '';
        
        if (relayPhHistory.length > 0) {
            relayPhHistory.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = entry;
                historyList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum registro ainda';
            historyList.appendChild(li);
        }
    }
}

// Atualiza display do relé de EC
function updateRelayEcDisplay() {
    const relayState = sensorData.rele_ec;
    
    if (relayState !== null) {
        const relayStatus = document.getElementById('relayEcStatus');
        const indicator = relayStatus.querySelector('.relay-indicator');
        const label = relayStatus.querySelector('.relay-label');
        
        if (relayState) {
            indicator.className = 'relay-indicator on';
            label.textContent = 'LIGADO';
            label.style.color = '#4caf50';
        } else {
            indicator.className = 'relay-indicator off';
            label.textContent = 'DESLIGADO';
            label.style.color = '#f44336';
        }
        
        // Atualiza histórico
        const historyList = document.getElementById('relayEcHistory');
        historyList.innerHTML = '';
        
        if (relayEcHistory.length > 0) {
            relayEcHistory.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = entry;
                historyList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum registro ainda';
            historyList.appendChild(li);
        }
    }
}

// Atualiza display do relé da bomba
function updateRelayBombDisplay() {
    const relayState = sensorData.rele_bomb;
    
    if (relayState !== null) {
        const relayStatus = document.getElementById('relayBombStatus');
        const indicator = relayStatus.querySelector('.relay-indicator');
        const label = relayStatus.querySelector('.relay-label');
        
        if (relayState) {
            indicator.className = 'relay-indicator on';
            label.textContent = 'LIGADO';
            label.style.color = '#4caf50';
        } else {
            indicator.className = 'relay-indicator off';
            label.textContent = 'DESLIGADO';
            label.style.color = '#f44336';
        }
        
        // Atualiza histórico
        const historyList = document.getElementById('relayBombHistory');
        historyList.innerHTML = '';
        
        if (relayBombHistory.length > 0) {
            relayBombHistory.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = entry;
                historyList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum registro ainda';
            historyList.appendChild(li);
        }
    }
}

// Atualiza display de temperatura
function updateTempDisplay() {
    const tempValue = sensorData.temperatura;
    
    if (tempValue !== null) {
        document.getElementById('tempValue').textContent = tempValue.toFixed(1);
        
        // Atualiza tendência
        const tempTrend = document.getElementById('tempTrend');
        if (previousData.temperatura !== undefined && previousData.temperatura !== null) {
            if (tempValue > previousData.temperatura) {
                tempTrend.innerHTML = '<i class="fas fa-arrow-up trend-up"></i>';
            } else if (tempValue < previousData.temperatura) {
                tempTrend.innerHTML = '<i class="fas fa-arrow-down trend-down"></i>';
            } else {
                tempTrend.innerHTML = '<i class="fas fa-arrow-right"></i>';
            }
        }
        
        // Cor baseada na temperatura (exemplo: ideal 18-28°C)
        const tempDisplay = document.getElementById('tempValue');
        if (tempValue < 15 || tempValue > 30) {
            tempDisplay.style.color = 'var(--danger-color)';
        } else if (tempValue < 18 || tempValue > 28) {
            tempDisplay.style.color = 'var(--warning-color)';
        } else {
            tempDisplay.style.color = 'var(--secondary-color)';
        }
    }
}

// Atualiza display de umidade
function updateHumidityDisplay() {
    const humidityValue = sensorData.umidade;
    
    if (humidityValue !== null) {
        document.getElementById('humidityValue').textContent = humidityValue.toFixed(1);
        
        // Atualiza tendência
        const humidityTrend = document.getElementById('humidityTrend');
        if (previousData.umidade !== undefined && previousData.umidade !== null) {
            if (humidityValue > previousData.umidade) {
                humidityTrend.innerHTML = '<i class="fas fa-arrow-up trend-up"></i>';
            } else if (humidityValue < previousData.umidade) {
                humidityTrend.innerHTML = '<i class="fas fa-arrow-down trend-down"></i>';
            } else {
                humidityTrend.innerHTML = '<i class="fas fa-arrow-right"></i>';
            }
        }
        
        // Cor baseada na umidade (exemplo: ideal 40-80%)
        const humidityDisplay = document.getElementById('humidityValue');
        if (humidityValue < 30 || humidityValue > 90) {
            humidityDisplay.style.color = 'var(--danger-color)';
        } else if (humidityValue < 40 || humidityValue > 80) {
            humidityDisplay.style.color = 'var(--warning-color)';
        } else {
            humidityDisplay.style.color = 'var(--secondary-color)';
        }
    }
}

// Atualiza display de luminosidade
function updateLightDisplay() {
    const lightValue = sensorData.luminosidade;
    
    if (lightValue !== null) {
        document.getElementById('lightValue').textContent = lightValue.toFixed(1);
        
        // Atualiza ícone baseado na luminosidade
        const lightIcon = document.getElementById('lightIcon');
        if (lightValue < 20) {
            lightIcon.className = 'fas fa-moon';
            lightIcon.style.color = '#5c6bc0';
        } else if (lightValue < 50) {
            lightIcon.className = 'fas fa-cloud-sun';
            lightIcon.style.color = '#ffb74d';
        } else {
            lightIcon.className = 'fas fa-sun';
            lightIcon.style.color = 'var(--warning-color)';
        }
    }
}

// Atualiza display de status
function updateStatusDisplay() {
    // WiFi status
    const wifiStatus = document.getElementById('wifiStatus');
    wifiStatus.textContent = 'CONECTADO';
    wifiStatus.style.color = 'var(--secondary-color)';
    
    // Sinal LoRa
    const rssiValue = sensorData.rssi;
    if (rssiValue !== null) {
        const signalStatus = document.getElementById('signalStatus');
        signalStatus.textContent = `${rssiValue} dBm`;
        
        if (rssiValue > -80) {
            signalStatus.style.color = 'var(--danger-color)';
        } else if (rssiValue > -100) {
            signalStatus.style.color = 'var(--warning-color)';
        } else {
            signalStatus.style.color = 'var(--secondary-color)';
        }
    }
    
    // Uptime (simulado)
    if (sensorData.lastUpdate) {
        const uptimeElement = document.getElementById('uptime');
        // Simula uptime baseado no tempo desde a primeira atualização
        if (!window.firstUpdateTime) {
            window.firstUpdateTime = new Date();
        }
        const uptimeSeconds = Math.floor((new Date() - window.firstUpdateTime) / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        uptimeElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
}

// Função para atualizar setpoints
function updateSetpoint(event) {
    const buttonId = event.target.id;
    
    if (buttonId === 'updatePhBtn') {
        const newPh = parseFloat(document.getElementById('phControl').value);
        if (!isNaN(newPh) && newPh >= 0 && newPh <= 14) {
            sensorData.setpoint_ph = newPh;
            // Aqui você enviaria o novo setpoint para o dispositivo
            console.log(`Novo setpoint pH: ${newPh}`);
            // Simula atualização
            fetchData();
        } else {
            alert('Por favor, insira um valor de pH válido (0-14)');
        }
    } else if (buttonId === 'updateEcBtn') {
        const newEc = parseFloat(document.getElementById('ecControl').value);
        if (!isNaN(newEc) && newEc >= 0 && newEc <= 5) {
            sensorData.setpoint_ec = newEc;
            // Aqui você enviaria o novo setpoint para o dispositivo
            console.log(`Novo setpoint EC: ${newEc}`);
            // Simula atualização
            fetchData();
        } else {
            alert('Por favor, insira um valor de EC válido (0-5)');
        }
    }
}
