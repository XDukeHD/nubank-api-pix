# Documentação da API de Pagamentos via PIX

Documentação completa para a API de Pagamentos via PIX, uma solução para gerar cobranças PIX e verificar pagamentos automaticamente.

## Requisitos

- Node.js v14 ou superior
- Conta Gmail para receber notificações do Nubank
- Acesso à API do Gmail (OAuth 2.0)

## Instalação

1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/pix-api.git
   cd pix-api
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Renomeie o arquivo `config.example.json` para `config.json` (Arquivos estão na pasta `config`):
   ```
    cp config.example.json config.json
   ```

4. Configure seu arquivo `config/config.json` com suas informações:
   - Chave PIX para recebimentos
   - Credenciais da API do Gmail
   - URL para webhook

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

## Endpoints da API

### 1. Criar Cobrança PIX

**Endpoint:** `POST /api/payments/pix/create`

**Headers:**
- `api-key`: Sua chave de API (obrigatório)

**Body:**
```json
{
  "user_id": "123",
  "amount": 99.90
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "pix_code": "00020126330014BR.GOV.BCB.PIX0111...",
    "qr_code_image_url": "http://localhost:3000/qrcodes/pix_123456789.png",
    "expires_at": "2023-01-01T15:00:00.000Z"
  }
}
```

### 2. Verificar Status do Pagamento

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

## Verificação de Pagamentos

A API monitora automaticamente os e-mails recebidos no Gmail configurado, procurando por e-mails do remetente `todomundo@nubank.com.br` com o título "Você recebeu uma transferência!". 

Quando um e-mail de transferência é encontrado, a API:
1. Extrai o valor da transferência e a data/hora (ajustada para horário de Brasília)
2. Procura por cobranças pendentes com o mesmo valor
3. Verifica se a transferência ocorreu dentro de 3 horas após a criação da cobrança
4. Marca o pagamento como pago, apaga o QR code do disco e envia um webhook para o sistema configurado

## Segurança

- Use HTTPS em produção
- Mantenha sua API key segura
- Configure corretamente as permissões da API do Gmail
- Defina webhook secrets para validar notificações

## Solução de Problemas Comuns

### Problemas de Autorização do Gmail
Se estiver tendo problemas com a verificação de e-mails, verifique:
1. Se as credenciais do OAuth estão corretas
2. Se as permissões necessárias foram concedidas
3. Se a conta não possui verificação em duas etapas bloqueando o acesso

### QR Code não é gerado
Verifique se o diretório `public/qrcodes` existe e tem permissões de escrita.

## Detalhes Técnicos e Observações

- O campo `qr_code_path` salva apenas o nome do arquivo, não o caminho completo.
- O QR code é apagado automaticamente do disco quando o pagamento é confirmado.
- Todas as datas são salvas já ajustadas para o fuso horário de Brasília (UTC-3).
- O sistema busca automaticamente o QR code na pasta `public/qrcodes` ao exibir a cobrança.

## Status do Projeto

Este projeto está em versão BETA. Embora seja funcional para uso em produção, podem ocorrer mudanças na API e novos recursos estão sendo adicionados constantemente.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
