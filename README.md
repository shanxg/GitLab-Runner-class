# Exercícios — Pipelines CI/CD com GitLab e Docker
Material prático do guia **"Pipelines CI/CD com GitLab e Docker"**, edição Linux + Windows (`CI-CD-Pipelines-GitLab-Docker.docx`, guardado fora deste repositório).

Guia baseado na página : https://medium.com/@ksaquib/ci-cd-pipelines-zero-to-hero-your-guide-from-beginner-to-advanced-mastery-50f2dbe6de16

A aplicação já está pronta. **Os arquivos de pipeline e o Dockerfile são seus**: escrever esses arquivos é o exercício.
As soluções dos exercícios não estão nesta pasta de propósito. O **Apêndice A** do guia traz a versão Windows dos exemplos do próprio guia: consulte só depois de tentar. Quando terminar um exercício, peça uma revisão.

---

## 1. O que já está pronto

```
GitLab-Runner\
├─ src\app.js          servidor HTTP (rotas / e /health)
├─ src\server.js       inicia o servidor na porta $PORT (padrão 81)
├─ test\app.test.js    4 testes com o test runner nativo do Node
├─ scripts\build.js    "build": limpa e gera a pasta dist\
├─ package.json        scripts build, test e start (sem dependências externas)
└─ .gitignore          ignora dist\ e node_modules\
```

Comandos para testar localmente:

| Comando | O que faz |
|---|---|
| `npm run build` | Gera `dist\` com `app.js` e `server.js` |
| `npm test` | Roda os testes (devem passar 4 de 4) |
| `npm start` | Sobe o servidor em <http://localhost:81> |

A rota `/health` devolve `{"status":"ok","version":"..."}`. A versão vem da variável de ambiente `APP_VERSION` (padrão `dev`), o que é útil para conferir qual versão foi implantada.

---

## 2. Preparação (uma vez só)

1. **Projeto no GitLab:** crie um projeto vazio no gitlab.com, **sem** marcar a opção de criar um README, e envie esta pasta:
   ```powershell
   git init -b main
   git add .
   git commit -m "App de apoio aos exercícios"
   git remote add origin https://gitlab.com/SEU_USUARIO/SEU_PROJETO.git
   git push -u origin main
   ```
2. **Runner do projeto:** em **Settings › CI/CD › Runners › New project runner**:
   - adicione a tag **`windows-local`**;
   - copie o token `glrt-...` que aparece ao final.
3. **Instale o runner em `D:\GitLab`.** Use um PowerShell **como Administrador**:
   ```powershell
   New-Item -ItemType Directory -Force D:\GitLab\builds, D:\GitLab\cache
   curl.exe -L -o D:\GitLab\gitlab-runner.exe https://s3.dualstack.us-east-1.amazonaws.com/gitlab-runner-downloads/latest/binaries/gitlab-runner-windows-amd64.exe
   icacls D:\GitLab /inheritance:r /grant:r "*S-1-5-32-544:(OI)(CI)F" "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-545:(OI)(CI)RX"
   git config --system core.longpaths true
   cd D:\GitLab
   .\gitlab-runner.exe register --non-interactive --config D:\GitLab\config.toml --url https://gitlab.com/ --token glrt-SEU_TOKEN --executor shell --shell powershell --builds-dir D:\GitLab\builds --cache-dir D:\GitLab\cache
   .\gitlab-runner.exe install --working-directory D:\GitLab --config D:\GitLab\config.toml
   .\gitlab-runner.exe start
   .\gitlab-runner.exe verify --config D:\GitLab\config.toml
   ```
   Depois disso, o runner aparece como *online* (bolinha verde) na tela de Runners do projeto.
4. **Desligue os runners de instância** do projeto, na mesma tela (seção *Instance runners*). Assim nenhum job vai parar nos runners Linux do GitLab, onde comandos PowerShell falham.
5. **Para o exercício 03:**
   - Docker Desktop aberto.
   - O serviço `gitlab-runner` rodando com o seu usuário (`services.msc` › gitlab-runner › Propriedades › Fazer logon › Esta conta).

### Como rodar um exercício específico

O GitLab só lê o `.gitlab-ci.yml` da raiz. Para os exercícios 01 e 02, aponte o projeto para o seu arquivo em
**Settings › CI/CD › General pipelines › CI/CD configuration file** (ex.: `exercicios/01-pipeline-basico.yml`).
Depois é só fazer push, ou ir em **Build › Pipelines › Run pipeline**.

---

## 3. Cola: do guia (Linux) para o seu runner (Windows/PowerShell)

Versão completa na seção 3.4 do guia. Problemas comuns no Windows estão na seção 7.2.

| No guia | No seu runner |
|---|---|
| Os jobs rodam em bash | Cada linha de `script:` é um comando **PowerShell 5.1** |
| `image: docker:latest` | Não se aplica: o executor `shell` roda direto na máquina, sem imagem |
| `DOCKER_HOST: unix:///var/run/docker.sock` | Não se aplica: o `docker` já fala com o Docker Desktop |
| `$CI_REGISTRY` dentro de `script:` | `$env:CI_REGISTRY` |
| `$CI_REGISTRY` em `variables:`, `rules:` e `environment:` | Continua `$CI_REGISTRY` (quem expande é o GitLab, não o shell) |
| `echo "texto"` | `Write-Host "texto"` |
| `cat arquivo` / `ls pasta` | `Get-Content arquivo` / `Get-ChildItem pasta` |
| `echo "x" > arquivo` | `Set-Content arquivo "x"` |
| `comando \|\| true` | Não existe `\|\|` no PowerShell 5.1 (veja a dica do exercício 03) |

> **Pegadinha:** dentro de aspas, `"$env:A:$env:B"` **não dá erro, mas descarta o valor de A**: o `:` confunde o PowerShell.
> Use `"${env:A}:$env:B"` ou monte o valor em `variables:` no YAML.

Se um comando de `script:` terminar com erro, o job falha, igual no Linux.

---

## Exercício 01 — Pipeline básico

**Arquivo:** `exercicios/01-pipeline-basico.yml`
**Base no guia:** seções 3.1, 3.2 e 3.3

**Objetivo:** montar o primeiro pipeline e ver stages rodando em sequência e jobs no mesmo stage.

**Requisitos**
- [ ] Três stages, nesta ordem: `build`, `test`, `deploy`.
- [ ] **build:** um job que mostra a versão do Node e roda `npm run build`.
- [ ] **test:** dois jobs no mesmo stage. Um roda `npm test`; o outro verifica a sintaxe de `src\server.js` com `node --check`.
- [ ] **deploy:** um job que só imprime uma mensagem com o nome do ambiente (variável `CI_ENVIRONMENT_NAME`) e declara o environment `production`.
- [ ] Todos os jobs com a tag `windows-local`, **sem repetir a tag em cada job**.

**Como saber se deu certo**
- O pipeline fica verde, com três colunas, e a coluna `test` tem dois jobs.
- O log do job de deploy mostra a palavra `production`.
- `production` aparece em **Operate › Environments**.

**Dicas**
- Para não repetir a tag, procure a palavra-chave `default:` na documentação do GitLab CI.
- O `environment:` também aceita uma `url:`. Por enquanto não há nada no ar para apontar, então é opcional.

**Desafios extras**
1. Em `test\app.test.js`, troque um `200` por `201` e faça push. O que acontece com o job de deploy? Por quê? (Depois desfaça.)
2. No `D:\GitLab\config.toml`, veja o valor de `concurrent`. Os dois jobs de `test` rodam ao mesmo tempo? Mude para `2` e compare. O runner relê o arquivo sozinho.

---

## Exercício 02 — Artefatos

**Arquivo:** `exercicios/02-artefatos.yml`
**Base no guia:** seção 3.1 (Artifacts) e o exemplo da 3.2

**Objetivo:** passar arquivos gerados em um job para o job seguinte.

**Requisitos**
- [ ] Dois stages: `build` e `test`.
- [ ] **build:** roda `npm run build` e cria `dist\build-info.txt` com o ID do pipeline e o commit curto (`CI_PIPELINE_ID` e `CI_COMMIT_SHORT_SHA`).
- [ ] O job de build publica a pasta `dist/` como **artefato que expira em 1 dia**.
- [ ] **test:** lista a pasta `dist`, mostra o conteúdo de `build-info.txt` e verifica a sintaxe de `dist\server.js`.
- [ ] Tag `windows-local` em todos os jobs, como no exercício 01.

**Como saber se deu certo**
- O log do job de test mostra o `build-info.txt` com o mesmo ID de pipeline que aparece na tela.
- A página do job de build tem um botão para baixar o artefato (`.zip`).

**Dicas**
- Veja a tabela "Cola" para criar e ler arquivos em PowerShell.
- Procure as palavras-chave `artifacts:paths` e `artifacts:expire_in`.

**Desafio extra**
- Remova o bloco de artefatos e rode de novo. O job de test falha, mesmo os dois jobs rodando na **mesma máquina**. Por quê?
  Dica: leia as primeiras linhas do log do job, onde o runner prepara a pasta de trabalho.

---

## Exercício 03 — Docker + deploy automatizado (estudo de caso)

**Arquivos:** `Dockerfile` e `.gitlab-ci.yml`, na raiz
**Base no guia:** seções 4, 5.2, 5.3 e 5.5. A seção 6 (`config.toml` com Docker) **não se aplica** ao seu runner Windows.

**Objetivo:** empacotar a app numa imagem, publicá-la no Container Registry do projeto e subir o container automaticamente na sua máquina, que faz o papel de ambiente de QA.

### Parte A — Dockerfile

- [ ] Imagem base `node:lts-alpine`.
- [ ] Copia o projeto e roda `npm run build` dentro da imagem.
- [ ] Expõe a porta `81` e inicia com `node dist/server.js`.
- [ ] Teste local antes de partir para o pipeline:
  ```powershell
  docker build -t estudos-app .
  docker run --rm -p 7800:81 -e APP_VERSION=local estudos-app
  ```
  Abra <http://localhost:7800/health>. Deve aparecer `"version":"local"`.

**Dica:** crie um `.dockerignore` para não copiar `.git`, `node_modules` e `dist` para dentro da imagem.

### Parte B — Pipeline

Volte o *CI/CD configuration file* para o padrão (`.gitlab-ci.yml`).

- [ ] Stages `package` e `deploy`.
- [ ] **package:** faz login no registry do projeto, constrói a imagem e faz push.
- [ ] **deploy:** faz pull da imagem, remove o container anterior **se existir** e sobe um novo:
  - nome `estudos-app`;
  - porta `7800:81`;
  - `APP_VERSION` com a tag da imagem.
- [ ] Tag da imagem: o commit curto (`CI_COMMIT_SHORT_SHA`). É mais prático que a `TAG_NAME_MANDATORY` do artigo, porque não precisa digitar a versão.
- [ ] Credenciais: use as variáveis prontas `CI_REGISTRY`, `CI_REGISTRY_IMAGE`, `CI_REGISTRY_USER` e `CI_REGISTRY_PASSWORD`. **Não crie token pessoal** e não escreva senha no arquivo.
- [ ] Login com `--password-stdin`, como na nota de atualização da seção 5.3.
- [ ] Regra de `retry` para até 2 novas tentativas em falhas de infraestrutura (seção 5.3).
- [ ] Tag `windows-local` em todos os jobs.

**Como saber se deu certo**
- A imagem aparece em **Deploy › Container Registry** com a tag do commit.
- <http://localhost:7800/health> mostra `"version"` igual ao commit curto do pipeline.
- `docker ps` lista o container `estudos-app`.
- Rodando o pipeline **duas vezes seguidas**, a segunda execução substitui o container sem erro.

**Dicas**
- `--password-stdin` lê a senha do pipe (`|`). Em PowerShell, o valor vai antes do pipe.
- Sem `||`, uma saída é verificar antes se o container existe e só então removê-lo. Veja `docker ps -a -q --filter "name=^estudos-app$"`.
- Lembre da pegadinha do `:` com `$env:` ao montar o nome da imagem.

**Desafios extras**
1. Faça o deploy rodar só na branch `main` (palavra-chave `rules:`).
2. Junte com o exercício 01: pipeline completo `test → package → deploy`, em que o deploy só acontece se os testes passarem.
3. Transforme o Dockerfile em **multi-stage**: um estágio compila e o outro leva só a `dist`. Compare o tamanho com `docker images`.

---

## Revisão

Terminou um exercício? Peça, por exemplo, "revise o exercício 01". A revisão aponta erros, explica o porquê e sugere melhorias.
Travou? Peça uma **dica** antes de pedir a resposta.
