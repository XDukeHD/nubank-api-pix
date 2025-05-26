# Documentação da API de Pagamentos via PIX

Documentação completa para a API de Pagamentos via PIX, uma solução para gerar cobranças PIX e verificar pagamentos automaticamente através de monitoramento de e-mails do Nubank.

## Visão Geral

Esta API permite que você:
- Gere cobranças PIX com códigos de pagamento e QR Codes personalizados
- Monitore automaticamente pagamentos recebidos através de e-mails do Nubank
- Receba notificações via webhook quando um pagamento é confirmado
- Verifique o status dos pagamentos a qualquer momento

A principal vantagem deste sistema é permitir a integração com PIX **sem necessidade de conta PJ** ou acesso à API oficial do PIX e o melhor, sem custo ou taxas adicionais.

## Requisitos

- Node.js v14 ou superior
- Conta Gmail para receber notificações do Nubank
- Acesso à API do Gmail (OAuth 2.0)
- Chave PIX do Nubank para recebimentos

## Instalação

1. Clone este repositório:
   ```
   git clone https://github.com/XDukeHD/nubank-api-pix
   cd pix-api
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Renomeie o arquivo `config.example.json` para `config.json` (Arquivos estão na pasta `config`):
   ```
   cp config/config.example.json config/config.json
   ```

4. Configure seu arquivo `config/config.json` com suas informações:
   - Chave PIX para recebimentos (`pix.key`)
   - Nome e cidade do recebedor (`pix.merchantName` e `pix.merchantCity`)
   - Credenciais da API do Gmail
   - URL e secret para webhook

5. Adicione uma imagem de logo (opcional):
   - Salve sua logo como `logo.png` no diretório `public/`

6. Execute o script de configuração para criar o primeiro cliente da API:
   ```
   npm run setup
   ```

7. Inicie o servidor:
   ```
   npm start
   ```

## Configuração do Gmail

Para que a verificação automática de pagamentos funcione, você precisa configurar o acesso OAuth 2.0 à API do Gmail:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a API do Gmail
4. Configure as credenciais OAuth 2.0
5. Configure a tela de consentimento OAuth
6. Gere um token de atualização (refresh token)

Para obter instruções detalhadas sobre este processo, consulte a [documentação oficial do Google](https://developers.google.com/gmail/api/quickstart/nodejs).

## Endpoints da API

### 1. Criar Cobrança PIX

Este endpoint gera um novo código PIX e QR Code personalizado para pagamento.

**Endpoint:** `POST /api/payments/pix/create`

**Headers:**
- `api-key`: Sua chave de API (obrigatório)

**Body:**
```json
{
  "user_id": "123",
  "amount": 99.90,
  "img_qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfF..." 
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "pix_code": "00020126330014BR.GOV.BCB.PIX0111...",
    "qr_code_image_url": "http://localhost:3000/qrcodes/pix_1747598840874_847187d46bc3d63459038a4a950a0a29.png",
    "expires_at": "2023-01-01T15:00:00.000Z"
  }
}
```

**Observações:**
- O `user_id` pode ser qualquer identificador que você use para associar o pagamento a um usuário ou pedido
- O campo `img_qr` é opcional e pode conter uma imagem em base64 ou URL que será usada como logo no QR Code
- O sistema aplica pequenas variações no valor para facilitar a identificação do pagamento
- O QR Code gerado inclui sua logo personalizada ou a imagem fornecida no parâmetro `img_qr`
- O campo `expires_at` indica quando a cobrança expira (padrão: 3 horas)

### 2. Verificar Status do Pagamento

Este endpoint permite consultar o status atual de um pagamento.

**Endpoint:** `GET /api/payments/status?payment_id=550e8400-e29b-41d4-a716-446655440000`

**Headers:**
- `api-key`: Sua chave de API (obrigatório)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "paid", // pending, paid ou expired
    "amount": 99.90,
    "created_at": "2023-01-01T12:00:00.000Z",
    "expires_at": "2023-01-01T15:00:00.000Z",
    "payment_date": "2023-01-01T12:30:00.000Z"
  }
}
```

**Status possíveis:**
- `pending`: Pagamento aguardando confirmação
- `paid`: Pagamento confirmado
- `expired`: Prazo para pagamento expirado

## Verificação de Pagamentos

A API monitora automaticamente os e-mails recebidos no Gmail configurado, procurando por e-mails do remetente `todomundo@nubank.com.br` com o título "Você recebeu uma transferência!". 

### Fluxo de processamento

Quando um e-mail de transferência é encontrado, a API:

1. Extrai o valor da transferência e a data/hora do corpo do e-mail
2. Ajusta o horário para o fuso horário de Brasília (UTC-3)
3. Procura por cobranças pendentes com valor próximo ao recebido (com tolerância para pequenas variações)
4. Verifica se a transferência ocorreu dentro do prazo válido (3 horas após a criação da cobrança por padrão)
5. Marca o pagamento como pago e registra a data/hora do pagamento
6. Envia um webhook para o sistema configurado (opcional)
7. Apaga o QR code do disco para economizar espaço

### Webhook de Notificação

Quando um pagamento é confirmado, a API pode enviar uma notificação para um endpoint webhook configurado:

**Payload do webhook:**
```json
{
  "event": "payment.confirmed",
  "payment_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123",
  "amount": 99.90,
  "payment_date": "2023-01-01T12:30:00.000Z",
  "status": "paid"
}
```

**Headers do webhook:**
- `Content-Type`: `application/json`
- `x-webhook-secret`: Assinatura HMAC SHA-256 do payload usando o secret configurado

Para habilitar o webhook, configure no arquivo `config.json`:
```json
"webhook": {
  "url": "https://seu-sistema.com/api/webhook",
  "secret": "seu_secret_para_validacao",
  "active": true
}
```

## Segurança

- **HTTPS**: Use HTTPS em produção para proteger as comunicações
- **API Key**: Mantenha sua API key segura e não a compartilhe publicamente
- **Permissões do Gmail**: Configure as permissões mínimas necessárias para a API do Gmail
- **Webhook Secrets**: Use a assinatura do webhook para validar as notificações
- **Controle de Acesso**: Limite o acesso aos endpoints da API usando firewalls e regras de rede

## Solução de Problemas Comuns

### Problemas de Autorização do Gmail

Se estiver tendo problemas com a verificação de e-mails, verifique:

1. **Credenciais OAuth**: Confirme se as credenciais (client ID, client secret e refresh token) estão corretas
2. **Permissões**: Verifique se as permissões necessárias foram concedidas (`https://www.googleapis.com/auth/gmail.readonly` e `https://www.googleapis.com/auth/gmail.modify`)
3. **Verificação em duas etapas**: Alguns problemas podem ocorrer se a conta tiver verificação em duas etapas ativada
4. **Remetente correto**: Confirme que o campo `sender` está configurado como `todomundo@nubank.com.br`
5. **Limites de API**: Verifique se você não atingiu os limites de uso da API do Gmail

### QR Code não é gerado

Possíveis causas:

1. **Permissões de diretório**: Verifique se o diretório `public/qrcodes` existe e tem permissões de escrita
2. **Logo ausente**: Confirme que o arquivo `public/logo.png` existe
3. **Dependências**: Verifique se todas as dependências foram instaladas corretamente (`jimp` e `qrcode`)

### Pagamentos não são detectados

Razões comuns:

1. **Valor não corresponde**: O sistema procura por pagamentos com valores próximos, mas com pequenas variações
2. **E-mail perdido**: O e-mail do Nubank pode não ter sido recebido ou foi classificado como spam
3. **Formato de e-mail mudou**: O Nubank pode ter alterado o formato dos e-mails de notificação
4. **Intervalo de verificação**: O sistema verifica e-mails a cada 20 segundos por padrão

## Detalhes Técnicos e Observações

- **Armazenamento de QR Code**: O campo `qr_code_path` na base de dados salva apenas o nome do arquivo, não o caminho completo
- **Limpeza automática**: O QR code é apagado automaticamente do disco quando o pagamento é confirmado
- **Fuso horário**: Todas as datas são salvas já ajustadas para o fuso horário de Brasília (UTC-3)
- **Expiração**: Cobranças expiram automaticamente após 3 horas por padrão (configurável)
- **Variação de valores**: O sistema aplica pequenas variações nos valores para facilitar a identificação de pagamentos
- **Servidor web**: A API expõe os QR codes gerados pela URL `/qrcodes/{nome_do_arquivo}`
- **Exclusão de e-mails**: Os e-mails processados são excluídos para manter a caixa de entrada limpa

## Estrutura do Projeto

```
pix-api/
├── config/
│   ├── config.example.json    # Modelo de configuração
│   └── config.json            # Configuração real (gitignore)
├── docs/
│   ├── docs-en.md             # Documentação em inglês
│   └── docs-pt.md             # Documentação em português
├── public/
│   ├── logo.png               # Logo para QR Codes
│   └── qrcodes/               # QR Codes gerados
├── scripts/
│   └── setup.js               # Script de configuração inicial
├── src/
│   ├── controllers/
│   │   └── paymentController.js  # Controladores de pagamento
│   ├── middlewares/
│   │   └── auth.js            # Middleware de autenticação
│   ├── models/
│   │   ├── apiClient.js       # Modelo de cliente da API
│   │   ├── index.js           # Configuração do Sequelize
│   │   └── payment.js         # Modelo de pagamento
│   ├── routes/
│   │   └── index.js           # Rotas da API
│   ├── services/
│   │   ├── cronService.js     # Serviço de tarefas agendadas
│   │   ├── emailService.js    # Serviço de verificação de e-mails
│   │   ├── pixService.js      # Serviço de geração de PIX
│   │   └── webhookService.js  # Serviço de webhook
│   ├── utils/
│   │   └── responseUtil.js    # Utilitários de resposta
│   └── index.js               # Ponto de entrada da aplicação
├── database.sqlite            # Banco de dados SQLite
├── LICENSE                    # Licença do projeto
├── package.json               # Dependências e scripts
└── README.md                  # Documentação simplificada
```

## Status do Projeto

Este projeto está em versão BETA. Embora seja funcional para uso em produção, podem ocorrer mudanças na API e novos recursos estão sendo adicionados constantemente.

## Roadmap

Funcionalidades planejadas para futuras versões:

- [ ] Suporte a outros bancos além do Nubank
- [ ] Painel de administração para gerenciamento de pagamentos
- [ ] Integração com sistemas de notificação (SMS, WhatsApp)
- [ ] Geração de relatórios de pagamentos
- [ ] Suporte a pagamentos recorrentes
- [ ] Melhorias na detecção de pagamentos

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests para melhorar o projeto.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

Desenvolvido por Túlio Cadilhac - XDuke.
