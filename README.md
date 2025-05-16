# Ambilight Video Player

## Visão Geral

Ambilight Video Player é um aplicativo web que reproduz vídeos com o efeito Ambilight em tempo real. O efeito Ambilight, originalmente desenvolvido pela Philips para TVs, analisa as cores nas bordas do vídeo em reprodução e as estende para além das margens do player, criando uma experiência de visualização mais imersiva.

## Estrutura do Projeto

```
ambilight-player/
├── app/
│   ├── __init__.py         # Inicialização do pacote app
│   ├── routes.py           # Rotas Flask e API endpoints
│   ├── ambilight.py        # Processamento de vídeo e análise de cores
│   ├── websocket.py        # Gerenciamento de conexões WebSocket
│   ├── utils.py            # Funções utilitárias
│   └── models.py           # Modelos de dados para configurações e histórico
├── static/
│   ├── css/
│   │   ├── tailwind.src.css  # CSS fonte para o Tailwind
│   │   └── tailwind.css      # CSS compilado
│   ├── js/
│   │   ├── player.js        # Lógica do player de vídeo
│   │   ├── ambilight.js     # Implementação do efeito Ambilight no frontend
│   │   ├── settings.js      # Gerenciamento de configurações
│   │   └── websocket.js     # Gerenciamento de conexões WebSocket no frontend
│   └── img/                 # Ícones e imagens
├── templates/
│   ├── index.html          # Página principal
│   ├── settings.html       # Página de configurações
│   └── about.html          # Página sobre o aplicativo
├── uploads/                # Diretório para uploads de vídeos
├── instance/               # Armazenamento de dados específicos da instância
│   └── config.sqlite       # Banco de dados SQLite (configurações e histórico)
├── requirements.txt        # Dependências Python
├── package.json            # Dependências npm (para Tailwind CSS)
├── tailwind.config.js      # Configuração do Tailwind CSS
├── postcss.config.js       # Configuração do PostCSS
└── run.py                  # Script para iniciar o aplicativo
```

## Características Principais

- **Interface moderna e responsiva** com Tailwind CSS
- **Player de vídeo integrado** com controles de reprodução padrão
- **Efeito Ambilight em tempo real** que extrai e exibe as cores das bordas do vídeo
- **Histórico de vídeos recentes**
- **Configurações personalizáveis** para o efeito Ambilight
- **Modo tela cheia**
- **Suporte para formatos comuns** (MP4, MKV, AVI, MOV, WEBM)

## Arquitetura do Sistema

### Backend (Python/Flask)

- **Flask**: Serve a aplicação web
- **API RESTful**: Comunicação entre frontend e backend
- **OpenCV**: Processamento de vídeo e análise de cores
- **WebSockets**: Comunicação em tempo real entre backend e frontend
- **SQLite**: Armazenamento persistente para configurações e histórico de vídeos

### Frontend (HTML/JavaScript/Tailwind CSS)

- **Tailwind CSS**: Estilização moderna e responsiva
- **JavaScript**: Controle do player e interação com a API
- **HTML5 Video Element**: Reprodução de vídeo
- **WebSockets**: Recebe dados de cores em tempo real
- **CSS**: Aplica o efeito Ambilight (box-shadow)

## Componentes Principais

### 1. Processador Ambilight (app/ambilight.py)

O `AmbilightProcessor` é responsável por analisar frames de vídeo e extrair as cores das bordas. Ele divide as bordas em zonas configuráveis e calcula a cor média para cada zona.

Características:
- Extração de cores das bordas do vídeo
- Divisão em zonas configuráveis
- Ajuste de intensidade
- Cache de frames para otimização
- Controle de taxa de processamento

### 2. Player de Vídeo (static/js/player.js)

Gerencia o player de vídeo HTML5 e seus controles, além de integrar com o efeito Ambilight.

Características:
- Controles de reprodução (play/pause, volume, mudo, fullscreen)
- Barra de progresso
- Histórico de vídeos
- Upload de novos arquivos
- Auto-hide dos controles quando não em uso

### 3. Efeito Ambilight (static/js/ambilight.js)

Implementa o efeito Ambilight no frontend, criando elementos DOM para as zonas coloridas e aplicando as cores recebidas via WebSocket.

Características:
- Criação dinâmica de zonas
- Aplicação de cores com box-shadow
- Configurações ajustáveis (intensidade, número de zonas, desfoque)
- Otimizações para desempenho

### 4. Comunicação WebSocket (app/websocket.py, static/js/websocket.js)

Estabelece comunicação em tempo real entre backend e frontend para transmissão de dados de cores.

Características:
- Gerenciamento de conexões
- Transmissão eficiente de dados
- Reconexão automática
- Processamento multithreaded

### 5. Armazenamento de Dados (app/models.py)

Modelos para gerenciar configurações e histórico de vídeos no banco de dados SQLite.

Características:
- Configurações personalizáveis (zonas, intensidade, desfoque)
- Histórico de vídeos reproduzidos recentemente
- Persistência de dados

## Fluxo de Trabalho do Efeito Ambilight

1. O usuário seleciona e inicia a reprodução de um vídeo
2. O backend processa o vídeo frame por frame
3. Para cada frame, o sistema extrai as cores das bordas
4. As cores são divididas em zonas configuráveis (por padrão, 10 por lado)
5. Os dados de cor são enviados para o frontend via WebSocket
6. O frontend aplica as cores como efeitos CSS (box-shadow) em torno do player

## Instruções de Instalação

### Requisitos

- Python 3.8+
- Node.js e npm (para Tailwind CSS)
- Bibliotecas Python: Flask, Flask-SocketIO, OpenCV, Numpy

### Passos para Instalação

1. Clone o repositório
2. Instale as dependências Python:
   ```
   pip install -r requirements.txt
   ```
3. Instale as dependências npm:
   ```
   npm install
   ```
4. Compile o CSS do Tailwind:
   ```
   npm run build:css
   ```
5. Execute o aplicativo:
   ```
   python run.py
   ```
6. Acesse o aplicativo em `http://localhost:5000`

## Configurações Personalizáveis

- **Intensidade do efeito**: Controla o brilho das cores (0-100%)
- **Zonas por lado**: Define o número de zonas por lado (5, 10, 15, 20)
- **Quantidade de desfoque**: Controla o quanto o efeito se espalha (5-50px)
- **Reprodução automática**: Inicia automaticamente a reprodução quando um vídeo é carregado

## Melhorias Futuras Possíveis

1. **Otimização de desempenho**:
   - Processamento GPU com CUDA
   - Compressão de dados WebSocket

2. **Recursos adicionais**:
   - Biblioteca de vídeos
   - Perfis de configuração salvos
   - Playlists
   - Aplicação de filtros de vídeo

3. **Melhorias na interface**:
   - Tema escuro/claro
   - Modo cinema
   - Visualização em grade de miniaturas
   - Teclados de atalho