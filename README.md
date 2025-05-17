# API de Pagamentos via PIX

Uma solução simples para gerar e monitorar pagamentos PIX sem necessidade de conta PJ ou acesso à API oficial do PIX.

> 🚨 **Projeto em versão BETA** - Funcional, mas ainda em desenvolvimento contínuo.

[English version available here](./docs/docs-en.md)

## Sobre o Projeto

Este projeto permite gerar cobranças PIX, criar QR Codes personalizados com logo centralizada e bordas arredondadas, monitorar pagamentos automaticamente via e-mail do Nubank, e notificar sistemas externos via webhook. O sistema apaga automaticamente o QR code do disco quando o pagamento é confirmado e salva datas já ajustadas para o fuso horário de Brasília (UTC-3).

## Principais Funcionalidades

- ✅ Geração de códigos PIX "copia e cola"
- ✅ QR Codes com logo personalizada e bordas arredondadas
- ✅ Verificação automática de pagamentos via e-mails do Nubank
- ✅ Webhook para notificar sistemas externos
- ✅ Expiração automática de cobranças
- ✅ Apaga QR code do disco ao ser pago
- ✅ Datas salvas em horário de Brasília

## Começando

1. Clone este repositório
2. Instale as dependências: `npm install`
3. Renomeie o arquivo `config.example.json` para `config.json` e preencha com suas infomações.
4. Execute `npm run setup` para criar seu primeiro cliente da API
5. Inicie o servidor: `npm start`

## Exemplo de Uso

Criando uma cobrança:
```json
{
  "user_id": "123",
  "amount": 99.90
}
```

## Documentação Completa

Para instruções detalhadas de instalação, configuração e uso da API, consulte:
- [Documentação em Português](./docs/docs-pt.md)
- [Documentation in English](./docs/docs-en.md)

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
