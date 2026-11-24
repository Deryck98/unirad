# UniRad

A força da radiologia unida. Rede dos técnicos e tecnólogos em radiologia para se unir por piso salarial, jornada e salário em dia. Começa em Manaus e vai para o Brasil todo.

## O que tem
- Cadastro só para a categoria: número do CRTR obrigatório e região do CRTR (busca)
- Visão **Minha região**, **Brasil todo** ou **outra região**
- Mural de atrasos (relato anônimo ou com nome, sem expor local com poucos relatos)
- Comunidade com publicações, comentários, vagas e cursos
- Aba de direitos e regras de uso (sem dados de pacientes)
- PWA: instala no iPhone, Android e notebook; funciona offline

## Estado atual: demonstração
Os dados ficam **só no aparelho** (localStorage). Para virar o app de verdade falta ligar um backend (contas, banco de dados, moderação). A camada de dados é o objeto `Store` em `data.js`.

## Pendências
- Conferir no site do CONTER os estados das regiões 7, 9, 11, 12, 13 e 15 (marcadas com `check: true` em `data.js`)
- Revisar com advogado e CRTR a aba Direitos e os termos de uso
- Backend com login e, se quiser, conferência do número do CRTR (hoje só é exigido o número, sem checagem)

## Como publicar (GitHub Pages)
Repositório > Settings > Pages > Source: `Deploy from a branch` > Branch: `main` / `(root)` > Save. O link aparece em 1 a 2 minutos.

## Rodar no computador
```
python3 -m http.server 8000
```
Abra `http://localhost:8000`.
