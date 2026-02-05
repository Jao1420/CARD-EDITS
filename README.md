# 🪪 Gerador de Cartões de Identificação

Solução interna para criação ágil e padronizada de cartões de identificação corporativos com QR Code embutido.

## Contexto do Problema

No ambiente corporativo atual, a criação de cartões de identificação — como *"Cadeira do XXXX"*, *"Máquina XXX"* e *"Documentos para assinaturas"* — depende de:

- Planilhas do Excel para formatação manual
- Ferramentas externas de geração de QR Code (acessadas via internet)
- Armazenamento descentralizado de modelos (risco de perda de arquivos)

Essa abordagem apresenta três gargalos críticos em ambientes com **intranet restrita**:

1. Dependência de serviços externos indisponíveis na rede interna
2. Perda de produtividade com capturas de tela e reprocessamento
3. Ausência de repositório centralizado para modelos recorrentes

## Solução Proposta

Aplicação web interna autocontida que elimina dependências externas e padroniza o fluxo de trabalho:

- ✅ **Gerador de QR Code 100% offline** — sem necessidade de acesso à internet
- ✅ **Biblioteca de modelos reutilizáveis** — armazenamento seguro de layouts frequentes
- ✅ **Redução do tempo de criação**
- ✅ **Totalmente compatível com intranet corporativa**
