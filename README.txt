AES Desenvolvimento de Sistemas — Projeto acadêmico (AES Talent)

Arquivos
- index.html        Site institucional (hero, soluções, empresa, AES Talent, governança, contato)
- candidaturas.html Portal público: vagas com busca/filtro, candidatura e consulta de protocolo
- rh.html           Painel interno de recrutamento (login, dashboard, kanban, vagas, agenda, Siuan, LGPD)
- style.css         Design system único usado pelas três páginas
- data.js           Dados, utilitários e localStorage
- site.js           Comportamentos do site público (menu, animações, contadores)
- apply.js          Lógica do portal de vagas
- rh.js             Lógica do painel RH

Como executar
Descompacte e abra index.html em um navegador moderno (precisa de internet apenas para carregar as fontes do Google Fonts; sem internet o site usa fontes do sistema).
Todos os dados ficam no localStorage do navegador: a simulação é local e não sincroniza entre dispositivos.

Acesso ao Painel RH (demonstração)
  Usuário: rh@aes.com
  Senha:   aes2026

Dados de demonstração
10 vagas em 5 setores (TI, RH, Administrativo, Facilities/Limpeza, Manutenção) e 167 candidatos fictícios
(7 candidatos de exemplo + 16 por vaga), mais 3 entrevistas agendadas.

Funcionalidades do painel RH
- Dashboard com KPIs, funil por etapa, gráfico por setor, ranking de aderência e próximas entrevistas
- Banco de candidatos com busca, filtros, paginação, ficha detalhada, edição de etapa/notas, exclusão e exportação CSV
- Pipeline Kanban com arrastar-e-soltar e filtro por vaga
- Cadastro de novas vagas (aparecem imediatamente no portal público)
- Agenda de entrevistas com agendamento assistido pela Agente Siuan (sempre confirmado pelo RH)
- Agente Siuan com três níveis de autonomia e consultas de auditoria
- Relatórios por setor, matriz setor × etapa e diretrizes de governança LGPD
- Botão "Resetar demo" restaura a base inicial

Observações
O currículo anexado no portal é simulado: apenas o nome do arquivo é registrado.
A pontuação de aderência é indicativa (competências informadas x requisitos da vaga) e nunca elimina candidatos.
Os dados não são reais; não há backend nem autenticação de produção.
