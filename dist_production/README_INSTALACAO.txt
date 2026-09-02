========================================================================
POUSADA MONTE ALTO - PACOTE DE PRODUÇÃO PRONTO PARA USO
Destino: fabioarieira.com/montealto
Backend API: fabioarieira.com/montealto/api
========================================================================

INSTRUÇÕES DE INSTALAÇÃO:

1. No seu servidor web (cPanel, Apache, Hostinger, VPS, etc.), acesse a pasta pública (ex: public_html).
2. Crie uma pasta chamada "montealto" dentro da raiz pública (para ficar em public_html/montealto).
3. Descompacte todo o conteúdo deste arquivo ZIP diretamente dentro de public_html/montealto/.

ESTRUTURA FINAL NO SERVIDOR:
/public_html/montealto/
   ├── api/                     (REST API em PHP)
   │   ├── config/
   │   ├── controllers/
   │   ├── middleware/
   │   ├── uploads/
   │   ├── index.php
   │   └── .htaccess
   ├── database/
   │   └── pousada.sqlite       (Banco de dados com Suítes, Reservas, Blog e Configurações)
   ├── assets/                  (CSS e JS compilados em React)
   ├── index.html               (Frontend SPA)
   └── .htaccess                (Roteamento Apache para Frontend e API)

========================================================================
ACESSO AO SISTEMA:
- Site Público: https://fabioarieira.com/montealto
- Painel Administrativo: https://fabioarieira.com/montealto/admin/login
- API REST: https://fabioarieira.com/montealto/api/accommodations

CREDENCIAIS DO PAINEL ADMIN:
- E-mail: admin@pousadamontealto.com.br
- Senha: admin123
========================================================================
