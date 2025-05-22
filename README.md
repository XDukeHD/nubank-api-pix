# API de Pagamentos via PIX

<div align="center">
  <img src="public/logo.png" alt="Logo PIX API" width="150" />
  <p><strong>Uma solução simples para integração de pagamentos PIX sem necessidade de conta PJ</strong></p>
  <p>
    <img src="https://img.shields.io/badge/status-beta-orange" alt="Status do Projeto" />
    <img src="https://img.shields.io/badge/licença-MIT-green" alt="Licença" />
    <img src="https://img.shields.io/badge/node-%3E%3D14-blue" alt="Node.js" />
  </p>
</div>

## 💡 Sobre o Projeto

Esta API permite que você gere cobranças PIX, monitore pagamentos e receba notificações **sem necessidade de conta PJ** ou acesso à API oficial do PIX, e sem custos adicionais. A solução é ideal para:

- 🏪 Pequenas e médias empresas
- 👨‍💻 Freelancers e profissionais autônomos
- 🛍️ Lojas virtuais e e-commerce
- 🎮 Jogos e aplicativos que precisam de micropagamentos
- 💰 Sistemas de vendas e cobranças

## ✨ Principais Funcionalidades

- ✅ **Geração de códigos PIX** com valores personalizados
- ✅ **QR Codes com logo centralizada** e bordas arredondadas
- ✅ **Verificação automática de pagamentos** via e-mail do Nubank
- ✅ **Webhook para notificações** em tempo real
- ✅ **API RESTful simples** com documentação completa
- ✅ **Banco de dados SQLite** sem necessidade de configurações complexas
- ✅ **Zero taxas de transação** além das cobradas pelo seu banco
- ✅ **100% código aberto** sob licença MIT

## 🚀 Começando

Siga os passos abaixo para começar a usar a API em minutos (O passo a seguir funciona apenas em ambientes Linux, para Windows, utilize o WSL):

```bash
# Clone o repositório
git clone https://github.com/XDukeHD/nubank-api-pix
cd pix-api

# Instale as dependências
npm install

# Configure o arquivo de configuração
cp config/config.example.json config/config.json

# Execute o setup inicial
npm run setup

# Inicie o servidor
npm start
```

## 📋 Exemplo de Uso

Criar uma cobrança PIX:

```bash
curl -X POST http://localhost:3000/api/payments/pix/create \
  -H "api-key: sua_chave_de_api" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "amount": 99.90}'
```

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Se você tem uma ideia para melhorar este projeto:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 🔍 Como Funciona

O sistema funciona monitorando os e-mails enviados pelo Nubank quando você recebe uma transferência PIX. Quando um cliente faz um pagamento, a API detecta o valor transferido e marca a cobrança correspondente como paga automaticamente.

A API também oferece um webhook para notificações em tempo real, permitindo que você integre facilmente com outros sistemas.

## 🔒 Segurança
A segurança é uma prioridade. A API utiliza autenticação por chave de API e HTTPS para proteger os dados em trânsito. Além disso, o banco de dados SQLite é armazenado localmente e não expõe informações sensíveis.

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas sobre a implementação, abra uma [issue](https://github.com/XDukeHD/nubank-api-pix/issues) ou entre em contato diretamente.

## ⚖️ Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  <p>Desenvolvido por <a href="https://github.com/XDukeHD/">Túlio Cadilhac - XDuke</a></p>
  <p>⭐ Não se esqueça de dar uma estrela se este projeto te ajudou! ⭐</p>
</div>
