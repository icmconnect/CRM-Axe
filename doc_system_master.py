# -*- coding: utf-8 -*-
"""
doc_system_master.py - Sistema de Auto-Documentação + Arquivo Consolidado Master de Código

Este script unificado contém dois componentes integrados de alta qualidade:
1. DocRegistry (Módulo de Auto-Documentação Automática de Código Python)
2. CodeSnapshot (Gerador de Arquivos Consolidados de Código Multilinguagem)

Autor: Google AI Studio Code Agent
Data de Geração: 30 de Maio de 2026
"""

import functools
import inspect
import json
import os
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set
import ast

# =====================================================================
# PARTE A: DocRegistry - Sistema de Auto-Documentação de Funções
# =====================================================================

class DocRegistry:
    """
    Registro Central de Documentação Automática.
    - Captura metadados de funções existentes e futuras com o decorator @DocRegistry.auto_doc
    - Mantém um histórico persistente em arquivo JSON
    - Gera relatórios interativos e estruturados em Markdown, HTML e JSON
    """
    
    _instance = None
    _registry: Dict[str, Any] = {}
    _registry_file = "doc_registry.json"
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_existing_registry()
        return cls._instance
    
    def _load_existing_registry(self):
        """Carrega dados persistidos anteriormente do arquivo JSON de documentação."""
        if os.path.exists(self._registry_file):
            try:
                with open(self._registry_file, 'r', encoding='utf-8') as f:
                    self._registry = json.load(f)
            except Exception as e:
                print(f"[DocRegistry] Aviso ao carregar registro existente: {e}")
                self._registry = {}
                
    def _save_registry(self):
        """Salva a estrutura de documentação no disco como JSON."""
        try:
            with open(self._registry_file, 'w', encoding='utf-8') as f:
                json.dump(self._registry, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"[DocRegistry] Erro ao salvar registro: {e}")
            
    @staticmethod
    def auto_doc(func: Callable) -> Callable:
        """
        Decorator para documentação e detecção automática de metadados de funções Python.
        
        Uso:
            @DocRegistry.auto_doc
            def minha_funcao(a: int) -> str:
                '''Esta é uma docstring de exemplo'''
                return str(a)
        """
        # Obter a assinatura da função e outras informações úteis
        try:
            sig = inspect.signature(func)
        except Exception:
            sig = "Indisponível"

        try:
            source = inspect.getsource(func)
        except Exception:
            source = "# Código-fonte indisponível (função dinâmica, built-in ou nativa)"

        try:
            arquivo = inspect.getfile(func)
        except Exception:
            arquivo = "N/A"

        doc = inspect.getdoc(func) or "Sem documentação descritiva informada."
        
        metadata = {
            "nome": func.__name__,
            "modulo": func.__module__,
            "arquivo": arquivo,
            "assinatura": str(sig),
            "parametros": [
                {
                    "nome": name,
                    "tipo": str(param.annotation) if param.annotation != inspect.Parameter.empty else "Any",
                    "default": str(param.default) if param.default != inspect.Parameter.empty else None
                }
                for name, param in (sig.parameters.items() if hasattr(sig, 'parameters') else [])
            ],
            "retorno": str(sig.return_annotation) if hasattr(sig, 'return_annotation') and sig.return_annotation != inspect.Parameter.empty else "Any",
            "documentacao": doc,
            "codigo_fonte": source,
            "hash_fonte": hashlib.md5(source.encode('utf-8')).hexdigest(),
            "data_registro": datetime.now().isoformat(),
            "dependencias": DocRegistry._extract_dependencies(source),
            "linhas_codigo": len(source.split('\n')),
            "complexidade": DocRegistry._estimate_complexity(source)
        }
        
        # Registrar metadados no Singleton persistente
        registry = DocRegistry()
        registry._registry[func.__qualname__] = metadata
        registry._save_registry()
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
            
        # Anexa os metadados diretamente no objeto wrapper de retorno
        wrapper.__doc_registry__ = metadata  # type: ignore
        return wrapper
        
    @staticmethod
    def _extract_dependencies(source: str) -> List[str]:
        """Extrai imports e chamadas de dependências comuns no escopo local do código."""
        imports = []
        for line in source.split('\n'):
            line_stripped = line.strip()
            if line_stripped.startswith(('import ', 'from ')):
                imports.append(line_stripped)
        return imports
        
    @staticmethod
    def _estimate_complexity(source: str) -> str:
        """Determina de maneira heurística a complexidade lógica do corpo de código."""
        lines = source.split('\n')
        control_flow = sum(1 for line in lines if any(
            kw in line for kw in ['if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except']
        ))
        if control_flow > 10:
            return "ALTA (Complexo)"
        elif control_flow > 5:
            return "MÉDIA (Intermediário)"
        else:
            return "BAIXA (Simples)"
            
    @classmethod
    def scan_module(cls, module) -> int:
        """
        Escaneia um módulo Python inteiro para auto-documentar todas as funções válidas encontradas.
        """
        count = 0
        for name, obj in inspect.getmembers(module):
            if inspect.isfunction(obj) and not name.startswith('_'):
                try:
                    cls.auto_doc(obj)
                    count += 1
                except Exception:
                    pass
        return count
        
    @classmethod
    def get_registry(cls) -> Dict[str, Any]:
        """Retorna o dicionário de chaves e dados do registro geral."""
        return cls()._registry
        
    @classmethod
    def search(cls, termo: str) -> List[Dict[str, Any]]:
        """Pesquisa funções documentadas no registro global pelo nome ou trecho da docstring."""
        results = []
        for func_name, metadata in cls()._registry.items():
            if (termo.lower() in func_name.lower() or 
                termo.lower() in metadata.get('documentacao', '').lower()):
                results.append(metadata)
        return results
        
    @classmethod
    def generate_report(cls, formato: str = 'markdown') -> str:
        """
        Gera relatório estruturado contendo a documentação de todas as funções ativas.
        Formatos aceitos: 'markdown', 'json', 'html'
        """
        registry = cls()._registry
        
        if formato == 'json':
            return json.dumps(registry, indent=2, ensure_ascii=False, default=str)
            
        elif formato == 'markdown':
            report = "# 📚 Documentação Automática do Sistema\n\n"
            report += f"**Gerado em:** {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}\n"
            report += f"**Total de funções mapeadas:** {len(registry)}\n\n---\n\n"
            
            for func_name, meta in sorted(registry.items()):
                report += f"## `{func_name}`\n\n"
                report += f"- **Módulo:** `{meta.get('modulo', 'N/A')}`\n"
                report += f"- **Arquivo-Origem:** `{meta.get('arquivo', 'N/A')}`\n"
                report += f"- **Assinatura:** `{meta.get('assinatura', 'N/A')}`\n"
                report += f"- **Complexidade estimada:** `{meta.get('complexidade', 'N/A')}`\n"
                report += f"- **Data de Registro:** {meta.get('data_registro', 'N/A')}\n\n"
                
                report += "### Descritivo / Documentação\n"
                report += f"{meta.get('documentacao', 'Sem documentação descritiva.')}\n\n"
                
                report += "### Parâmetros\n"
                params = meta.get('parametros', [])
                if params:
                    for p in params:
                        def_val = f" (Padrão: {p['default']})" if p['default'] is not None else ""
                        report += f"- `{p['nome']}`: Tipo `{p['tipo']}`{def_val}\n"
                else:
                    report += "*Nenhum parâmetro declarado.*\n"
                report += f"\n- **Retorno:** Tipo `{meta.get('retorno', 'Any')}`\n\n"
                
                if meta.get('dependencias'):
                    report += "### Dependências Internas\n"
                    for dep in meta['dependencias']:
                        report += f"- `{dep}`\n"
                    report += "\n"
                
                report += f"### Código Fonte\n```python\n{meta.get('codigo_fonte', '')}\n```\n\n---\n\n"
            return report
            
        elif formato == 'html':
            html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Documentação do Sistema</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; line-height: 1.6; background-color: #fafafa; }}
        h1 {{ color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }}
        h2 {{ color: #2563eb; margin-top: 40px; }}
        .meta {{ font-size: 14px; color: #64748b; margin-bottom: 20px; }}
        .function-card {{ border: 1px solid #e2e8f0; padding: 25px; margin: 25px 0; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        pre {{ background: #1e1e1e; color: #d4d4d4; padding: 18px; border-radius: 8px; overflow-x: auto; font-family: 'Consolas', monospace; font-size: 14px; theme-color: dark; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .alta {{ background: #fee2e2; color: #ef4444; }}
        .media {{ background: #fef3c7; color: #d97706; }}
        .baixa {{ background: #dcfce7; color: #16a34a; }}
        code {{ font-family: 'Consolas', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 85%; color: #0f172a; }}
    </style>
</head>
<body>
    <h1>📚 Documentação Automática do Sistema</h1>
    <div class="meta">
        <p><strong>Gerado em:</strong> {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')} | <strong>Total de funções mapeadas:</strong> {len(registry)}</p>
    </div>
    <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
"""
            for func_name, meta in sorted(registry.items()):
                complex_val = meta.get('complexidade', 'BAIXA')
                c_badge = "baixa"
                if "MÉDIA" in complex_val:
                    c_badge = "media"
                elif "ALTA" in complex_val:
                    c_badge = "alta"
                    
                html += f"""
    <div class="function-card">
        <h2><code>{func_name}</code></h2>
        <div class="meta">
            <p><strong>Módulo:</strong> <code>{meta.get('modulo', 'N/A')}</code> | <strong>Arquivo:</strong> <code>{meta.get('arquivo', 'N/A')}</code></p>
            <p><strong>Assinatura:</strong> <code>{meta.get('assinatura', 'N/A')}</code></p>
            <p><strong>Complexidade:</strong> <span class="badge {c_badge}">{complex_val}</span></p>
        </div>
        
        <h3>Descrição / Docstring</h3>
        <p style="white-space: pre-line; background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #64748b;">{meta.get('documentacao', 'N/A')}</p>
        
        <h3>Código Fonte</h3>
        <pre><code>{meta.get('codigo_fonte', 'N/A')}</code></pre>
    </div>
"""
            html += "</body></html>"
            return html
            
        return "Formato informado não é elegível."


# =====================================================================
# PARTE B: CodeSnapshot - Gerador Consolidado de Arquivos de Código
# =====================================================================

class CodeSnapshot:
    """
    Gera um arquivo de snapshot completo do código-fonte do projeto inteiro.
    - Captura todos os arquivos baseados em padrões de inclusão e deleção
    - Analisa arquivos .py via Árvores de Sintaxe Abstrata (AST) para funcoes, serviços e classes
    - Extrai metadados estruturados e monta um relatório legível em Markdown unificado
    """
    
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path).resolve()
        self.snapshot: Dict[str, Any] = {
            "metadata": {
                "data_geracao": datetime.now().isoformat(),
                "diretorio_raiz": str(self.root_path),
                "hash_global": "",
                "total_arquivos": 0,
                "total_linhas": 0,
                "total_funcoes": 0,
                "total_classes": 0,
                "dependencias_externas": []
            },
            "estrutura_diretorios": {},
            "arquivos": [],
            "servicos": [],
            "funcoes": [],
            "classes": [],
            "imports_globais": [],
            "dependencias_externas": set()
        }
        
    def generate(self, include_patterns: Optional[List[str]] = None, 
                 exclude_patterns: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Escaneia o diretório e calcula hash global e sumários.
        """
        if include_patterns is None:
            # Padrões comuns suportados por padrão (incluindo React e TypeScript)
            include_patterns = ['*.py', '*.js', '*.ts', '*.tsx', '*.jsx', '*.json', '*.html', '*.css']
            
        if exclude_patterns is None:
            # Padrões comuns para evitar ruído de pacotes instalados/cache
            exclude_patterns = [
                'node_modules', '.git', '__pycache__', 'venv', '.env', 
                'dist', 'build', '.next', 'coverage', 'doc_registry.json', 
                'code_snapshot_master.json', 'SNAPSHOT_COMPLETO.md', 'DOCUMENTACAO_AUTOMATICA.md'
            ]
            
        # Percorre os arquivos
        self._scan_directory(self.root_path, include_patterns, exclude_patterns)
        
        # Gera o hash global fundindo os hashes de arquivos individuais
        all_content = ''.join([f['conteudo'] for f in self.snapshot['arquivos']])
        self.snapshot['metadata']['hash_global'] = hashlib.sha256(all_content.encode('utf-8')).hexdigest()
        
        # Converte o set para lista para serialização correta
        self.snapshot['metadata']['dependencias_externas'] = sorted(list(self.snapshot['dependencias_externas']))
        del self.snapshot['dependencias_externas']
        
        return self.snapshot
        
    def _scan_directory(self, directory: Path, include_patterns: List[str], exclude_patterns: List[str]):
        """Escaneia o diretório de forma recursiva mapeando arquivos e pastas."""
        try:
            for item in directory.iterdir():
                # Verifica exclusões
                if any(excl in item.parts or excl in str(item) for excl in exclude_patterns):
                    continue
                    
                if item.is_dir():
                    rel_path = str(item.relative_to(self.root_path))
                    self.snapshot['estrutura_diretorios'][rel_path] = {
                        'tipo': 'diretorio',
                        'subitens': []
                    }
                    self._scan_directory(item, include_patterns, exclude_patterns)
                    
                elif item.is_file():
                    # Verifica padrões de inclusão
                    if any(item.match(pat) for pat in include_patterns):
                        self._process_file(item)
        except PermissionError:
            pass # Pula pastas sem permissão de leitura
            
    def _process_file(self, file_path: Path):
        """Lê arquivo e executa análise sintática / métricas de tamanho."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            rel_path = str(file_path.relative_to(self.root_path))
            file_info = {
                'caminho': rel_path,
                'caminho_absoluto': str(file_path),
                'tamanho_bytes': file_path.stat().st_size,
                'hash': hashlib.md5(content.encode('utf-8')).hexdigest(),
                'linhas': len(content.split('\n')),
                'conteudo': content,
                'extensao': file_path.suffix,
                'ultima_modificacao': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            }
            
            self.snapshot['arquivos'].append(file_info)
            self.snapshot['metadata']['total_arquivos'] += 1
            self.snapshot['metadata']['total_linhas'] += file_info['linhas']
            
            # Análise estática focada para arquivos Python
            if file_path.suffix == '.py':
                self._analyze_python_file(content, rel_path)
                
            self._extract_imports(content, file_path.suffix)
            
        except Exception as e:
            print(f"[CodeSnapshot] Erro ao processar arquivo {file_path}: {e}")
            
    def _analyze_python_file(self, content: str, filepath: str):
        """Avalia um arquivo Python usando representações AST."""
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Coleta segmento do código-fonte de modo seguro
                    try:
                        codigo = ast.get_source_segment(content, node)
                    except AttributeError:
                        linhas = content.split('\n')
                        codigo = '\n'.join(linhas[node.lineno-1:getattr(node, 'end_lineno', node.lineno)])
                        
                    func_info = {
                        'nome': node.name,
                        'arquivo': filepath,
                        'linha': node.lineno,
                        'argumentos': [arg.arg for arg in node.args.args],
                        'decorators': [self._get_decorator_name(dec) for dec in node.decorator_list],
                        'docstring': ast.get_docstring(node),
                        'codigo': codigo
                    }
                    self.snapshot['funcoes'].append(func_info)
                    self.snapshot['metadata']['total_funcoes'] += 1
                    
                elif isinstance(node, ast.ClassDef):
                    try:
                        codigo = ast.get_source_segment(content, node)
                    except AttributeError:
                        linhas = content.split('\n')
                        codigo = '\n'.join(linhas[node.lineno-1:getattr(node, 'end_lineno', node.lineno)])
                        
                    class_info = {
                        'nome': node.name,
                        'arquivo': filepath,
                        'linha': node.lineno,
                        'metodos': [n.name for n in node.body if isinstance(n, ast.FunctionDef)],
                        'docstring': ast.get_docstring(node),
                        'codigo': codigo
                    }
                    self.snapshot['classes'].append(class_info)
                    self.snapshot['metadata']['total_classes'] += 1
                    
                    # Identifica se é um serviço de forma genérica
                    if any(term in node.name.lower() for term in ['service', 'servico', 'repository', 'controller', 'manager']):
                        self.snapshot['servicos'].append(class_info)
                        
        except SyntaxError:
            pass # Pula erros de sintaxe em scripts não finalizados
            
    def _get_decorator_name(self, decorator) -> str:
        """Determina o nome correspondente de um decorator de AST."""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call):
            if isinstance(decorator.func, ast.Name):
                return decorator.func.id
        elif isinstance(decorator, ast.Attribute):
            parts = []
            node = decorator
            while isinstance(node, ast.Attribute):
                parts.append(node.attr)
                node = node.value
            if isinstance(node, ast.Name):
                parts.append(node.id)
            return ".".join(reversed(parts))
        return "desconhecido"
        
    def _extract_imports(self, content: str, extension: str):
        """Mapeia todas as declarações de import das linguagens principais mapeadas."""
        if extension == '.py':
            for line in content.split('\n'):
                line_stripped = line.strip()
                if line_stripped.startswith(('import ', 'from ')):
                    self.snapshot['imports_globais'].append(line_stripped)
                    # Adiciona pacotes às dependências externas
                    parts = line_stripped.replace('import ', '').replace('from ', '').split()
                    if parts:
                        pkg = parts[0].split('.')[0]
                        self.snapshot['dependencias_externas'].add(pkg)
                        
        elif extension in ['.js', '.jsx', '.ts', '.tsx']:
            for line in content.split('\n'):
                line_stripped = line.strip()
                if 'require(' in line_stripped or 'import ' in line_stripped:
                    self.snapshot['imports_globais'].append(line_stripped)
                    
    def save_snapshot(self, output_file: str = "code_snapshot_master.json"):
        """Exporta em formato JSON limpo."""
        # Cria uma cópia local serializável
        serializable_snapshot = dict(self.snapshot)
        if isinstance(serializable_snapshot.get('dependencias_externas'), set):
            serializable_snapshot['dependencias_externas'] = sorted(list(serializable_snapshot['dependencias_externas']))
            
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(serializable_snapshot, f, indent=2, ensure_ascii=False, default=str)
        print(f"[CodeSnapshot] Documento estruturado salvo com sucesso em: {output_file}")
        
    def save_readable_report(self, output_file: str = "SNAPSHOT_COMPLETO.md"):
        """Escreve um grande arquivo unificado e bem-formatado de documentação e código fonte."""
        meta = self.snapshot['metadata']
        
        report = f"# 📸 SNAPSHOT COMPLETO DO SISTEMA\n\n"
        report += f"**Data de Geração:** {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}  \n"
        report += f"**Diretório Raiz:** `{meta['diretorio_raiz']}`  \n"
        report += f"**Hash Global SHA-256:** `{meta['hash_global']}`  \n\n"
        report += "---\n\n"
        
        report += "## 📊 ESTATÍSTICAS GERAIS DO PROJETO\n\n"
        report += f"- **Total de Arquivos:** {meta['total_arquivos']}\n"
        report += f"- **Consolidado de Linhas:** {meta['total_linhas']}\n"
        report += f"- **Funções Mapeadas (Python):** {meta['total_funcoes']}\n"
        report += f"- **Classes Extraídas (Python):** {meta['total_classes']}\n"
        report += f"- **Serviços Ativos (Python):** {len(self.snapshot['servicos'])}\n\n"
        report += "---\n\n"
        
        report += "## 🌳 ESTRUTURA DE DIRETÓRIOS E COMPONENTES\n\n"
        report += "```text\n"
        report += f"{Path(meta['diretorio_raiz']).name}/\n"
        for dir_path in sorted(self.snapshot['estrutura_diretorios'].keys()):
            report += f" └── {dir_path}/\n"
        report += "```\n\n"
        report += "---\n\n"
        
        report += "## 📄 COMPILADO DE ARQUIVOS E CÓDIGO FONTE\n\n"
        for file_info in sorted(self.snapshot['arquivos'], key=lambda x: x['caminho']):
            report += f"### 📝 Arquivo: `{file_info['caminho']}`\n\n"
            report += f"- **Linhas:** {file_info['linhas']} | **Tamanho:** {file_info['tamanho_bytes']} bytes\n"
            report += f"- **ID MD5:** `{file_info['hash']}`\n"
            report += f"- **Última Modificação:** {file_info['ultima_modificacao']}\n\n"
            
            # Identificação correta de extensão / idioma
            ext = file_info['extensao']
            lang = {
                '.py': 'python',
                '.js': 'javascript',
                '.jsx': 'javascript',
                '.ts': 'typescript',
                '.tsx': 'typescript',
                '.json': 'json',
                '.html': 'html',
                '.css': 'css'
            }.get(ext, '')
            
            report += f"```{lang}\n{file_info['conteudo']}\n```\n\n"
            report += "---\n\n"
            
        # Sessão de funções do snapshot (AST)
        if self.snapshot['funcoes']:
            report += "## ⚡ EXTRAÇÃO DE FUNÇÕES (Mapeamento Estático)\n\n"
            for func in self.snapshot['funcoes']:
                report += f"### Função: `{func['nome']}()`\n"
                report += f"- **Arquivo:** `{func['arquivo']}` (Linha {func['linha']})\n"
                report += f"- **Argumentos:** `{', '.join(func['argumentos'] or ['nenhum'])}`\n"
                if func.get('docstring'):
                    report += f"- **Docstring:**\n\n  ```\n  {func['docstring']}\n  ```\n"
                report += f"\n```python\n{func['codigo']}\n```\n\n"
            report += "---\n\n"
            
        # Sessão de Serviços / Classes
        if self.snapshot['servicos']:
            report += "## 🔧 SERVIÇOS E REGISTROS DE COMPORTAMENTO\n\n"
            for s in self.snapshot['servicos']:
                report += f"### Componente: `{s['nome']}`\n"
                report += f"- **Origem:** `{s['arquivo']}` (Linha {s['linha']})\n"
                report += f"- **Métodos Disponíveis:** `{', '.join(s['metodos']) if s['metodos'] else 'Nenhum'}`\n"
                if s.get('docstring'):
                    report += f"- **Docstring:**\n  ```\n  {s['docstring']}\n  ```\n"
                report += f"\n```python\n{s['codigo']}\n```\n\n"
            report += "---\n\n"
            
        # Gravação do Arquivo
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"[CodeSnapshot] Relatório unificado legível exportado com sucesso para: {output_file}")


# =====================================================================
# SCRIPT DE INTEGRAÇÃO MASTER & CASOS DE USO
# =====================================================================

# Exemplo de funções que serão monitoradas pelo DocRegistry
@DocRegistry.auto_doc
def calcular_metricas_usuario(id_usuario: int, historico: list) -> dict:
    """
    Calcula as métricas financeiras associadas ao histórico de contribuições de um membro.
    
    Parâmetros:
        id_usuario: Identificador único do membro da casa.
        historico: Lista contendo dicionários de transações de entradas do membro.
        
    Retorna:
        Dicionário formatado contendo total pago, status de pontualidade e média ponderada.
    """
    total = sum(item.get('valor', 0.0) for item in historico)
    media = total / len(historico) if historico else 0.0
    status = "PONTUAL" if media > 50 else "PENDENTE"
    
    return {
        "membro_id": id_usuario,
        "media_contribuicao": media,
        "total_acumulado": total,
        "situacao": status
    }


@DocRegistry.auto_doc
def validar_dados_membro(dados: dict, campos_obrigatorios: Optional[list] = None) -> bool:
    """
    Verifica se os campos fundamentais e obrigatórios para cadastro administrativo estão completos e válidos.
    
    Parâmetros:
        dados: Dicionário cru com as informações digitadas do membro.
        campos_obrigatorios: Lista opcional de strings que sobrescreve a lista padrão de validações.
        
    Retorna:
        Verdadeiro se todos os campos existem e não são nulos, Falso caso contrário.
    """
    import re # Dependência de import interno dinâmico para fins de testes do DocRegistry
    
    if campos_obrigatorios is None:
        campos_obrigatorios = ["nome", "cpf", "email"]
        
    for campo in campos_obrigatorios:
        if campo not in dados or not dados[campo]:
            return False
            
    # Expressão regular simples apenas para demonstração
    if "email" in dados and not re.match(r"[^@]+@[^@]+\.[^@]+", dados["email"]):
        return False
        
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("INICIANDO EXECUÇÃO DO SISTEMA DE AUTO-DOCUMENTAÇÃO & MASTER SNAPSHOT")
    print("=" * 60)
    
    # 1. Demonstração de captura do DocRegistry
    print("\n[Etapa 1/4] Simulando chamadas e registrando metadados de funções no DocRegistry...")
    membro_mock = {"nome": "Guilherme S.", "cpf": "123.456.789-00", "email": "guilherme@umbanda.org"}
    validar_dados_membro(membro_mock)
    
    historico_mock = [{"valor": 120.0}, {"valor": 100.0}, {"valor": 150.0}]
    calcular_metricas_usuario(101, historico_mock)
    
    # Gerando os documentos do DocRegistry
    registro_md = DocRegistry.generate_report('markdown')
    with open('DOCUMENTACAO_AUTOMATICA.md', 'w', encoding='utf-8') as f:
        f.write(registro_md)
    print("✅ Módulo DocRegistry completado. Resultados exportados para: 'DOCUMENTACAO_AUTOMATICA.md' e 'doc_registry.json'")
    
    # 2. Executando o CodeSnapshot sobre a estrutura de diretórios do projeto
    print("\n[Etapa 2/4] Executando análise do CodeSnapshot para registrar código existente no workspace...")
    snapshot = CodeSnapshot(".")
    
    # Vamos gerar o snapshot trazendo os arquivos da codebase para análise
    snapshot.generate(
        include_patterns=['*.py', '*.ts', '*.tsx', '*.json', '*.html', '*.css', '.env.example'],
        exclude_patterns=[
            'node_modules', '.git', '__pycache__', 'venv', '.env', 
            'dist', 'build', '.next', 'coverage', 'package-lock.json',
            'doc_registry.json', 'code_snapshot_master.json', 
            'SNAPSHOT_COMPLETO.md', 'DOCUMENTACAO_AUTOMATICA.md'
        ]
    )
    
    # Salvando os relatórios do Snapshot
    snapshot.save_snapshot("code_snapshot_master.json")
    snapshot.save_readable_report("SNAPSHOT_COMPLETO.md")
    
    print("\n[Etapa 3/4] Auto-Documentação de Módulo Integrada...")
    # Registra dinamicamente todas as demais funções Python que existam neste próprio script
    import sys
    modulo_atual = sys.modules[__name__]
    num_mapeados = DocRegistry.scan_module(modulo_atual)
    
    # Salva o arquivo final atualizado após escaneamento completo do próprio script
    registro_md_atualizado = DocRegistry.generate_report('markdown')
    with open('DOCUMENTACAO_AUTOMATICA.md', 'w', encoding='utf-8') as f:
        f.write(registro_md_atualizado)
        
    print(f"✅ Mapeamento concluído com sucesso. {num_mapeados} funções do script foram documentadas via inspeção dinâmica!")
    print("\n" + "=" * 60)
    print("🚀 SISTEMA FINALIZADO E PRONTO PARA USO!")
    print("=" * 60)
    print("Componentes gerados:\n"
          " 📂 SNAPSHOT_COMPLETO.md       - Toda a estrutura e códigos-fontes unificados\n"
          " 📂 code_snapshot_master.json   - Dados estruturados para integrações externas\n"
          " 📂 DOCUMENTACAO_AUTOMATICA.md   - Detalhes de assinaturas, parâmetros, tipos e docstrings\n"
          " 📂 doc_registry.json          - Dados estruturados das funções monitoradas")
    print("=" * 60 + "\n")
